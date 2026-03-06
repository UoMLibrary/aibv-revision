<script lang="ts">
	export let ksbs: any[] = [];
	export let progress: Record<string, 0 | 1 | 2> = {};

	export let title = '';
	export let strongColour = '#2563eb'; // for 2
	export let mediumColour = '#93c5fd'; // for 1
	export let zeroColour = '#e5e7eb'; // for 0

	export let filter: (ksb: any) => boolean = () => true;

	$: shortTitle =
		title === 'Knowledge' ? 'K' : title === 'Skills' ? 'S' : title === 'Behaviours' ? 'B' : title;

	// --- derive relevant KSBs ---
	$: relevant = ksbs.filter(filter);

	$: total = relevant.length;

	$: counts = relevant.reduce(
		(acc, ksb) => {
			const value = progress[ksb.ksbCode] ?? 0;
			acc[value]++;
			return acc;
		},
		{ 0: 0, 1: 0, 2: 0 } as Record<0 | 1 | 2, number>
	);

	$: pct = {
		0: total ? (counts[0] / total) * 100 : 0,
		1: total ? (counts[1] / total) * 100 : 0,
		2: total ? (counts[2] / total) * 100 : 0
	};
</script>

{#if total > 0}
	<div class="progress-card">
		<div class="header">
			<strong class="title-full">{title}</strong>
			<!-- <strong class="title-short">{shortTitle}</strong> -->
			<span class="count">{counts[2]} / {total} secure</span>
		</div>

		<div class="bar">
			<div
				class="seg seg-2"
				style="width: {pct[2]}%; background: {strongColour};"
				title="{counts[2]} secure"
			/>
			<div
				class="seg seg-1"
				style="width: {pct[1]}%; background: {mediumColour};"
				title="{counts[1]} some confidence"
			/>
			<div
				class="seg seg-0"
				style="width: {pct[0]}%; background: {zeroColour};"
				title="{counts[0]} not started"
			/>
		</div>
	</div>
{/if}

<style>
	.progress-card {
		border: 1px solid #e5e7eb;
		border-radius: 10px;
		padding: 0.75rem 1rem;
		background: white;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		font-size: 0.9rem;
		margin-bottom: 0.4rem;
		color: #374151;
	}

	.bar {
		display: flex;
		height: 10px;
		border-radius: 999px;
		overflow: hidden;
		background: #e5e7eb;
	}

	.seg {
		height: 100%;
		transition: width 0.3s ease;
	}

	/* --- Responsive tweaks --- */

	/* Medium screens: stack count under full title */
	@media (max-width: 700px) {
		.header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.15rem;
		}

		.count {
			font-size: 0.8rem;
			color: #6b7280;
		}
	}

	/* Small screens */
	@media (max-width: 480px) {
		.progress-card {
			padding: 0.6rem 0.75rem;
		}

		.header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.2rem;
			font-size: 0.8rem;
		}

		.count {
			font-size: x-small;
			color: #6b7280;
		}

		.bar {
			height: 8px;
		}
	}
</style>
