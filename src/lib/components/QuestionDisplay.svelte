<script lang="ts">
    let {
        categoryName,
        points,
        isDailyDouble,
        clue,
    }: {
        categoryName: string;
        points: number;
        isDailyDouble: boolean;
        clue: string;
    } = $props();
</script>

<div
    class="flex-1 bg-blue-800 rounded-xl md:rounded-2xl p-6 md:p-10 lg:p-12 shadow-2xl flex flex-col justify-center"
>
    <div class="text-center mb-6 md:mb-8">
        <div
            class="text-yellow-400 font-semibold text-xl md:text-2xl lg:text-3xl mb-2"
        >
            {categoryName}
        </div>
        <div
            class="text-4xl md:text-5xl lg:text-6xl font-bold text-yellow-400"
        >
            ${points}
        </div>
        {#if isDailyDouble}
            <div
                class="mt-3 md:mt-4 inline-block px-4 md:px-6 py-2 md:py-3 bg-yellow-500 text-blue-900 rounded-full text-lg md:text-xl lg:text-2xl font-bold"
            >
                DAILY DOUBLE
            </div>
        {/if}
    </div>

    <!-- Clue Display -->
    <div
        class="bg-blue-700 rounded-lg md:rounded-xl p-6 md:p-10 lg:p-12 flex items-center justify-center flex-1"
    >
        <p
            class="text-4xl md:text-6xl lg:text-7xl text-white text-center leading-relaxed"
        >
            {clue}
        </p>
    </div>
</div>
