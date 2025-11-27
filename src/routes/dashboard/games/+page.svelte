<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	function getStatusBadge(status: string) {
		switch (status) {
			case 'LOBBY':
				return 'bg-yellow-100 text-yellow-800';
			case 'IN_PROGRESS':
				return 'bg-green-100 text-green-800';
			case 'COMPLETED':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusText(status: string) {
		switch (status) {
			case 'LOBBY':
				return 'Lobby';
			case 'IN_PROGRESS':
				return 'In Progress';
			case 'COMPLETED':
				return 'Completed';
			default:
				return status;
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Games</h1>
			<p class="text-gray-600 mt-1">Manage your Jeopardy game sessions</p>
		</div>
		<a
			href="/dashboard/games/new"
			class="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-2"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 4v16m8-8H4"
				/>
			</svg>
			New Game
		</a>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<div class="bg-white rounded-lg shadow p-4">
			<p class="text-sm text-gray-600">Total Games</p>
			<p class="text-2xl font-bold text-gray-900">{data.games.length}</p>
		</div>
		<div class="bg-white rounded-lg shadow p-4">
			<p class="text-sm text-gray-600">In Lobby</p>
			<p class="text-2xl font-bold text-yellow-600">
				{data.games.filter((g) => g.status === 'LOBBY').length}
			</p>
		</div>
		<div class="bg-white rounded-lg shadow p-4">
			<p class="text-sm text-gray-600">In Progress</p>
			<p class="text-2xl font-bold text-green-600">
				{data.games.filter((g) => g.status === 'IN_PROGRESS').length}
			</p>
		</div>
		<div class="bg-white rounded-lg shadow p-4">
			<p class="text-sm text-gray-600">Completed</p>
			<p class="text-2xl font-bold text-gray-600">
				{data.games.filter((g) => g.status === 'COMPLETED').length}
			</p>
		</div>
	</div>

	<!-- Games List -->
	<div class="space-y-4">
		{#if data.games.length === 0}
			<div class="bg-white rounded-lg shadow p-8 text-center">
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
						d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">No games yet</h3>
				<p class="text-gray-600 mb-4">Create your first game to get started!</p>
				<a
					href="/dashboard/games/new"
					class="inline-block px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
				>
					Create First Game
				</a>
			</div>
		{:else}
			{#each data.games as game}
				<div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
					<div class="flex justify-between items-start mb-4">
						<div class="flex-1">
							<div class="flex items-center gap-3 mb-2">
								<h3 class="text-xl font-bold text-gray-900">{game.board.name}</h3>
								<span class={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(game.status)}`}>
									{getStatusText(game.status)}
								</span>
							</div>
							<div class="flex items-center gap-4 text-sm text-gray-600">
								<div class="flex items-center gap-1">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
										/>
									</svg>
									<span>Code: <span class="font-mono font-bold text-blue-700">{game.code}</span></span>
								</div>
								<span>•</span>
								<span>{game.teams.length} teams</span>
								<span>•</span>
								<span>{game._count.students} students</span>
								<span>•</span>
								<span>Created {new Date(game.createdAt).toLocaleDateString()}</span>
							</div>
						</div>
						<div class="flex gap-2 ml-4">
							{#if game.status === 'LOBBY'}
								<a
									href={`/dashboard/games/${game.id}/lobby`}
									class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
								>
									Manage Lobby
								</a>
							{:else if game.status === 'IN_PROGRESS'}
								<a
									href={`/dashboard/games/${game.id}/play`}
									class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
								>
									Continue Game
								</a>
							{:else}
								<a
									href={`/dashboard/games/${game.id}/results`}
									class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
								>
									View Results
								</a>
							{/if}
						</div>
					</div>

					<!-- Teams Preview -->
					{#if game.teams.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each game.teams as team}
								<div class="flex items-center gap-2 px-3 py-1 rounded-full border-2" style={`border-color: ${team.color}; background-color: ${team.color}20`}>
									<div class="w-3 h-3 rounded-full" style={`background-color: ${team.color}`}></div>
									<span class="text-sm font-medium">{team.name}</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>
