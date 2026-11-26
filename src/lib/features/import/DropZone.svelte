<script lang="ts">
	import { t } from '#lib/i18n/index.svelte.ts';
	import { parseHttpUrl } from './classify.ts';

	let { onfile, onurl }: { onfile: (blob: Blob, name: string) => void; onurl: (url: string) => void } =
		$props();

	let dragging = $state(false);
	let linkOpen = $state(false);
	let pasteEmpty = $state(false);
	let url = $state('');
	let input: HTMLInputElement;
	let urlInput: HTMLInputElement | undefined = $state();

	const accept = 'image/*,video/mp4,video/quicktime,video/webm,.heic,.heif,.mov,.apng';
	const ghostButton =
		'flex min-h-13 items-center justify-center gap-2 rounded-md bg-foreground/20 px-3 font-semibold text-primary-foreground transition-colors duration-(--duration-fast) hover:bg-foreground/30';

	function takeFirst(files: FileList | null | undefined) {
		const file = files?.[0];
		if (file) onfile(file, file.name);
	}

	function submitUrl(event: SubmitEvent) {
		event.preventDefault();
		if (url.trim()) onurl(url.trim());
	}

	async function toggleLink() {
		linkOpen = !linkOpen;
		pasteEmpty = false;
		if (linkOpen) {
			await Promise.resolve();
			urlInput?.focus();
		}
	}

	async function paste() {
		pasteEmpty = false;
		try {
			const items = await navigator.clipboard.read();
			for (const item of items) {
				const type = item.types.find((value) => value.startsWith('image/') || value.startsWith('video/'));
				if (!type) continue;
				const blob = await item.getType(type);
				onfile(blob, `clipboard.${type.split('/')[1] ?? 'png'}`);
				return;
			}
			for (const item of items) {
				if (!item.types.includes('text/plain')) continue;
				const text = (await (await item.getType('text/plain')).text()).trim();
				if (!parseHttpUrl(text)) continue;
				onurl(text);
				return;
			}
			pasteEmpty = true;
		} catch {
			pasteEmpty = true;
		}
	}
</script>

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
	class="relative flex flex-col gap-5 overflow-hidden rounded-xl bg-brand p-6 shadow-float transition-[box-shadow] duration-(--duration-base) sm:p-8 lg:min-h-136 lg:justify-end
		{dragging ? 'ring-4 ring-brand-tint ring-offset-2 ring-offset-background' : ''}"
>
	<div
		aria-hidden="true"
		class="flex size-14 items-center justify-center rounded-md bg-foreground/20 lg:absolute lg:top-8 lg:left-8 lg:size-20 lg:rounded-lg"
	>
		<svg
			viewBox="0 0 24 24"
			class="size-7 lg:size-10"
			fill="none"
			stroke="currentColor"
			stroke-width="1.8"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M12 5v14M5 12h14" />
		</svg>
	</div>
	<div class="flex flex-col gap-2">
		<h1 id="import-title" class="text-3xl font-bold tracking-tight sm:text-4xl">
			{dragging ? t('importDropActive') : t('importTitle')}
		</h1>
		<p class="max-w-[34ch] text-base">{t('importDescription')}</p>
	</div>
	<div class="grid grid-cols-2 gap-2 lg:grid-cols-1">
		<button
			id="import-pick"
			type="button"
			onclick={() => input.click()}
			class="col-span-2 lg:col-span-1 flex min-h-13 items-center justify-center gap-2 rounded-md bg-card px-3 font-semibold text-secondary-foreground shadow-soft transition-transform duration-(--duration-fast) active:scale-98"
		>
			<svg
				aria-hidden="true"
				viewBox="0 0 24 24"
				class="size-5 shrink-0"
				fill="none"
				stroke="currentColor"
				stroke-width="1.9"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M12 15V3M7 8l5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
			</svg>
			{t('importPick')}
		</button>
		<button
			type="button"
			aria-expanded={linkOpen}
			aria-controls="import-link"
			onclick={toggleLink}
			class={ghostButton}
		>
			<svg
				aria-hidden="true"
				viewBox="0 0 24 24"
				class="size-5 shrink-0"
				fill="none"
				stroke="currentColor"
				stroke-width="1.9"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path
					d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"
				/>
			</svg>
			{t('importLink')}
		</button>
		<button type="button" onclick={paste} class={ghostButton}>
			<svg
				aria-hidden="true"
				viewBox="0 0 24 24"
				class="size-5 shrink-0"
				fill="none"
				stroke="currentColor"
				stroke-width="1.9"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<rect x="6" y="4" width="12" height="17" rx="2.5" />
				<path d="M9 4.5V3h6v1.5M9.5 11h5M9.5 15h5" />
			</svg>
			{t('importPaste')}
		</button>
	</div>
	<input
		bind:this={input}
		type="file"
		{accept}
		class="sr-only"
		tabindex="-1"
		aria-hidden="true"
		onchange={(event) => takeFirst(event.currentTarget.files)}
	/>
	{#if pasteEmpty}
		<p role="status" class="rounded-sm bg-foreground/25 px-3 py-2 text-sm">{t('importPasteEmpty')}</p>
	{/if}
	{#if linkOpen}
		<form id="import-link" onsubmit={submitUrl} class="flex flex-col gap-2">
			<label for="import-url" class="text-sm font-semibold">{t('importUrlLabel')}</label>
			<div class="flex gap-2">
				<input
					bind:this={urlInput}
					id="import-url"
					type="url"
					inputmode="url"
					autocomplete="off"
					placeholder={t('importUrlPlaceholder')}
					bind:value={url}
					class="min-h-12 min-w-0 flex-1 rounded-md border-0 bg-card px-4 text-base text-foreground"
				/>
				<button
					type="submit"
					disabled={!url.trim()}
					class="min-h-12 rounded-md bg-foreground px-5 font-semibold text-background transition-opacity duration-(--duration-fast) disabled:cursor-not-allowed disabled:opacity-60"
				>
					{t('importUrlSubmit')}
				</button>
			</div>
			<p class="text-sm">{t('importXHint')}</p>
		</form>
	{/if}
	<p class="tabular text-xs">{t('importFormats')}</p>
</div>
