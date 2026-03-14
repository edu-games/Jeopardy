<script lang="ts">
    import type { PageData } from "./$types";
    import { onMount, onDestroy } from "svelte";

    let { data }: { data: PageData } = $props();

    let buzzerPressed = $state(false);
    let pressingBuzzer = $state(false);
    let buzzerError = $state("");
    let wsConnected = $state(false);

    let teams = $state(data.game.teams);
    let gameStatus = $state(data.game.status);
    let gameState = $state(data.game.gameState);
    let currentSlotData = $state<any>(null);
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

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

    const buzzerEnabled = $derived(gameState?.buzzerEnabled ?? false);
    const myTeam = $derived(teams.find((t) => t.id === data.student.team?.id));
    const sortedTeams = $derived([...teams].sort((a, b) => b.score - a.score));
    const myRank = $derived(sortedTeams.findIndex(t => t.id === myTeam?.id) + 1);

    function pressBuzzer() {
        if (!buzzerEnabled || buzzerPressed || pressingBuzzer || !ws) return;
        pressingBuzzer = true;
        buzzerError = "";
        ws.send(JSON.stringify({ type: "buzzer" }));
    }

    function connect() {
        if (ws) { ws.onclose = null; ws.close(); }
        ws = new WebSocket(`/api/ws/${data.game.id}?role=student&studentId=${data.student.id}`);
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
                        if (msg.studentId === data.student.id) buzzerPressed = true;
                        pressingBuzzer = false;
                        if (gameState) gameState.buzzerEnabled = false;
                        break;
                    case "buzzer-enabled":
                        if (gameState) gameState.buzzerEnabled = true;
                        buzzerPressed = false;
                        pressingBuzzer = false;
                        break;
                    case "team-assigned":
                        teams = msg.teams;
                        break;
                    case "error":
                        if (pressingBuzzer) {
                            buzzerError = "Too slow!";
                            pressingBuzzer = false;
                        }
                        break;
                    case "game-started":
                        gameStatus = "IN_PROGRESS";
                        break;
                    case "game-ended":
                        localStorage.removeItem(storageKey);
                        window.location.href = `/game/${data.game.code}/results?studentId=${data.student.id}`;
                        break;
                }
            } catch (err) {
                console.error("[WS] Error:", err);
            }
        };

        ws.onclose = () => {
            wsConnected = false;
            reconnectTimer = setTimeout(connect, 2500);
        };

        ws.onerror = () => { pressingBuzzer = false; };
    }

    const storageKey = `jeopardy_session_${data.game.code}`;

    onMount(() => {
        // Persist session so the join page can redirect back here on reconnect
        localStorage.setItem(storageKey, JSON.stringify({ studentId: data.student.id, name: data.student.name }));
        connect();
    });

    onDestroy(() => {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (ws) { ws.onclose = null; ws.close(); }
    });
</script>

<div class="h-dvh flex flex-col overflow-hidden select-none font-sans"
     style="background: {myTeam ? `linear-gradient(160deg, #0f172a 0%, color-mix(in srgb, ${myTeam.color} 18%, #0f172a) 100%)` : 'linear-gradient(160deg, #0f172a, #1e3a5f)'}">

    <!-- Header -->
    <header class="shrink-0 px-5 pt-5 pb-4">
        <div class="flex items-center justify-between">
            <!-- Team badge -->
            <div class="flex items-center gap-2">
                {#if myTeam}
                    <div class="w-8 h-8 rounded-full shadow-lg border-2 border-white/20"
                         style="background-color: {myTeam.color}"></div>
                    <div>
                        <p class="text-white/50 text-[10px] uppercase tracking-widest leading-none">Team</p>
                        <p class="text-white font-bold text-sm leading-tight">{myTeam.name}</p>
                    </div>
                {:else}
                    <div class="px-3 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/40">
                        <p class="text-yellow-400 text-xs font-medium">Awaiting team</p>
                    </div>
                {/if}
            </div>

            <!-- Player name -->
            <div class="text-center">
                <p class="text-white/40 text-[10px] uppercase tracking-widest leading-none">Player</p>
                <p class="text-white font-semibold text-sm">{data.student.name}</p>
            </div>

            <!-- Score -->
            <div class="text-right">
                {#if myTeam}
                    <p class="text-white/40 text-[10px] uppercase tracking-widest leading-none">Score</p>
                    <p class="font-black text-lg leading-tight" style="color: {myTeam.color}">${myTeam.score.toLocaleString()}</p>
                {:else}
                    <div class="w-14"></div>
                {/if}
            </div>
        </div>
    </header>

    <!-- Main content area -->
    <main class="flex-1 flex flex-col px-5 pb-4 min-h-0 gap-3">

        {#if gameStatus === "LOBBY"}
            <div class="flex-1 flex flex-col items-center justify-center text-center gap-6">
                <!-- Animated waiting indicator -->
                <div class="relative">
                    <div class="w-24 h-24 rounded-full border-2 border-white/10 flex items-center justify-center"
                         style="background: {myTeam ? `${myTeam.color}20` : '#1e40af20'}">
                        <div class="absolute inset-0 rounded-full animate-ping opacity-20"
                             style="background: {myTeam?.color ?? '#3b82f6'}"></div>
                        <span class="text-4xl relative z-10">👋</span>
                    </div>
                </div>
                <div>
                    <h1 class="text-white font-black text-3xl mb-2">You're in!</h1>
                    <p class="text-white/50 text-base">Waiting for the instructor<br>to start the game...</p>
                </div>
                {#if myTeam}
                    <div class="px-5 py-3 rounded-2xl border"
                         style="background: {myTeam.color}15; border-color: {myTeam.color}40">
                        <p class="font-bold text-white">{myTeam.name}</p>
                        <p class="text-white/50 text-sm">Your team</p>
                    </div>
                {/if}
            </div>

        {:else if gameStatus === "IN_PROGRESS"}
            {#if currentSlot && currentCategory}
                <!-- Category + points -->
                <div class="shrink-0 flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10">
                    <p class="text-white/60 text-sm font-semibold uppercase tracking-wide">{currentCategory.name}</p>
                    <div class="flex items-center gap-2">
                        {#if currentSlot.isDailyDouble}
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-yellow-400 text-blue-950">DD</span>
                        {/if}
                        <p class="text-yellow-400 font-black text-lg">${currentSlot.points}</p>
                    </div>
                </div>

                <!-- Clue card -->
                <div class="flex-1 rounded-3xl flex items-center justify-center p-6 border border-white/10 min-h-0"
                     style="background: linear-gradient(135deg, #1e3a8a, #1d4ed8)">
                    <p class="text-white text-2xl font-bold text-center leading-snug tracking-wide">
                        {currentSlot.question.answer}
                    </p>
                </div>

                <!-- Buzzer area -->
                <div class="shrink-0 flex flex-col items-center gap-3 pb-1">
                    {#if buzzerEnabled && !buzzerPressed}
                        {#if buzzerError}
                            <p class="text-red-400 text-sm font-medium">{buzzerError}</p>
                        {/if}
                        <button
                            type="button"
                            onclick={pressBuzzer}
                            disabled={pressingBuzzer}
                            class="w-44 h-44 rounded-full font-black text-2xl tracking-widest uppercase transition-transform active:scale-90 disabled:opacity-60 shadow-2xl border-4 border-red-400/30"
                            style="background: radial-gradient(circle at 35% 35%, #ef4444, #991b1b); box-shadow: 0 0 40px rgba(239,68,68,0.4), inset 0 2px 8px rgba(255,255,255,0.15)"
                        >
                            {#if pressingBuzzer}
                                <svg class="animate-spin h-10 w-10 mx-auto text-white" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            {:else}
                                <span class="text-white drop-shadow-lg">BUZZ!</span>
                            {/if}
                        </button>
                        <p class="text-white/30 text-xs">Tap to buzz in</p>

                    {:else if buzzerPressed}
                        <div class="w-44 h-44 rounded-full flex flex-col items-center justify-center border-4 border-green-400/40"
                             style="background: radial-gradient(circle at 35% 35%, #16a34a, #14532d); box-shadow: 0 0 40px rgba(34,197,94,0.3)">
                            <svg class="w-12 h-12 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                            <p class="text-white font-black text-sm uppercase tracking-wide">You're in!</p>
                        </div>
                        <p class="text-green-400 text-sm font-medium">Wait for the instructor</p>

                    {:else}
                        <div class="w-44 h-44 rounded-full flex flex-col items-center justify-center border-4 border-white/5"
                             style="background: radial-gradient(circle at 35% 35%, #374151, #1f2937)">
                            <svg class="w-10 h-10 text-white/20 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <p class="text-white/25 font-bold text-sm uppercase tracking-wide">Locked</p>
                        </div>
                        <p class="text-white/30 text-xs">
                            {currentSlot.isDailyDouble ? "Daily Double" : "Wait for the buzzer"}
                        </p>
                    {/if}
                </div>

            {:else}
                <!-- Waiting for question -->
                <div class="flex-1 flex flex-col items-center justify-center text-center gap-5">
                    <div class="relative w-24 h-24 flex items-center justify-center">
                        <div class="absolute inset-0 rounded-full border-2 border-white/10 animate-spin" style="border-top-color: {myTeam?.color ?? '#3b82f6'}"></div>
                        <span class="text-3xl">🎯</span>
                    </div>
                    <div>
                        <h2 class="text-white font-black text-2xl">Get ready!</h2>
                        <p class="text-white/40 text-sm mt-1">The instructor is picking a question</p>
                    </div>
                    {#if myTeam}
                        <div class="px-4 py-2 rounded-xl text-sm font-bold"
                             style="background: {myTeam.color}20; color: {myTeam.color}">
                            #{myRank} · {myTeam.name} · ${myTeam.score.toLocaleString()}
                        </div>
                    {/if}
                </div>
            {/if}

        {:else if gameStatus === "COMPLETED"}
            <div class="flex-1 flex flex-col items-center justify-center text-center gap-5">
                <div class="text-7xl">🏆</div>
                <div>
                    <h2 class="text-white font-black text-3xl">Game over!</h2>
                    <p class="text-white/50 mt-1">Thanks for playing</p>
                </div>
                {#if myTeam}
                    <div class="px-5 py-3 rounded-2xl text-center"
                         style="background: {myTeam.color}20; border: 1px solid {myTeam.color}40">
                        <p class="text-white/50 text-xs uppercase tracking-widest">Final score</p>
                        <p class="font-black text-3xl mt-0.5" style="color: {myTeam.color}">${myTeam.score.toLocaleString()}</p>
                        <p class="text-white/60 text-sm">{myTeam.name} · #{myRank}</p>
                    </div>
                {/if}
                <a href="/game/{data.game.code}/results?studentId={data.student.id}"
                   class="px-8 py-4 rounded-2xl font-black text-lg text-blue-950 bg-yellow-400 shadow-xl">
                    See Results
                </a>
            </div>
        {/if}

    </main>

    <!-- Score strip -->
    {#if gameStatus === "IN_PROGRESS"}
        <div class="shrink-0 px-4 pb-4">
            <div class="flex gap-2 overflow-x-auto pb-0.5" style="scrollbar-width: none">
                {#each sortedTeams as team, i (team.id)}
                    <div class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all
                                {team.id === myTeam?.id ? 'ring-1 ring-white/40' : ''}"
                         style="background: {team.color}18; border: 1px solid {team.color}50">
                        <span class="text-white/30 text-[10px] font-bold">#{i+1}</span>
                        <div class="w-2 h-2 rounded-full" style="background-color: {team.color}"></div>
                        <span class="text-white/80 font-medium">{team.name}</span>
                        <span class="font-black" style="color: {team.color}">${team.score.toLocaleString()}</span>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Disconnected overlay -->
    {#if !wsConnected}
        <div class="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 py-2 bg-black/60 backdrop-blur-sm">
            <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <p class="text-white/70 text-xs">Reconnecting...</p>
        </div>
    {/if}

</div>
