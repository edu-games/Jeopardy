<script lang="ts">
    import type { ActionData } from "./$types";

    let { form }: { form: ActionData } = $props();
</script>

<div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 px-4"
>
    <div class="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <h1 class="text-3xl font-bold text-center mb-2 text-blue-900">
            Classroom Jeopardy
        </h1>
        <p class="text-center text-gray-600 mb-8">Instructor Registration</p>

        {#if form?.error}
            <div
                class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
            >
                {form.error}
            </div>
        {/if}

        <form method="POST" class="space-y-6">
            <div>
                <label
                    for="name"
                    class="block text-sm font-medium text-gray-700 mb-2"
                >
                    Full Name
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={form?.name ?? ""}
                    required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                />
            </div>

            <div>
                <label
                    for="email"
                    class="block text-sm font-medium text-gray-700 mb-2"
                >
                    Email
                </label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={form?.email ?? ""}
                    required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                />
            </div>

            <div>
                <label
                    for="password"
                    class="block text-sm font-medium text-gray-700 mb-2"
                >
                    Password
                </label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    minlength="8"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                />
                <p class="text-sm text-gray-500 mt-1">
                    Must be at least 8 characters
                </p>
            </div>

            <div>
                <label
                    for="confirmPassword"
                    class="block text-sm font-medium text-gray-700 mb-2"
                >
                    Confirm Password
                </label>
                <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    minlength="8"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                />
            </div>

            <button
                type="submit"
                class="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
                Register
            </button>
        </form>

        <p class="text-center mt-6 text-gray-600">
            Already have an account?
            <a
                href="/login"
                class="text-blue-700 hover:text-blue-800 font-semibold"
            >
                Login here
            </a>
        </p>

        <div class="mt-6 pt-6 border-t border-gray-200">
            <a
                href="/"
                class="text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center"
            >
                ← Back to home
            </a>
        </div>
    </div>
</div>
