<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	let searchTerm = $state('');
	let selectedTags = $state<string[]>([]);

	// Filter questions
	let filteredQuestions = $derived(() => {
		let filtered = data.questions;

		// Filter by search term
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter(
				(q) =>
					q.answer.toLowerCase().includes(term) || q.question.toLowerCase().includes(term)
			);
		}

		// Filter by tags
		if (selectedTags.length > 0) {
			filtered = filtered.filter((q) =>
				q.tags.some((t) => selectedTags.includes(t.tag.name))
			);
		}

		return filtered;
	});

	function toggleTag(tagName: string) {
		if (selectedTags.includes(tagName)) {
			selectedTags = selectedTags.filter((t) => t !== tagName);
		} else {
			selectedTags = [...selectedTags, tagName];
		}
	}

	async function deleteQuestion(id: string) {
		if (!confirm('Are you sure you want to delete this question?')) {
			return;
		}

		const response = await fetch(`/api/questions/${id}`, {
			method: 'DELETE'
		});

		if (response.ok) {
			// Reload the page
			window.location.reload();
		} else {
			alert('Failed to delete question');
		}
	}

	async function exportQuestions() {
		const response = await fetch('/api/questions/export');
		const data = await response.json();
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `questions-${new Date().toISOString().split('T')[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Question Bank</h1>
			<p class="text-gray-600 mt-1">Manage your Jeopardy questions</p>
		</div>
		<div class="flex gap-3">
			<a
				href="/dashboard/questions/import"
				class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
					/>
				</svg>
				Import
			</a>
			<button
				onclick={exportQuestions}
				class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
					/>
				</svg>
				Export
			</button>
			<a
				href="/dashboard/questions/new"
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
				New Question
			</a>
		</div>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div class="bg-white rounded-lg shadow p-4">
			<p class="text-sm text-gray-600">Total Questions</p>
			<p class="text-2xl font-bold text-gray-900">{data.questions.length}</p>
		</div>
		<div class="bg-white rounded-lg shadow p-4">
			<p class="text-sm text-gray-600">Total Tags</p>
			<p class="text-2xl font-bold text-gray-900">{data.tags.length}</p>
		</div>
		<div class="bg-white rounded-lg shadow p-4">
			<p class="text-sm text-gray-600">Filtered Results</p>
			<p class="text-2xl font-bold text-gray-900">{filteredQuestions().length}</p>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-lg shadow p-6">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Filters</h2>

		<!-- Search -->
		<div class="mb-4">
			<label for="search" class="block text-sm font-medium text-gray-700 mb-2">
				Search Questions
			</label>
			<input
				type="text"
				id="search"
				bind:value={searchTerm}
				placeholder="Search by answer or question..."
				class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			/>
		</div>

		<!-- Tag filters -->
		{#if data.tags.length > 0}
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">Filter by Tags</label>
				<div class="flex flex-wrap gap-2">
					{#each data.tags as tag}
						<button
							type="button"
							onclick={() => toggleTag(tag.name)}
							class={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
								selectedTags.includes(tag.name)
									? 'bg-blue-600 text-white'
									: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
							}`}
						>
							{tag.name}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if selectedTags.length > 0 || searchTerm.trim()}
			<button
				type="button"
				onclick={() => {
					searchTerm = '';
					selectedTags = [];
				}}
				class="mt-4 text-sm text-blue-600 hover:text-blue-800"
			>
				Clear all filters
			</button>
		{/if}
	</div>

	<!-- Questions List -->
	<div class="space-y-4">
		{#if filteredQuestions().length === 0}
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
						d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">No questions found</h3>
				<p class="text-gray-600 mb-4">
					{#if data.questions.length === 0}
						Get started by creating your first question!
					{:else}
						Try adjusting your filters or search term.
					{/if}
				</p>
				{#if data.questions.length === 0}
					<a
						href="/dashboard/questions/new"
						class="inline-block px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
					>
						Create First Question
					</a>
				{/if}
			</div>
		{:else}
			{#each filteredQuestions() as question}
				<div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
					<div class="flex justify-between items-start">
						<div class="flex-1">
							<div class="mb-3">
								<p class="text-sm font-medium text-gray-500 mb-1">Answer (Clue)</p>
								<p class="text-lg text-gray-900">{question.answer}</p>
							</div>
							<div class="mb-3">
								<p class="text-sm font-medium text-gray-500 mb-1">Question (Response)</p>
								<p class="text-lg text-blue-700 font-medium">{question.question}</p>
							</div>
							{#if question.tags.length > 0}
								<div class="flex flex-wrap gap-2">
									{#each question.tags as { tag }}
										<span
											class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
										>
											{tag.name}
										</span>
									{/each}
								</div>
							{/if}
						</div>
						<div class="flex gap-2 ml-4">
							<a
								href={`/dashboard/questions/${question.id}/edit`}
								class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
								title="Edit"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/>
								</svg>
							</a>
							<button
								onclick={() => deleteQuestion(question.id)}
								class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
								title="Delete"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
							</button>
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
