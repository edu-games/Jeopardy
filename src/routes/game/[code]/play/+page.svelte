<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';

	export let data: PageData;

	let buzzerPressed = $state(false);
	let buzzerError = $state('');
	let pressingBuzzer = $state(false);

	// Real-time game state
	let teams = $state(data.game.teams);
	let gameState = $state(data.game.gameState);
	let currentSlotData = $state<any>(null);

	// Get current question slot if one is active
	const currentSlot = $derived(
		currentSlotData ||
		(gameState?.currentSlotId
			? data.game.board.categories
					.flatMap((c) => c.slots)
					.find((s) => s.id === gameState?.currentSlotId)
			: null)
	);

	const currentCategory = $derived(
		currentSlot
			? data.game.board.categories.find((c) => c.slots.some((s) => s.id === currentSlot.id))
			: null
	);

	const buzzerEnabled = $derived(gameState?.buzzerEnabled || false);

	// My team's current data
	const myTeam = $derived(teams.find((t) => t.id === data.student.team?.id));

	async function pressBuzzer() {
		if (!buzzerEnabled || buzzerPressed || pressingBuzzer) {
			return;
		}

		pressingBuzzer = true;
		buzzerError = '';

		try {
			const response = await fetch('/api/students/buzzer', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					studentId: data.student.id,
					gameId: data.game.id
				})
			});

			if (response.ok) {
				buzzerPressed = true;
			} else {
				const error = await response.json();
				buzzerError = error.message || 'Failed to press buzzer';
			}
		} catch (err) {
			buzzerError = 'An error occurred. Please try again.';
		} finally {
			pressingBuzzer = false;
		}
	}

	// Set up Server-Sent Events for real-time updates
	onMount(() => {
		const eventSource = new EventSource(`/api/sse/${data.game.id}`);

		eventSource.onmessage = (event) => {
			try {
				const eventData = JSON.parse(event.data);
				console.log('[SSE] Received event:', eventData.type);

				switch (eventData.type) {
					case 'connected':
						console.log('[SSE] Connected with client ID:', eventData.clientId);
						break;

					case 'question-revealed':
						// New question revealed
						currentSlotData = eventData.currentSlot;
						gameState = {
							...gameState,
							currentSlotId: eventData.slotId,
							buzzerEnabled: eventData.buzzerEnabled
						};
						buzzerPressed = false; // Reset buzzer state for new question
						buzzerError = '';
						break;

					case 'answer-submitted':
						// Answer was submitted, update scores and reset question
						teams = eventData.teams;
						gameState = {
							...gameState,
							answeredSlots: eventData.answeredSlots,
							currentSlotId: eventData.currentSlotId,
							buzzerEnabled: false
						};
						currentSlotData = null;
						buzzerPressed = false;
						break;

					case 'buzzer-pressed':
						// Someone buzzed in (could show notification)
						console.log(
							`[SSE] ${eventData.studentName} from ${eventData.teamName} buzzed in!`
						);
						break;

					case 'game-started':
					case 'game-ended':
						// Game status changed
						window.location.reload();
						break;
				}
			} catch (error) {
				console.error('[SSE] Error parsing event:', error);
			}
		};

		eventSource.onerror = (error) => {
			console.error('[SSE] Connection error:', error);
			eventSource.close();
		};

		// Cleanup on unmount
		return () => {
			eventSource.close();
		};
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-4">
	<div class="max-w-4xl mx-auto">
		<!-- Header with Student Info -->>
		<div class="mb-6 bg-white/10 backdrop-blur-sm rounded-lg p-6">
			<div class="text-center">
				<h1 class="text-3xl font-bold text-white mb-2">Jeopardy!</h1>
				<p class="text-blue-200 text-lg">Welcome, {data.student.name}!</p>
			</div>
		</div>

		<!-- Team Info -->>
		{#if myTeam}
			<div
				class="mb-6 p-6 rounded-lg"
				style={`background-color: ${myTeam.color}20; border: 3px solid ${myTeam.color}`}
			>
				<div class="text-center">
					<div class="flex items-center justify-center gap-3 mb-3">
						<div
							class="w-6 h-6 rounded-full"
							style={`background-color: ${myTeam.color}`}
						></div>
						<h2 class="text-2xl font-bold text-white">{myTeam.name}</h2>
					</div>
					<div class="text-5xl font-bold text-white mb-2">${myTeam.score}</div>
					<p class="text-blue-200">Your Team's Score</p>
				</div>
			</div>
		{:else}
			<div class="mb-6 p-6 bg-yellow-50 border-3 border-yellow-300 rounded-lg">
				<p class="text-yellow-800 font-medium text-center text-lg">
					⏳ Waiting for team assignment
				</p>
				<p class="text-sm text-yellow-700 mt-2 text-center">
					The instructor will assign you to a team shortly
				</p>
			</div>
		{/if}

		<!-- Game Status -->>
		{#if data.game.status === 'LOBBY'}
			<div class="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
				<div class="animate-pulse mb-4">
					<svg
						class="w-16 h-16 mx-auto text-blue-300"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<h3 class="text-2xl font-bold text-white mb-2">Game Starting Soon</h3>
				<p class="text-blue-200">
					Wait for the instructor to start the game. Stay on this page!
				</p>
			</div>
		{:else if data.game.status === 'IN_PROGRESS'}
			<!-- Current Question Info -->>
			{#if currentSlot && currentCategory}
				<div class="mb-6 bg-blue-800 rounded-lg p-6">
					<div class="text-center mb-4">
						<div class="text-yellow-400 font-semibold text-lg mb-1">
							{currentCategory.name}
						</div>
						<div class="text-4xl font-bold text-yellow-400">${currentSlot.points}</div>
						{#if currentSlot.isDailyDouble}
							<div
								class="mt-3 inline-block px-4 py-2 bg-yellow-500 text-blue-900 rounded-full text-sm font-bold"
							>
								DAILY DOUBLE
							</div>
						{/if}
					</div>

					<!-- Clue Display -->>
					<div class="bg-blue-700 rounded-lg p-6 mb-4">
						<p class="text-sm text-blue-300 mb-2 uppercase tracking-wide text-center">Clue</p>
						<p class="text-xl text-white text-center">{currentSlot.question.answer}</p>
					</div>

					<!-- Buzzer Button -->>
					{#if buzzerEnabled && !buzzerPressed}
						<button
							type="button"
							onclick={pressBuzzer}
							disabled={pressingBuzzer}
							class="w-full py-12 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg font-bold text-4xl transition-all shadow-2xl disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
						>
							{#if pressingBuzzer}
								<svg class="animate-spin h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24">
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
							{:else}
								🔴 BUZZ IN!
							{/if}
						</button>

						{#if buzzerError}
							<div class="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
								{buzzerError}
							</div>
						{/if}
					{:else if buzzerPressed}
						<div class="bg-green-600 rounded-lg p-8 text-center">
							<svg
								class="w-16 h-16 mx-auto text-white mb-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<h3 class="text-2xl font-bold text-white mb-2">You Buzzed In!</h3>
							<p class="text-green-100">Wait for the instructor to call on your team.</p>
						</div>
					{:else}
						<div class="bg-gray-600 rounded-lg p-8 text-center">
							<svg
								class="w-16 h-16 mx-auto text-gray-400 mb-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
								/>
							</svg>
							<h3 class="text-xl font-bold text-white mb-2">Buzzer Locked</h3>
							<p class="text-gray-300">
								{#if currentSlot.isDailyDouble}
									This is a Daily Double. Your team cannot buzz in.
								{:else}
									Wait for the instructor to unlock the buzzer.
								{/if}
							</p>
						</div>
					{/if}
				</div>
			{:else}
				<div class="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
					<div class="animate-pulse mb-4">
						<svg
							class="w-16 h-16 mx-auto text-blue-300"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<h3 class="text-2xl font-bold text-white mb-2">Waiting for Next Question</h3>
					<p class="text-blue-200">The instructor will select a question shortly.</p>
				</div>
			{/if}

			<!-- All Teams Scoreboard -->>
			<div class="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-6">
				<h3 class="text-xl font-bold text-white mb-4 text-center">All Teams</h3>
				<div class="grid grid-cols-2 gap-3">
					{#each teams as team}
						<div
							class="p-4 rounded-lg text-center {team.id === myTeam?.id
								? 'ring-4 ring-white'
								: ''}"
							style={`background-color: ${team.color}30; border: 2px solid ${team.color}`}
						>
							<div class="flex items-center justify-center gap-2 mb-1">
								<div class="w-3 h-3 rounded-full" style={`background-color: ${team.color}`}></div>
								<p class="font-semibold text-white text-sm">{team.name}</p>
							</div>
							<p class="text-2xl font-bold text-white">${team.score}</p>
						</div>
					{/each}
				</div>
			</div>
		{:else if data.game.status === 'COMPLETED'}
			<div class="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
				<svg
					class="w-16 h-16 mx-auto text-yellow-400 mb-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
					/>
				</svg>
				<h3 class="text-2xl font-bold text-white mb-2">Game Complete!</h3>
				<p class="text-blue-200">Thanks for playing!</p>
			</div>
		{/if}
	</div>
</div>
