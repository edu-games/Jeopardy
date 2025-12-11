<script lang="ts">
    let { status }: { status: "connected" | "connecting" | "disconnected" } =
        $props();
</script>

<div class="flex items-center justify-center gap-2 mb-2">
    {#if status === "connected"}
        <div
            class="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-400 animate-pulse"
            title="Connected"
        ></div>
        <span class="text-xs text-green-300/80">Live</span>
    {:else if status === "connecting"}
        <div
            class="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-400 animate-pulse"
            title="Connecting"
        ></div>
        <span class="text-xs text-yellow-300/80">Connecting...</span>
    {:else}
        <div
            class="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-400 animate-pulse"
            title="Disconnected"
        ></div>
        <span class="text-xs text-red-300/80">Reconnecting...</span>
    {/if}
</div>
