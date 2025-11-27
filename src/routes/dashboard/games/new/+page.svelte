<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	let selectedBoardId = $state('');
	let teamCount = $state(4);
	let teamAssignment = $state<'MANUAL' | 'RANDOM'>('RANDOM');
	let teamNames = $state<string[]>(['Team 1', 'Team 2', 'Team 3', 'Team 4', 'Team 5', 'Team 6']);
	let teamColors = $state<string[]>([
		'#EF4444',
		'#3B82F6',
		'#10B981',
		'#F59E0B',
		'#8B5CF6',
		'#EC4899'
	]);
	let creating = $state(false);
	let error = $state('');

	$effect(() => {
		// Update team names when count changes
		teamNames = Array.from({ length: 6 }, (_, i) => teamNames[i] || `Team ${i + 1}`);
	});

	let selectedBoard = $derived(data.boards.find((b) => b.id === selectedBoardId));

	async function createGame() {
		if (!selectedBoardId) {
			error = 'Please select a board';
			return;
		}

		if (teamCount < 2 || teamCount > 6) {
			error = 'Team count must be between 2 and 6';
			return;
		}

		creating = true;
		error = '';

		try {
			const response = await fetch('/api/games', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					boardId: selectedBoardId,
					teamCount,
					teamAssignment,
					teamNames: teamNames.slice(0, teamCount),
					teamColors: teamColors.slice(0, teamCount)
				})
			});

			if (response.ok) {
				const game = await response.json();
				window.location.href = `/dashboard/games/${game.id}/lobby`;
			} else {
				const data = await response.json();
				error = data.message || 'Failed to create game';
			}
		} catch (err) {
			error = 'An error occurred while creating the game';
		} finally {
			creating = false;
		}
	}
</script>

<div class="max-w-4xl mx-auto">
	<div class="mb-8">
		<div class="flex items-center gap-2 mb-2">
			<a href="/dashboard/games" class="text-gray-600 hover:text-gray-900 transition-colors">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
			</a>
			<h1 class="text-3xl font-bold text-gray-900">Create New Game</h1>
		</div>
		<p class="text-gray-600">Set up a new Jeopardy game session</p>
	</div>

	{#if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
			{error}
		</div>
	{/if}

	<!-- Board Selection -->
	<div class="bg-white rounded-lg shadow p-6 mb-6">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Select Board</h2>

		{#if data.boards.length === 0}
			<div class="text-center py-8">
				<p class="text-gray-600 mb-4">You don't have any complete boards yet.</p>
				<a
					href="/dashboard/boards/new"
					class="inline-block px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
				>
					Create a Board
				</a>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each data.boards as board}
					<button
						type="button"
						onclick={() => (selectedBoardId = board.id)}
						class={`text-left p-4 border-2 rounded-lg transition-all ${
							selectedBoardId === board.id
								? 'border-blue-500 bg-blue-50'
								: 'border-gray-300 hover:border-blue-300'
						}`}
					>
						<h3 class="font-semibold text-gray-900 mb-2">{board.name}</h3>
						{#if board.description}
							<p class="text-sm text-gray-600 mb-2">{board.description}</p>
						{/if}
						<div class="flex flex-wrap gap-1">
							{#each board.categories.slice(0, 3) as category}
								<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
									{category.name}
								</span>
							{/each}
							{#if board.categories.length > 3}
								<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
									+{board.categories.length - 3} more
								</span>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	{#if selectedBoard}
		<!-- Team Configuration -->
		<div class="bg-white rounded-lg shadow p-6 mb-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Team Configuration</h2>

			<div class="mb-6">
				<label for="teamCount" class="block text-sm font-medium text-gray-700 mb-2">
					Number of Teams (2-6)
				</label>
				<input
					type="number"
					id="teamCount"
					bind:value={teamCount}
					min="2"
					max="6"
					class="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>

			<div class="mb-6">
				<label class="block text-sm font-medium text-gray-700 mb-3">
					Team Assignment Method
				</label>
				<div class="flex gap-4">
					<button
						type="button"
						onclick={() => (teamAssignment = 'RANDOM')}
						class={`flex-1 p-4 border-2 rounded-lg transition-all ${
							teamAssignment === 'RANDOM'
								? 'border-blue-500 bg-blue-50'
								: 'border-gray-300 hover:border-blue-300'
						}`}
					>
						<div class="font-semibold text-gray-900 mb-1">Random Assignment</div>
						<div class="text-sm text-gray-600">
							Students automatically assigned to teams evenly
						</div>
					</button>
					<button
						type="button"
						onclick={() => (teamAssignment = 'MANUAL')}
						class={`flex-1 p-4 border-2 rounded-lg transition-all ${
							teamAssignment === 'MANUAL'
								? 'border-blue-500 bg-blue-50'
								: 'border-gray-300 hover:border-blue-300'
						}`}
					>
						<div class="font-semibold text-gray-900 mb-1">Manual Assignment</div>
						<div class="text-sm text-gray-600">You assign students to teams manually</div>
					</button>
				</div>
			</div>

			<!-- Team Names and Colors -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-3">Team Details</label>
				<div class="space-y-3">
					{#each Array.from({ length: teamCount }) as _, i}
						<div class="flex items-center gap-3">
							<div class="w-12 h-12 rounded-lg border-2 border-gray-300 flex items-center justify-center">
								<input
									type="color"
									bind:value={teamColors[i]}
									class="w-8 h-8 border-0 rounded cursor-pointer"
								/>
							</div>
							<input
								type="text"
								bind:value={teamNames[i]}
								placeholder={`Team ${i + 1}`}
								class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Create Button -->
		<div class="flex gap-4">
			<button
				type="button"
				onclick={createGame}
				disabled={creating || !selectedBoardId}
				class="flex-1 px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
			>
				{creating ? 'Creating Game...' : 'Create Game'}
			</button>
			<a
				href="/dashboard/games"
				class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
			>
				Cancel
			</a>
		</div>
	{/if}
</div>
