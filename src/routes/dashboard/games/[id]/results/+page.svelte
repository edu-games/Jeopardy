<script lang="ts">
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    // Calculate game statistics
    let totalQuestions = $derived(
        data.game.gameState?.answeredSlots?.length || 0,
    );
    let totalStudents = $derived(data.game.students.length);
    let winningTeam = $derived(data.game.teams[0]); // Already sorted by score DESC
    let studentsPerTeam = $derived((teamId: string) => {
        return data.game.students.filter((s) => s.team?.id === teamId);
    });
</script>

<div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
            <div>
                <div class="flex items-center gap-2 mb-2">
                    <a
                        href="/dashboard/games"
                        class="text-gray-600 hover:text-gray-900 transition-colors"
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
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                    </a>
                    <h1 class="text-3xl font-bold text-gray-900">
                        Game Results
                    </h1>
                </div>
                <p class="text-gray-600">{data.game.board.name}</p>
            </div>
            <a
                href="/dashboard/games"
                class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
                Back to Games
            </a>
        </div>
    </div>

    <!-- Winner Celebration -->
    {#if winningTeam}
        <div
            class="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg p-8 mb-8 shadow-xl text-center"
        >
            <div class="mb-4">
                <svg
                    class="w-20 h-20 mx-auto text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                    />
                </svg>
            </div>
            <h2 class="text-4xl font-bold text-white mb-2">
                🏆 {winningTeam.name} Wins! 🏆
            </h2>
            <p class="text-2xl text-yellow-100 font-semibold">
                ${winningTeam.score}
            </p>
            <p class="text-yellow-100 mt-2">
                {studentsPerTeam(winningTeam.id).length} students
            </p>
        </div>
    {/if}

    <!-- Game Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center gap-3">
                <div class="bg-blue-100 rounded-full p-3">
                    <svg
                        class="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>
                <div>
                    <p class="text-gray-600 text-sm">Questions Answered</p>
                    <p class="text-2xl font-bold text-gray-900">
                        {totalQuestions}
                    </p>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center gap-3">
                <div class="bg-green-100 rounded-full p-3">
                    <svg
                        class="w-6 h-6 text-green-600"
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
                </div>
                <div>
                    <p class="text-gray-600 text-sm">Total Students</p>
                    <p class="text-2xl font-bold text-gray-900">
                        {totalStudents}
                    </p>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center gap-3">
                <div class="bg-purple-100 rounded-full p-3">
                    <svg
                        class="w-6 h-6 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                    </svg>
                </div>
                <div>
                    <p class="text-gray-600 text-sm">Teams</p>
                    <p class="text-2xl font-bold text-gray-900">
                        {data.game.teams.length}
                    </p>
                </div>
            </div>
        </div>
    </div>

    <!-- Team Rankings -->
    <div class="bg-white rounded-lg shadow mb-8">
        <div class="p-6 border-b">
            <h2 class="text-xl font-bold text-gray-900">Team Rankings</h2>
        </div>
        <div class="p-6">
            <div class="space-y-4">
                {#each data.game.teams as team, index}
                    {@const students = studentsPerTeam(team.id)}
                    <div
                        class="p-6 rounded-lg border-2 transition-all"
                        style={`border-color: ${team.color}; background-color: ${team.color}10`}
                    >
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center gap-4">
                                <!-- Rank Badge -->
                                <div
                                    class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                                    style={`background-color: ${team.color}`}
                                >
                                    {#if index === 0}
                                        🥇
                                    {:else if index === 1}
                                        🥈
                                    {:else if index === 2}
                                        🥉
                                    {:else}
                                        #{index + 1}
                                    {/if}
                                </div>

                                <!-- Team Info -->
                                <div>
                                    <h3 class="text-2xl font-bold text-gray-900">
                                        {team.name}
                                    </h3>
                                    <p class="text-gray-600">
                                        {students.length} student{students.length ===
                                        1
                                            ? ""
                                            : "s"}
                                    </p>
                                </div>
                            </div>

                            <!-- Score -->
                            <div class="text-right">
                                <p class="text-4xl font-bold text-gray-900">
                                    ${team.score}
                                </p>
                                <p class="text-gray-600 text-sm">Final Score</p>
                            </div>
                        </div>

                        <!-- Student List -->
                        {#if students.length > 0}
                            <div class="mt-4 pt-4 border-t border-gray-200">
                                <p class="text-sm font-medium text-gray-700 mb-2">
                                    Team Members:
                                </p>
                                <div class="flex flex-wrap gap-2">
                                    {#each students as student}
                                        <span
                                            class="px-3 py-1 rounded-full text-sm font-medium text-gray-700"
                                            style={`background-color: ${team.color}30`}
                                        >
                                            {student.name}
                                        </span>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-4">
        <a
            href="/dashboard/games"
            class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-center"
        >
            Back to Games
        </a>
        <a
            href="/dashboard/games/{data.game.id}/play"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
            View Game Board
        </a>
    </div>
</div>
