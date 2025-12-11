<script lang="ts">
    import type { Board } from "@prisma/client";

    let {
        categories,
        answeredSlots = [],
    }: {
        categories: any[];
        answeredSlots?: string[];
    } = $props();

    function isSlotAnswered(slotId: string) {
        return answeredSlots.includes(slotId);
    }
</script>

<div
    class="flex-1 bg-blue-800 rounded-xl md:rounded-2xl p-3 md:p-6 lg:p-8 shadow-2xl flex flex-col"
>
    <!-- Category Headers -->
    <div
        class="grid grid-cols-6 gap-1 md:gap-2 lg:gap-4 mb-1 md:mb-2 lg:mb-4 flex-shrink-0"
    >
        {#each categories as category}
            <div
                class="bg-blue-900 p-2 md:p-4 lg:p-6 rounded-lg md:rounded-xl text-center"
            >
                <h3
                    class="text-yellow-400 font-bold text-xs md:text-lg lg:text-2xl uppercase tracking-wide line-clamp-2"
                >
                    {category.name}
                </h3>
            </div>
        {/each}
    </div>

    <!-- Question Grid -->
    <div class="grid grid-cols-6 gap-1 md:gap-2 lg:gap-4 flex-1">
        {#each Array.from({ length: 5 }, (_, rowIndex) => rowIndex) as rowIndex}
            {#each categories as category}
                {@const slot = category.slots.find((s) => s.row === rowIndex)}
                {#if slot}
                    <div
                        class={`
                            rounded-lg md:rounded-xl font-semibold text-xl md:text-3xl lg:text-5xl transition-all flex items-center justify-center
                            ${
                                isSlotAnswered(slot.id)
                                    ? "bg-blue-900/50 text-blue-700"
                                    : "bg-blue-600 text-yellow-400"
                            }
                        `}
                    >
                        {#if !isSlotAnswered(slot.id)}
                            <div class="text-center">
                                ${slot.points}
                            </div>
                        {:else}
                            <svg
                                class="w-6 md:w-10 lg:w-12 h-6 md:h-10 lg:h-12"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        {/if}
                    </div>
                {/if}
            {/each}
        {/each}
    </div>
</div>
