<script lang="ts">
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    // Calculate statistics
    let totalQuestions = $derived(
        data.game.gameState?.answeredSlots?.length || 0,
    );
    let winningTeam = $derived(data.game.teams[0]); // Already sorted by score DESC
    let myTeam = $derived(data.student.team);
    let myTeamRank = $derived(() => {
        if (!myTeam) return null;
        return (
            data.game.teams.findIndex((t) => t.id === myTeam.id) + 1 ||
            null
        );
    });
    let studentsPerTeam = $derived((teamId: string) => {
        return data.game.teams
            .find((t) => t.id === teamId)
            ?.students.map((s) => s.name);
    });
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-4">
    <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="mb-6 bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <div class="text-center">
                <h1 class="text-3xl font-bold text-white mb-2">
                    Game Complete!
                </h1>
                <p class="text-blue-200 text-lg">
                    {data.game.board.name}
                </p>
            </div>
        </div>

        <!-- Winner Announcement -->
        {#if winningTeam}
            <div
                class="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg p-8 mb-6 shadow-xl text-center"
            >
                <div class="mb-4">
                    <svg
                        class="w-16 h-16 mx-auto text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                        />
                    </svg>
                </div>
                <h2 class="text-3xl font-bold text-white mb-2">
                    🏆 {winningTeam.name} Wins! 🏆
                </h2>
                <p class="text-2xl text-yellow-100 font-semibold">
                    ${winningTeam.score}
                </p>
            </div>
        {/if}

        <!-- Your Team's Performance -->
        {#if myTeam}
            <div
                class="mb-6 p-6 rounded-lg shadow-xl"
                style={`background-color: ${myTeam.color}20; border: 3px solid ${myTeam.color}`}
            >
                <div class="text-center">
                    <div class="flex items-center justify-center gap-3 mb-3">
                        <div
                            class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                            style={`background-color: ${myTeam.color}`}
                        >
                            {#if myTeamRank() === 1}
                                🥇
                            {:else if myTeamRank() === 2}
                                🥈
                            {:else if myTeamRank() === 3}
                                🥉
                            {:else}
                                <span class="text-white font-bold"
                                    >#{myTeamRank()}</span
                                >
                            {/if}
                        </div>
                        <h2 class="text-2xl font-bold text-white">
                            Your Team: {myTeam.name}
                        </h2>
                    </div>
                    <div class="text-5xl font-bold text-white mb-2">
                        ${myTeam.score}
                    </div>
                    <p class="text-blue-200 text-lg">
                        {#if myTeamRank() === 1}
                            🎉 Congratulations! You won! 🎉
                        {:else}
                            Finished in {myTeamRank()}{myTeamRank() === 2
                                ? "nd"
                                : myTeamRank() === 3
                                  ? "rd"
                                  : "th"} place
                        {/if}
                    </p>
                </div>
            </div>
        {/if}

        <!-- Final Rankings -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
            <h3 class="text-xl font-bold text-white mb-4 text-center">
                Final Rankings
            </h3>
            <div class="space-y-3">
                {#each data.game.teams as team, index}
                    {@const students = studentsPerTeam(team.id)}
                    <div
                        class="p-4 rounded-lg {team.id === myTeam?.id
                            ? 'ring-4 ring-white'
                            : ''}"
                        style={`background-color: ${team.color}30; border: 2px solid ${team.color}`}
                    >
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                                    style={`background-color: ${team.color}`}
                                >
                                    {#if index === 0}
                                        🥇
                                    {:else if index === 1}
                                        🥈
                                    {:else if index === 2}
                                        🥉
                                    {:else}
                                        <span class="text-white font-bold"
                                            >#{index + 1}</span
                                        >
                                    {/if}
                                </div>
                                <div>
                                    <p class="font-bold text-white text-lg">
                                        {team.name}
                                    </p>
                                    <p class="text-sm text-blue-200">
                                        {students?.length || 0} student{students?.length ===
                                        1
                                            ? ""
                                            : "s"}
                                    </p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="text-3xl font-bold text-white">
                                    ${team.score}
                                </p>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>

        <!-- Game Stats -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 class="text-xl font-bold text-white mb-4 text-center">
                Game Statistics
            </h3>
            <div class="grid grid-cols-2 gap-4 text-center">
                <div>
                    <p class="text-3xl font-bold text-white">
                        {totalQuestions}
                    </p>
                    <p class="text-blue-200">Questions Answered</p>
                </div>
                <div>
                    <p class="text-3xl font-bold text-white">
                        {data.game.teams.length}
                    </p>
                    <p class="text-blue-200">Teams Competed</p>
                </div>
            </div>
        </div>

        <!-- Thank You Message -->
        <div class="mt-6 text-center">
            <p class="text-blue-200 text-lg">Thanks for playing!</p>
        </div>
    </div>
</div>
