<script lang="ts">
	import { onMount } from 'svelte';
	import { asset } from '$app/paths';
	import { lock, passphrase, unlockWithProbe } from '$lib/stores/unlock';

	import Quiz from '$lib/components/Quiz.svelte';
	import KSBCheck from '$lib/components/KSBCheck.svelte';

	type View = 'home' | 'quiz' | 'ksbs';

	let input = '';
	let busy = false;
	let error = '';
	let view: View = 'home';

	function setView(next: View) {
		view = next;

		if (typeof window === 'undefined') return;

		if (next === 'home') {
			const cleanUrl = `${window.location.pathname}${window.location.search}`;
			window.history.replaceState({}, '', cleanUrl);
		} else {
			window.location.hash = next;
		}
	}

	function syncViewFromHash() {
		if (typeof window === 'undefined') return;

		const hash = window.location.hash.replace('#', '');

		if (hash === 'quiz' || hash === 'ksbs') {
			view = hash;
		} else {
			view = 'home';
		}
	}

	onMount(() => {
		syncViewFromHash();
		window.addEventListener('hashchange', syncViewFromHash);

		return () => {
			window.removeEventListener('hashchange', syncViewFromHash);
		};
	});

	async function submitPasscode() {
		error = '';
		busy = true;

		try {
			await unlockWithProbe(input, asset('/encrypted/probe.enc.json'));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Incorrect passcode';
		} finally {
			busy = false;
		}
	}
</script>

{#if $passphrase && view === 'quiz'}
	<div class="app-shell">
		<div class="topbar">
			<div class="nav-group">
				<button
					type="button"
					class:active={view === 'home'}
					class="nav-button"
					on:click={() => setView('home')}
				>
					Home
				</button>
				<button
					type="button"
					class:active={view === 'ksbs'}
					class="nav-button"
					on:click={() => setView('ksbs')}
				>
					KSBs
				</button>
				<button
					type="button"
					class:active={view === 'quiz'}
					class="nav-button"
					on:click={() => setView('quiz')}
				>
					Quiz
				</button>
			</div>

			<button type="button" class="text-button" on:click={lock}>Lock</button>
		</div>

		<Quiz />
	</div>
{:else if $passphrase && view === 'ksbs'}
	<div class="app-shell">
		<div class="topbar">
			<div class="nav-group">
				<button
					type="button"
					class:active={view === 'home'}
					class="nav-button"
					on:click={() => setView('home')}
				>
					Home
				</button>
				<button
					type="button"
					class:active={view === 'ksbs'}
					class="nav-button"
					on:click={() => setView('ksbs')}
				>
					KSBs
				</button>
				<button
					type="button"
					class:active={view === 'quiz'}
					class="nav-button"
					on:click={() => setView('quiz')}
				>
					Quiz
				</button>
			</div>

			<button type="button" class="text-button" on:click={lock}>Lock</button>
		</div>

		<KSBCheck />
	</div>
{:else}
	<div class="landing">
		<div class="card">
			<h1>AI for Business Value</h1>

			<p class="intro">
				A focused way to revise and self-assess the Knowledge, Skills and Behaviours required for
				the apprenticeship.
			</p>

			{#if !$passphrase}
				<form class="unlock" on:submit|preventDefault={submitPasscode}>
					<label for="passcode">Passcode</label>
					<input
						id="passcode"
						type="password"
						bind:value={input}
						placeholder="Enter passcode"
						autocomplete="current-password"
					/>

					{#if error}
						<p class="error">{error}</p>
					{/if}

					<button class="primary" type="submit" disabled={busy}>
						{busy ? 'Unlocking…' : 'Unlock'}
					</button>
				</form>
			{:else}
				<div class="actions">
					<button class="primary" type="button" on:click={() => setView('ksbs')}>Revise KSBs</button
					>
					<button class="secondary" type="button" on:click={() => setView('quiz')}>AIBV quiz</button
					>
				</div>

				<div class="minor-actions">
					<button class="text-button" type="button" on:click={lock}>Lock</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	:global(body) {
		margin: 0;
		background: #f9fafb;
		font-family: system-ui, sans-serif;
	}

	.app-shell {
		min-height: 100vh;
		padding: 1rem;
		box-sizing: border-box;
	}

	.topbar {
		max-width: 980px;
		margin: 0 auto 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.nav-group {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.nav-button {
		background: white;
		color: #111827;
		border: 1px solid #d1d5db;
		border-radius: 999px;
		padding: 0.55rem 0.95rem;
		font-size: 0.9rem;
		cursor: pointer;
		transition:
			background 0.15s ease,
			border-color 0.15s ease,
			color 0.15s ease;
	}

	.nav-button:hover {
		background: #f3f4f6;
	}

	.nav-button.active {
		background: #111827;
		color: white;
		border-color: #111827;
	}

	.landing {
		min-height: calc(100vh - 2rem);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: #f9fafb;
	}

	.card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 14px;
		padding: 2rem 2.25rem;
		max-width: 520px;
		width: 100%;
		text-align: center;
		box-sizing: border-box;
	}

	h1 {
		margin: 0 0 0.75rem;
		font-size: 1.75rem;
		color: #111827;
	}

	.intro {
		margin: 0 0 2rem;
		color: #374151;
		line-height: 1.6;
		font-size: 0.95rem;
	}

	.unlock {
		display: grid;
		gap: 0.75rem;
		text-align: left;
	}

	.unlock label {
		font-size: 0.9rem;
		font-weight: 600;
		color: #111827;
	}

	.unlock input {
		width: 100%;
		border: 1px solid #d1d5db;
		border-radius: 10px;
		padding: 0.7rem 0.85rem;
		font-size: 0.95rem;
		box-sizing: border-box;
	}

	.error {
		margin: 0;
		font-size: 0.9rem;
		color: #b91c1c;
	}

	.actions {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.minor-actions {
		margin-top: 0.9rem;
	}

	button {
		border-radius: 10px;
		padding: 0.65rem 1.25rem;
		font-size: 0.95rem;
		cursor: pointer;
		border: 1px solid transparent;
		transition:
			background 0.15s ease,
			border-color 0.15s ease,
			transform 0.05s ease;
	}

	button:active {
		transform: translateY(1px);
	}

	.primary {
		background: #111827;
		color: white;
		border-color: #111827;
	}

	.primary:hover {
		background: #1f2937;
	}

	.secondary {
		background: #f9fafb;
		color: #111827;
		border-color: #d1d5db;
	}

	.secondary:hover {
		background: #f3f4f6;
	}

	.text-button {
		background: transparent;
		color: #6b7280;
		border-color: transparent;
		padding: 0.35rem 0.5rem;
	}

	.text-button:hover {
		color: #111827;
		background: #f3f4f6;
	}

	@media (max-width: 640px) {
		.topbar {
			align-items: stretch;
		}

		.nav-group {
			width: 100%;
		}

		.nav-button {
			flex: 1 1 auto;
			text-align: center;
		}
	}

	@media (max-width: 480px) {
		.card {
			padding: 1.75rem 1.5rem;
		}

		h1 {
			font-size: 1.5rem;
		}

		.actions {
			flex-direction: column;
		}

		.actions button {
			width: 100%;
		}

		.text-button {
			width: auto;
		}
	}
</style>
