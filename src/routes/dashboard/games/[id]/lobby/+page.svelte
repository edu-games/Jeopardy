<script lang="ts">
    import type { PageData } from "./$types";
    import { onMount, onDestroy } from "svelte";

    let { data }: { data: PageData } = $props();

    let starting = $state(false);
    let ws: WebSocket | null = null;

    // Real-time state
    let teams = $state(data.game.teams);
    let students = $state(data.game.students);
    let connectedStudents = $state(new Set<string>());

    // Get unassigned students
    let unassignedStudents = $derived(students.filter((s) => !s.teamId));

    function send(msg: object) {
        ws?.send(JSON.stringify(msg));
    }

    function assignStudent(studentId: string, teamId: string) {
        send({ type: "assign-team", studentId, teamId });
    }

    function startGame() {
        if (
            data.game.teamAssignment === "MANUAL" &&
            unassignedStudents.length > 0
        ) {
            if (
                !confirm(
                    `There are ${unassignedStudents.length} unassigned students. Start game anyway?`,
                )
            ) {
                return;
            }
        }
        starting = true;
        send({ type: "start-game" });
    }

    function copyJoinUrl() {
        const joinUrl = `${data.baseUrl}/game/${data.game.code}/join`;
        navigator.clipboard.writeText(joinUrl);
        alert("Join URL copied to clipboard!");
    }

    onMount(() => {
        ws = new WebSocket(`/api/ws/${data.game.id}?role=instructor`);

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);

                switch (msg.type) {
                    case "student-joined":
                        students = msg.students;
                        teams = msg.teams;
                        break;

                    case "team-assigned":
                        students = msg.students;
                        teams = msg.teams;
                        break;

                    case "student-status": {
                        const next = new Set(connectedStudents);
                        if (msg.connected) next.add(msg.studentId);
                        else next.delete(msg.studentId);
                        connectedStudents = next;
                        break;
                    }

                    case "game-started":
                        window.location.href = `/dashboard/games/${data.game.id}/play`;
                        break;

                    case "error":
                        alert(msg.message || "An error occurred");
                        starting = false;
                        break;
                }
            } catch (err) {
                console.error("[WS Lobby] Error:", err);
            }
        };

        ws.onerror = () => {
            starting = false;
        };
    });

    onDestroy(() => ws?.close());
</script>

<div class="max-w-7xl mx-auto">

    <!-- Header -->
    <div class="flex items-end justify-between mb-8 gap-4">
        <div>
            <p class="text-gray-400 text-xs uppercase tracking-widest mb-1">{data.game.board.name}</p>
            <h1 class="text-3xl font-black text-gray-900">Game Lobby</h1>
        </div>
        <button
            onclick={startGame}
            disabled={starting || students.length === 0}
            class="px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0 bg-green-500 hover:bg-green-600"
        >
            {#if starting}
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Starting...
            {:else}
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5.14v14l11-7-11-7z"/>
                </svg>
                Start Game
            {/if}
        </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">

        <!-- Left: QR + join info -->
        <div class="lg:col-span-2 flex flex-col gap-3">

            <!-- QR Code card -->
            <div class="rounded-2xl p-6 text-center bg-white border border-gray-100 shadow-sm">
                <img
                    src={data.qrCode}
                    alt="QR Code"
                    class="w-full max-w-[200px] mx-auto rounded-xl mb-5"
                    style="image-rendering: pixelated"
                />
                <p class="text-gray-400 text-[10px] uppercase tracking-[0.3em] mb-2">Game Code</p>
                <div class="flex items-center justify-center gap-1.5 mb-4">
                    {#each data.game.code.split('') as char}
                        <div class="w-9 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <span class="text-xl font-black text-amber-500">{char}</span>
                        </div>
                    {/each}
                </div>
                <button
                    onclick={copyJoinUrl}
                    class="flex items-center gap-1.5 mx-auto text-gray-400 hover:text-gray-600 text-xs transition-colors"
                >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                    Copy join link
                </button>
            </div>

            <!-- Info pills -->
            <div class="flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                <span class="text-gray-500 text-sm">Team Assignment</span>
                <span class="text-gray-900 font-semibold text-sm">
                    {data.game.teamAssignment === "RANDOM" ? "Automatic" : "Manual"}
                </span>
            </div>

            <div class="flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                <span class="text-gray-500 text-sm">Students joined</span>
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span class="text-gray-900 font-black text-lg leading-none">{students.length}</span>
                </div>
            </div>
        </div>

        <!-- Right: Teams -->
        <div class="lg:col-span-3 flex flex-col gap-3">

            {#each teams as team}
                <div class="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2.5">
                            <div class="w-3 h-3 rounded-full shrink-0" style={`background: ${team.color}`}></div>
                            <h3 class="text-gray-900 font-bold">{team.name}</h3>
                        </div>
                        <span class="text-gray-400 text-xs">{team.students.length} {team.students.length === 1 ? 'student' : 'students'}</span>
                    </div>

                    {#if team.students.length > 0}
                        <div class="flex flex-wrap gap-1.5">
                            {#each team.students as student}
                                <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm border"
                                     style={`background: ${team.color}12; border-color: ${team.color}30`}>
                                    <div class="w-1.5 h-1.5 rounded-full shrink-0 {connectedStudents.has(student.id) ? 'bg-green-400' : 'bg-gray-300'}"></div>
                                    <span class="text-gray-700 text-sm">{student.name}</span>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <p class="text-gray-300 text-sm italic">Waiting for students...</p>
                    {/if}
                </div>
            {/each}

            <!-- Unassigned Students (Manual mode only) -->
            {#if data.game.teamAssignment === "MANUAL" && unassignedStudents.length > 0}
                <div class="rounded-2xl p-5 bg-amber-50 border border-amber-200">
                    <h3 class="text-amber-700 font-bold mb-3">
                        Unassigned ({unassignedStudents.length})
                    </h3>
                    <div class="space-y-2">
                        {#each unassignedStudents as student}
                            <div class="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-amber-100">
                                <div class="flex items-center gap-2">
                                    <div class="w-1.5 h-1.5 rounded-full {connectedStudents.has(student.id) ? 'bg-green-400' : 'bg-gray-300'}"></div>
                                    <span class="text-gray-800 text-sm font-medium">{student.name}</span>
                                </div>
                                <div class="flex gap-1.5">
                                    {#each teams as team}
                                        <button
                                            onclick={() => assignStudent(student.id, team.id)}
                                            class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all hover:brightness-95 border"
                                            style={`background: ${team.color}15; color: ${team.color}; border-color: ${team.color}40`}
                                        >
                                            {team.name}
                                        </button>
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}

            <!-- Empty State -->
            {#if students.length === 0}
                <div class="rounded-2xl p-10 text-center bg-white border border-gray-100 border-dashed">
                    <div class="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                        <svg class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                    </div>
                    <p class="text-gray-400 text-sm">Waiting for students to scan the QR code</p>
                </div>
            {/if}
        </div>
    </div>
</div>
