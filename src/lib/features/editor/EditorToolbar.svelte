<script lang="ts">
	import { t } from '#lib/i18n/index.svelte.ts';
	import type { EditorHistory } from './history.svelte.ts';

	let {
		history,
		compare,
		oncompare
	}: { history: EditorHistory; compare: boolean; oncompare: (value: boolean) => void } = $props();

	const iconButton =
		'flex size-11 items-center justify-center rounded-full transition-colors duration-(--duration-fast) hover:bg-muted disabled:opacity-35 disabled:hover:bg-transparent';
</script>

<div class="flex items-center justify-between gap-2">
	<div class="flex rounded-full bg-card shadow-soft">
		<button
			type="button"
			aria-label={t('editorUndo')}
			title={t('editorUndo')}
			disabled={!history.canUndo}
			onclick={() => history.undo()}
			class={iconButton}
		>
			<svg
				aria-hidden="true"
				viewBox="0 0 24 24"
				class="size-5"
				fill="none"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
			</svg>
		</button>
		<button
			type="button"
			aria-label={t('editorRedo')}
			title={t('editorRedo')}
			disabled={!history.canRedo}
			onclick={() => history.redo()}
			class={iconButton}
		>
			<svg
				aria-hidden="true"
				viewBox="0 0 24 24"
				class="size-5"
				fill="none"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="m15 14 5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
			</svg>
		</button>
	</div>
	<button
		type="button"
		aria-pressed={compare}
		onpointerdown={() => oncompare(true)}
		onpointerup={() => oncompare(false)}
		onpointerleave={() => oncompare(false)}
		onpointercancel={() => oncompare(false)}
		onkeydown={(event) => (event.key === ' ' || event.key === 'Enter') && oncompare(true)}
		onkeyup={() => oncompare(false)}
		onblur={() => oncompare(false)}
		oncontextmenu={(event) => event.preventDefault()}
		class="flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold shadow-soft transition-colors duration-(--duration-fast) select-none
			{compare ? 'bg-secondary text-secondary-foreground' : 'bg-card hover:bg-muted'}"
	>
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			class="size-5"
			fill="none"
			stroke="currentColor"
			stroke-width="1.8"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
		</svg>
		{t('editorCompare')}
	</button>
</div>
