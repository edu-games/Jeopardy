<script lang="ts">
    import type { PageData } from "./$types";
    import { onMount } from "svelte";
    import ConnectionStatus from "$lib/components/ConnectionStatus.svelte";
    import JeopardyBoard from "$lib/components/JeopardyBoard.svelte";
    import QuestionDisplay from "$lib/components/QuestionDisplay.svelte";

    let { data }: { data: PageData } = $props();

    // Real-time game state
    let answeredSlots = $state(data.game.gameState?.answeredSlots || []);
    let currentSlotData = $state<any>(null);
    let connectionStatus = $state<"connected" | "connecting" | "disconnected">(
        "connecting",
    );

    // Get current question slot if one is active
    const currentSlot = $derived(
        currentSlotData ||
            (data.game.gameState?.currentSlotId
                ? data.game.board.categories
                      .flatMap((c) => c.slots)
                      .find((s) => s.id === data.game.gameState?.currentSlotId)
                : null),
    );

    const currentCategory = $derived(
        currentSlot
            ? data.game.board.categories.find((c) =>
                  c.slots.some((s) => s.id === currentSlot.id),
              )
            : null,
    );

    // Set up Server-Sent Events for real-time updates
    onMount(() => {
        const eventSource = new EventSource(`/api/sse/${data.game.id}`);

        eventSource.onopen = () => {
            connectionStatus = "connected";
            console.log("[SSE Projector] Connection opened");
        };

        eventSource.onmessage = (event) => {
            try {
                const eventData = JSON.parse(event.data);
                console.log("[SSE Projector] Received event:", eventData.type);

                switch (eventData.type) {
                    case "connected":
                        connectionStatus = "connected";
                        console.log(
                            "[SSE Projector] Connected with client ID:",
                            eventData.clientId,
                        );
                        break;

                    case "question-revealed":
                        // New question revealed
                        currentSlotData = eventData.currentSlot;
                        break;

                    case "answer-submitted":
                        // Answer was submitted, update answered slots and reset question
                        console.log(
                            "[SSE Projector] Answer submitted:",
                            eventData,
                        );
                        answeredSlots = eventData.answeredSlots;
                        currentSlotData = null;
                        break;

                    case "game-ended":
                        // Game ended
                        window.location.reload();
                        break;
                }
            } catch (error) {
                console.error("[SSE Projector] Error parsing event:", error);
            }
        };

        eventSource.onerror = (error) => {
            console.error("[SSE Projector] Connection error:", error);
            connectionStatus = "disconnected";

            // Try to reconnect after 3 seconds
            setTimeout(() => {
                if (eventSource.readyState === EventSource.CLOSED) {
                    window.location.reload();
                }
            }, 3000);
        };

        // Cleanup on unmount
        return () => {
            eventSource.close();
        };
    });
</script>

<svelte:head>
    <title>Jeopardy! - Projector View</title>
</svelte:head>

<div
    class="fixed inset-0 bg-gradient-to-br from-blue-900 to-blue-700 flex flex-col p-4 md:p-6 lg:p-8"
>
    <div class="flex-1 flex flex-col max-h-screen">
        <!-- Header -->
        <div class="mb-4 md:mb-6 flex-shrink-0">
            <div class="flex items-start justify-between gap-4">
                <!-- Center: Title and Connection Status -->
                <div class="flex-1 text-center">
                    <ConnectionStatus status={connectionStatus} />

                    <h1
                        class="text-3xl md:text-5xl lg:text-6xl font-bold text-yellow-400 mb-1 md:mb-2"
                    >
                        Jeopardy!
                    </h1>
                </div>

                <!-- Right: Game Code -->
                <div
                    class="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-right"
                >
                    <p
                        class="text-lg md:text-xl lg:text-2xl font-bold text-white/90 tracking-wider"
                    >
                        {data.game.code}
                    </p>
                </div>
            </div>
        </div>

        {#if currentSlot && currentCategory}
            <QuestionDisplay
                categoryName={currentCategory.name}
                points={currentSlot.points}
                isDailyDouble={currentSlot.isDailyDouble}
                clue={currentSlot.question.answer}
            />
        {:else}
            <JeopardyBoard
                categories={data.game.board.categories}
                {answeredSlots}
            />
        {/if}

        <!-- Game Status Indicator -->
        {#if data.game.status === "LOBBY"}
            <div class="mt-4 md:mt-6 lg:mt-8 text-center flex-shrink-0">
                <div
                    class="inline-block bg-yellow-500 text-blue-900 px-6 md:px-8 py-3 md:py-4 rounded-full text-lg md:text-xl lg:text-2xl font-bold"
                >
                    Game Starting Soon...
                </div>
            </div>
        {:else if data.game.status === "COMPLETED"}
            <div class="mt-4 md:mt-6 lg:mt-8 text-center flex-shrink-0">
                <div
                    class="inline-block bg-green-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-full text-lg md:text-xl lg:text-2xl font-bold"
                >
                    Game Complete!
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    /* Ensure text is readable on projectors */
    :global(body) {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }
</style>
