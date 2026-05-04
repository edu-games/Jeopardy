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

	function formatGameCode(value: string) {
		return value
			.toUpperCase()
			.replace(/[^A-Z0-9]/g, '')
			.slice(0, 6);
	}

	function handleCodeInput(e: Event) {
		const target = e.target as HTMLInputElement;
		gameCode = formatGameCode(target.value);
	}
</script>

<div class="min-h-screen flex flex-col bg-gray-50">
	<!-- Nav -->
	<nav
		class="shrink-0 bg-white border-b border-gray-100 px-8 py-0 flex items-center justify-between h-14"
	>
		<span class="text-gray-900 font-black text-sm tracking-[0.12em] uppercase"
			>Classroom Jeopardy</span
		>
		<div class="flex items-center gap-3">
			{#if data.instructor}
				<span class="text-gray-500 text-sm">Hey, {data.instructor.name.split(' ')[0]}</span>
				<a
					href="/dashboard"
					class="px-4 py-1.5 text-sm font-bold rounded-lg transition-all hover:brightness-105"
					style="background: #f59e0b; color: #fff"
				>
					Dashboard
				</a>
			{:else}
				<a
					href="/login"
					class="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
				>
					Sign In
				</a>
				<a
					href="/register"
					class="px-4 py-1.5 text-sm font-bold rounded-lg transition-all hover:brightness-105"
					style="background: #f59e0b; color: #fff"
				>
					Register
				</a>
			{/if}
		</div>
	</nav>

	<!-- Hero -->
	<div class="flex-1 flex flex-col items-center justify-center px-6 py-16">
		<!-- Title -->
		<div class="text-center mb-12">
			<h1
				class="font-black leading-none tracking-tight mb-3"
				style="font-size: clamp(4rem, 13vw, 9rem); color: #111"
			>
				JEOPARDY<span style="color: #f59e0b">!</span>
			</h1>
			<p class="text-gray-400 text-sm tracking-widest uppercase">
				Live quiz games for your classroom
			</p>
		</div>

		<!-- Panels -->
		<div class="grid md:grid-cols-5 gap-4 w-full max-w-3xl items-start">
			<!-- Student join — primary -->
			<div
				class="md:col-span-3 rounded-2xl p-7 flex flex-col bg-white border border-gray-100 shadow-sm"
			>
				<p class="text-amber-500/80 text-[10px] uppercase tracking-[0.3em] mb-1">Students</p>
				<h2 class="text-gray-900 font-bold text-2xl mb-6">Join a Game</h2>

				<form onsubmit={handleJoinGame} class="flex flex-col gap-4">
					<div>
						<label
							for="gameCode"
							class="text-gray-400 text-[10px] uppercase tracking-widest block mb-2"
							>Game Code</label
						>
						<input
							type="text"
							id="gameCode"
							bind:value={gameCode}
							oninput={handleCodeInput}
							placeholder="ABC123"
							class="w-full rounded-xl px-5 py-3.5 text-2xl font-black tracking-[0.2em] text-center uppercase transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/50 bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-300 caret-amber-400"
							maxlength="6"
							required
							autocomplete="off"
						/>
					</div>
					<button
						type="submit"
						disabled={isJoining || !gameCode.trim()}
						class="w-full py-3.5 rounded-xl font-bold text-base text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-105"
						style="background: #f59e0b"
					>
						{isJoining ? 'Joining...' : 'Join Game'}
					</button>
				</form>
			</div>

			<!-- Instructor — secondary -->
			<div
				class="md:col-span-2 rounded-2xl p-6 flex flex-col justify-between bg-white border border-gray-100 shadow-sm"
			>
				<div>
					<p class="text-gray-400 text-[10px] uppercase tracking-[0.3em] mb-1">Instructors</p>
					<h2 class="text-gray-900 font-bold text-xl mb-5">Run a Game</h2>
					<ul class="space-y-2.5 mb-6">
						{#each ['Custom question banks', 'Drag-and-drop boards', 'Live buzz-in & scoring'] as feature}
							<li class="flex items-center gap-2.5">
								<div class="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></div>
								<span class="text-gray-500 text-sm">{feature}</span>
							</li>
						{/each}
					</ul>
				</div>
				<div class="flex flex-col gap-2">
					{#if data.instructor}
						<a
							href="/dashboard"
							class="block text-center py-2.5 rounded-xl font-bold text-sm transition-all hover:brightness-105"
							style="background: #f59e0b; color: #fff"
						>
							Go to Dashboard
						</a>
					{:else}
						<a
							href="/register"
							class="block text-center py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors"
							style="background: #111; color: white"
						>
							Create Account
						</a>
						<a
							href="/login"
							class="block text-center py-2.5 rounded-xl font-semibold text-sm text-gray-500 hover:text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
						>
							Sign In
						</a>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<footer class="shrink-0 text-center py-5 text-gray-300 text-xs">
		&copy; {new Date().getFullYear()} Classroom Jeopardy
	</footer>
</div>
