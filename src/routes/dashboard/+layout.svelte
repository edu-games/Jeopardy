<script lang="ts">
	import type { LayoutData } from './$types';

	let { data }: { data: LayoutData } = $props();

	let mobileMenuOpen = $state(false);

	const navigationItems = [
		{ name: 'Dashboard', href: '/dashboard' },
		{ name: 'Questions', href: '/dashboard/questions' },
		{ name: 'Boards', href: '/dashboard/boards' },
		{ name: 'Games', href: '/dashboard/games' }
	];

	async function handleLogout() {
		const response = await fetch('/api/auth/logout', {
			method: 'POST'
		});
		if (response.ok) {
			window.location.href = '/';
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Navigation -->
	<nav class="sticky top-0 z-50 bg-white border-b border-gray-100">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-14">
				<div class="flex items-center">
					<a href="/dashboard" class="text-lg font-black text-gray-900 tracking-tight">
						Classroom Jeopardy<span class="text-amber-500">!</span>
					</a>

					<!-- Desktop Navigation -->
					<div class="hidden md:ml-8 md:flex md:items-center md:space-x-0.5">
						{#each navigationItems as item}
							<a
								href={item.href}
								class="px-3 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
							>
								{item.name}
							</a>
						{/each}
					</div>
				</div>

				<!-- User Menu -->
				<div class="flex items-center gap-3">
					<div class="hidden sm:flex items-center gap-2.5">
						<div
							class="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs"
							style="background: #f59e0b"
						>
							{data.instructor.name.charAt(0).toUpperCase()}
						</div>
						<span class="text-sm font-medium text-gray-600">
							{data.instructor.name}
						</span>
					</div>
					<button
						onclick={handleLogout}
						class="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
					>
						Logout
					</button>

					<!-- Mobile menu button -->
					<button
						type="button"
						class="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
						onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
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
			</div>
		</div>

		<!-- Mobile Navigation -->
		{#if mobileMenuOpen}
			<div class="md:hidden border-t border-gray-100 bg-white">
				<div class="px-3 pt-2 pb-3 space-y-0.5">
					<div class="sm:hidden px-3 py-2 flex items-center gap-2.5 mb-2 border-b border-gray-100">
						<div
							class="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs"
							style="background: #f59e0b"
						>
							{data.instructor.name.charAt(0).toUpperCase()}
						</div>
						<span class="text-sm font-medium text-gray-700">{data.instructor.name}</span>
					</div>
					{#each navigationItems as item}
						<a
							href={item.href}
							class="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
						>
							{item.name}
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</nav>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<slot />
	</main>
</div>
