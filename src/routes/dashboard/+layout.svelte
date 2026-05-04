<script lang="ts">
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';

	let { data }: { data: LayoutData } = $props();

	let mobileMenuOpen = $state(false);

	const navigationItems = [
		{ name: 'Overview', href: '/dashboard', match: (p: string) => p === '/dashboard' },
		{
			name: 'Questions',
			href: '/dashboard/questions',
			match: (p: string) => p.startsWith('/dashboard/questions')
		},
		{
			name: 'Boards',
			href: '/dashboard/boards',
			match: (p: string) => p.startsWith('/dashboard/boards')
		},
		{
			name: 'Games',
			href: '/dashboard/games',
			match: (p: string) => p.startsWith('/dashboard/games')
		}
	];

	async function handleLogout() {
		const response = await fetch('/api/auth/logout', { method: 'POST' });
		if (response.ok) window.location.href = '/';
	}
</script>

<div class="min-h-screen flex" style="background: var(--bg)">
	<!-- Sidebar (desktop) -->
	<aside
		class="hidden md:flex flex-col shrink-0"
		style="width: 224px; background: var(--ink); position: sticky; top: 0; height: 100vh"
	>
		<!-- Logo -->
		<div style="padding: 24px 20px 20px">
			<a
				href="/dashboard"
				class="font-serif-display block leading-none"
				style="font-size: 20px; color: #fff"
			>
				Tile<br /><span style="color: var(--gold)">Trivia</span>
			</a>
			<div
				class="font-medium uppercase"
				style="margin-top: 6px; font-size: 10px; letter-spacing: 0.14em; color: rgba(255,255,255,0.3)"
			>
				Instructor Portal
			</div>
		</div>
		<div style="height: 1px; background: rgba(255,255,255,0.08); margin: 0 20px"></div>

		<!-- Nav -->
		<nav class="flex-1 flex flex-col" style="padding: 12px 10px; gap: 2px">
			{#each navigationItems as item}
				{@const active = item.match($page.url.pathname)}
				<a
					href={item.href}
					class="flex items-center w-full transition-all"
					style="gap: 10px; padding: 8px 10px; border-radius: 7px; background: {active
						? 'rgba(255,255,255,0.1)'
						: 'transparent'}; color: {active ? '#fff' : 'rgba(255,255,255,0.45)'}; font-size: 13px; font-weight: {active
						? '600'
						: '400'}"
				>
					{#if item.name === 'Overview'}
						<svg
							width="15"
							height="15"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						>
							<rect x="3" y="3" width="7" height="7" />
							<rect x="14" y="3" width="7" height="7" />
							<rect x="14" y="14" width="7" height="7" />
							<rect x="3" y="14" width="7" height="7" />
						</svg>
					{:else if item.name === 'Questions'}
						<svg
							width="15"
							height="15"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						>
							<path d="M9 9a3 3 0 1 1 6 0c0 2-3 3-3 3" />
							<path d="M12 17h.01" />
						</svg>
					{:else if item.name === 'Boards'}
						<svg
							width="15"
							height="15"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						>
							<rect x="3" y="3" width="18" height="18" rx="2" />
							<path d="M3 9h18M9 21V9" />
						</svg>
					{:else if item.name === 'Games'}
						<svg
							width="15"
							height="15"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						>
							<polygon points="5 3 19 12 5 21 5 3" />
						</svg>
					{/if}
					<span class="flex-1">{item.name}</span>
				</a>
			{/each}
		</nav>

		<div style="height: 1px; background: rgba(255,255,255,0.08); margin: 0 20px"></div>
		<!-- User -->
		<div class="flex items-center" style="padding: 16px 20px; gap: 10px">
			<div
				class="flex items-center justify-center shrink-0"
				style="width: 30px; height: 30px; border-radius: 50%; background: rgba(212,168,23,0.25)"
			>
				<span style="font-size: 13px; font-weight: 700; color: var(--gold)"
					>{data.instructor.name.charAt(0)}</span
				>
			</div>
			<div class="flex-1 min-w-0">
				<div
					class="truncate"
					style="font-size: 12px; font-weight: 600; color: #fff"
				>
					{data.instructor.name}
				</div>
				<button
					onclick={handleLogout}
					class="hover:underline"
					style="font-size: 11px; color: rgba(255,255,255,0.35); background: none; border: none; padding: 0; cursor: pointer; font-family: inherit"
				>
					Sign out
				</button>
			</div>
		</div>
	</aside>

	<!-- Mobile top bar -->
	<div class="md:hidden fixed top-0 inset-x-0 z-40">
		<div
			class="flex items-center justify-between h-14 px-4"
			style="background: var(--ink)"
		>
			<a
				href="/dashboard"
				class="font-serif-display"
				style="font-size: 18px; color: #fff"
			>
				Tile <span style="color: var(--gold)">Trivia</span>
			</a>
			<button
				type="button"
				class="p-1.5 rounded-lg"
				style="color: rgba(255,255,255,0.7)"
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				aria-label="Toggle menu"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
					/>
				</svg>
			</button>
		</div>
		{#if mobileMenuOpen}
			<div
				style="background: var(--ink); border-top: 1px solid rgba(255,255,255,0.08)"
				class="px-3 pt-2 pb-3 space-y-0.5"
			>
				{#each navigationItems as item}
					<a
						href={item.href}
						class="block px-3 py-2 rounded-lg text-sm font-medium"
						style="color: rgba(255,255,255,0.7)"
					>
						{item.name}
					</a>
				{/each}
				<button
					onclick={handleLogout}
					class="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium"
					style="color: rgba(255,255,255,0.5); background: none; border: none; font-family: inherit"
				>
					Sign out
				</button>
			</div>
		{/if}
	</div>

	<!-- Main Content -->
	<main class="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-8 md:pt-9 pt-20" style="background: var(--bg)">
		<div class="max-w-6xl mx-auto">
			<slot />
		</div>
	</main>
</div>
