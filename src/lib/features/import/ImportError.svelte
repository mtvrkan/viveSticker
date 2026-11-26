<script lang="ts">
	import type { ImportErrorReason } from '#lib/core/types.ts';
	import { t } from '#lib/i18n/index.svelte.ts';

	let { reason, onretry }: { reason: ImportErrorReason; onretry: () => void } = $props();
</script>

<div
	role="alert"
	class="flex flex-col items-start gap-4 rounded-lg border border-destructive/30 bg-destructive-soft p-5 sm:p-6"
>
	<div class="flex items-start gap-3">
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			class="mt-0.5 size-6 shrink-0 text-destructive"
			fill="none"
			stroke="currentColor"
			stroke-width="1.8"
			stroke-linecap="round"
		>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 7.5v5.5M12 16.5h.01" />
		</svg>
		<div class="flex flex-col gap-1">
			<p class="font-semibold">{t('errorTitle')}</p>
			<p class="text-sm">{t(`error.${reason}`)}</p>
		</div>
	</div>
	<button
		type="button"
		onclick={onretry}
		class="min-h-11 rounded-md bg-foreground px-5 font-semibold text-background transition-opacity duration-(--duration-fast) hover:opacity-90"
	>
		{t('errorRetry')}
	</button>
</div>
