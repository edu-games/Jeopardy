<script lang="ts">
    import type { PageData } from "./$types";
    import { onMount } from "svelte";

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

    function isSlotAnswered(slotId: string) {
        return answeredSlots.includes(slotId);
    }

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
                    <!-- Connection Status Indicator -->
                    <div class="flex items-center justify-center gap-2 mb-2">
                        {#if connectionStatus === "connected"}
                            <div
                                class="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-400 animate-pulse"
                                title="Connected"
                            ></div>
                            <span class="text-xs text-green-300/80">Live</span>
                        {:else if connectionStatus === "connecting"}
                            <div
                                class="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-400 animate-pulse"
                                title="Connecting"
                            ></div>
                            <span class="text-xs text-yellow-300/80"
                                >Connecting...</span
                            >
                        {:else}
                            <div
                                class="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-400 animate-pulse"
                                title="Disconnected"
                            ></div>
                            <span class="text-xs text-red-300/80"
                                >Reconnecting...</span
                            >
                        {/if}
                    </div>

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
            <!-- Question Display Mode -->
            <div
                class="flex-1 bg-blue-800 rounded-xl md:rounded-2xl p-6 md:p-10 lg:p-12 shadow-2xl flex flex-col justify-center"
            >
                <div class="text-center mb-6 md:mb-8">
                    <div
                        class="text-yellow-400 font-semibold text-xl md:text-2xl lg:text-3xl mb-2"
                    >
                        {currentCategory.name}
                    </div>
                    <div
                        class="text-4xl md:text-5xl lg:text-6xl font-bold text-yellow-400"
                    >
                        ${currentSlot.points}
                    </div>
                    {#if currentSlot.isDailyDouble}
                        <div
                            class="mt-3 md:mt-4 inline-block px-4 md:px-6 py-2 md:py-3 bg-yellow-500 text-blue-900 rounded-full text-lg md:text-xl lg:text-2xl font-bold"
                        >
                            DAILY DOUBLE
                        </div>
                    {/if}
                </div>

                <!-- Clue Display -->
                <div
                    class="bg-blue-700 rounded-lg md:rounded-xl p-6 md:p-10 lg:p-12 flex items-center justify-center flex-1"
                >
                    <p
                        class="text-4xl md:text-6xl lg:text-7xl text-white text-center leading-relaxed"
                    >
                        {currentSlot.question.answer}
                    </p>
                </div>
            </div>
        {:else}
            <!-- Board Display Mode -->
            <div
                class="flex-1 bg-blue-800 rounded-xl md:rounded-2xl p-3 md:p-6 lg:p-8 shadow-2xl flex flex-col"
            >
                <!-- Category Headers -->
                <div
                    class="grid grid-cols-6 gap-1 md:gap-2 lg:gap-4 mb-1 md:mb-2 lg:mb-4 flex-shrink-0"
                >
                    {#each data.game.board.categories as category}
                        <div
                            class="bg-blue-900 p-2 md:p-4 lg:p-6 rounded-lg md:rounded-xl text-center"
                        >
                            <h3
                                class="text-yellow-400 font-bold text-xs md:text-lg lg:text-2xl uppercase tracking-wide line-clamp-2"
                            >
                                {category.name}
                            </h3>
                        </div>
                    {/each}
                </div>

                <!-- Question Grid -->
                <div class="grid grid-cols-6 gap-1 md:gap-2 lg:gap-4 flex-1">
                    {#each Array.from({ length: 5 }, (_, rowIndex) => rowIndex) as rowIndex}
                        {#each data.game.board.categories as category}
                            {@const slot = category.slots.find(
                                (s) => s.row === rowIndex,
                            )}
                            {#if slot}
                                <div
                                    class={`
                                        rounded-lg md:rounded-xl font-semibold text-xl md:text-3xl lg:text-5xl transition-all flex items-center justify-center
                                        ${
                                            isSlotAnswered(slot.id)
                                                ? "bg-blue-900/50 text-blue-700"
                                                : "bg-blue-600 text-yellow-400"
                                        }
                                    `}
                                >
                                    {#if !isSlotAnswered(slot.id)}
                                        <div class="text-center">
                                            ${slot.points}
                                        </div>
                                    {:else}
                                        <svg
                                            class="w-8 md:w-16 lg:w-20 h-8 md:h-16 lg:h-20"
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
                                </div>
                            {/if}
                        {/each}
                    {/each}
                </div>
            </div>
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
