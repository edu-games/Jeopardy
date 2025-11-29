<script lang="ts">
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
</script>

<div class="space-y-8">
    <!-- Hero Section -->
    <div
        class="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 text-white"
    >
        <h1 class="text-4xl font-bold mb-3">
            Welcome back, {data.instructor.name}!
        </h1>
        <p class="text-blue-100 text-lg">
            Get started by creating questions, building boards, or starting a
            new game.
        </p>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
            class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
        >
            <div class="flex items-center justify-between">
                <div>
                    <p
                        class="text-sm font-medium text-gray-500 uppercase tracking-wide"
                    >
                        Total Questions
                    </p>
                    <p class="text-3xl font-bold text-gray-900 mt-2">
                        {data.stats.questions}
                    </p>
                </div>
                <div
                    class="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg"
                >
                    <svg
                        class="w-7 h-7 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path
                            fill-rule="evenodd"
                            d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </div>
            </div>
        </div>

        <div
            class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
        >
            <div class="flex items-center justify-between">
                <div>
                    <p
                        class="text-sm font-medium text-gray-500 uppercase tracking-wide"
                    >
                        Total Boards
                    </p>
                    <p class="text-3xl font-bold text-gray-900 mt-2">
                        {data.stats.boards}
                    </p>
                </div>
                <div
                    class="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg"
                >
                    <svg
                        class="w-7 h-7 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                        />
                    </svg>
                </div>
            </div>
        </div>

        <div
            class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
        >
            <div class="flex items-center justify-between">
                <div>
                    <p
                        class="text-sm font-medium text-gray-500 uppercase tracking-wide"
                    >
                        Games Played
                    </p>
                    <p class="text-3xl font-bold text-gray-900 mt-2">
                        {data.stats.games}
                    </p>
                </div>
                <div
                    class="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
                >
                    <svg
                        class="w-7 h-7 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </div>
            </div>
        </div>
    </div>

    <!-- Quick Actions -->
    <div>
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <a
                href="/dashboard/questions/new"
                class="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-200"
            >
                <div
                    class="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mb-4 group-hover:scale-110 transition-transform"
                >
                    <svg
                        class="w-7 h-7 text-white"
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
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">
                    New Question
                </h3>
                <p class="text-sm text-gray-600">
                    Add questions to your question bank
                </p>
            </a>

            <a
                href="/dashboard/boards/new"
                class="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-green-200 transition-all duration-200"
            >
                <div
                    class="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl mb-4 group-hover:scale-110 transition-transform"
                >
                    <svg
                        class="w-7 h-7 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                        />
                    </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">
                    New Board
                </h3>
                <p class="text-sm text-gray-600">
                    Create a Jeopardy board from questions
                </p>
            </a>

            <a
                href="/dashboard/games/new"
                class="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-purple-200 transition-all duration-200"
            >
                <div
                    class="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl mb-4 group-hover:scale-110 transition-transform"
                >
                    <svg
                        class="w-7 h-7 text-white"
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
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">
                    Start Game
                </h3>
                <p class="text-sm text-gray-600">
                    Begin a new Jeopardy game session
                </p>
            </a>

            <a
                href="/dashboard/questions"
                class="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-amber-200 transition-all duration-200"
            >
                <div
                    class="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl mb-4 group-hover:scale-110 transition-transform"
                >
                    <svg
                        class="w-7 h-7 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                    </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">
                    Question Bank
                </h3>
                <p class="text-sm text-gray-600">
                    Browse and manage your questions
                </p>
            </a>
        </div>
    </div>
</div>
