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

<div class="board-velvet flex-1 flex flex-col min-h-0 rounded-xl overflow-hidden">
	<!-- Category Headers -->
	<div class="grid grid-cols-6 gap-[3px] px-2.5 pt-2.5 pb-1 flex-shrink-0">
		{#each categories as category}
			<div class="px-1.5 py-2 text-center">
				<span
					class="font-serif-display block leading-tight"
					style="color: var(--gold); font-size: clamp(10px, 1.4vw, 15px)"
				>
					{category.name}
				</span>
			</div>
		{/each}
	</div>
	<div style="height:1px; background: rgba(255,255,255,0.07); margin: 0 10px"></div>

	<!-- Question Grid -->
	<div
		class="grid grid-cols-6 gap-[3px] flex-1 p-2.5 pt-1.5 min-h-0"
		style="grid-template-rows: repeat(5, 1fr)"
	>
		{#each Array.from({ length: 5 }, (_, rowIndex) => rowIndex) as rowIndex}
			{#each categories as category}
				{@const slot = category.slots.find((s) => s.row === rowIndex)}
				{#if slot}
					{@const answered = isSlotAnswered(slot.id)}
					{@const isDD = slot.isDailyDouble && !answered}
					<div
						class="rounded-md flex items-center justify-center transition-colors"
						style="background: {answered
							? 'rgba(255,255,255,0.03)'
							: 'rgba(13,100,93,0.6)'}; border: 1.5px solid {isDD
							? 'var(--gold)'
							: 'rgba(255,255,255,0.06)'}"
					>
						{#if !answered}
							<span
								class="font-serif-display mono-nums"
								style="color: var(--gold); font-size: clamp(16px, 2.6vw, 36px); letter-spacing: -0.02em"
							>
								${slot.points}
							</span>
						{:else}
							<svg
								class="w-5 md:w-8 lg:w-10 h-5 md:h-8 lg:h-10"
								style="color: rgba(255,255,255,0.10)"
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
