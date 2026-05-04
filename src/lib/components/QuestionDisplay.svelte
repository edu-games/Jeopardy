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
		<p class="font-serif-display text-2xl md:text-3xl mb-2" style="color: rgba(255,255,255,0.6); letter-spacing: 0.02em">
			{categoryName}
		</p>
		{#if isWildCard && wager !== null}
			<p class="font-serif-display text-5xl md:text-7xl lg:text-8xl text-[#d4a817] mb-2">
				${wager.toLocaleString()}
			</p>
			<p class="text-white/40 text-lg md:text-xl mb-3">wagered</p>
		{:else}
			<p class="font-serif-display text-5xl md:text-7xl lg:text-8xl text-[#d4a817] mb-3">
				${points}
			</p>
		{/if}
		{#if isWildCard}
			<span
				class="inline-block px-5 py-2 bg-[#d4a817] text-[#0c1a38] rounded-full text-base md:text-xl font-black tracking-wide"
			>
				WILD CARD
			</span>
		{/if}
	</div>

	<!-- Clue Display -->
	<div
		class="rounded-3xl flex items-center justify-center flex-1 p-8 md:p-12"
		style="background: linear-gradient(135deg, #0d4f49, #0f766e); border: 1px solid rgba(212,168,23,0.25)"
	>
		<p class="text-3xl md:text-5xl lg:text-6xl text-white text-center leading-relaxed font-medium">
			{clue}
		</p>
	</div>
</div>
