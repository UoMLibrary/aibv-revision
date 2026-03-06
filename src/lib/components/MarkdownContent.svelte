<script lang="ts">
	import { marked } from 'marked';

	export let markdown: string = '';
</script>

<section class="markdown">
	{@html marked.parse(markdown)}
</section>

<style>
	.markdown {
		background: #f9fafb;
		border-radius: 8px;
		padding: 1rem;
		margin-top: 1rem;
		line-height: 1.65;
	}

	/* Paragraph spacing */
	.markdown :global(p) {
		margin: 0.75rem 0 1rem;
	}

	/* Headings */
	.markdown :global(h1),
	.markdown :global(h2),
	.markdown :global(h3),
	.markdown :global(h4) {
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		line-height: 1.3;
	}

	/* Lists */
	.markdown :global(ul),
	.markdown :global(ol) {
		margin: 0.75rem 0 1rem;
		padding-left: 1.5rem;
	}

	.markdown :global(li) {
		margin-bottom: 0.5rem;
	}

	/* Horizontal rules */
	.markdown :global(hr) {
		margin: 2rem 0;
		border: none;
		border-top: 1px solid #e5e7eb;
	}

	/* Images */
	.markdown :global(img) {
		display: block;
		max-width: 100%;
		margin: 1.25rem auto;
		border-radius: 8px;
	}
</style>
