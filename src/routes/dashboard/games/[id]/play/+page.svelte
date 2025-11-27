<script lang="ts">
    import type { PageData } from "./$types";
    import { onMount } from "svelte";

    let { data }: { data: PageData } = $props();

    // Local state for real-time updates
    let teams = $state(data.game.teams);
    let answeredSlots = $state(data.game.gameState?.answeredSlots || []);
    let currentSlot = $state<any>(null);
    let selectedTeamId = $state("");
    let submittingAnswer = $state(false);
    let buzzerNotification = $state<{
        studentName: string;
        teamName: string;
    } | null>(null);

    function isSlotAnswered(slotId: string) {
        return answeredSlots.includes(slotId);
    }

    async function revealQuestion(slot: any) {
        if (isSlotAnswered(slot.id)) {
            return;
        }

        currentSlot = slot;
        selectedTeamId = teams[0]?.id || "";

        // Call API to reveal question
        await fetch(`/api/games/${data.game.id}/reveal-question`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ slotId: slot.id }),
        });
    }

    async function submitAnswer(isCorrect: boolean) {
        if (!selectedTeamId || !currentSlot) return;

        submittingAnswer = true;

        try {
            const response = await fetch(`/api/games/${data.game.id}/answer`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    teamId: selectedTeamId,
                    isCorrect,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                teams = result.teams;
                answeredSlots = result.gameState.answeredSlots;
                currentSlot = null;
                selectedTeamId = "";
            } else {
                alert("Failed to submit answer");
            }
        } finally {
            submittingAnswer = false;
        }
    }

    function closeModal() {
        currentSlot = null;
    }

    // Count answered questions
    let answeredCount = $derived(answeredSlots.length);
    let totalQuestions = 30;

    // Set up Server-Sent Events for real-time updates
    onMount(() => {
        const eventSource = new EventSource(`/api/sse/${data.game.id}`);

        eventSource.onmessage = (event) => {
            try {
                const eventData = JSON.parse(event.data);
                console.log("[SSE Instructor] Received event:", eventData.type);

                switch (eventData.type) {
                    case "connected":
                        console.log(
                            "[SSE Instructor] Connected with client ID:",
                            eventData.clientId,
                        );
                        break;

                    case "buzzer-pressed":
                        // Show notification when student buzzes in
                        buzzerNotification = {
                            studentName: eventData.studentName,
                            teamName: eventData.teamName,
                        };
                        // Auto-hide after 3 seconds
                        setTimeout(() => {
                            buzzerNotification = null;
                        }, 3000);
                        break;

                    case "answer-submitted":
                        // Update scores when answer is submitted (in case of multiple instructors)
                        teams = eventData.teams;
                        answeredSlots = eventData.answeredSlots;
                        break;
                }
            } catch (error) {
                console.error("[SSE Instructor] Error parsing event:", error);
            }
        };

        eventSource.onerror = (error) => {
            console.error("[SSE Instructor] Connection error:", error);
            eventSource.close();
        };

        // Cleanup on unmount
        return () => {
            eventSource.close();
        };
    });
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-4">
    <div class="max-w-7xl mx-auto">
        <!-- Header with Scoreboard -->
        <div class="mb-6 bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div class="flex justify-between items-center mb-4">
                <div class="text-white">
                    <h1 class="text-2xl font-bold">{data.game.board.name}</h1>
                    <p class="text-blue-200">
                        Progress: {answeredCount}/{totalQuestions} questions
                    </p>
                </div>
                <a
                    href="/dashboard/games"
                    class="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                >
                    End Game
                </a>
            </div>

            <!-- Team Scores -->
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {#each teams as team}
                    <div
                        class="p-4 rounded-lg text-center"
                        style={`background-color: ${team.color}20; border: 2px solid ${team.color}`}
                    >
                        <div
                            class="flex items-center justify-center gap-2 mb-1"
                        >
                            <div
                                class="w-3 h-3 rounded-full"
                                style={`background-color: ${team.color}`}
                            ></div>
                            <p class="font-semibold text-white text-sm">
                                {team.name}
                            </p>
                        </div>
                        <p class="text-2xl font-bold text-white">
                            ${team.score}
                        </p>
                        <p class="text-xs text-blue-200">
                            {team.students.length} students
                        </p>
                    </div>
                {/each}
            </div>
        </div>

        <!-- Jeopardy Board -->
        <div class="bg-blue-800 rounded-lg p-4 shadow-2xl">
            <!-- Category Headers -->
            <div class="grid grid-cols-6 gap-2 mb-2">
                {#each data.game.board.categories as category}
                    <div class="bg-blue-900 p-4 rounded-lg text-center">
                        <h3
                            class="text-yellow-400 font-bold text-sm uppercase tracking-wide"
                        >
                            {category.name}
                        </h3>
                    </div>
                {/each}
            </div>

            <!-- Question Grid -->
            <div class="grid grid-cols-6 gap-2">
                {#each data.game.board.categories as category}
                    {#each category.slots as slot}
                        <button
                            type="button"
                            onclick={() => revealQuestion(slot)}
                            disabled={isSlotAnswered(slot.id)}
                            class={`
								aspect-square p-4 rounded-lg font-bold text-2xl transition-all
								${
                                    isSlotAnswered(slot.id)
                                        ? "bg-blue-900/50 text-blue-700 cursor-not-allowed"
                                        : "bg-blue-600 text-yellow-400 hover:bg-blue-500 hover:scale-105 cursor-pointer shadow-lg"
                                }
								${slot.isDailyDouble && !isSlotAnswered(slot.id) ? "ring-4 ring-yellow-500" : ""}
							`}
                        >
                            {#if !isSlotAnswered(slot.id)}
                                ${slot.points}
                                {#if slot.isDailyDouble}
                                    <div class="text-xs mt-1">DD</div>
                                {/if}
                            {:else}
                                <svg
                                    class="w-8 h-8 mx-auto"
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
                    {/each}
                {/each}
            </div>
        </div>
    </div>
</div>

<!-- Question Modal -->
{#if currentSlot}
    <div
        class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
    >
        <div
            class="bg-blue-900 rounded-lg max-w-4xl w-full p-8 text-white shadow-2xl"
        >
            <!-- Header -->
            <div class="flex justify-between items-start mb-6">
                <div>
                    <div class="text-yellow-400 text-sm font-semibold mb-1">
                        {data.game.board.categories.find((c) =>
                            c.slots.some((s) => s.id === currentSlot.id),
                        )?.name}
                    </div>
                    <div class="text-3xl font-bold text-yellow-400">
                        ${currentSlot.points}
                    </div>
                    {#if currentSlot.isDailyDouble}
                        <div
                            class="mt-2 inline-block px-3 py-1 bg-yellow-500 text-blue-900 rounded-full text-sm font-bold"
                        >
                            DAILY DOUBLE
                        </div>
                    {/if}
                </div>
                <button
                    onclick={closeModal}
                    class="text-white/60 hover:text-white transition-colors"
                >
                    <svg
                        class="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            <!-- Buzzer Notification -->
            {#if buzzerNotification}
                <div
                    class="mb-6 bg-red-600 text-white px-6 py-4 rounded-lg shadow-xl animate-pulse"
                >
                    <div class="flex items-center gap-3">
                        <svg
                            class="w-8 h-8"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"
                            />
                        </svg>
                        <div>
                            <p class="font-bold text-lg">Buzzer Pressed!</p>
                            <p class="text-sm">
                                {buzzerNotification.studentName} from {buzzerNotification.teamName}
                            </p>
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Answer (Clue) -->
            <div class="mb-6 p-6 bg-blue-800 rounded-lg">
                <p class="text-sm text-blue-300 mb-2 uppercase tracking-wide">
                    Clue
                </p>
                <p class="text-2xl">{currentSlot.question.answer}</p>
            </div>

            <!-- Question (Response) -->
            <div class="mb-8 p-6 bg-blue-700 rounded-lg">
                <p class="text-sm text-blue-300 mb-2 uppercase tracking-wide">
                    Correct Response
                </p>
                <p class="text-2xl font-semibold text-yellow-400">
                    {currentSlot.question.question}
                </p>
            </div>

            <!-- Team Selection -->
            <div class="mb-6">
                <label class="block text-sm font-medium text-blue-200 mb-3">
                    Which team is answering?
                </label>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {#each teams as team}
                        <button
                            type="button"
                            onclick={() => (selectedTeamId = team.id)}
                            class={`
								p-4 rounded-lg border-2 transition-all text-left
								${selectedTeamId === team.id ? "ring-4 ring-white" : "hover:scale-105"}
							`}
                            style={`background-color: ${team.color}40; border-color: ${team.color}`}
                        >
                            <div class="flex items-center gap-2 mb-1">
                                <div
                                    class="w-3 h-3 rounded-full"
                                    style={`background-color: ${team.color}`}
                                ></div>
                                <span class="font-semibold">{team.name}</span>
                            </div>
                            <div class="text-sm text-blue-200">
                                ${team.score}
                            </div>
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Scoring Buttons -->
            <div class="flex gap-4">
                <button
                    type="button"
                    onclick={() => submitAnswer(true)}
                    disabled={submittingAnswer || !selectedTeamId}
                    class="flex-1 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-lg disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <svg
                        class="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                    Correct (+${currentSlot.points})
                </button>
                <button
                    type="button"
                    onclick={() => submitAnswer(false)}
                    disabled={submittingAnswer || !selectedTeamId}
                    class="flex-1 px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold text-lg disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <svg
                        class="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                    Incorrect (-${currentSlot.points})
                </button>
            </div>
        </div>
    </div>
{/if}
