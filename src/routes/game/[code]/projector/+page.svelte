<script lang="ts">
    import type { PageData } from "./$types";
    import { onMount, onDestroy } from "svelte";
    import JeopardyBoard from "$lib/components/JeopardyBoard.svelte";
    import QuestionDisplay from "$lib/components/QuestionDisplay.svelte";

    let { data }: { data: PageData } = $props();

    // Real-time game state
    let answeredSlots = $state<string[]>(
        typeof data.game.gameState?.answeredSlots === "string"
            ? JSON.parse(data.game.gameState.answeredSlots)
            : (data.game.gameState?.answeredSlots ?? []),
    );
    let currentSlotData = $state<any>(null);
    let connectionStatus = $state<"connected" | "connecting" | "disconnected">(
        "connecting",
    );
    let teams = $state<any[]>([]);
    let ws: WebSocket | null = null;
    let clueReady = $state(false);
    let currentWager = $state<number | null>(null);

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

    // Sort teams by score descending for the scoreboard
    const sortedTeams = $derived(
        [...teams].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    );

    function connect() {
        ws = new WebSocket(`/api/ws/${data.game.id}?role=projector`);

        ws.onopen = () => {
            connectionStatus = "connected";
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);

                switch (msg.type) {
                    case "question-revealed":
                        currentSlotData = msg.currentSlot;
                        clueReady = !msg.currentSlot?.isDailyDouble;
                        currentWager = null;
                        break;

                    case "wager-submitted":
                        clueReady = true;
                        currentWager = msg.wager;
                        break;

                    case "question-closed":
                        currentSlotData = null;
                        clueReady = false;
                        currentWager = null;
                        break;

                    case "answer-submitted":
                        answeredSlots = msg.answeredSlots;
                        currentSlotData = null;
                        clueReady = false;
                        currentWager = null;
                        if (msg.teams) teams = msg.teams;
                        break;

                    case "game-state-snapshot":
                        if (msg.teams) teams = msg.teams;
                        if (msg.answeredSlots) answeredSlots = msg.answeredSlots;
                        currentSlotData = msg.currentSlot ?? null;
                        if (msg.currentSlot) {
                            clueReady = !msg.currentSlot.isDailyDouble || !!msg.currentWager;
                            currentWager = msg.currentWager ?? null;
                        }
                        break;

                    case "game-started":
                        window.location.reload();
                        break;

                    case "game-ended":
                        window.location.reload();
                        break;
                }
            } catch (error) {
                console.error("[WS Projector] Error parsing message:", error);
            }
        };

        ws.onclose = () => {
            connectionStatus = "disconnected";
            setTimeout(connect, 3000);
        };

        ws.onerror = () => {
            connectionStatus = "disconnected";
        };
    }

    onMount(connect);
    onDestroy(() => ws?.close());
</script>

<svelte:head>
    <title>Jeopardy! - Projector View</title>
</svelte:head>

<div class="fixed inset-0 bg-[#0f172a] flex flex-col">
    <!-- Top bar -->
    <div class="shrink-0 px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4">
        <!-- Left: Title + connection dot -->
        <div class="flex items-center gap-3">
            <div
                class={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    connectionStatus === "connected"
                        ? "bg-green-400"
                        : "bg-white/20"
                }`}
            ></div>
            <h1 class="text-yellow-400 font-black text-3xl md:text-4xl tracking-tight">
                JEOPARDY!
            </h1>
        </div>

        <!-- Right: Game code pill -->
        <div class="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-white/60 text-sm font-mono tracking-widest">
            {data.game.code}
        </div>
    </div>

    <!-- Main area -->
    <div class="flex-1 flex flex-col px-6 py-4 gap-4 min-h-0">
        {#if currentSlot && currentCategory}
            {#if currentSlot.isDailyDouble && !clueReady}
                <!-- Daily Double splash — waiting for wager -->
                <div class="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-6">
                    <p class="text-white/50 text-sm md:text-base uppercase tracking-widest font-medium">{currentCategory.name}</p>
                    <p class="text-8xl md:text-9xl font-black" style="color: #f59e0b">💰</p>
                    <span class="inline-block px-8 py-3 rounded-full text-2xl md:text-4xl font-black tracking-wide" style="background: #f59e0b; color: #1e3a8a">
                        DAILY DOUBLE
                    </span>
                    <p class="text-white/40 text-lg">Wager being placed...</p>
                </div>
            {:else}
                <QuestionDisplay
                    categoryName={currentCategory.name}
                    points={currentSlot.points}
                    isDailyDouble={currentSlot.isDailyDouble}
                    clue={currentSlot.question.answer}
                    wager={currentWager}
                />
            {/if}
        {:else}
            <JeopardyBoard
                categories={data.game.board.categories}
                {answeredSlots}
            />
        {/if}

        <!-- LOBBY status pill -->
        {#if data.game.status === "LOBBY"}
            <div class="shrink-0 flex justify-center">
                <div class="bg-yellow-500 text-blue-950 rounded-full px-8 py-3 text-xl font-black">
                    Game Starting Soon...
                </div>
            </div>
        {:else if data.game.status === "COMPLETED"}
            <div class="shrink-0 flex justify-center">
                <div class="bg-green-500/20 border border-green-500/40 text-green-400 rounded-full px-8 py-3 text-xl font-black">
                    Game Complete!
                </div>
            </div>
        {/if}

        <!-- Bottom score strip -->
        {#if sortedTeams.length > 0}
            <div class="shrink-0 flex flex-wrap gap-2 justify-center pb-1">
                {#each sortedTeams as team, i}
                    <div
                        class="flex items-center gap-2 px-4 py-2 rounded-full border"
                        style={`background: ${team.color}15; border-color: ${team.color}40`}
                    >
                        <span class="text-white/30 text-xs font-mono">#{i + 1}</span>
                        <div
                            class="w-2.5 h-2.5 rounded-full shrink-0"
                            style={`background-color: ${team.color}`}
                        ></div>
                        <span class="text-white/70 text-sm font-medium">{team.name}</span>
                        <span class="text-sm font-black" style={`color: ${team.color}`}>
                            ${team.score ?? 0}
                        </span>
                    </div>
                {/each}
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
