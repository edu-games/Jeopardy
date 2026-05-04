<script lang="ts">
	let {
		categories,
		answeredSlots = []
	}: {
		categories: any[];
		answeredSlots?: string[];
	} = $props();

	function isSlotAnswered(slotId: string) {
		return answeredSlots.includes(slotId);
	}
</script>

<div class="flex-1 bg-[#0f172a] flex flex-col min-h-0">
	<!-- Category Headers -->
	<div class="grid grid-cols-6 gap-1 md:gap-2 p-2 flex-shrink-0">
		{#each categories as category}
			<div class="bg-white/5 border border-white/10 rounded-xl p-2 md:p-4 text-center">
				<h3
					class="text-yellow-400 font-bold text-xs md:text-sm lg:text-base uppercase tracking-widest line-clamp-2"
				>
					{category.name}
				</h3>
			</div>
		{/each}
	</div>

	<!-- Question Grid -->
	<div class="grid grid-cols-6 gap-1 md:gap-2 flex-1 p-2 pt-0">
		{#each Array.from({ length: 5 }, (_, rowIndex) => rowIndex) as rowIndex}
			{#each categories as category}
				{@const slot = category.slots.find((s) => s.row === rowIndex)}
				{#if slot}
					<div
						class={`
                            rounded-xl font-semibold transition-all flex items-center justify-center
                            ${
															isSlotAnswered(slot.id)
																? 'bg-white/5 text-white/10'
																: 'bg-blue-800 hover:bg-blue-700 text-yellow-400 font-black'
														}
                            ${slot.isWildCard && !isSlotAnswered(slot.id) ? 'ring-2 ring-yellow-400' : ''}
                        `}
					>
						{#if !isSlotAnswered(slot.id)}
							<div class="text-center text-xl md:text-3xl lg:text-5xl">
								${slot.points}
							</div>
						{:else}
							<svg
								class="w-5 md:w-8 lg:w-10 h-5 md:h-8 lg:h-10 text-white/10"
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
