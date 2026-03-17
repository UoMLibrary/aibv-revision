<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { asset } from '$app/paths';
	import { get } from 'svelte/store';

	import ProgressSummary from '$lib/components/ProgressSummary.svelte';
	import MarkdownContent from '$lib/components/MarkdownContent.svelte';

	import { fetchEncryptedJson } from '$lib/crypto/encrypted-json';
	import { passphrase } from '$lib/stores/unlock';

	type KSBType = 'Knowledge' | 'Skill' | 'Behaviour';
	type MethodFilter = 'ALL' | 'AM1' | 'AM2';
	type KSBTypeFilter = 'ALL' | KSBType;
	type NavigationMode = 'random' | 'ordered';
	type Mastery = 0 | 1 | 2;

	type KSBItem = {
		ksbCode: string;
		ksb: string;
		ksbType: KSBType;
		ksbIndex: number;
		method: 'AM1' | 'AM2';
		mlink?: string;
		pass?: string;
		meets?: string;
		distinction?: string;
		evidence?: string[];
		questions?: string[];
		portfolioExample?: string;
		contentReview?: string;
	};

	const WEIGHTS: Record<0 | 1 | 2, number> = {
		0: 5,
		1: 2,
		2: 0.5
	};

	const TYPE_ORDER: KSBType[] = ['Knowledge', 'Skill', 'Behaviour'];

	let data: KSBItem[] = [];

	let loading = true;
	let loadError = '';

	let progress: Record<string, Mastery> = {};
	let confidence: Mastery = 0;

	let selectedMethod: MethodFilter = 'ALL';
	let selectedType: KSBTypeFilter = 'ALL';

	let currentKSB: KSBItem | null = null;
	let showReview = false;

	let navMode: NavigationMode = 'ordered';
	let currentIndex = 0;

	$: filtered = data.filter((d) => {
		const methodOk = selectedMethod === 'ALL' ? true : d.method === selectedMethod;
		const typeOk = selectedType === 'ALL' ? true : d.ksbType === selectedType;
		return methodOk && typeOk;
	});

	$: ordered = [...filtered].sort((a, b) => {
		if (selectedType !== 'ALL') {
			return a.ksbIndex - b.ksbIndex;
		}

		const typeDiff = TYPE_ORDER.indexOf(a.ksbType) - TYPE_ORDER.indexOf(b.ksbType);
		if (typeDiff !== 0) return typeDiff;

		return a.ksbIndex - b.ksbIndex;
	});

	function pickWeightedRandom(ksbs: KSBItem[]) {
		const weightedPool = ksbs.flatMap((ksb) => {
			const value = (progress[ksb.ksbCode] ?? 0) as Mastery;
			const weight = WEIGHTS[value] ?? 1;
			return Array.from({ length: Math.ceil(weight) }, () => ksb);
		});

		if (!weightedPool.length) {
			return ksbs[Math.floor(Math.random() * ksbs.length)];
		}

		return weightedPool[Math.floor(Math.random() * weightedPool.length)];
	}

	function resetAndSelect() {
		currentIndex = 0;
		selectKSB();
	}

	function selectKSB() {
		showReview = false;

		if (!filtered.length) {
			currentKSB = null;
			return;
		}

		if (navMode === 'random') {
			currentKSB = pickWeightedRandom(filtered);
		} else {
			currentKSB = ordered[currentIndex % ordered.length];
		}

		confidence = progress[currentKSB.ksbCode] ?? 0;
	}

	function nextKSB() {
		if (!ordered.length && navMode === 'ordered') return;

		if (navMode === 'ordered') {
			currentIndex = (currentIndex + 1) % ordered.length;
		}

		selectKSB();
	}

	function saveConfidence(value: Mastery) {
		if (!currentKSB) return;

		confidence = value;
		progress[currentKSB.ksbCode] = value;
		localStorage.setItem('ksb-progress', JSON.stringify(progress));
	}

	function headerColour(type: string) {
		switch (type) {
			case 'Knowledge':
				return '#dbeafe';
			case 'Skill':
				return '#dcfce7';
			case 'Behaviour':
				return '#fef3c7';
			default:
				return 'white';
		}
	}

	function hasContent(value?: string) {
		return !!value && value.trim().length > 0;
	}

	onMount(async () => {
		const stored = localStorage.getItem('ksb-progress');
		if (stored) {
			try {
				progress = JSON.parse(stored);
			} catch {
				progress = {};
			}
		}

		const secret = get(passphrase);

		if (!secret) {
			goto('/');
			return;
		}

		try {
			data = await fetchEncryptedJson<KSBItem[]>(asset('/encrypted/ksbs-sorted.enc.json'), secret);

			await tick();
			selectKSB();
		} catch (err) {
			console.error(err);
			loadError = 'Could not unlock KSB data. Please go back and enter the passcode again.';
		} finally {
			loading = false;
		}
	});
</script>

<div class="ksb-check">
	{#if loading}
		<div class="card">
			<p>Loading KSBs…</p>
		</div>
	{:else if loadError}
		<div class="card">
			<p class="load-error">{loadError}</p>
			<div class="actions">
				<button on:click={() => goto('/')}>Back to home</button>
			</div>
		</div>
	{:else}
		<div class="toolbar">
			<div class="filter">
				<label>Assessment</label>
				<select bind:value={selectedMethod} on:change={resetAndSelect}>
					<option value="ALL">All</option>
					<option value="AM1">AM1 - Project</option>
					<option value="AM2">AM2 - Portfolio</option>
				</select>
			</div>

			<div class="filter">
				<label>Type</label>
				<select bind:value={selectedType} on:change={resetAndSelect}>
					<option value="ALL">All</option>
					<option value="Knowledge">Knowledge</option>
					<option value="Skill">Skill</option>
					<option value="Behaviour">Behaviour</option>
				</select>
			</div>

			<div class="filter">
				<label>Study mode</label>
				<select bind:value={navMode} on:change={selectKSB}>
					<option value="ordered">Browse in order</option>
					<option value="random">Random revision</option>
				</select>
			</div>
		</div>

		{#if filtered.length}
			<div class="progress-wrapper">
				<div class="progress-grid">
					<ProgressSummary
						title="Knowledge"
						strongColour="#2563eb"
						mediumColour="#93c5fd"
						{progress}
						ksbs={filtered}
						filter={(k) => k.ksbType === 'Knowledge'}
					/>

					<ProgressSummary
						title="Skills"
						strongColour="#16a34a"
						mediumColour="#86efac"
						{progress}
						ksbs={filtered}
						filter={(k) => k.ksbType === 'Skill'}
					/>

					<ProgressSummary
						title="Behaviours"
						strongColour="#f59e0b"
						mediumColour="#fde68a"
						{progress}
						ksbs={filtered}
						filter={(k) => k.ksbType === 'Behaviour'}
					/>
				</div>
			</div>
		{/if}

		{#if currentKSB}
			<div class="card">
				<header class="card-header" style="background: {headerColour(currentKSB.ksbType)}">
					<div>
						<div class="meta">
							<span class="pill code">{currentKSB.ksbCode}</span>
						</div>

						<h2>{currentKSB.ksb}</h2>
					</div>

					<button class="next-top" on:click={nextKSB}>Next →</button>
				</header>

				<section class="criteria">
					<div class="criteria-header">
						<h3>
							{currentKSB.ksbType} assessment criteria ({currentKSB.method === 'AM1'
								? 'AM1: Project'
								: 'AM2: Portfolio'})
						</h3>

						{#if hasContent(currentKSB.mlink)}
							<a
								class="criteria-link"
								href={currentKSB.mlink}
								target="_blank"
								rel="noopener noreferrer"
							>
								View {currentKSB.ksbCode} on Multiverse ↗
							</a>
						{/if}
					</div>

					{#if hasContent(currentKSB.pass) || hasContent(currentKSB.meets)}
						<div class="criterion">
							<h4>Pass / Meets</h4>

							{#if hasContent(currentKSB.pass)}
								<p>{currentKSB.pass}</p>
							{/if}

							{#if hasContent(currentKSB.meets)}
								<p class="muted">{currentKSB.meets}</p>
							{/if}
						</div>
					{/if}

					{#if hasContent(currentKSB.distinction)}
						<div class="criterion">
							<h4>Distinction</h4>
							<p>{currentKSB.distinction}</p>
						</div>
					{/if}
				</section>

				<section>
					<h3>How secure is this for you right now?</h3>

					<div class="mastery">
						<button
							class="level level-0"
							class:active={confidence === 0}
							on:click={() => saveConfidence(0)}
						>
							Not confident yet
						</button>

						<button
							class="level level-1"
							class:active={confidence === 1}
							on:click={() => saveConfidence(1)}
						>
							Some confidence
						</button>

						<button
							class="level level-2"
							class:active={confidence === 2}
							on:click={() => saveConfidence(2)}
						>
							Confident / secure
						</button>
					</div>
				</section>

				{#if currentKSB.evidence?.length}
					<section class="evidence">
						<h3>Evidence you could use</h3>

						<ul>
							{#each currentKSB.evidence as ev}
								<li>{ev}</li>
							{/each}
						</ul>
					</section>
				{/if}

				<section>
					<h3>Self-check</h3>
					<ol>
						{#each currentKSB.questions ?? [] as q}
							<li>{q}</li>
						{/each}
					</ol>
				</section>

				{#if hasContent(currentKSB.portfolioExample)}
					<section class="portfolio">
						<h3>Portfolio example</h3>
						<MarkdownContent markdown={currentKSB.portfolioExample} />
					</section>
				{/if}

				{#if hasContent(currentKSB.contentReview)}
					<section class="actions">
						<button on:click={() => (showReview = !showReview)}>
							{showReview ? 'Hide revision material' : 'Show revision material'}
						</button>
					</section>

					{#if showReview}
						<MarkdownContent markdown={currentKSB.contentReview} />
					{/if}
				{/if}
			</div>
		{:else}
			<p>No KSBs match this method.</p>
		{/if}
	{/if}
</div>

<style>
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		padding: 0.75rem 1rem;
		border-radius: 10px;
		margin-bottom: 1.25rem;
	}

	.ksb-check {
		max-width: 760px;
		margin: 2rem auto;
		font-family: system-ui, sans-serif;
	}

	.toolbar {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 1.25rem;
	}

	.card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
	}

	header h2 {
		margin: 0.5rem 0 1rem;
	}

	.meta {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
		font-size: 0.85rem;
		color: #6b7280;
	}

	section {
		margin-top: 1.5rem;
	}

	.actions button {
		background: #111827;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		cursor: pointer;
	}

	.mastery {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.mastery .level {
		border: 1px solid #d1d5db;
		background: #f9fafb;
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.9rem;
		color: #374151;
		transition:
			background 0.15s ease,
			border-color 0.15s ease,
			color 0.15s ease;
	}

	.evidence {
		background: #f9fafb;
		border-radius: 8px;
		padding: 0.75rem 1rem;
	}

	.evidence h3 {
		margin-top: 0;
	}

	.evidence ul {
		margin: 0.5rem 0 0;
		padding-left: 1.25rem;
	}

	.evidence li {
		margin-bottom: 0.5rem;
	}

	.mastery .level-0.active {
		background: #fee2e2;
		border-color: #ef4444;
		color: #7f1d1d;
	}

	.mastery .level-1.active {
		background: #e5e7eb;
		border-color: #9ca3af;
		color: #111827;
	}

	.mastery .level-2.active {
		background: #dcfce7;
		border-color: #22c55e;
		color: #14532d;
	}

	.next-top {
		background: #111827;
		color: white;
		border: none;
		padding: 0.4rem 0.8rem;
		border-radius: 8px;
		cursor: pointer;
		white-space: nowrap;
	}

	.progress-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.pill {
		font-size: 1.1rem;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		font-weight: 600;
	}

	.pill.code {
		background: #111827;
		color: white;
	}

	.filter {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.8rem;
		color: #374151;
	}

	.filter select {
		border: 1px solid #d1d5db;
		border-radius: 8px;
		padding: 0.4rem 0.6rem;
		background: white;
		font-size: 0.9rem;
	}

	.criteria-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
	}

	.criteria-header h3 {
		margin: 0;
	}

	.criteria-link {
		font-size: 0.85rem;
		color: #2563eb;
		text-decoration: none;
		white-space: nowrap;
	}

	.criteria-link:hover {
		text-decoration: underline;
	}

	.criteria,
	section {
		line-height: 1.6;
	}

	.criteria {
		line-height: 1.55;
	}

	section ol li {
		margin-bottom: 0.65rem;
	}

	.criteria p,
	section p {
		margin: 0.6rem 0 1rem;
	}

	.criteria h4,
	section h3 {
		margin-top: 1.25rem;
		margin-bottom: 0.5rem;
		line-height: 1.3;
	}

	section ol,
	section ul {
		margin: 0.75rem 0 1rem;
		padding-left: 1.5rem;
	}

	section li {
		margin-bottom: 0.5rem;
		line-height: 1.6;
	}

	.progress-wrapper {
		margin-bottom: 1.75rem;
		padding: 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		background: #f9fafb;
	}

	.progress-wrapper .progress-grid {
		margin-bottom: 0;
	}

	.load-error {
		color: #b91c1c;
	}
</style>
