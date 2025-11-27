<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="space-y-6">
	<div class="bg-white rounded-lg shadow p-6">
		<h1 class="text-3xl font-bold text-gray-900 mb-2">
			Welcome back, {data.instructor.name}!
		</h1>
		<p class="text-gray-600">
			Get started by creating questions, building boards, or starting a new game.
		</p>
	</div>

	<!-- Quick Actions -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		<a
			href="/dashboard/questions/new"
			class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
		>
			<div class="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
				<svg
					class="w-6 h-6 text-blue-700"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
			</div>
			<h2 class="text-lg font-semibold text-gray-900 mb-2">New Question</h2>
			<p class="text-sm text-gray-600">Add questions to your question bank</p>
		</a>

		<a
			href="/dashboard/boards/new"
			class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
		>
			<div class="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
				<svg
					class="w-6 h-6 text-green-700"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
					/>
				</svg>
			</div>
			<h2 class="text-lg font-semibold text-gray-900 mb-2">New Board</h2>
			<p class="text-sm text-gray-600">Create a Jeopardy board from questions</p>
		</a>

		<a
			href="/dashboard/games/new"
			class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
		>
			<div class="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
				<svg
					class="w-6 h-6 text-purple-700"
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
			</div>
			<h2 class="text-lg font-semibold text-gray-900 mb-2">Start Game</h2>
			<p class="text-sm text-gray-600">Begin a new Jeopardy game session</p>
		</a>

		<a
			href="/dashboard/questions"
			class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
		>
			<div class="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mb-4">
				<svg
					class="w-6 h-6 text-yellow-700"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
					/>
				</svg>
			</div>
			<h2 class="text-lg font-semibold text-gray-900 mb-2">Question Bank</h2>
			<p class="text-sm text-gray-600">Browse and manage your questions</p>
		</a>
	</div>

	<!-- Stats Overview (Placeholder) -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div class="bg-white rounded-lg shadow p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">Total Questions</p>
					<p class="text-2xl font-bold text-gray-900">-</p>
				</div>
				<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
					<svg class="w-6 h-6 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
						<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
						<path
							fill-rule="evenodd"
							d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-lg shadow p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">Total Boards</p>
					<p class="text-2xl font-bold text-gray-900">-</p>
				</div>
				<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
					<svg class="w-6 h-6 text-green-700" fill="currentColor" viewBox="0 0 20 20">
						<path
							d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
						/>
					</svg>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-lg shadow p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">Games Played</p>
					<p class="text-2xl font-bold text-gray-900">-</p>
				</div>
				<div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
					<svg class="w-6 h-6 text-purple-700" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
			</div>
		</div>
	</div>
</div>
