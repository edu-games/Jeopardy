<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const totalQuestions = $derived.by(() => {
		const raw = data.game.gameState?.answeredSlots;
		if (!raw) return 0;
		if (Array.isArray(raw)) return raw.length;
		try {
			const parsed = JSON.parse(raw as unknown as string);
			return Array.isArray(parsed) ? parsed.length : 0;
		} catch {
			return 0;
		}
	});
	const totalStudents = $derived(data.game.students.length);
	const sortedTeams = $derived([...data.game.teams].sort((a, b) => b.score - a.score));
	const winningTeam = $derived(sortedTeams[0]);

	function studentsForTeam(teamId: string) {
		return data.game.students.filter((s) => s.team?.id === teamId);
	}

	function formatDate(d: string | Date | null | undefined) {
		if (!d) return '';
		try {
			return new Date(d).toLocaleDateString('en-US', {
				month: 'long',
				day: 'numeric',
				year: 'numeric'
			});
		} catch {
			return '';
		}
	}
</script>

<div>
	<!-- Header -->
	<div style="margin-bottom: 28px">
		<a
			href="/dashboard/games"
			class="inline-flex items-center hover:opacity-70 transition-opacity"
			style="gap: 5px; font-size: 12px; color: var(--muted); margin-bottom: 10px"
		>
			<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M15 18l-6-6 6-6" />
			</svg>
			Back to Games
		</a>
		<h1 class="font-serif-display" style="font-size: 28px; color: var(--ink); line-height: 1.1">
			Game Results
		</h1>
		<p style="font-size: 13px; color: var(--muted); margin-top: 2px">
			{data.game.board.name}{data.game.createdAt ? ` — ${formatDate(data.game.createdAt)}` : ''}
		</p>
	</div>

	<!-- Winner banner -->
	{#if winningTeam}
		<div
			class="flex items-center"
			style="border-radius: 14px; padding: 28px 32px; margin-bottom: 24px; gap: 20px; background: linear-gradient(135deg, #d4a817, #b8891e); box-shadow: 0 8px 32px rgba(212,168,23,0.25)"
		>
			<div style="font-size: 56px">🏆</div>
			<div class="flex-1">
				<span
					class="block font-semibold uppercase"
					style="font-size: 10px; letter-spacing: 0.2em; color: rgba(255,255,255,0.6); margin-bottom: 4px"
				>
					Winner
				</span>
				<h2
					class="font-serif-display"
					style="font-size: 30px; color: #fff; line-height: 1"
				>
					{winningTeam.name}
				</h2>
			</div>
			<div class="text-right">
				<div
					class="font-serif-display mono-nums"
					style="font-size: 44px; color: #fff; line-height: 1"
				>
					${winningTeam.score.toLocaleString()}
				</div>
				<p
					style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 3px"
				>
					Final Score
				</p>
			</div>
		</div>
	{/if}

	<!-- Stats -->
	<div class="grid grid-cols-3" style="gap: 10px; margin-bottom: 24px">
		{#each [{ l: 'Questions Answered', v: totalQuestions }, { l: 'Total Students', v: totalStudents }, { l: 'Teams', v: data.game.teams.length }] as s}
			<div
				class="flex items-center"
				style="background: var(--surface); border: 1px solid var(--rule); border-radius: 10px; box-shadow: 0 1px 2px rgba(15,23,42,.04); padding: 18px; gap: 12px"
			>
				<div
					class="font-serif-display mono-nums"
					style="font-size: 32px; color: var(--ink); line-height: 1"
				>
					{s.v}
				</div>
				<span
					class="font-semibold uppercase"
					style="font-size: 10px; letter-spacing: 0.12em; color: var(--muted)"
				>
					{s.l}
				</span>
			</div>
		{/each}
	</div>

	<!-- Final rankings -->
	<div
		style="background: var(--surface); border: 1px solid var(--rule); border-radius: 10px; box-shadow: 0 1px 2px rgba(15,23,42,.04); overflow: hidden; margin-bottom: 20px"
	>
		<div
			style="padding: 12px 20px; border-bottom: 1px solid var(--rule); background: var(--bg)"
		>
			<h2
				class="font-serif-display"
				style="font-size: 17px; color: var(--ink)"
			>
				Final Rankings
			</h2>
		</div>
		<div class="flex flex-col" style="padding: 12px 16px; gap: 8px">
			{#each sortedTeams as team, i}
				{@const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
				{@const students = studentsForTeam(team.id)}
				<div
					style="padding: 16px 18px; border-radius: 10px; border: 1.5px solid {team.color}30; background: {team.color}08"
				>
					<div class="flex items-center justify-between" style="margin-bottom: 10px">
						<div class="flex items-center" style="gap: 12px">
							<div
								class="flex items-center justify-center shrink-0 text-white"
								style="width: 44px; height: 44px; border-radius: 50%; background: {team.color}; font-size: 20px"
							>
								{medal}
							</div>
							<div>
								<p
									class="font-serif-display"
									style="font-size: 18px; color: var(--ink); line-height: 1.1"
								>
									{team.name}
								</p>
								<span
									class="font-semibold uppercase"
									style="font-size: 10px; letter-spacing: 0.12em; color: var(--muted)"
								>
									{students.length} student{students.length === 1 ? '' : 's'}
								</span>
							</div>
						</div>
						<div
							class="font-serif-display mono-nums"
							style="font-size: 30px; color: var(--ink); line-height: 1"
						>
							${team.score.toLocaleString()}
						</div>
					</div>
					{#if students.length > 0}
						<div
							class="flex flex-wrap"
							style="padding-top: 10px; border-top: 1px solid {team.color}20; gap: 5px"
						>
							{#each students as student}
								<span
									class="font-medium"
									style="padding: 3px 10px; border-radius: 99px; font-size: 11px; background: {team.color}15; color: var(--ink-3)"
								>
									{student.name}
								</span>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Actions -->
	<div class="flex" style="gap: 8px">
		<a
			href="/dashboard/games"
			class="font-semibold rounded-lg transition-colors"
			style="padding: 7px 16px; font-size: 13px; border: 1px solid var(--rule); color: var(--ink-3); background: transparent"
		>
			← Back to Games
		</a>
		<a
			href="/dashboard/games/{data.game.id}/play"
			class="font-semibold rounded-lg transition-colors hover:brightness-110"
			style="padding: 7px 16px; font-size: 13px; background: var(--accent); color: #fff"
		>
			View Board
		</a>
	</div>
</div>
