<script lang="ts">
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let selectedTags = $state<string[]>(data.question.tags.map((t) => t.tagId));
	let newTagInput = $state('');
	let newTags = $state<string[]>([]);

	function toggleTag(tagId: string) {
		if (selectedTags.includes(tagId)) {
			selectedTags = selectedTags.filter((t) => t !== tagId);
		} else {
			selectedTags = [...selectedTags, tagId];
		}
	}

	function addNewTag() {
		if (newTagInput.trim() && !newTags.includes(newTagInput.trim())) {
			newTags = [...newTags, newTagInput.trim()];
			newTagInput = '';
		}
	}

	function removeNewTag(tag: string) {
		newTags = newTags.filter((t) => t !== tag);
	}
</script>

<div class="max-w-4xl">
	<div class="mb-8">
		<div class="flex items-center gap-2 mb-2">
			<a
				href="/dashboard/questions"
				class="text-gray-600 hover:text-gray-900 transition-colors"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
			</a>
			<h1 class="text-3xl font-bold text-gray-900">Edit Question</h1>
		</div>
		<p class="text-gray-600">Update your question in the question bank</p>
	</div>

	<div class="bg-white rounded-lg shadow p-6">
		{#if form?.error}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
				{form.error}
			</div>
		{/if}

		<form method="POST" class="space-y-6">
			<!-- Answer (Clue) -->
			<div>
				<label for="answer" class="block text-sm font-medium text-gray-700 mb-2">
					Answer (Clue) <span class="text-red-500">*</span>
				</label>
				<p class="text-sm text-gray-500 mb-2">
					This is the clue that will be shown to players
				</p>
				<textarea
					id="answer"
					name="answer"
					rows="3"
					required
					value={form?.answer ?? data.question.answer}
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="Example: This Founding Father is on the $100 bill"
				></textarea>
			</div>

			<!-- Question (Response) -->
			<div>
				<label for="question" class="block text-sm font-medium text-gray-700 mb-2">
					Question (Response) <span class="text-red-500">*</span>
				</label>
				<p class="text-sm text-gray-500 mb-2">
					This is the correct response in Jeopardy format
				</p>
				<textarea
					id="question"
					name="question"
					rows="2"
					required
					value={form?.question ?? data.question.question}
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="Example: Who is Benjamin Franklin?"
				></textarea>
			</div>

			<!-- Tags -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
				<p class="text-sm text-gray-500 mb-3">
					Select existing tags or create new ones to categorize this question
				</p>

				<!-- Current tags -->
				<div class="mb-4">
					<p class="text-sm font-medium text-gray-600 mb-2">Current Tags:</p>
					<div class="flex flex-wrap gap-2">
						{#if data.question.tags.length > 0}
							{#each data.question.tags as { tag }}
								<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
									{tag.name}
								</span>
							{/each}
						{:else}
							<span class="text-sm text-gray-500">No tags</span>
						{/if}
					</div>
				</div>

				<!-- Existing tags -->
				{#if data.allTags.length > 0}
					<div class="mb-4">
						<p class="text-sm font-medium text-gray-600 mb-2">Select Tags:</p>
						<div class="flex flex-wrap gap-2">
							{#each data.allTags as tag}
								<button
									type="button"
									onclick={() => toggleTag(tag.id)}
									class={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
										selectedTags.includes(tag.id)
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

				<!-- New tags -->
				<div>
					<p class="text-sm font-medium text-gray-600 mb-2">Or Create New Tags:</p>
					<div class="flex gap-2">
						<input
							type="text"
							bind:value={newTagInput}
							onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addNewTag())}
							placeholder="Enter tag name and press Enter or click Add"
							class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
						<button
							type="button"
							onclick={addNewTag}
							class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
						>
							Add Tag
						</button>
					</div>
					{#if newTags.length > 0}
						<div class="mt-3 flex flex-wrap gap-2">
							{#each newTags as tag}
								<span
									class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-2"
								>
									{tag}
									<button
										type="button"
										onclick={() => removeNewTag(tag)}
										class="text-green-600 hover:text-green-800"
									>
										<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
											<path
												fill-rule="evenodd"
												d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
												clip-rule="evenodd"
											/>
										</svg>
									</button>
								</span>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Hidden inputs for form submission -->
				<input type="hidden" name="tags" value={selectedTags.join(',')} />
				<input type="hidden" name="newTags" value={newTags.join(',')} />
			</div>

			<!-- Actions -->
			<div class="flex gap-4 pt-4 border-t">
				<button
					type="submit"
					class="px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium"
				>
					Save Changes
				</button>
				<a
					href="/dashboard/questions"
					class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
				>
					Cancel
				</a>
			</div>
		</form>
	</div>
</div>
