<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import LocaleSwitch from './LocaleSwitch.svelte';
	import { t } from '#lib/i18n/index.svelte.ts';

	let { children }: { children: Snippet } = $props();
</script>

<div class="flex min-h-dvh flex-col">
	<header class="sticky top-0 z-20 border-b bg-background/90 backdrop-blur-sm pt-[env(safe-area-inset-top)]">
		<div class="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-4 px-4">
			<a href={resolve('/')} class="flex min-h-11 items-center gap-2 rounded-sm font-semibold tracking-tight">
				<svg aria-hidden="true" viewBox="0 0 64 64" class="size-7">
					<path
						d="M58 38 38 58H24a18 18 0 0 1-18-18V24A18 18 0 0 1 24 6h16a18 18 0 0 1 18 18z"
						fill="var(--color-primary)"
					/>
					<path d="M58 38H44a6 6 0 0 0-6 6v14z" fill="var(--color-brand-tint)" />
					<path
						d="M22 24l10 18 10-18"
						fill="none"
						stroke="var(--color-primary-foreground)"
						stroke-width="5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<span class="text-lg">viveSticker</span>
			</a>
			<LocaleSwitch />
		</div>
	</header>

	<main class="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
		{@render children()}
	</main>

	<footer class="border-t pb-[env(safe-area-inset-bottom)]">
		<p class="mx-auto max-w-3xl px-4 py-5 text-sm text-muted-foreground">{t('privacyNote')}</p>
	</footer>
</div>
