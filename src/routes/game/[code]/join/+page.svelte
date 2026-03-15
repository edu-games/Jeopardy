<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let name = $state('');
	let joining = $state(false);
	let error = $state('');
	let success = $state(false);
	let assignedTeam = $state<any>(null);
	let gameId = $state('');

	const gameCode = $page.params.code.toUpperCase();
	const storageKey = `jeopardy_session_${gameCode}`;

	onMount(() => {
		// If we already have a session for this game, go straight back to play
		const saved = localStorage.getItem(storageKey);
		if (saved) {
			try {
				const { studentId } = JSON.parse(saved);
				if (studentId) {
					window.location.href = `/game/${gameCode}/play?studentId=${studentId}`;
					return;
				}
			} catch {
				localStorage.removeItem(storageKey);
			}
		}
	});

	async function joinGame() {
		if (!name.trim()) {
			error = 'Please enter your name';
			return;
		}

		joining = true;
		error = '';

		try {
			const response = await fetch('/api/students/join', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					gameCode,
					name: name.trim()
				})
			});

			if (response.ok) {
				const data = await response.json();
				assignedTeam = data.student.team;
				gameId = data.gameId;
				success = true;

				// Save session so they can reconnect if they close the window
				localStorage.setItem(storageKey, JSON.stringify({ studentId: data.student.id, name: name.trim() }));

				// Auto-redirect to play page after 2 seconds
				setTimeout(() => {
					window.location.href = `/game/${gameCode}/play?studentId=${data.student.id}`;
				}, 2000);
			} else {
				const data = await response.json();
				error = data.message || 'Failed to join game';
			}
		} catch (err) {
			error = 'An error occurred. Please try again.';
		} finally {
			joining = false;
		}
	}
</script>

<div class="min-h-screen flex flex-col select-none"
     style="background: radial-gradient(ellipse at 50% 0%, #1e3a8a 0%, #0f172a 65%)">

    {#if !success}
        <!-- Logo -->
        <div class="text-center pt-14 pb-6 shrink-0">
            <p class="text-white/30 text-[10px] uppercase tracking-[0.4em] mb-2">Welcome to</p>
            <h1 class="text-6xl font-black text-yellow-400 tracking-wider leading-none"
                style="text-shadow: 0 0 60px rgba(250,204,21,0.35)">JEOPARDY!</h1>
        </div>

        <!-- Game code tiles -->
        <div class="text-center mb-10 shrink-0">
            <p class="text-white/30 text-[10px] uppercase tracking-[0.35em] mb-4">Game code</p>
            <div class="flex items-center justify-center gap-2">
                {#each gameCode.split('') as char}
                    <div class="w-12 h-14 rounded-xl flex items-center justify-center"
                         style="background: linear-gradient(160deg, #1e40af, #1e3a8a); border: 1px solid rgba(59,130,246,0.4); box-shadow: 0 4px 20px rgba(30,58,138,0.5)">
                        <span class="text-2xl font-black text-yellow-400">{char}</span>
                    </div>
                {/each}
            </div>
        </div>

        <!-- Form — no card, just content on the background -->
        <div class="flex-1 flex flex-col px-8 max-w-sm mx-auto w-full">
            {#if error}
                <div class="mb-6 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
                    <svg class="w-4 h-4 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    <p class="text-red-400 text-sm">{error}</p>
                </div>
            {/if}

            <form onsubmit={(e) => { e.preventDefault(); joinGame(); }}>
                <p class="text-white/40 text-xs uppercase tracking-widest text-center mb-5">Enter your name to play</p>

                <input
                    type="text"
                    id="name"
                    bind:value={name}
                    disabled={joining}
                    required
                    placeholder="Your name..."
                    autocomplete="off"
                    class="w-full bg-transparent border-b-2 border-white/20 text-white text-2xl font-semibold text-center py-3 mb-8 focus:outline-none focus:border-yellow-400 transition-colors placeholder:text-white/20 disabled:opacity-50"
                />

                <button
                    type="submit"
                    disabled={joining || !name.trim()}
                    class="w-full py-5 font-black text-xl rounded-2xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    style="background: #facc15; color: #172554; box-shadow: 0 8px 32px rgba(250,204,21,0.25)"
                >
                    {#if joining}
                        <span class="flex items-center justify-center gap-2">
                            <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Joining...
                        </span>
                    {:else}
                        BUZZ IN
                    {/if}
                </button>
            </form>
        </div>

    {:else}
        <!-- Success state — team color floods the page -->
        <div class="flex-1 flex flex-col items-center justify-center px-6 text-center"
             style={assignedTeam ? `background: radial-gradient(ellipse at 50% 40%, ${assignedTeam.color}30 0%, transparent 70%)` : ''}>

            <!-- Animated checkmark -->
            <div class="relative mb-6">
                <div class="w-24 h-24 rounded-full flex items-center justify-center"
                     style={assignedTeam ? `background: ${assignedTeam.color}25; border: 2px solid ${assignedTeam.color}60` : 'background: #16a34a25; border: 2px solid #16a34a60'}>
                    <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                         style={assignedTeam ? `color: ${assignedTeam.color}` : 'color: #4ade80'}>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            </div>

            <h1 class="text-4xl font-black text-white mb-1">You're in!</h1>
            <p class="text-white/50 mb-10">Welcome, <span class="text-white font-semibold">{name}</span></p>

            {#if assignedTeam}
                <div class="px-8 py-5 rounded-2xl mb-6 text-center"
                     style={`background: ${assignedTeam.color}20; border: 2px solid ${assignedTeam.color}50`}>
                    <div class="flex items-center justify-center gap-2 mb-1">
                        <div class="w-3 h-3 rounded-full" style={`background: ${assignedTeam.color}`}></div>
                        <p class="text-xl font-black" style={`color: ${assignedTeam.color}`}>{assignedTeam.name}</p>
                    </div>
                    <p class="text-white/40 text-xs uppercase tracking-widest">Your team</p>
                </div>
            {:else}
                <div class="px-6 py-4 rounded-2xl mb-6 bg-yellow-400/10 border border-yellow-400/30">
                    <p class="text-yellow-400 font-bold">Waiting for team assignment</p>
                    <p class="text-white/40 text-sm mt-1">Your instructor will assign you shortly</p>
                </div>
            {/if}

            <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                <p class="text-white/40 text-sm">Heading to the game...</p>
            </div>
        </div>
    {/if}
</div>
