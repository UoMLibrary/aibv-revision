<script lang="ts">
	import { goto } from '$app/navigation';
	import { asset } from '$app/paths';
	import { lock, passphrase, unlockWithProbe } from '$lib/stores/unlock';

	let input = '';
	let busy = false;
	let error = '';

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

<div class="landing">
	<div class="card">
		<h1>AI for Business Value</h1>

		<p class="intro">
			A focused way to revise and self-assess the Knowledge, Skills and Behaviours required for the
			apprenticeship.
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
				<button class="primary" on:click={() => goto(`ksbs`)}>Revise KSBs</button>
				<button class="secondary" on:click={() => goto('quiz')}>AIBV quiz</button>
			</div>

			<div class="minor-actions">
				<button class="text-button" on:click={lock}>Lock</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.landing {
		min-height: calc(100vh - 2rem);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		font-family: system-ui, sans-serif;
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

		button {
			width: 100%;
		}

		.text-button {
			width: auto;
		}
	}
</style>
