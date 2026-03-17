<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { asset } from '$app/paths';
	import { get } from 'svelte/store';

	import BackButton from './BackButton.svelte';
	import { fetchEncryptedJson } from '$lib/crypto/encrypted-json';
	import { passphrase } from '$lib/stores/unlock';

	type QuizQuestion = {
		module: string | number;
		unit: string | number;
		question: string;
		options: string[];
		answer: number;
		feedback: string;
	};

	let allQuestions: QuizQuestion[] = [];
	let quizQuestions: QuizQuestion[] = [];

	let loading = true;
	let loadError = '';

	let started = false;
	let suddenDeath = false;

	let currentIndex = 0;
	let score = 0;
	let selected: number | null = null;
	let showFeedback = false;
	let finished = false;

	onMount(async () => {
		const secret = get(passphrase);

		if (!secret) {
			goto('/');
			return;
		}

		try {
			allQuestions = await fetchEncryptedJson<QuizQuestion[]>(
				asset('/encrypted/combined-quiz.enc.json'),
				secret
			);
		} catch (err) {
			console.error(err);
			loadError = 'Could not unlock quiz data. Go back and enter the passcode again.';
		} finally {
			loading = false;
		}
	});

	function shuffle<T>(array: T[]): T[] {
		return [...array].sort(() => Math.random() - 0.5);
	}

	function startQuiz(count: number | 'sudden' | 'all') {
		suddenDeath = count === 'sudden';

		if (count === 'sudden' || count === 'all') {
			quizQuestions = shuffle(allQuestions);
		} else {
			quizQuestions = shuffle(allQuestions).slice(0, count);
		}

		started = true;
		currentIndex = 0;
		score = 0;
		selected = null;
		showFeedback = false;
		finished = false;
	}

	function selectAnswer(index: number) {
		if (showFeedback) return;

		selected = index;
		showFeedback = true;

		const q = quizQuestions[currentIndex];
		const correct = index === q.answer;

		if (correct) {
			score++;
		}
	}

	function nextQuestion() {
		const q = quizQuestions[currentIndex];
		const gotItWrong = selected !== q.answer;

		if (suddenDeath && gotItWrong) {
			finished = true;
			return;
		}

		showFeedback = false;
		selected = null;
		currentIndex++;

		if (currentIndex >= quizQuestions.length) {
			finished = true;
		}
	}

	function restart() {
		started = false;
	}
</script>

<div class="quiz card">
	<BackButton label="Back to home" />

	{#if loading}
		<p>Loading quiz…</p>
	{:else if loadError}
		<p class="load-error">{loadError}</p>
	{:else if !started}
		<h2>Start a quiz</h2>

		<div class="buttons">
			<button on:click={() => startQuiz(10)}>10 questions</button>
			<button on:click={() => startQuiz(25)}>25 questions</button>
			<button on:click={() => startQuiz(50)}>50 questions</button>
			<button on:click={() => startQuiz('all')}>
				All questions ({allQuestions.length})
			</button>
			<button class="danger" on:click={() => startQuiz('sudden')}>Sudden death</button>
		</div>
	{:else if finished}
		<div class="quiz-finished card">
			<h2>Quiz complete</h2>

			<p class="summary">
				You answered
				<strong>{score}</strong>
				{#if !suddenDeath}
					out of <strong>{quizQuestions.length}</strong>
				{/if}
				questions correctly.
			</p>

			<div class="final-score">
				<span class="label">Final score</span>
				<span class="value">
					{score}
					{#if !suddenDeath}
						/ {quizQuestions.length}
					{/if}
				</span>
			</div>

			<div class="quiz-actions">
				<button on:click={restart}>Back to start</button>
			</div>
		</div>
	{:else if quizQuestions[currentIndex]}
		<div class="question-header">
			<h3>
				Question {currentIndex + 1}
				{#if !suddenDeath}
					/ {quizQuestions.length}
				{/if}
			</h3>

			<div class="score">
				Score {score}
				{#if !suddenDeath}
					/ {quizQuestions.length}
				{/if}
			</div>
		</div>

		<p class="meta">
			Module {quizQuestions[currentIndex].module}, Unit {quizQuestions[currentIndex].unit}
		</p>

		<p class="question">{quizQuestions[currentIndex].question}</p>

		<ul class="options">
			{#each quizQuestions[currentIndex].options as option, i}
				<li>
					<button
						disabled={showFeedback}
						class:selected={selected === i}
						class:correct={showFeedback && i === quizQuestions[currentIndex].answer}
						class:wrong={showFeedback && selected === i && i !== quizQuestions[currentIndex].answer}
						on:click={() => selectAnswer(i)}
					>
						{option}
					</button>
				</li>
			{/each}
		</ul>

		{#if showFeedback}
			<div
				class="answer-feedback {selected === quizQuestions[currentIndex].answer
					? 'correct'
					: 'wrong'}"
			>
				{#if selected === quizQuestions[currentIndex].answer}
					<h4>Correct</h4>
					<p>{quizQuestions[currentIndex].feedback}</p>
				{:else}
					<h4>Incorrect</h4>
					<p>
						<strong>Correct answer:</strong>
						{quizQuestions[currentIndex].options[quizQuestions[currentIndex].answer]}
					</p>
				{/if}
			</div>

			{#if !finished}
				<div class="quiz-actions">
					<button on:click={nextQuestion}>
						{#if suddenDeath && selected !== quizQuestions[currentIndex].answer}
							Finish quiz
						{:else}
							Next question
						{/if}
					</button>
				</div>
			{/if}
		{/if}
	{/if}
</div>

<style>
	.load-error {
		color: #b91c1c;
	}

	.quiz {
		max-width: 760px;
		margin: 2rem auto;
		font-family: system-ui, sans-serif;
	}

	.card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
	}

	h2,
	h3 {
		margin-bottom: 0.75rem;
		line-height: 1.3;
	}

	.meta {
		font-size: 0.8rem;
		color: #6b7280;
		margin-bottom: 0.5rem;
	}

	.question {
		font-size: 1.05rem;
		font-weight: 500;
		margin-bottom: 1.25rem;
		line-height: 1.655;
	}

	.buttons {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 0.75rem;
		margin-top: 1.25rem;
	}

	button {
		background: #111827;
		color: white;
		border: none;
		padding: 0.5rem 0.9rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.9rem;
		transition:
			background 0.15s ease,
			transform 0.05s ease;
	}

	button:hover {
		background: #1f2937;
	}

	button:active {
		transform: translateY(1px);
	}

	.danger {
		background: #b91c1c;
	}

	.danger:hover {
		background: #991b1b;
	}

	.options {
		list-style: none;
		padding: 0;
		margin: 0 0 1rem;
	}

	.options li + li {
		margin-top: 0.5rem;
	}

	.options button {
		width: 100%;
		text-align: left;
		background: #f9fafb;
		color: #111827;
		border: 1px solid #e5e7eb;
		padding: 0.65rem 0.85rem;
		line-height: 1.55;
		white-space: normal;
	}

	.options li + li {
		margin-top: 0.6rem;
	}

	.options button:hover {
		background: #f3f4f6;
	}

	.selected {
		border-color: #9ca3af;
	}

	.correct {
		background: #dcfce7;
		border-color: #22c55e;
		color: #14532d;
	}

	.wrong {
		background: #fee2e2;
		border-color: #ef4444;
		color: #7f1d1d;
	}

	.question-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.score {
		font-size: 0.85rem;
		color: #6b7280;
		white-space: nowrap;
	}

	.answer-feedback {
		margin-top: 1rem;
		padding: 0.9rem 1.1rem;
		border-radius: 10px;
		line-height: 1.5;
	}

	.answer-feedback h4 {
		margin: 0 0 0.25rem;
		font-size: 0.95rem;
		font-weight: 600;
	}

	.answer-feedback.correct {
		background: #dcfce7;
		border: 1px solid #22c55e;
		color: #14532d;
	}

	.answer-feedback.correct h4 {
		color: #166534;
	}

	.answer-feedback.wrong {
		background: #fee2e2;
		border: 1px solid #ef4444;
		color: #7f1d1d;
	}

	.answer-feedback.wrong h4 {
		color: #991b1b;
	}

	.quiz-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 1.25rem;
	}

	.quiz-actions button {
		background: #111827;
	}

	.quiz-finished {
		text-align: center;
	}

	.quiz-finished h2 {
		margin-bottom: 0.5rem;
	}

	.quiz-finished .summary {
		font-size: 0.95rem;
		color: #374151;
		margin-bottom: 1.5rem;
	}

	.final-score {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1rem 1.5rem;
		margin-bottom: 1.5rem;
		border-radius: 12px;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
	}

	.final-score .label {
		font-size: 0.8rem;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.final-score .value {
		font-size: 2rem;
		font-weight: 700;
		color: #111827;
	}

	.quiz-finished .quiz-actions {
		justify-content: center;
	}
</style>
