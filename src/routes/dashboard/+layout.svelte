<script lang="ts">
	import type { LayoutData } from './$types';

	export let data: LayoutData;

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

<div class="min-h-screen bg-gray-100">
	<!-- Navigation -->
	<nav class="bg-blue-700 text-white shadow-lg">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex">
					<!-- Logo -->
					<div class="flex-shrink-0 flex items-center">
						<a href="/dashboard" class="text-xl font-bold">Classroom Jeopardy</a>
					</div>

					<!-- Desktop Navigation -->
					<div class="hidden md:ml-8 md:flex md:space-x-4">
						{#each navigationItems as item}
							<a
								href={item.href}
								class="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-800 transition-colors flex items-center"
							>
								{item.name}
							</a>
						{/each}
					</div>
				</div>

				<!-- User Menu -->
				<div class="flex items-center space-x-4">
					<span class="text-sm hidden sm:block">
						{data.instructor.name}
					</span>
					<button
						onclick={handleLogout}
						class="px-4 py-2 bg-blue-800 rounded-md text-sm font-medium hover:bg-blue-900 transition-colors"
					>
						Logout
					</button>

					<!-- Mobile menu button -->
					<button
						type="button"
						class="md:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-blue-800"
						onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					>
						<svg
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
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
			<div class="md:hidden">
				<div class="px-2 pt-2 pb-3 space-y-1">
					{#each navigationItems as item}
						<a
							href={item.href}
							class="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800"
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
