<script lang="ts">
	let {
		categoryName,
		points,
		isWildCard,
		clue,
		wager = null
	}: {
		categoryName: string;
		points: number;
		isWildCard: boolean;
		clue: string;
		wager?: number | null;
	} = $props();
</script>

<div class="flex-1 flex flex-col justify-center min-h-0 px-4 py-6">
	<!-- Category + Points header -->
	<div class="text-center mb-6 flex-shrink-0">
		<p class="text-white/50 text-sm md:text-base uppercase tracking-widest font-medium mb-2">
			{categoryName}
		</p>
		{#if isWildCard && wager !== null}
			<p class="text-5xl md:text-7xl lg:text-8xl font-black text-yellow-400 mb-2">
				${wager.toLocaleString()}
			</p>
			<p class="text-white/40 text-lg md:text-xl mb-3">wagered</p>
		{:else}
			<p class="text-5xl md:text-7xl lg:text-8xl font-black text-yellow-400 mb-3">
				${points}
			</p>
		{/if}
		{#if isWildCard}
			<span
				class="inline-block px-5 py-2 bg-yellow-500 text-blue-950 rounded-full text-base md:text-xl font-black tracking-wide"
			>
				WILD CARD
			</span>
		{/if}
	</div>

	<!-- Clue Display -->
	<div
		class="bg-gradient-to-br from-blue-900 to-blue-800 rounded-3xl flex items-center justify-center flex-1 p-8 md:p-12"
	>
		<p class="text-3xl md:text-5xl lg:text-6xl text-white text-center leading-relaxed font-medium">
			{clue}
		</p>
	</div>
</div>
