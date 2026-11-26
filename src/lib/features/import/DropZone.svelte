<script lang="ts">
	import { t } from '#lib/i18n/index.svelte.ts';

	let { onfile, onurl }: { onfile: (blob: Blob, name: string) => void; onurl: (url: string) => void } =
		$props();

	let dragging = $state(false);
	let url = $state('');
	let input: HTMLInputElement;

	const accept = 'image/*,video/mp4,video/quicktime,video/webm,.heic,.heif,.mov,.apng';

	function takeFirst(files: FileList | null | undefined) {
		const file = files?.[0];
		if (file) onfile(file, file.name);
	}

	function submitUrl(event: SubmitEvent) {
		event.preventDefault();
		if (url.trim()) onurl(url.trim());
	}
</script>

<div class="flex flex-col gap-4">
	<div
		role="presentation"
		ondragenter={(event) => {
			event.preventDefault();
			dragging = true;
		}}
		ondragover={(event) => event.preventDefault()}
		ondragleave={(event) => {
			if (!event.currentTarget.contains(event.relatedTarget as Node | null)) dragging = false;
		}}
		ondrop={(event) => {
			event.preventDefault();
			dragging = false;
			takeFirst(event.dataTransfer?.files);
		}}
		class="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors duration-(--duration-base) ease-(--ease-enter)
			{dragging ? 'border-primary bg-secondary' : 'border-input bg-card'}"
	>
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			class="size-10 text-primary"
			fill="none"
			stroke="currentColor"
			stroke-width="1.6"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5" />
			<path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
		</svg>
		<div class="flex flex-col gap-1">
			<p class="text-lg font-semibold">{dragging ? t('importDropActive') : t('importDropHeadline')}</p>
			<p class="text-sm text-muted-foreground">{t('importPasteHint')}</p>
		</div>
		<button
			type="button"
			onclick={() => input.click()}
			class="min-h-11 rounded-md bg-primary px-5 font-semibold text-primary-foreground transition-colors duration-(--duration-fast) hover:bg-primary-hover"
		>
			{t('importPick')}
		</button>
		<input
			bind:this={input}
			type="file"
			{accept}
			class="sr-only"
			tabindex="-1"
			aria-hidden="true"
			onchange={(event) => takeFirst(event.currentTarget.files)}
		/>
		<p class="tabular text-xs text-muted-foreground">{t('importFormats')}</p>
	</div>

	<form onsubmit={submitUrl} class="flex flex-col gap-2">
		<label for="import-url" class="text-sm font-medium">{t('importUrlLabel')}</label>
		<div class="flex gap-2">
			<input
				id="import-url"
				type="url"
				inputmode="url"
				autocomplete="off"
				placeholder={t('importUrlPlaceholder')}
				bind:value={url}
				class="min-h-11 min-w-0 flex-1 rounded-md border border-input bg-card px-3 text-base"
			/>
			<button
				type="submit"
				disabled={!url.trim()}
				class="min-h-11 rounded-md border border-input bg-card px-4 font-semibold transition-colors duration-(--duration-fast) hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
			>
				{t('importUrlSubmit')}
			</button>
		</div>
		<p class="text-sm text-muted-foreground">{t('importXHint')}</p>
	</form>
</div>
