<script lang="ts">
    let inputData = $state("");
    let importing = $state(false);
    let result = $state<{
        success: boolean;
        message: string;
        count?: number;
    } | null>(null);
    let importFormat = $state<"json" | "csv">("json");

    function parseCSV(
        csv: string,
    ): Array<{ answer: string; question: string; tags: string[] }> {
        const lines = csv.trim().split("\n");

        if (lines.length < 2) {
            throw new Error(
                "CSV must have a header row and at least one data row",
            );
        }

        // Parse header
        const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const answerIndex = header.indexOf("answer");
        const questionIndex = header.indexOf("question");
        const tagsIndex = header.indexOf("tags");

        if (answerIndex === -1 || questionIndex === -1) {
            throw new Error('CSV must have "answer" and "question" columns');
        }

        // Parse data rows
        const questions = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Simple CSV parsing (handles basic cases)
            const values = line.split(",").map((v) => v.trim());

            const answer = values[answerIndex]?.trim();
            const question = values[questionIndex]?.trim();
            const tagsString =
                tagsIndex !== -1 ? values[tagsIndex]?.trim() : "";

            if (!answer || !question) {
                throw new Error(
                    `Row ${i + 1}: answer and question are required`,
                );
            }

            const tags = tagsString
                ? tagsString
                      .split(";")
                      .map((t) => t.trim())
                      .filter((t) => t)
                : [];

            questions.push({ answer, question, tags });
        }

        return questions;
    }

    async function handleImport() {
        importing = true;
        result = null;

        try {
            let questions;

            if (importFormat === "json") {
                // Parse JSON
                const data = JSON.parse(inputData);

                // Validate structure
                if (!data.questions || !Array.isArray(data.questions)) {
                    throw new Error(
                        'Invalid format: must have a "questions" array',
                    );
                }

                questions = data.questions;
            } else {
                // Parse CSV
                questions = parseCSV(inputData);
            }

            // Import questions
            const response = await fetch("/api/questions/import", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ questions }),
            });

            if (response.ok) {
                const importData = await response.json();
                result = {
                    success: true,
                    message: `Successfully imported ${importData.imported} questions!`,
                    count: importData.imported,
                };
                inputData = "";
            } else {
                const error = await response.json();
                result = {
                    success: false,
                    message: error.message || "Failed to import questions",
                };
            }
        } catch (err) {
            result = {
                success: false,
                message:
                    err instanceof Error
                        ? err.message
                        : `Invalid ${importFormat.toUpperCase()} format`,
            };
        } finally {
            importing = false;
        }
    }

    function loadSampleData() {
        if (importFormat === "json") {
            inputData = JSON.stringify(
                {
                    version: "1.0",
                    questions: [
                        {
                            answer: "This Founding Father is on the $100 bill",
                            question: "Who is Benjamin Franklin?",
                            tags: ["History", "American History"],
                        },
                        {
                            answer: "The capital of France",
                            question: "What is Paris?",
                            tags: ["Geography", "Europe"],
                        },
                        {
                            answer: "The process by which plants make food",
                            question: "What is photosynthesis?",
                            tags: ["Science", "Biology"],
                        },
                    ],
                },
                null,
                2,
            );
        } else {
            inputData = `answer,question,tags
This Founding Father is on the $100 bill,Who is Benjamin Franklin?,History;American History
The capital of France,What is Paris?,Geography;Europe
The process by which plants make food,What is photosynthesis?,Science;Biology`;
        }
    }
</script>

<div class="max-w-4xl">
    <div class="mb-8">
        <div class="flex items-center gap-2 mb-2">
            <a
                href="/dashboard/questions"
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
            <h1 class="text-3xl font-bold text-gray-900">Import Questions</h1>
        </div>
        <p class="text-gray-600">
            Bulk import questions from JSON or CSV format
        </p>
    </div>

    <!-- Format selector -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-3"
            >Import Format</label
        >
        <div class="flex gap-4">
            <button
                type="button"
                onclick={() => {
                    importFormat = "json";
                    inputData = "";
                    result = null;
                }}
                class={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    importFormat === "json"
                        ? "bg-blue-700 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
            >
                JSON
            </button>
            <button
                type="button"
                onclick={() => {
                    importFormat = "csv";
                    inputData = "";
                    result = null;
                }}
                class={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    importFormat === "csv"
                        ? "bg-blue-700 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
            >
                CSV
            </button>
        </div>
    </div>

    <!-- Instructions -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-blue-900 mb-3">
            {importFormat === "json" ? "JSON Format" : "CSV Format"}
        </h2>

        {#if importFormat === "json"}
            <p class="text-blue-800 mb-3">
                Your JSON file should have the following structure:
            </p>
            <pre
                class="bg-white p-4 rounded border border-blue-200 text-sm overflow-x-auto"><code
                    >{JSON.stringify(
                        {
                            version: "1.0",
                            questions: [
                                {
                                    answer: "The clue shown to players",
                                    question:
                                        "The correct response (What is...?, Who is...?)",
                                    tags: ["Tag1", "Tag2"],
                                },
                            ],
                        },
                        null,
                        2,
                    )}</code
                ></pre>
        {:else}
            <p class="text-blue-800 mb-3">
                Your CSV file should have the following structure:
            </p>
            <ul class="text-blue-800 mb-3 list-disc list-inside space-y-1">
                <li>
                    First row must be headers: <code
                        class="bg-white px-1 rounded">answer,question,tags</code
                    >
                </li>
                <li>Tags column is optional</li>
                <li>Multiple tags should be separated by semicolons (;)</li>
            </ul>
            <pre
                class="bg-white p-4 rounded border border-blue-200 text-sm overflow-x-auto"><code
                    >answer,question,tags
The clue shown to players,The correct response,Tag1;Tag2
Another clue,Another response,Tag3</code
                ></pre>
        {/if}

        <button
            type="button"
            onclick={loadSampleData}
            class="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
            Load Sample Data
        </button>
    </div>

    <!-- Result message -->
    {#if result}
        <div
            class={`p-4 rounded-lg mb-6 ${
                result.success
                    ? "bg-green-100 border border-green-400 text-green-700"
                    : "bg-red-100 border border-red-400 text-red-700"
            }`}
        >
            <div class="flex items-center gap-2">
                {#if result.success}
                    <svg
                        class="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clip-rule="evenodd"
                        />
                    </svg>
                {:else}
                    <svg
                        class="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd"
                        />
                    </svg>
                {/if}
                <p>{result.message}</p>
            </div>
            {#if result.success && result.count}
                <a
                    href="/dashboard/questions"
                    class="inline-block mt-3 text-sm underline hover:no-underline"
                >
                    View Questions →
                </a>
            {/if}
        </div>
    {/if}

    <!-- Import form -->
    <div class="bg-white rounded-lg shadow p-6">
        <form
            onsubmit={(e) => {
                e.preventDefault();
                handleImport();
            }}
            class="space-y-6"
        >
            <div>
                <label
                    for="dataInput"
                    class="block text-sm font-medium text-gray-700 mb-2"
                >
                    {importFormat === "json" ? "JSON Data" : "CSV Data"}
                </label>
                <textarea
                    id="dataInput"
                    bind:value={inputData}
                    rows="20"
                    required
                    disabled={importing}
                    placeholder={importFormat === "json"
                        ? "Paste your JSON data here..."
                        : "Paste your CSV data here..."}
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                ></textarea>
            </div>

            <div class="flex gap-4">
                <button
                    type="submit"
                    disabled={importing || !inputData.trim()}
                    class="px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {#if importing}
                        <svg
                            class="animate-spin h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
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
                        Importing...
                    {:else}
                        Import Questions
                    {/if}
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
