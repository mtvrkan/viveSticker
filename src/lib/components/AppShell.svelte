<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';
	import LocaleSwitch from './LocaleSwitch.svelte';
	import { t } from '#lib/i18n/index.svelte.ts';

	let { children }: { children: Snippet } = $props();

	const links = $derived([
		{ href: resolve('/'), label: t('navStickers'), current: page.route.id === '/' },
		{ href: resolve('/pack'), label: t('navPacks'), current: page.route.id === '/pack' }
	]);
</script>

<div class="flex min-h-dvh flex-col">
	<header class="sticky top-0 z-30 bg-background pt-[env(safe-area-inset-top)]">
		<div class="mx-auto flex h-16 w-full max-w-6xl items-center gap-2 px-4">
			<a href={resolve('/')} class="flex min-h-11 items-center gap-2 rounded-sm font-bold tracking-tight">
				<svg aria-hidden="true" viewBox="0 0 64 64" class="size-8">
					<defs>
						<linearGradient id="brand-mark" x1="0" y1="0" x2="1" y2="1">
							<stop offset="0" stop-color="#6d4aff" />
							<stop offset="1" stop-color="#2f5bea" />
						</linearGradient>
					</defs>
					<path
						d="M58 38 38 58H24a18 18 0 0 1-18-18V24A18 18 0 0 1 24 6h16a18 18 0 0 1 18 18z"
						fill="url(#brand-mark)"
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
				<span class="hidden text-lg min-[460px]:inline">viveSticker</span>
			</a>
			<nav aria-label={t('navLabel')} class="mx-auto">
				<ul class="flex gap-0.5 rounded-full bg-muted p-1">
					{#each links as link (link.href)}
						<li>
							<a
								href={link.href}
								aria-current={link.current ? 'page' : undefined}
								class="flex min-h-10 items-center rounded-full px-3.5 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors duration-(--duration-fast) hover:text-foreground aria-[current=page]:bg-card aria-[current=page]:text-foreground aria-[current=page]:shadow-soft"
							>
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
			<LocaleSwitch />
		</div>
	</header>

	<main class="mx-auto w-full max-w-6xl flex-1 px-4 pt-2 pb-10 sm:pt-6">
		{@render children()}
	</main>

	<footer class="pb-[env(safe-area-inset-bottom)]">
		<p class="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground">{t('privacyNote')}</p>
	</footer>
</div>
