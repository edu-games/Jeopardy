<script lang="ts">
    import type { LayoutData } from "./$types";

    let { data }: { data: LayoutData } = $props();

    let mobileMenuOpen = $state(false);

    const navigationItems = [
        { name: "Dashboard", href: "/dashboard" },
        { name: "Questions", href: "/dashboard/questions" },
        { name: "Boards", href: "/dashboard/boards" },
        { name: "Games", href: "/dashboard/games" },
    ];

    async function handleLogout() {
        const response = await fetch("/api/auth/logout", {
            method: "POST",
        });
        if (response.ok) {
            window.location.href = "/";
        }
    }
</script>

<div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <!-- Logo -->
                    <div class="flex-shrink-0 flex items-center">
                        <a
                            href="/dashboard"
                            class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent"
                            >Classroom Jeopardy</a
                        >
                    </div>

                    <!-- Desktop Navigation -->
                    <div class="hidden md:ml-10 md:flex md:space-x-1">
                        {#each navigationItems as item}
                            <a
                                href={item.href}
                                class="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 flex items-center"
                            >
                                {item.name}
                            </a>
                        {/each}
                    </div>
                </div>

                <!-- User Menu -->
                <div class="flex items-center space-x-4">
                    <div class="hidden sm:flex items-center space-x-3">
                        <div
                            class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        >
                            {data.instructor.name.charAt(0).toUpperCase()}
                        </div>
                        <span class="text-sm font-medium text-gray-700">
                            {data.instructor.name}
                        </span>
                    </div>
                    <button
                        onclick={handleLogout}
                        class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                        Logout
                    </button>

                    <!-- Mobile menu button -->
                    <button
                        type="button"
                        class="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                        onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
                    >
                        <svg
                            class="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d={mobileMenuOpen
                                    ? "M6 18L18 6M6 6l12 12"
                                    : "M4 6h16M4 12h16M4 18h16"}
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Mobile Navigation -->
        {#if mobileMenuOpen}
            <div class="md:hidden border-t border-gray-200 bg-white">
                <div class="px-2 pt-2 pb-3 space-y-1">
                    <div
                        class="sm:hidden px-3 py-2 flex items-center space-x-3 mb-2"
                    >
                        <div
                            class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        >
                            {data.instructor.name.charAt(0).toUpperCase()}
                        </div>
                        <span class="text-sm font-medium text-gray-700">
                            {data.instructor.name}
                        </span>
                    </div>
                    {#each navigationItems as item}
                        <a
                            href={item.href}
                            class="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                            {item.name}
                        </a>
                    {/each}
                </div>
            </div>
        {/if}
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <slot />
    </main>
</div>
