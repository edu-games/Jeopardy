<script lang="ts">
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    // Board state
    let boardName = $state("");
    let boardDescription = $state("");
    let saving = $state(false);
    let error = $state("");

    // Category and slot state
    interface Slot {
        questionId: string | null;
        points: number;
        isDailyDouble: boolean;
    }

    interface Category {
        name: string;
        slots: Slot[];
    }

    // Initialize 6 categories with 5 slots each
    let categories = $state<Category[]>(
        Array.from({ length: 6 }, (_, i) => ({
            name: "",
            slots: Array.from({ length: 5 }, (_, j) => ({
                questionId: null,
                points: (j + 1) * 200, // 200, 400, 600, 800, 1000
                isDailyDouble: false,
            })),
        })),
    );

    // Question selection modal state
    let selectingSlot: { categoryIndex: number; slotIndex: number } | null =
        $state(null);
    let questionSearch = $state("");
    let selectedTagFilter = $state<string[]>([]);

    // Filtered questions for selection
    let filteredQuestions = $derived(() => {
        let filtered = data.questions;

        // Get all currently selected question IDs
        const selectedQuestionIds = new Set(
            categories.flatMap((cat) =>
                cat.slots
                    .map((slot) => slot.questionId)
                    .filter((id): id is string => id !== null),
            ),
        );

        // Filter out already selected questions
        filtered = filtered.filter((q) => !selectedQuestionIds.has(q.id));

        if (questionSearch.trim()) {
            const term = questionSearch.toLowerCase();
            filtered = filtered.filter(
                (q) =>
                    q.answer.toLowerCase().includes(term) ||
                    q.question.toLowerCase().includes(term),
            );
        }

        if (selectedTagFilter.length > 0) {
            filtered = filtered.filter((q) =>
                q.tags.some((t) => selectedTagFilter.includes(t.tag.name)),
            );
        }

        return filtered;
    });

    function openQuestionSelector(categoryIndex: number, slotIndex: number) {
        selectingSlot = { categoryIndex, slotIndex };
        questionSearch = "";
        selectedTagFilter = [];
    }

    function selectQuestion(questionId: string) {
        if (selectingSlot) {
            categories[selectingSlot.categoryIndex].slots[
                selectingSlot.slotIndex
            ].questionId = questionId;
            selectingSlot = null;
        }
    }

    function getQuestionById(id: string | null) {
        if (!id) return null;
        return data.questions.find((q) => q.id === id);
    }

    function toggleTagFilter(tagName: string) {
        if (selectedTagFilter.includes(tagName)) {
            selectedTagFilter = selectedTagFilter.filter((t) => t !== tagName);
        } else {
            selectedTagFilter = [...selectedTagFilter, tagName];
        }
    }

    function validateBoard() {
        // Check board name
        if (!boardName.trim()) {
            error = "Board name is required";
            return false;
        }

        // Check all categories have names
        for (let i = 0; i < categories.length; i++) {
            if (!categories[i].name.trim()) {
                error = `Category ${i + 1} must have a name`;
                return false;
            }
        }

        // Check all slots have questions
        for (let i = 0; i < categories.length; i++) {
            for (let j = 0; j < categories[i].slots.length; j++) {
                if (!categories[i].slots[j].questionId) {
                    error = `Category ${i + 1}, Slot ${j + 1} must have a question selected`;
                    return false;
                }
            }
        }

        error = "";
        return true;
    }

    async function saveBoard() {
        if (!validateBoard()) {
            return;
        }

        saving = true;
        error = "";

        try {
            const response = await fetch("/api/boards", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: boardName.trim(),
                    description: boardDescription.trim() || null,
                    categories: categories.map((cat) => ({
                        name: cat.name.trim(),
                        slots: cat.slots.map((slot) => ({
                            questionId: slot.questionId,
                            points: slot.points,
                            isDailyDouble: slot.isDailyDouble,
                        })),
                    })),
                }),
            });

            if (response.ok) {
                window.location.href = "/dashboard/boards";
            } else {
                const data = await response.json();
                error = data.message || "Failed to save board";
            }
        } catch (err) {
            error = "An error occurred while saving the board";
        } finally {
            saving = false;
        }
    }

    // Count filled slots
    let filledSlots = $derived(
        categories.reduce(
            (sum, cat) => sum + cat.slots.filter((s) => s.questionId).length,
            0,
        ),
    );
</script>

<div class="max-w-7xl mx-auto">
    <div class="mb-8">
        <div class="flex items-center gap-2 mb-2">
            <a
                href="/dashboard/boards"
                class="text-gray-600 hover:text-gray-900 transition-colors"
            >
                <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
            </a>
            <h1 class="text-3xl font-bold text-gray-900">Create New Board</h1>
        </div>
        <p class="text-gray-600">
            Build a Jeopardy board with 6 categories and 5 questions each
        </p>
    </div>

    {#if error}
        <div
            class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6"
        >
            {error}
        </div>
    {/if}

    <!-- Board Details -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Board Details</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label
                    for="boardName"
                    class="block text-sm font-medium text-gray-700 mb-2"
                >
                    Board Name <span class="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="boardName"
                    bind:value={boardName}
                    placeholder="e.g., U.S. History Quiz"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            <div>
                <label
                    for="boardDescription"
                    class="block text-sm font-medium text-gray-700 mb-2"
                >
                    Description (optional)
                </label>
                <input
                    type="text"
                    id="boardDescription"
                    bind:value={boardDescription}
                    placeholder="Brief description of the board"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
        </div>
    </div>

    <!-- Progress -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span
                >{filledSlots}/30 slots filled ({Math.round(
                    (filledSlots / 30) * 100,
                )}%)</span
            >
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
            <div
                class="bg-blue-500 h-2 rounded-full transition-all"
                style={`width: ${(filledSlots / 30) * 100}%`}
            ></div>
        </div>
    </div>

    <!-- Categories Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        {#each categories as category, categoryIndex}
            <div class="bg-white rounded-lg shadow p-6">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Category {categoryIndex + 1} Name
                        <span class="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        bind:value={category.name}
                        placeholder={`Category ${categoryIndex + 1}`}
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <!-- Slots -->
                <div class="space-y-2">
                    {#each category.slots.toSorted((a, b) => a.points - b.points) as slot, slotIndex}
                        {@const question = getQuestionById(slot.questionId)}
                        <div
                            class="border rounded-lg p-3 {slot.isDailyDouble
                                ? 'border-yellow-500 bg-yellow-50'
                                : 'border-gray-200'}"
                        >
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                    <span
                                        class="text-sm font-medium text-gray-700"
                                        >${slot.points}</span
                                    >
                                    {#if slot.isDailyDouble}
                                        <span
                                            class="text-xs bg-yellow-500 text-white px-2 py-1 rounded-full"
                                            >DD</span
                                        >
                                    {/if}
                                </div>
                                <div class="flex gap-1">
                                    <button
                                        type="button"
                                        onclick={() =>
                                            (slot.isDailyDouble =
                                                !slot.isDailyDouble)}
                                        class="p-1 text-yellow-600 hover:bg-yellow-100 rounded transition-colors"
                                        title="Toggle Daily Double"
                                    >
                                        <svg
                                            class="w-4 h-4"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                            />
                                        </svg>
                                    </button>
                                    <input
                                        type="number"
                                        bind:value={slot.points}
                                        min="100"
                                        step="100"
                                        class="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                                    />
                                </div>
                            </div>
                            {#if question}
                                <div class="text-sm mb-2">
                                    <p class="text-gray-600 truncate">
                                        {question.answer}
                                    </p>
                                    <p
                                        class="text-blue-600 font-medium truncate"
                                    >
                                        {question.question}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onclick={() =>
                                        openQuestionSelector(
                                            categoryIndex,
                                            slotIndex,
                                        )}
                                    class="text-xs text-blue-600 hover:text-blue-800"
                                >
                                    Change Question
                                </button>
                            {:else}
                                <button
                                    type="button"
                                    onclick={() =>
                                        openQuestionSelector(
                                            categoryIndex,
                                            slotIndex,
                                        )}
                                    class="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded border-2 border-dashed border-blue-300 transition-colors"
                                >
                                    + Select Question
                                </button>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        {/each}
    </div>

    <!-- Actions -->
    <div class="flex gap-4 sticky bottom-4 bg-white rounded-lg shadow-lg p-4">
        <button
            type="button"
            onclick={saveBoard}
            disabled={saving}
            class="px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex-1"
        >
            {saving ? "Saving..." : "Save Board"}
        </button>
        <a
            href="/dashboard/boards"
            class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-center"
        >
            Cancel
        </a>
    </div>
</div>

<!-- Question Selection Modal -->
{#if selectingSlot}
    <div
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onclick={(e) => {
            if (e.target === e.currentTarget) selectingSlot = null;
        }}
    >
        <div
            class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
            <div class="p-6 border-b">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-900">
                        Select Question for Category {selectingSlot.categoryIndex +
                            1}, Slot {selectingSlot.slotIndex + 1}
                    </h3>
                    <button
                        onclick={() => (selectingSlot = null)}
                        class="text-gray-500 hover:text-gray-700"
                    >
                        <svg
                            class="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <!-- Search and Filter -->
                <input
                    type="text"
                    bind:value={questionSearch}
                    placeholder="Search questions..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                />

                {#if data.tags.length > 0}
                    <div class="flex flex-wrap gap-2">
                        {#each data.tags as tag}
                            <button
                                type="button"
                                onclick={() => toggleTagFilter(tag.name)}
                                class={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                    selectedTagFilter.includes(tag.name)
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                            >
                                {tag.name}
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>

            <div class="overflow-y-auto max-h-[60vh] p-6">
                {#if filteredQuestions().length === 0}
                    <p class="text-center text-gray-500 py-8">
                        No questions found. {data.questions.length === 0
                            ? "Create some questions first!"
                            : "Try adjusting your search."}
                    </p>
                {:else}
                    <div class="space-y-3">
                        {#each filteredQuestions() as question}
                            <button
                                type="button"
                                onclick={() => selectQuestion(question.id)}
                                class="w-full text-left p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                                <p class="text-gray-600 mb-1">
                                    {question.answer}
                                </p>
                                <p class="text-blue-700 font-medium mb-2">
                                    {question.question}
                                </p>
                                {#if question.tags.length > 0}
                                    <div class="flex flex-wrap gap-1">
                                        {#each question.tags as { tag }}
                                            <span
                                                class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                            >
                                                {tag.name}
                                            </span>
                                        {/each}
                                    </div>
                                {/if}
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}
