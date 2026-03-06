<script>
	export let label = 'Home';
</script>

<button class="home-button" on:click={() => history.back()} aria-label={label}>
	<svg
		class="icon"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<path d="M3 10.5L12 3l9 7.5" />
		<path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
	</svg>

	<span>{label}</span>
</button>

<style>
	.home-button {
		background: transparent;
		border: none;
		padding: 0;
		margin-bottom: 0.75rem;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.9rem;
		color: #2563eb; /* same blue used elsewhere */
		cursor: pointer;
	}

	.home-button:hover {
		text-decoration: underline;
	}

	.home-button:focus {
		outline: none;
		text-decoration: underline;
	}

	.icon {
		width: 16px;
		height: 16px;
	}
	.home-button {
		color: #6b7280;
	}

	.home-button:hover {
		color: #2563eb;
	}
</style>
