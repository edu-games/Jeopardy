<script lang="ts">
	import { page } from '$app/stores';

	let name = $state('');
	let joining = $state(false);
	let error = $state('');
	let success = $state(false);
	let assignedTeam = $state<any>(null);
	let gameId = $state('');

	const gameCode = $page.params.code;

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
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					gameCode: gameCode.toUpperCase(),
					name: name.trim()
				})
			});

			if (response.ok) {
				const data = await response.json();
				assignedTeam = data.student.team;
				gameId = data.gameId;
				success = true;

				// Auto-redirect to play page after 2 seconds
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

<div class="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center px-4">
	<div class="max-w-md w-full">
		{#if !success}
			<!-- Join Form -->
			<div class="bg-white rounded-lg shadow-xl p-8">
				<div class="text-center mb-8">
					<h1 class="text-3xl font-bold text-gray-900 mb-2">Join Jeopardy!</h1>
					<p class="text-gray-600">Game Code: <span class="font-mono font-bold text-blue-700">{gameCode.toUpperCase()}</span></p>
				</div>

				{#if error}
					<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
						{error}
					</div>
				{/if}

				<form onsubmit={(e) => { e.preventDefault(); joinGame(); }} class="space-y-6">
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
							Your Name
						</label>
						<input
							type="text"
							id="name"
							bind:value={name}
							disabled={joining}
							required
							placeholder="Enter your name"
							class="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
						/>
					</div>

					<button
						type="submit"
						disabled={joining || !name.trim()}
						class="w-full px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium text-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						{#if joining}
							<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Joining...
						{:else}
							Join Game
						{/if}
					</button>
				</form>
			</div>
		{:else}
			<!-- Success Message -->
			<div class="bg-white rounded-lg shadow-xl p-8 text-center">
				<svg class="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>

				<h2 class="text-2xl font-bold text-gray-900 mb-2">You're In!</h2>
				<p class="text-gray-600 mb-6">Welcome, {name}!</p>

				{#if assignedTeam}
					<div class="mb-6 p-4 rounded-lg" style={`background-color: ${assignedTeam.color}20; border: 2px solid ${assignedTeam.color}`}>
						<div class="flex items-center justify-center gap-2 mb-1">
							<div class="w-4 h-4 rounded-full" style={`background-color: ${assignedTeam.color}`}></div>
							<p class="text-lg font-semibold" style={`color: ${assignedTeam.color}`}>
								{assignedTeam.name}
							</p>
						</div>
						<p class="text-sm text-gray-600">Your team</p>
					</div>
				{:else}
					<div class="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
						<p class="text-yellow-800 font-medium">
							⏳ Waiting for team assignment
						</p>
						<p class="text-sm text-yellow-700 mt-1">
							The instructor will assign you to a team shortly
						</p>
					</div>
				{/if}

				<div class="bg-gray-50 rounded-lg p-4">
					<p class="text-sm text-gray-600">
						The game will start soon. Stay on this page and wait for the instructor.
					</p>
				</div>
			</div>
		{/if}
	</div>
</div>
