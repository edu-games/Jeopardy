<script lang="ts">
    import type { ActionData } from "./$types";

    let { form }: { form: ActionData } = $props();
</script>

<div class="min-h-screen flex flex-col items-center justify-center px-6"
     style="background: #0d0d10">

    <!-- Logo -->
    <div class="text-center mb-12">
        <a href="/" class="text-white font-black text-4xl tracking-wider hover:text-white/80 transition-colors">
            JEOPARDY<span class="text-amber-500">!</span>
        </a>
        <p class="text-white/30 text-sm mt-2 tracking-widest uppercase">Instructor Portal</p>
    </div>

    <!-- Form — no card box, just clean centered content -->
    <div class="w-full max-w-sm">

        {#if form?.error}
            <div class="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
                <svg class="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                <p class="text-red-400 text-sm">{form.error}</p>
            </div>
        {/if}

        <form method="POST" class="space-y-5">
            <div>
                <label for="email" class="block text-white/40 text-xs uppercase tracking-widest mb-2">Email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={form?.email ?? ""}
                    required
                    placeholder="your@email.com"
                    class="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400/50 focus:bg-white/8 transition-all"
                />
            </div>

            <div>
                <label for="password" class="block text-white/40 text-xs uppercase tracking-widest mb-2">Password</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    class="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400/50 focus:bg-white/8 transition-all"
                />
            </div>

            <button
                type="submit"
                class="w-full py-4 rounded-xl font-bold text-base mt-2 hover:bg-white/90 transition-all active:scale-95"
                style="background: white; color: #0d0d10"
            >
                Sign In
            </button>
        </form>

        <div class="mt-8 pt-6 border-t border-white/8 text-center space-y-3">
            <p class="text-white/40 text-sm">
                No account?
                <a href="/register" class="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
                    Register here
                </a>
            </p>
            <a href="/" class="text-white/25 hover:text-white/50 text-sm transition-colors">
                ← Back to home
            </a>
        </div>
    </div>
</div>
