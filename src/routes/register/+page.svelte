<script lang="ts">
    import type { ActionData } from "./$types";

    let { form }: { form: ActionData } = $props();
</script>

<div class="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-50">

    <!-- Logo -->
    <div class="text-center mb-10">
        <a href="/" class="font-black text-4xl tracking-wider transition-colors" style="color: #111">
            JEOPARDY<span style="color: #f59e0b">!</span>
        </a>
        <p class="text-gray-400 text-sm mt-2 tracking-widest uppercase">Create your account</p>
    </div>

    <!-- Form -->
    <div class="w-full max-w-sm bg-white border border-gray-100 shadow-sm rounded-2xl p-8">

        {#if form?.error}
            <div class="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <svg class="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                <p class="text-red-500 text-sm">{form.error}</p>
            </div>
        {/if}

        <form method="POST" class="space-y-5">
            <div>
                <label for="name" class="block text-gray-500 text-xs uppercase tracking-widest mb-2">Full Name</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={form?.name ?? ""}
                    required
                    placeholder="John Doe"
                    class="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/20 transition-all"
                />
            </div>

            <div>
                <label for="email" class="block text-gray-500 text-xs uppercase tracking-widest mb-2">Email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={form?.email ?? ""}
                    required
                    placeholder="your@email.com"
                    class="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/20 transition-all"
                />
            </div>

            <div>
                <label for="password" class="block text-gray-500 text-xs uppercase tracking-widest mb-2">Password</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    minlength="8"
                    placeholder="••••••••"
                    class="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/20 transition-all"
                />
                <p class="text-gray-400 text-xs mt-1.5 pl-1">Minimum 8 characters</p>
            </div>

            <div>
                <label for="confirmPassword" class="block text-gray-500 text-xs uppercase tracking-widest mb-2">Confirm Password</label>
                <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    minlength="8"
                    placeholder="••••••••"
                    class="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/20 transition-all"
                />
            </div>

            <button
                type="submit"
                class="w-full py-3.5 rounded-xl font-bold text-base mt-2 text-white transition-all active:scale-95 hover:opacity-90"
                style="background: #f59e0b"
            >
                Create Account
            </button>
        </form>

        <div class="mt-6 pt-5 border-t border-gray-100 text-center space-y-2">
            <p class="text-gray-500 text-sm">
                Already have an account?
                <a href="/login" class="font-semibold transition-colors hover:opacity-80" style="color: #f59e0b">
                    Sign in
                </a>
            </p>
            <a href="/" class="text-gray-400 hover:text-gray-600 text-sm transition-colors">
                ← Back to home
            </a>
        </div>
    </div>

    <!-- No account needed note -->
    <p class="mt-6 text-gray-400 text-sm text-center max-w-xs">
        You don't need an account to play — only to create and manage games.
    </p>
</div>
