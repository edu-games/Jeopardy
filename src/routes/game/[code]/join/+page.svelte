<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let name = $state('');
	let joining = $state(false);
	let error = $state('');
	let success = $state(false);
	let assignedTeam = $state<any>(null);
	let gameId = $state('');

	const gameCode = $page.params.code.toUpperCase();
	const storageKey = `jeopardy_session_${gameCode}`;

	onMount(() => {
		const saved = localStorage.getItem(storageKey);
		if (saved) {
			try {
				const { studentId } = JSON.parse(saved);
				if (studentId) {
					window.location.href = `/game/${gameCode}/play?studentId=${studentId}`;
					return;
				}
			} catch {
				localStorage.removeItem(storageKey);
			}
		}
	});

	async function joinGame() {
		if (!name.trim()) {
			error = 'Please enter your name';
			return;
		}

		joining = true;
		error = '';

		try {
			const response = await fetch('/api/students/join', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ gameCode, name: name.trim() })
			});

			if (response.ok) {
				const data = await response.json();
				assignedTeam = data.student.team;
				gameId = data.gameId;
				success = true;

				localStorage.setItem(storageKey, JSON.stringify({ studentId: data.student.id, name: name.trim() }));

				setTimeout(() => {
					window.location.href = `/game/${gameCode}/play?studentId=${data.student.id}`;
				}, 2000);
			} else {
				const data = await response.json();
				error = data.message || 'Failed to join game';
			}
		} catch (err) {
			error = 'An error occurred. Please try again.';
		} finally {
			joining = false;
		}
	}
</script>

<div class="min-h-screen flex flex-col bg-gray-50 select-none">

	{#if !success}
		<!-- Header -->
		<div class="text-center pt-14 pb-8 shrink-0">
			<a href="/" class="text-gray-900 font-black text-2xl tracking-tight">
				Classroom Jeopardy<span class="text-amber-500">!</span>
			</a>
		</div>

		<!-- Game code tiles -->
		<div class="text-center mb-10 shrink-0">
			<p class="text-gray-400 text-[10px] uppercase tracking-[0.35em] mb-4">Game code</p>
			<div class="flex items-center justify-center gap-2">
				{#each gameCode.split('') as char}
					<div class="w-12 h-14 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
						<span class="text-2xl font-black text-amber-500">{char}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Form -->
		<div class="flex-1 flex flex-col px-8 max-w-sm mx-auto w-full">
			{#if error}
				<div class="mb-6 flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
					<svg class="w-4 h-4 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
					</svg>
					<p class="text-red-500 text-sm">{error}</p>
				</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); joinGame(); }}>
				<p class="text-gray-400 text-xs uppercase tracking-widest text-center mb-5">Enter your name to play</p>

				<input
					type="text"
					id="name"
					bind:value={name}
					disabled={joining}
					required
					placeholder="Your name..."
					autocomplete="off"
					class="w-full bg-transparent border-b-2 border-gray-200 text-gray-900 text-2xl font-semibold text-center py-3 mb-8 focus:outline-none focus:border-amber-400 transition-colors placeholder:text-gray-300 disabled:opacity-50"
				/>

				<button
					type="submit"
					disabled={joining || !name.trim()}
					class="w-full py-4 font-black text-lg rounded-2xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-105"
					style="background: #f59e0b; color: #fff"
				>
					{#if joining}
						<span class="flex items-center justify-center gap-2">
							<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Joining...
						</span>
					{:else}
						Buzz In
					{/if}
				</button>
			</form>
		</div>

	{:else}
		<!-- Success state -->
		<div class="flex-1 flex flex-col items-center justify-center px-6 text-center">

			<div class="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-white border-2 shadow-sm"
			     style={assignedTeam ? `border-color: ${assignedTeam.color}` : 'border-color: #22c55e'}>
				<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"
				     style={assignedTeam ? `color: ${assignedTeam.color}` : 'color: #22c55e'}>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
				</svg>
			</div>

			<h1 class="text-3xl font-black text-gray-900 mb-1">You're in!</h1>
			<p class="text-gray-400 mb-8">Welcome, <span class="text-gray-700 font-semibold">{name}</span></p>

			{#if assignedTeam}
				<div class="px-8 py-4 rounded-2xl mb-6 bg-white border-2 shadow-sm"
				     style={`border-color: ${assignedTeam.color}40`}>
					<div class="flex items-center justify-center gap-2 mb-0.5">
						<div class="w-3 h-3 rounded-full shrink-0" style={`background: ${assignedTeam.color}`}></div>
						<p class="text-lg font-black" style={`color: ${assignedTeam.color}`}>{assignedTeam.name}</p>
					</div>
					<p class="text-gray-400 text-xs uppercase tracking-widest">Your team</p>
				</div>
			{:else}
				<div class="px-6 py-4 rounded-2xl mb-6 bg-amber-50 border border-amber-200">
					<p class="text-amber-600 font-bold">Waiting for team assignment</p>
					<p class="text-gray-400 text-sm mt-1">Your instructor will assign you shortly</p>
				</div>
			{/if}

			<div class="flex items-center gap-2">
				<div class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
				<p class="text-gray-400 text-sm">Heading to the game...</p>
			</div>
		</div>
	{/if}
</div>
