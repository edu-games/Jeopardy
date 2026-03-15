<script lang="ts">
    import type { PageData } from "./$types";
    import { onMount, onDestroy } from "svelte";

    let { data }: { data: PageData } = $props();

    // Local state for real-time updates
    let teams = $state(data.game.teams);
    let connectedStudents = $state(new Set<string>());
    let answeredSlots = $state(data.game.gameState?.answeredSlots ? JSON.parse(data.game.gameState.answeredSlots as unknown as string) : []);
    let currentSlot = $state<any>(null);
    let selectedTeamId = $state("");
    let submittingAnswer = $state(false);
    let buzzerNotification = $state<{
        studentName: string;
        teamName: string;
    } | null>(null);
    let showEndGameConfirm = $state(false);
    let endingGame = $state(false);
    let endGameError = $state("");
    let wsConnected = $state(false);

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let endGameTimeout: ReturnType<typeof setTimeout> | null = null;

    function send(msg: object) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(msg));
        }
    }

    function isSlotAnswered(slotId: string) {
        return answeredSlots.includes(slotId);
    }

    function endGame() {
        endingGame = true;
        endGameError = "";
        send({ type: "end-game" });
        endGameTimeout = setTimeout(() => {
            endingGame = false;
            endGameError = "No response from server. Please try again.";
        }, 8000);
    }

    function resetEndGame() {
        endingGame = false;
        endGameError = "";
        if (endGameTimeout) { clearTimeout(endGameTimeout); endGameTimeout = null; }
    }

    function revealQuestion(slot: any) {
        if (isSlotAnswered(slot.id)) return;
        currentSlot = slot;
        selectedTeamId = teams[0]?.id || "";
        send({ type: "reveal-question", slotId: slot.id });
    }

    function submitAnswer(isCorrect: boolean) {
        if (!selectedTeamId || !currentSlot || submittingAnswer) return;
        submittingAnswer = true;
        send({ type: "answer", isCorrect, teamId: selectedTeamId });
    }

    function closeModal() {
        send({ type: "close-question" });
        currentSlot = null;
        submittingAnswer = false;
        buzzerNotification = null;
    }

    // Count answered questions
    let answeredCount = $derived(answeredSlots.length);
    let totalQuestions = 30;

    function connect() {
        if (ws) { ws.onclose = null; ws.close(); }
        ws = new WebSocket(`/api/ws/${data.game.id}?role=instructor`);

        ws.onopen = () => { wsConnected = true; };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);

                switch (msg.type) {
                    case "buzzer-pressed":
                        buzzerNotification = {
                            studentName: msg.studentName,
                            teamName: msg.teamName,
                        };
                        if (msg.teamId) selectedTeamId = msg.teamId as string;
                        setTimeout(() => { buzzerNotification = null; }, 3000);
                        break;

                    case "answer-submitted":
                        teams = msg.teams;
                        answeredSlots = msg.answeredSlots;
                        currentSlot = null;
                        selectedTeamId = "";
                        submittingAnswer = false;
                        buzzerNotification = null;
                        break;

                    case "question-closed":
                        currentSlot = null;
                        submittingAnswer = false;
                        buzzerNotification = null;
                        break;

                    case "student-status": {
                        const next = new Set(connectedStudents);
                        if (msg.connected) next.add(msg.studentId);
                        else next.delete(msg.studentId);
                        connectedStudents = next;
                        break;
                    }

                    case "connected-students-snapshot":
                        connectedStudents = new Set<string>(msg.studentIds);
                        break;

                    case "game-state-snapshot":
                        if (msg.teams) teams = msg.teams;
                        if (msg.answeredSlots) answeredSlots = msg.answeredSlots;
                        if (msg.currentSlot) {
                            currentSlot = msg.currentSlot;
                            selectedTeamId = teams[0]?.id || "";
                        }
                        break;

                    case "error":
                        resetEndGame();
                        submittingAnswer = false;
                        break;

                    case "game-ended":
                        if (endGameTimeout) clearTimeout(endGameTimeout);
                        window.location.href = "/dashboard/games";
                        break;
                }
            } catch (err) {
                console.error("[WS Instructor] Error:", err);
            }
        };

        ws.onerror = () => console.error("[WS Instructor] Connection error");
        ws.onclose = () => {
            wsConnected = false;
            resetEndGame();
            reconnectTimer = setTimeout(connect, 2500);
        };
    }

    onMount(connect);
    onDestroy(() => {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (ws) { ws.onclose = null; ws.close(); }
        if (endGameTimeout) clearTimeout(endGameTimeout);
    });
</script>

<div class="h-screen flex flex-col bg-gray-50 overflow-hidden">

    <!-- Top bar -->
    <div class="shrink-0 px-5 py-3 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shadow-sm">
        <!-- Left: board name + progress + connection -->
        <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 text-xs font-medium">
                {#if wsConnected}
                    <div class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                    <span class="text-green-600">Live</span>
                {:else}
                    <div class="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></div>
                    <span class="text-red-500">Reconnecting...</span>
                {/if}
            </div>
            <span class="text-gray-900 font-bold text-lg">{data.game.board.name}</span>
            <span class="text-gray-400 text-sm">{answeredCount} / {totalQuestions} answered</span>
        </div>
        <!-- Right: action buttons -->
        <div class="flex items-center gap-2">
            {#if data.game.status === "COMPLETED"}
                <a
                    href="/dashboard/games/{data.game.id}/results"
                    class="px-3 py-1.5 rounded-xl text-sm font-bold text-white hover:brightness-105 transition-colors"
                    style="background: #f59e0b"
                >
                    View Results
                </a>
            {:else}
                <a
                    href="/game/{data.game.code}/projector"
                    target="_blank"
                    class="bg-gray-100 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                    Projector
                </a>
                <button
                    type="button"
                    onclick={() => (showEndGameConfirm = true)}
                    class="bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
                >
                    End Game
                </button>
            {/if}
        </div>
    </div>

    <!-- Team strip -->
    <div class="shrink-0 px-5 py-3 border-b border-gray-100 bg-white">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {#each teams as team}
                <div
                    class="p-2.5 rounded-2xl border bg-white"
                    style={`border-color: ${team.color}40`}
                >
                    <!-- Team name + score -->
                    <div class="flex items-center justify-between mb-1.5">
                        <div class="flex items-center gap-1.5 min-w-0">
                            <div
                                class="w-2 h-2 rounded-full shrink-0"
                                style={`background-color: ${team.color}`}
                            ></div>
                            <span class="text-gray-700 text-xs font-semibold truncate">{team.name}</span>
                        </div>
                        <span class="text-xs font-black shrink-0 ml-1" style={`color: ${team.color}`}>
                            ${team.score}
                        </span>
                    </div>
                    <!-- Student list -->
                    <div class="flex flex-col gap-0.5">
                        {#each team.students as student}
                            <div class="flex items-center gap-1.5">
                                <div
                                    class={`w-1.5 h-1.5 rounded-full shrink-0 ${connectedStudents.has(student.id) ? "bg-green-400" : "bg-gray-200"}`}
                                ></div>
                                <span
                                    class={`text-xs truncate ${connectedStudents.has(student.id) ? "text-gray-600" : "text-gray-300"}`}
                                >{student.name}</span>
                            </div>
                        {/each}
                        {#if team.students.length === 0}
                            <p class="text-gray-300 text-xs italic">No students</p>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>

    <!-- Board area -->
    <div class="flex-1 px-5 pb-5 flex flex-col min-h-0 pt-3">
        <div class="flex-1 rounded-2xl overflow-hidden flex flex-col bg-[#0a1628] min-h-0">
            <!-- Category headers -->
            <div class="grid grid-cols-6 gap-1 p-2 bg-white/5 shrink-0">
                {#each data.game.board.categories as category}
                    <div class="text-yellow-400 font-bold text-xs uppercase tracking-wide text-center py-2 px-1">
                        {category.name}
                    </div>
                {/each}
            </div>

            <!-- Question grid -->
            <div class="grid grid-cols-6 gap-1 flex-1 p-2 pt-1 min-h-0">
                {#each Array.from({ length: 5 }, (_, rowIndex) => rowIndex) as rowIndex}
                    {#each data.game.board.categories as category}
                        {@const slot = category.slots.find((s) => s.row === rowIndex)}
                        {#if slot}
                            <button
                                type="button"
                                onclick={() => revealQuestion(slot)}
                                disabled={isSlotAnswered(slot.id)}
                                class={`
                                    rounded-xl transition-all flex items-center justify-center
                                    ${
                                        isSlotAnswered(slot.id)
                                            ? "bg-white/[0.03] cursor-not-allowed"
                                            : "bg-blue-800 hover:bg-blue-600 active:scale-95 cursor-pointer shadow"
                                    }
                                    ${slot.isDailyDouble && !isSlotAnswered(slot.id) ? "ring-1 ring-yellow-400" : ""}
                                `}
                            >
                                {#if !isSlotAnswered(slot.id)}
                                    <span class="text-yellow-400 font-black text-lg md:text-xl">${slot.points}</span>
                                {:else}
                                    <svg
                                        class="w-5 h-5 text-white/15"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fill-rule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clip-rule="evenodd"
                                        />
                                    </svg>
                                {/if}
                            </button>
                        {/if}
                    {/each}
                {/each}
            </div>
        </div>
    </div>
</div>

<!-- Question Modal -->
{#if currentSlot}
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="bg-white border border-gray-100 rounded-3xl max-w-3xl w-full p-7 shadow-2xl">
            <!-- Header -->
            <div class="flex justify-between items-start mb-5">
                <div>
                    <p class="text-gray-400 text-xs uppercase tracking-widest font-medium mb-1">
                        {data.game.board.categories.find((c) =>
                            c.slots.some((s) => s.id === currentSlot.id),
                        )?.name}
                    </p>
                    <p class="text-3xl font-black" style="color: #f59e0b">
                        ${currentSlot.points}
                    </p>
                    {#if currentSlot.isDailyDouble}
                        <span class="mt-2 inline-block px-3 py-1 rounded-full text-xs font-black text-white" style="background: #f59e0b">
                            DAILY DOUBLE
                        </span>
                    {/if}
                </div>
                <button
                    type="button"
                    onclick={closeModal}
                    class="text-gray-300 hover:text-gray-600 transition-colors p-1"
                >
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Buzzer notification -->
            {#if buzzerNotification}
                <div class="bg-red-600 rounded-2xl px-5 py-3 mb-5 flex items-center gap-3 animate-pulse">
                    <svg class="w-6 h-6 text-white shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                    <div>
                        <p class="font-bold text-white text-sm">Buzzer Pressed!</p>
                        <p class="text-red-200 text-xs">{buzzerNotification.studentName} from {buzzerNotification.teamName}</p>
                    </div>
                </div>
            {/if}

            <!-- Clue section -->
            <div class="rounded-2xl p-5 mb-4" style="background: linear-gradient(135deg, #1e3a8a, #1d4ed8)">
                <p class="text-blue-300 text-xs uppercase tracking-widest mb-2">Clue</p>
                <p class="text-white text-xl leading-relaxed">{currentSlot.question.answer}</p>
            </div>

            <!-- Answer section -->
            <div class="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-5">
                <p class="text-amber-400 text-xs uppercase tracking-widest mb-2">Correct Response</p>
                <p class="text-amber-700 text-xl font-semibold">{currentSlot.question.question}</p>
            </div>

            <!-- Team selector -->
            <div class="mb-5">
                <p class="text-gray-500 text-sm font-medium mb-3">Which team is answering?</p>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {#each teams as team}
                        <button
                            type="button"
                            onclick={() => (selectedTeamId = team.id)}
                            class={`
                                p-3 rounded-xl border-2 transition-all text-left
                                ${selectedTeamId === team.id ? "ring-2 ring-gray-400" : "hover:brightness-95"}
                            `}
                            style={`background: ${team.color}10; border-color: ${team.color}40`}
                        >
                            <div class="flex items-center gap-2 mb-0.5">
                                <div class="w-2.5 h-2.5 rounded-full" style={`background-color: ${team.color}`}></div>
                                <span class="text-gray-800 font-semibold text-sm truncate">{team.name}</span>
                            </div>
                            <span class="text-xs font-bold" style={`color: ${team.color}`}>${team.score}</span>
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Score buttons -->
            <div class="flex gap-3">
                <button
                    type="button"
                    onclick={() => submitAnswer(true)}
                    disabled={submittingAnswer || !selectedTeamId}
                    class="flex-1 py-4 bg-green-600 hover:bg-green-500 rounded-2xl font-black text-lg text-white disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    Correct (+${currentSlot.points})
                </button>
                <button
                    type="button"
                    onclick={() => submitAnswer(false)}
                    disabled={submittingAnswer || !selectedTeamId}
                    class="flex-1 py-4 bg-red-600 hover:bg-red-500 rounded-2xl font-black text-lg text-white disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Incorrect (-${currentSlot.points})
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- End Game Confirmation Modal -->
{#if showEndGameConfirm}
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="bg-white border border-gray-100 rounded-3xl max-w-sm w-full p-7 shadow-2xl">
            <div class="flex items-center gap-4 mb-4">
                <div class="bg-red-50 rounded-full p-3 shrink-0">
                    <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 class="text-gray-900 font-black text-xl">End Game?</h3>
            </div>
            <p class="text-gray-500 text-sm mb-5">
                Are you sure you want to end this game? Students will no longer be able to play and this action cannot be undone.
            </p>
            {#if endGameError}
                <p class="text-red-500 text-sm mb-4">{endGameError}</p>
            {/if}
            <div class="flex gap-3">
                <button
                    type="button"
                    onclick={() => { showEndGameConfirm = false; resetEndGame(); }}
                    disabled={endingGame}
                    class="bg-gray-100 text-gray-700 flex-1 py-3 rounded-2xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onclick={endGame}
                    disabled={endingGame}
                    class="bg-red-600 text-white flex-1 py-3 rounded-2xl font-bold hover:bg-red-500 transition-colors disabled:opacity-50"
                >
                    {endingGame ? "Ending..." : "End Game"}
                </button>
            </div>
        </div>
    </div>
{/if}
