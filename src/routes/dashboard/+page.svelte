<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="space-y-8">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
		<div>
			<p class="text-gray-400 text-xs uppercase tracking-widest mb-0.5">Welcome back</p>
			<h1 class="font-serif-display text-4xl text-gray-900">{data.instructor.name}</h1>
		</div>

		<!-- Compact stats pill -->
		<div
			class="flex items-stretch divide-x divide-gray-100 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden self-start"
		>
			{#each [{ label: 'Questions', value: data.stats.questions }, { label: 'Boards', value: data.stats.boards }, { label: 'Games', value: data.stats.games }] as stat}
				<div class="px-5 py-3 text-center">
					<p class="text-2xl font-black text-gray-900 leading-none">{stat.value}</p>
					<p class="text-[10px] text-gray-400 uppercase tracking-wide mt-1">{stat.label}</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- Quick Actions -->
	<div>
		<p class="text-gray-400 text-[11px] uppercase tracking-[0.25em] mb-3">Quick Actions</p>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
			<!-- Start a Game — primary CTA -->
			<a
				href="/dashboard/games/new"
				class="group flex items-center gap-4 p-5 rounded-2xl transition-all hover:brightness-105 active:scale-[0.99] shadow-sm"
				style="background: #0f766e"
			>
				<div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
					<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.5"
							d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.5"
							d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<div>
					<p class="font-bold text-white">Start a Game</p>
					<p class="text-white/70 text-sm">Launch a live session</p>
				</div>
				<svg
					class="w-4 h-4 text-white/40 ml-auto group-hover:text-white/70 transition-colors"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>

			<a
				href="/dashboard/boards/new"
				class="group flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all active:scale-[0.99]"
			>
				<div
					class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors"
				>
					<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
						/>
					</svg>
				</div>
				<div>
					<p class="font-bold text-gray-900">New Board</p>
					<p class="text-gray-400 text-sm">Build a question board</p>
				</div>
				<svg
					class="w-4 h-4 text-gray-200 ml-auto group-hover:text-gray-400 transition-colors"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>

			<a
				href="/dashboard/questions/new"
				class="group flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all active:scale-[0.99]"
			>
				<div
					class="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors"
				>
					<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
				</div>
				<div>
					<p class="font-bold text-gray-900">Add Question</p>
					<p class="text-gray-400 text-sm">Grow your question bank</p>
				</div>
				<svg
					class="w-4 h-4 text-gray-200 ml-auto group-hover:text-gray-400 transition-colors"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>

			<a
				href="/dashboard/questions"
				class="group flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all active:scale-[0.99]"
			>
				<div
					class="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 group-hover:bg-teal-100 transition-colors"
				>
					<svg class="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						/>
					</svg>
				</div>
				<div>
					<p class="font-bold text-gray-900">Question Bank</p>
					<p class="text-gray-400 text-sm">Browse all questions</p>
				</div>
				<svg
					class="w-4 h-4 text-gray-200 ml-auto group-hover:text-gray-400 transition-colors"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		</div>
	</div>
</div>
