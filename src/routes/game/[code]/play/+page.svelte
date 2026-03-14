<script lang="ts">
    import type { PageData } from "./$types";
    import { onMount, onDestroy } from "svelte";

    let { data }: { data: PageData } = $props();

    let buzzerPressed = $state(false);
    let pressingBuzzer = $state(false);
    let buzzerError = $state("");
    let wsConnected = $state(false);

    // Real-time game state
    let teams = $state(data.game.teams);
    let gameStatus = $state(data.game.status);
    let gameState = $state(data.game.gameState);
    let currentSlotData = $state<any>(null);
    let ws: WebSocket | null = null;

    const currentSlot = $derived(
        currentSlotData ||
            (gameState?.currentSlotId
                ? data.game.board.categories
                      .flatMap((c) => c.slots)
                      .find((s) => s.id === gameState?.currentSlotId)
                : null),
    );

    const currentCategory = $derived(
        currentSlot
            ? data.game.board.categories.find((c) =>
                  c.slots.some((s) => s.id === currentSlot.id),
              )
            : null,
    );

    const buzzerEnabled = $derived(gameState?.buzzerEnabled || false);
    const myTeam = $derived(teams.find((t) => t.id === data.student.team?.id));
    const sortedTeams = $derived([...teams].sort((a, b) => b.score - a.score));

    function pressBuzzer() {
        if (!buzzerEnabled || buzzerPressed || pressingBuzzer || !ws) return;
        pressingBuzzer = true;
        buzzerError = "";
        ws.send(JSON.stringify({ type: "buzzer" }));
    }

    function connect() {
        ws = new WebSocket(
            `/api/ws/${data.game.id}?role=student&studentId=${data.student.id}`
        );

        ws.onopen = () => { wsConnected = true; };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);

                switch (msg.type) {
                    case "question-revealed":
                        currentSlotData = msg.currentSlot;
                        if (gameState) {
                            gameState.currentSlotId = msg.slotId;
                            gameState.buzzerEnabled = msg.buzzerEnabled;
                        }
                        buzzerPressed = false;
                        buzzerError = "";
                        pressingBuzzer = false;
                        break;

                    case "answer-submitted":
                        teams = msg.teams;
                        if (gameState) {
                            gameState.answeredSlots = msg.answeredSlots;
                            gameState.currentSlotId = msg.currentSlotId;
                            gameState.buzzerEnabled = false;
                        }
                        currentSlotData = null;
                        buzzerPressed = false;
                        pressingBuzzer = false;
                        break;

                    case "buzzer-pressed":
                        if (msg.studentId === data.student.id) {
                            buzzerPressed = true;
                        }
                        pressingBuzzer = false;
                        if (gameState) gameState.buzzerEnabled = false;
                        break;

                    case "buzzer-enabled":
                        if (gameState) gameState.buzzerEnabled = true;
                        buzzerPressed = false;
                        pressingBuzzer = false;
                        break;

                    case "error":
                        if (pressingBuzzer) {
                            buzzerError = msg.message || "Too slow!";
                            pressingBuzzer = false;
                        }
                        break;

                    case "game-started":
                        gameStatus = "IN_PROGRESS";
                        break;

                    case "game-ended":
                        window.location.href = `/game/${data.game.code}/results?studentId=${data.student.id}`;
                        break;
                }
            } catch (err) {
                console.error("[WS Student] Error:", err);
            }
        };

        ws.onclose = () => {
            wsConnected = false;
            // Reconnect after a short delay
            setTimeout(connect, 2000);
        };

        ws.onerror = () => {
            pressingBuzzer = false;
        };
    }

    onMount(connect);
    onDestroy(() => {
        ws?.close();
        ws = null;
    });
</script>

<div class="h-dvh flex flex-col bg-blue-950 overflow-hidden select-none">

    <!-- Top bar: name + team + score -->
    <div class="flex items-center justify-between px-4 py-3 bg-blue-900 border-b border-blue-800 shrink-0">
        <div class="flex items-center gap-2 min-w-0">
            {#if myTeam}
                <div class="w-3 h-3 rounded-full shrink-0" style="background-color: {myTeam.color}"></div>
                <span class="text-white font-semibold text-sm truncate">{myTeam.name}</span>
            {:else}
                <span class="text-blue-300 text-sm">No team yet</span>
            {/if}
        </div>
        <div class="text-center">
            <p class="text-blue-200 text-xs leading-none">JEOPARDY!</p>
            <p class="text-white text-sm font-medium truncate max-w-32">{data.student.name}</p>
        </div>
        <div class="text-right">
            {#if myTeam}
                <p class="text-yellow-400 font-bold text-xl leading-none">${myTeam.score.toLocaleString()}</p>
            {:else}
                <p class="text-blue-600 text-xl">—</p>
            {/if}
        </div>
    </div>

    <!-- Main content -->
    <div class="flex-1 flex flex-col justify-center px-4 py-4 overflow-hidden">

        {#if gameStatus === "LOBBY"}
            <!-- Waiting for game to start -->
            <div class="text-center">
                <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-800 flex items-center justify-center">
                    <svg class="w-10 h-10 text-blue-300 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 class="text-2xl font-bold text-white mb-2">You're in!</h2>
                <p class="text-blue-300">Waiting for the game to start...</p>
                {#if !myTeam}
                    <p class="text-yellow-400 text-sm mt-4">The instructor will assign you to a team</p>
                {/if}
            </div>

        {:else if gameStatus === "IN_PROGRESS"}

            {#if currentSlot && currentCategory}
                <!-- Active question -->
                <div class="flex flex-col gap-3 h-full justify-between">
                    <!-- Question info -->
                    <div class="bg-blue-900 rounded-2xl p-4 text-center">
                        <p class="text-yellow-400 font-semibold text-xs uppercase tracking-widest mb-1">{currentCategory.name}</p>
                        <p class="text-yellow-400 font-bold text-3xl">${currentSlot.points}</p>
                        {#if currentSlot.isDailyDouble}
                            <span class="inline-block mt-2 px-3 py-1 bg-yellow-500 text-blue-950 rounded-full text-xs font-black uppercase tracking-wide">Daily Double</span>
                        {/if}
                    </div>

                    <!-- Clue -->
                    <div class="bg-blue-800 rounded-2xl p-5 flex-1 flex items-center justify-center">
                        <p class="text-white text-xl text-center leading-relaxed">{currentSlot.question.answer}</p>
                    </div>

                    <!-- Buzzer area -->
                    {#if buzzerEnabled && !buzzerPressed}
                        <div class="flex flex-col gap-2">
                            <button
                                type="button"
                                onclick={pressBuzzer}
                                disabled={pressingBuzzer}
                                class="w-full py-10 rounded-2xl font-black text-3xl tracking-wide transition-all active:scale-95 shadow-2xl
                                    {pressingBuzzer
                                        ? 'bg-red-800 text-red-400 cursor-not-allowed'
                                        : 'bg-red-600 active:bg-red-700 text-white'}"
                            >
                                {#if pressingBuzzer}
                                    <svg class="animate-spin h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                {:else}
                                    BUZZ IN
                                {/if}
                            </button>
                            {#if buzzerError}
                                <p class="text-red-400 text-center text-sm">{buzzerError}</p>
                            {/if}
                        </div>

                    {:else if buzzerPressed}
                        <div class="w-full py-10 rounded-2xl bg-green-600 text-center">
                            <p class="text-white font-black text-3xl">YOU'RE IN!</p>
                            <p class="text-green-200 text-sm mt-1">Wait for the instructor</p>
                        </div>

                    {:else}
                        <div class="w-full py-8 rounded-2xl bg-blue-900 text-center">
                            <p class="text-blue-400 font-bold text-xl">
                                {currentSlot.isDailyDouble ? "Daily Double — no buzzer" : "Buzzer locked"}
                            </p>
                        </div>
                    {/if}
                </div>

            {:else}
                <!-- Waiting for next question -->
                <div class="text-center">
                    <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-800 flex items-center justify-center">
                        <svg class="w-10 h-10 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 class="text-xl font-bold text-white mb-1">Get Ready</h2>
                    <p class="text-blue-300 text-sm">Waiting for the next question...</p>
                </div>
            {/if}

        {:else if gameStatus === "COMPLETED"}
            <div class="text-center">
                <div class="text-6xl mb-4">🏆</div>
                <h2 class="text-2xl font-bold text-white mb-2">Game over!</h2>
                <p class="text-blue-300 mb-6">Thanks for playing</p>
                <a
                    href="/game/{data.game.code}/results?studentId={data.student.id}"
                    class="inline-block px-8 py-4 bg-yellow-500 text-blue-950 rounded-2xl font-bold text-lg"
                >
                    See Results
                </a>
            </div>
        {/if}

    </div>

    <!-- Score strip -->
    {#if gameStatus === "IN_PROGRESS"}
        <div class="shrink-0 bg-blue-900 border-t border-blue-800 px-3 py-2">
            <div class="flex gap-2 overflow-x-auto scrollbar-none">
                {#each sortedTeams as team (team.id)}
                    <div
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0 text-sm
                            {team.id === myTeam?.id ? 'ring-2 ring-white' : ''}"
                        style="background-color: {team.color}25; border: 1.5px solid {team.color}"
                    >
                        <div class="w-2 h-2 rounded-full shrink-0" style="background-color: {team.color}"></div>
                        <span class="text-white font-medium">{team.name}</span>
                        <span class="text-yellow-400 font-bold">${team.score.toLocaleString()}</span>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Connection indicator -->
    {#if !wsConnected}
        <div class="absolute bottom-0 left-0 right-0 bg-red-900/90 text-red-200 text-xs text-center py-1.5">
            Reconnecting...
        </div>
    {/if}

</div>
