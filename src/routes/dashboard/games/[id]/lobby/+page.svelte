<script lang="ts">
    import type { PageData } from "./$types";
    import { onMount } from "svelte";

    let { data }: { data: PageData } = $props();

    let starting = $state(false);

    // Real-time state
    let teams = $state(data.game.teams);
    let students = $state(data.game.students);

    // Get unassigned students
    let unassignedStudents = $derived(students.filter((s) => !s.teamId));

    async function assignStudent(studentId: string, teamId: string) {
        const response = await fetch(`/api/games/${data.game.id}/assign-team`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ studentId, teamId }),
        });

        if (response.ok) {
            window.location.reload();
        } else {
            alert("Failed to assign student");
        }
    }

    async function startGame() {
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

        const response = await fetch(`/api/games/${data.game.id}/start`, {
            method: "POST",
        });

        if (response.ok) {
            window.location.href = `/dashboard/games/${data.game.id}/play`;
        } else {
            alert("Failed to start game");
            starting = false;
        }
    }

    function copyJoinUrl() {
        const joinUrl = `${data.baseUrl}/game/${data.game.code}/join`;
        navigator.clipboard.writeText(joinUrl);
        alert("Join URL copied to clipboard!");
    }

    // Set up Server-Sent Events for real-time updates
    onMount(() => {
        const eventSource = new EventSource(`/api/sse/${data.game.id}`);

        eventSource.onmessage = (event) => {
            try {
                const eventData = JSON.parse(event.data);
                console.log("[SSE Lobby] Received event:", eventData.type);

                switch (eventData.type) {
                    case "connected":
                        console.log(
                            "[SSE Lobby] Connected with client ID:",
                            eventData.clientId,
                        );
                        break;

                    case "student-joined":
                        // New student joined
                        students = eventData.students;
                        teams = eventData.teams;
                        break;

                    case "team-assigned":
                        // Student was assigned to a team
                        students = eventData.students;
                        teams = eventData.teams;
                        break;

                    case "game-started":
                        // Game started, redirect to play page
                        window.location.href = `/dashboard/games/${data.game.id}/play`;
                        break;
                }
            } catch (error) {
                console.error("[SSE Lobby] Error parsing event:", error);
            }
        };

        eventSource.onerror = (error) => {
            console.error("[SSE Lobby] Connection error:", error);
            eventSource.close();
        };

        // Cleanup on unmount
        return () => {
            eventSource.close();
        };
    });
</script>

<div class="max-w-7xl mx-auto">
    <div class="mb-8">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 mb-2">
                    Game Lobby
                </h1>
                <p class="text-gray-600">{data.game.board.name}</p>
            </div>
            <button
                onclick={startGame}
                disabled={starting || students.length === 0}
                class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {#if starting}
                    <svg
                        class="animate-spin h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                        ></circle>
                        <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    Starting...
                {:else}
                    <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    Start Game
                {/if}
            </button>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- QR Code and Join Info -->
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
                Student Join
            </h2>

            <!-- QR Code -->
            <div class="mb-6">
                <img
                    src={data.qrCode}
                    alt="QR Code"
                    class="w-full max-w-xs mx-auto border-4 border-gray-200 rounded-lg"
                />
            </div>

            <!-- Join Code -->
            <div class="mb-4">
                <label
                    for="game-code"
                    class="block text-sm font-medium text-gray-700 mb-2"
                    >Game Code</label
                >
                <div class="flex items-center gap-2">
                    <input
                        id="game-code"
                        type="text"
                        value={data.game.code}
                        readonly
                        class="flex-1 px-4 py-3 text-center text-2xl font-mono font-bold border border-gray-300 rounded-lg bg-gray-50"
                    />
                </div>
            </div>

            <!-- Join URL -->
            <div class="mb-4">
                <label
                    for="join-url"
                    class="block text-sm font-medium text-gray-700 mb-2"
                    >Join URL</label
                >
                <div class="flex items-center gap-2">
                    <input
                        id="join-url"
                        type="text"
                        value={`${data.baseUrl}/game/${data.game.code}/join`}
                        readonly
                        class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <button
                        onclick={copyJoinUrl}
                        class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="Copy URL"
                    >
                        <svg
                            class="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Assignment Mode -->
            <div class="p-4 bg-gray-50 rounded-lg">
                <div class="flex items-center gap-2 text-sm">
                    <svg
                        class="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span class="text-gray-700">
                        Team Assignment: <strong class="text-gray-900">
                            {data.game.teamAssignment === "RANDOM"
                                ? "Automatic"
                                : "Manual"}
                        </strong>
                    </span>
                </div>
            </div>
        </div>

        <!-- Teams and Students -->
        <div class="lg:col-span-2 space-y-4">
            {#each teams as team}
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="w-6 h-6 rounded-full"
                            style={`background-color: ${team.color}`}
                        ></div>
                        <h3 class="text-lg font-semibold text-gray-900">
                            {team.name}
                        </h3>
                        <span class="text-sm text-gray-600">
                            ({team.students.length}
                            {team.students.length === 1
                                ? "student"
                                : "students"})
                        </span>
                    </div>

                    {#if team.students.length > 0}
                        <div class="flex flex-wrap gap-2">
                            {#each team.students as student}
                                <div
                                    class="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                                >
                                    {student.name}
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <p class="text-gray-500 text-sm italic">
                            No students assigned yet
                        </p>
                    {/if}
                </div>
            {/each}

            <!-- Unassigned Students (Manual mode only) -->
            {#if data.game.teamAssignment === "MANUAL" && unassignedStudents.length > 0}
                <div
                    class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6"
                >
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">
                        Unassigned Students ({unassignedStudents.length})
                    </h3>
                    <div class="space-y-3">
                        {#each unassignedStudents as student}
                            <div
                                class="flex items-center justify-between bg-white p-3 rounded-lg"
                            >
                                <span class="font-medium text-gray-900"
                                    >{student.name}</span
                                >
                                <div class="flex gap-2">
                                    {#each teams as team}
                                        <button
                                            onclick={() =>
                                                assignStudent(
                                                    student.id,
                                                    team.id,
                                                )}
                                            class="px-3 py-1 rounded text-sm font-medium transition-colors"
                                            style={`background-color: ${team.color}20; color: ${team.color}; border: 2px solid ${team.color}`}
                                        >
                                            → {team.name}
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
                <div class="bg-white rounded-lg shadow p-8 text-center">
                    <svg
                        class="w-16 h-16 mx-auto text-gray-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                    </svg>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">
                        No students yet
                    </h3>
                    <p class="text-gray-600">
                        Students will appear here as they join the game
                    </p>
                </div>
            {/if}
        </div>
    </div>
</div>
