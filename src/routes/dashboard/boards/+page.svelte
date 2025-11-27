<script lang="ts">
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    async function deleteBoard(id: string, name: string) {
        if (!confirm(`Are you sure you want to delete the board "${name}"?`)) {
            return;
        }

        const response = await fetch(`/api/boards/${id}`, {
            method: "DELETE",
        });

        if (response.ok) {
            window.location.reload();
        } else {
            alert("Failed to delete board");
        }
    }

    function getBoardCompleteness(board: any) {
        const totalSlots = 30; // 6 categories × 5 slots
        const filledSlots = board.categories.reduce(
            (sum: number, cat: any) => sum + cat.slots.length,
            0,
        );
        return {
            filled: filledSlots,
            total: totalSlots,
            percentage: Math.round((filledSlots / totalSlots) * 100),
        };
    }
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
        <div>
            <h1 class="text-3xl font-bold text-gray-900">Boards</h1>
            <p class="text-gray-600 mt-1">Manage your Jeopardy game boards</p>
        </div>
        <a
            href="/dashboard/boards/new"
            class="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-2"
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
                    d="M12 4v16m8-8H4"
                />
            </svg>
            New Board
        </a>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white rounded-lg shadow p-4">
            <p class="text-sm text-gray-600">Total Boards</p>
            <p class="text-2xl font-bold text-gray-900">{data.boards.length}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
            <p class="text-sm text-gray-600">Complete Boards</p>
            <p class="text-2xl font-bold text-gray-900">
                {data.boards.filter(
                    (b) => getBoardCompleteness(b).filled === 30,
                ).length}
            </p>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
            <p class="text-sm text-gray-600">Games Created</p>
            <p class="text-2xl font-bold text-gray-900">
                {data.boards.reduce((sum, b) => sum + b._count.games, 0)}
            </p>
        </div>
    </div>

    <!-- Boards List -->
    <div class="space-y-4">
        {#if data.boards.length === 0}
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
                        d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                    />
                </svg>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">
                    No boards yet
                </h3>
                <p class="text-gray-600 mb-4">
                    Create your first Jeopardy board to get started!
                </p>
                <a
                    href="/dashboard/boards/new"
                    class="inline-block px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                >
                    Create First Board
                </a>
            </div>
        {:else}
            {#each data.boards as board}
                {@const completeness = getBoardCompleteness(board)}
                <div
                    class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                >
                    <div class="p-6">
                        <div class="flex justify-between items-start mb-4">
                            <div class="flex-1">
                                <h3
                                    class="text-xl font-bold text-gray-900 mb-1"
                                >
                                    {board.name}
                                </h3>
                                {#if board.description}
                                    <p class="text-gray-600">
                                        {board.description}
                                    </p>
                                {/if}
                            </div>
                            <div class="flex gap-2 ml-4">
                                <a
                                    href={`/dashboard/boards/${board.id}/edit`}
                                    class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit"
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
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                    </svg>
                                </a>
                                <button
                                    onclick={() =>
                                        deleteBoard(board.id, board.name)}
                                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete"
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
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Categories Preview -->
                        <div class="mb-4">
                            <h4 class="text-sm font-medium text-gray-700 mb-2">
                                Categories:
                            </h4>
                            <div class="flex flex-wrap gap-2">
                                {#each board.categories.slice(0, 6) as category}
                                    <span
                                        class="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                                    >
                                        {category.name}
                                    </span>
                                {/each}
                            </div>
                        </div>

                        <!-- Progress Bar -->
                        <div class="mb-3">
                            <div
                                class="flex justify-between text-sm text-gray-600 mb-1"
                            >
                                <span>Completeness</span>
                                <span
                                    >{completeness.filled}/{completeness.total} slots
                                    filled ({completeness.percentage}%)</span
                                >
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    class={`h-2 rounded-full transition-all ${
                                        completeness.percentage === 100
                                            ? "bg-green-500"
                                            : completeness.percentage > 50
                                              ? "bg-blue-500"
                                              : "bg-yellow-500"
                                    }`}
                                    style={`width: ${completeness.percentage}%`}
                                ></div>
                            </div>
                        </div>

                        <!-- Metadata -->
                        <div
                            class="flex items-center gap-4 text-sm text-gray-500"
                        >
                            <span>{board._count.games} games created</span>
                            <span>•</span>
                            <span
                                >Created {new Date(
                                    board.createdAt,
                                ).toLocaleDateString()}</span
                            >
                        </div>
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>
