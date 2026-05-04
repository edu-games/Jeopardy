<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let pendingDelete: { id: string; name: string } | null = $state(null);

	function getStatusBadge(status: string) {
		switch (status) {
			case 'LOBBY':
				return 'bg-teal-100 text-teal-800';
			case 'IN_PROGRESS':
				return 'bg-green-100 text-green-700';
			case 'COMPLETED':
				return 'bg-gray-100 text-gray-500';
			default:
				return 'bg-gray-100 text-gray-500';
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
			<h1 class="font-serif-display text-4xl text-gray-900">Games</h1>
			<p class="text-gray-400 text-sm mt-0.5">Manage your Tile Trivia game sessions</p>
		</div>
		<a
			href="/dashboard/games/new"
			class="px-4 py-2 rounded-xl font-bold text-sm text-white transition-all hover:brightness-105 flex items-center gap-2"
			style="background: #0f766e"
		>
			<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
				<path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z" />
			</svg>
			New Game
		</a>
	</div>

	<!-- Games List -->
	<div class="space-y-3">
		{#if data.games.length === 0}
			<div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
				<div
					class="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3"
				>
					<svg class="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
						<path d="M8 5.14v14l11-7-11-7z" />
					</svg>
				</div>
				<h3 class="text-gray-900 font-bold mb-1">No games yet</h3>
				<p class="text-gray-400 text-sm mb-5">Create your first game to get started</p>
				<a
					href="/dashboard/games/new"
					class="inline-block px-5 py-2.5 rounded-xl font-bold text-sm text-white hover:brightness-105 transition-all"
					style="background: #0f766e"
				>
					Create First Game
				</a>
			</div>
		{:else}
			{#each data.games as game}
				<div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
					<div class="flex items-center justify-between gap-4">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2.5 mb-1.5 flex-wrap">
								<h3 class="text-gray-900 font-bold truncate">{game.board.name}</h3>
								<span
									class={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(game.status)}`}
								>
									{getStatusText(game.status)}
								</span>
							</div>
							<div class="flex items-center gap-3 text-sm text-gray-400 flex-wrap">
								<span class="font-mono font-bold text-gray-600">{game.code}</span>
								<span>·</span>
								<span>{game.teams.length} teams</span>
								<span>·</span>
								<span>{game._count.students} students</span>
								<span>·</span>
								<span>{new Date(game.createdAt).toLocaleDateString()}</span>
							</div>
							{#if game.teams.length > 0}
								<div class="flex flex-wrap gap-1.5 mt-3">
									{#each game.teams as team}
										<div
											class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
											style={`background: ${team.color}12; border-color: ${team.color}30; color: ${team.color}`}
										>
											<div
												class="w-1.5 h-1.5 rounded-full shrink-0"
												style={`background: ${team.color}`}
											></div>
											{team.name}
											{#if game.status === 'COMPLETED' || game.status === 'IN_PROGRESS'}
												<span class="text-gray-500 font-normal">${team.score}</span>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Actions -->
						<div class="flex items-center gap-2 shrink-0">
							{#if game.status === 'LOBBY'}
								<a
									href={`/dashboard/games/${game.id}/lobby`}
									class="px-3.5 py-2 rounded-xl font-semibold text-sm text-white bg-teal-600 hover:bg-teal-700 transition-colors"
								>
									Manage Lobby
								</a>
							{:else if game.status === 'IN_PROGRESS'}
								<a
									href={`/dashboard/games/${game.id}/play`}
									class="px-3.5 py-2 rounded-xl font-semibold text-sm text-white bg-green-500 hover:bg-green-600 transition-colors"
								>
									Continue
								</a>
							{:else}
								<a
									href={`/dashboard/games/${game.id}/results`}
									class="px-3.5 py-2 rounded-xl font-semibold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
								>
									View Results
								</a>
							{/if}

							{#if game.status !== 'IN_PROGRESS'}
								<button
									type="button"
									onclick={() => (pendingDelete = { id: game.id, name: game.board.name })}
									class="p-2 rounded-xl text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
									title="Delete game"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<!-- Delete confirmation modal -->
{#if pendingDelete}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
	>
		<!-- Backdrop -->
		<div
			class="absolute inset-0 bg-black/20 backdrop-blur-sm"
			onclick={() => (pendingDelete = null)}
		></div>

		<!-- Dialog -->
		<div class="relative bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm p-6">
			<div class="flex items-start gap-4 mb-5">
				<div class="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
					<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
				</div>
				<div>
					<h2 class="text-gray-900 font-bold text-base">Delete game?</h2>
					<p class="text-gray-500 text-sm mt-1">
						<span class="font-semibold text-gray-700">{pendingDelete.name}</span> and all its data will
						be permanently deleted.
					</p>
				</div>
			</div>

			<div class="flex gap-2">
				<button
					type="button"
					onclick={() => (pendingDelete = null)}
					class="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
				>
					Cancel
				</button>
				<form method="POST" action="?/delete" class="flex-1">
					<input type="hidden" name="gameId" value={pendingDelete.id} />
					<button
						type="submit"
						class="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
					>
						Delete
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
