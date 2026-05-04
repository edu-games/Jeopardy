<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="min-h-screen grid md:grid-cols-2" style="background: var(--ink)">
	<!-- Left: branding -->
	<div
		class="hidden md:flex flex-col justify-between"
		style="padding: 48px; border-right: 1px solid rgba(255,255,255,0.07)"
	>
		<a
			href="/"
			class="font-serif-display"
			style="font-size: 20px; color: #fff; letter-spacing: 0.01em"
		>
			Tile <span style="color: var(--gold)">Trivia</span>
		</a>
		<div>
			<p
				class="font-serif-display"
				style="font-size: clamp(2.5rem, 5vw, 4rem); color: #fff; line-height: 1.1; margin-bottom: 16px; white-space: pre-line"
			>{`Welcome\nback.`}</p>
			<p
				style="font-size: 14px; color: rgba(255,255,255,0.35); max-width: 320px; line-height: 1.6"
			>
				Sign in to manage your question banks, boards, and live game sessions.
			</p>
		</div>
		<p style="font-size: 12px; color: rgba(255,255,255,0.2)">
			Students don't need an account — only instructors.
		</p>
	</div>

	<!-- Right: form -->
	<div
		class="flex flex-col items-center justify-center px-6 py-12 md:p-12"
		style="background: var(--bg)"
	>
		<!-- Mobile header -->
		<a
			href="/"
			class="md:hidden font-serif-display mb-8"
			style="font-size: 20px; color: var(--ink); letter-spacing: 0.01em"
		>
			Tile <span style="color: var(--gold)">Trivia</span>
		</a>

		<div class="w-full" style="max-width: 360px">
			<h2
				class="font-serif-display"
				style="font-size: 26px; color: var(--ink); margin-bottom: 6px"
			>
				Sign in to your account
			</h2>
			<p
				style="font-size: 13px; color: var(--muted); margin-bottom: 28px"
			>
				Enter your credentials below.
			</p>

			{#if form?.error}
				<div
					class="flex items-start gap-3 rounded-lg px-3 py-2.5 mb-4"
					style="background: #fef2f2; border: 1px solid #fecaca"
				>
					<svg
						class="w-4 h-4 shrink-0 mt-0.5"
						style="color: var(--red)"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
							clip-rule="evenodd"
						/>
					</svg>
					<p style="font-size: 13px; color: var(--red)">{form.error}</p>
				</div>
			{/if}

			<form method="POST" class="flex flex-col gap-4">
				<div class="flex flex-col gap-1.5">
					<label
						for="email"
						class="font-semibold uppercase"
						style="font-size: 10px; letter-spacing: 0.12em; color: var(--muted)"
					>
						Email address
					</label>
					<input
						type="email"
						id="email"
						name="email"
						value={form?.email ?? ''}
						required
						placeholder="you@university.edu"
						class="w-full focus:outline-none"
						style="padding: 9px 12px; font-size: 14px; border-radius: 7px; border: 1px solid var(--rule); background: var(--surface); color: var(--ink); transition: border-color .12s"
						onfocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
						onblur={(e) => (e.currentTarget.style.borderColor = 'var(--rule)')}
					/>
				</div>

				<div class="flex flex-col gap-1.5">
					<label
						for="password"
						class="font-semibold uppercase"
						style="font-size: 10px; letter-spacing: 0.12em; color: var(--muted)"
					>
						Password
					</label>
					<input
						type="password"
						id="password"
						name="password"
						required
						placeholder="••••••••"
						class="w-full focus:outline-none"
						style="padding: 9px 12px; font-size: 14px; border-radius: 7px; border: 1px solid var(--rule); background: var(--surface); color: var(--ink); transition: border-color .12s"
						onfocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
						onblur={(e) => (e.currentTarget.style.borderColor = 'var(--rule)')}
					/>
				</div>

				<button
					type="submit"
					class="w-full font-bold rounded-lg transition-all hover:brightness-110 active:scale-[0.99]"
					style="background: var(--accent); color: #fff; padding: 11px 22px; font-size: 14px; margin-top: 4px"
				>
					Sign in →
				</button>
			</form>

			<div style="height: 1px; background: var(--rule); margin: 24px 0"></div>

			<p style="font-size: 13px; color: var(--muted); text-align: center">
				Don't have an account?
				<a
					href="/register"
					class="font-semibold hover:opacity-80"
					style="color: var(--accent); font-size: 13px"
				>
					Register here
				</a>
			</p>
		</div>
	</div>
</div>
