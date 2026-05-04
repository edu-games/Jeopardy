<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let gameCode = $state('');
	let isJoining = $state(false);

	async function handleJoinGame(e: Event) {
		e.preventDefault();
		if (!gameCode.trim()) return;
		isJoining = true;
		window.location.href = `/game/${gameCode.toUpperCase()}/join`;
	}

	function handleCodeInput(e: Event) {
		const t = e.target as HTMLInputElement;
		gameCode = t.value
			.toUpperCase()
			.replace(/[^A-Z0-9]/g, '')
			.slice(0, 6);
	}
</script>

<div class="min-h-screen flex flex-col" style="background: var(--ink)">
	<!-- Top bar -->
	<div class="flex items-center justify-between px-6 sm:px-10 py-5">
		<a
			href="/"
			class="font-serif-display text-lg"
			style="color: #fff; letter-spacing: 0.01em"
		>
			Tile <span style="color: var(--gold)">Trivia</span>
		</a>
		<div class="flex items-center gap-2">
			{#if data.instructor}
				<a
					href="/dashboard"
					class="px-4 py-1.5 text-sm font-semibold rounded-lg transition-all hover:brightness-110"
					style="background: var(--gold); color: var(--ink)"
				>
					Dashboard
				</a>
			{:else}
				<a
					href="/login"
					class="font-semibold transition-colors"
					style="padding: 7px 16px; font-size: 13px; border-radius: 8px; color: rgba(255,255,255,0.5)"
				>
					Sign in
				</a>
				<a
					href="/register"
					class="font-semibold transition-colors"
					style="padding: 7px 16px; font-size: 13px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.7)"
				>
					Register
				</a>
			{/if}
		</div>
	</div>

	<!-- Hero -->
	<div
		class="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center"
	>
		<!-- Decorative rule -->
		<div class="flex items-center gap-3 mb-7">
			<div style="height:1px; width:48px; background: rgba(212,168,23,0.4)"></div>
			<span
				class="text-[10px] font-semibold uppercase"
				style="color: rgba(212,168,23,0.6); letter-spacing: 0.2em"
			>
				Live Quiz
			</span>
			<div style="height:1px; width:48px; background: rgba(212,168,23,0.4)"></div>
		</div>

		<h1
			class="font-serif-display"
			style="font-size: clamp(4rem, 11vw, 8.5rem); color:#fff; line-height: 0.9; letter-spacing: 0.01em; margin-bottom: 16px"
		>
			Tile Trivia<span style="color: var(--gold); font-style: italic">!</span>
		</h1>
		<p style="font-size:15px; color: rgba(255,255,255,0.35); margin-bottom: 56px">
			Real-time team quiz games for higher education
		</p>

		<!-- Two panels -->
		<div
			class="grid grid-cols-1 md:grid-cols-2 gap-3 w-full"
			style="max-width: 680px"
		>
			<!-- Join -->
			<div
				class="text-left"
				style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 28px"
			>
				<span
					class="block text-[10px] font-semibold uppercase mb-3"
					style="color: rgba(212,168,23,0.7); letter-spacing: 0.2em"
				>
					For Students
				</span>
				<p
					class="font-serif-display mb-5"
					style="font-size: 20px; color:#fff"
				>
					Join a game
				</p>
				<form onsubmit={handleJoinGame}>
					<input
						type="text"
						bind:value={gameCode}
						oninput={handleCodeInput}
						placeholder="Enter code"
						maxlength="6"
						required
						autocomplete="off"
						class="w-full mono-nums text-center font-bold uppercase mb-3 focus:outline-none"
						style="padding: 11px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.07); color: #fff; font-size: 22px; letter-spacing: 0.18em; font-family: ui-monospace, SFMono-Regular, Menlo, monospace"
					/>
					<button
						type="submit"
						disabled={isJoining || gameCode.length !== 6}
						class="w-full font-bold rounded-lg transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
						style="background: var(--gold); color: var(--ink); padding: 11px; font-size: 13px"
					>
						{isJoining ? 'Joining…' : 'Join Game →'}
					</button>
				</form>
			</div>

			<!-- Instructor -->
			<div
				class="text-left flex flex-col"
				style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 28px"
			>
				<span
					class="block text-[10px] font-semibold uppercase mb-3"
					style="color: rgba(255,255,255,0.3); letter-spacing: 0.2em"
				>
					For Instructors
				</span>
				<p
					class="font-serif-display mb-4"
					style="font-size: 20px; color:#fff"
				>
					Run a game
				</p>
				<ul class="flex-1 mb-6 space-y-2">
					{#each ['Custom question banks', 'Drag-and-drop boards', 'Live buzz-in & scoring'] as f}
						<li class="flex items-center gap-2">
							<div
								class="shrink-0"
								style="width:4px; height:4px; border-radius:50%; background: rgba(212,168,23,0.5)"
							></div>
							<span style="font-size:13px; color: rgba(255,255,255,0.45)">{f}</span>
						</li>
					{/each}
				</ul>
				<div class="flex flex-col gap-2">
					{#if data.instructor}
						<a
							href="/dashboard"
							class="w-full text-center font-semibold rounded-lg transition-colors"
							style="padding: 7px 16px; font-size: 13px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.85)"
						>
							Go to Dashboard
						</a>
					{:else}
						<a
							href="/register"
							class="w-full text-center font-semibold rounded-lg transition-colors"
							style="padding: 7px 16px; font-size: 13px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.8)"
						>
							Create Account
						</a>
						<a
							href="/login"
							class="w-full text-center font-semibold rounded-lg"
							style="padding: 7px 16px; color: rgba(255,255,255,0.35); font-size: 12px"
						>
							Already have an account
						</a>
					{/if}
				</div>
			</div>
		</div>
	</div>

</div>
