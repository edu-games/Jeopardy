<script lang="ts">
    let gameCode = $state("");
    let isJoining = $state(false);

    async function handleJoinGame(e: Event) {
        e.preventDefault();
        if (!gameCode.trim()) return;

        isJoining = true;
        // Redirect to join page with the code
        window.location.href = `/game/${gameCode.toUpperCase()}/join`;
    }

    function formatGameCode(value: string) {
        // Only allow alphanumeric characters and convert to uppercase
        return value
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 6);
    }

    function handleCodeInput(e: Event) {
        const target = e.target as HTMLInputElement;
        gameCode = formatGameCode(target.value);
    }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <!-- Navigation -->
    <nav
        class="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50"
    >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex justify-between items-center">
                <div
                    class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                >
                    Classroom Jeopardy
                </div>
                <div class="flex gap-3">
                    <a
                        href="/login"
                        class="px-4 py-2 text-gray-700 hover:text-blue-700 font-medium transition-colors"
                    >
                        Instructor Login
                    </a>
                    <a
                        href="/register"
                        class="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
                    >
                        Get Started
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <!-- Hero Section -->
        <div class="text-center mb-16">
            <h1
                class="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent"
            >
                Classroom Jeopardy
            </h1>
            <p class="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Make learning fun and interactive with gamified quizzes for your
                classroom
            </p>
        </div>

        <!-- Two Column Layout -->
        <div class="grid md:grid-cols-2 gap-8 mb-16">
            <!-- Student Join Section -->
            <div
                class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
            >
                <div
                    class="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mb-6 mx-auto"
                >
                    <svg
                        class="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                        />
                    </svg>
                </div>
                <h2 class="text-3xl font-bold text-gray-900 mb-3 text-center">
                    Join a Game
                </h2>
                <p class="text-gray-600 mb-6 text-center">
                    Enter your game code to join the fun
                </p>
                <form onsubmit={handleJoinGame} class="space-y-4">
                    <div>
                        <label
                            for="gameCode"
                            class="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Game Code
                        </label>
                        <input
                            type="text"
                            id="gameCode"
                            bind:value={gameCode}
                            oninput={handleCodeInput}
                            placeholder="ABC123"
                            class="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 uppercase transition-all"
                            maxlength="6"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isJoining || !gameCode.trim()}
                        class="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {isJoining ? "Joining..." : "Join Game"}
                    </button>
                </form>
            </div>

            <!-- Instructor Section -->
            <div
                class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
            >
                <div
                    class="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-6 mx-auto"
                >
                    <svg
                        class="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                    </svg>
                </div>
                <h2 class="text-3xl font-bold text-gray-900 mb-3 text-center">
                    For Instructors
                </h2>
                <p class="text-gray-600 mb-6 text-center">
                    Create engaging Jeopardy-style games for your classroom
                </p>
                <div class="space-y-4 mb-6">
                    <div class="flex items-start space-x-3">
                        <svg
                            class="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        <span class="text-gray-700"
                            >Build custom question banks</span
                        >
                    </div>
                    <div class="flex items-start space-x-3">
                        <svg
                            class="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        <span class="text-gray-700"
                            >Design interactive game boards</span
                        >
                    </div>
                    <div class="flex items-start space-x-3">
                        <svg
                            class="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        <span class="text-gray-700"
                            >Track student engagement in real-time</span
                        >
                    </div>
                </div>
                <div class="flex flex-col gap-3">
                    <a
                        href="/register"
                        class="block text-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
                    >
                        Create Account
                    </a>
                    <a
                        href="/login"
                        class="block text-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                    >
                        Sign In
                    </a>
                </div>
            </div>
        </div>

        <!-- Features Section -->
        <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-gray-900 mb-12">
                Why Classroom Jeopardy?
            </h2>
            <div class="grid md:grid-cols-3 gap-8">
                <div
                    class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                    <div
                        class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-4"
                    >
                        <svg
                            class="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">
                        Instant Engagement
                    </h3>
                    <p class="text-gray-600">
                        Turn any lesson into an exciting game show experience
                        that keeps students engaged and motivated.
                    </p>
                </div>

                <div
                    class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                    <div
                        class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4"
                    >
                        <svg
                            class="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                            />
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">
                        Easy Setup
                    </h3>
                    <p class="text-gray-600">
                        Create games in minutes with our intuitive interface. No
                        technical expertise required.
                    </p>
                </div>

                <div
                    class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                    <div
                        class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4"
                    >
                        <svg
                            class="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">
                        Real-Time Results
                    </h3>
                    <p class="text-gray-600">
                        Track student performance and participation as the game
                        unfolds with live updates.
                    </p>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 py-8 mt-20">
        <div
            class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600"
        >
            <p>
                &copy; {new Date().getFullYear()} Classroom Jeopardy. Make learning
                fun.
            </p>
        </div>
    </footer>
</div>
