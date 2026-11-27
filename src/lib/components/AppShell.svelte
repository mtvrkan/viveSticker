<script lang="ts">
	import { page } from '$app/state';
	import { onMount, type Snippet } from 'svelte';
	import { copyFor } from '#lib/content/index.ts';
	import { i18n, rememberLocale, t } from '#lib/i18n/index.svelte.ts';
	import { pageHref } from '#lib/seo/links.ts';
	import { LANGUAGE_NAMES, pageIdFrom, type ContentId } from '#lib/seo/site.ts';
	import Icon from './Icon.svelte';
	import { install, promptInstall, watchInstall } from './install.svelte.ts';
	import LocaleSwitch from './LocaleSwitch.svelte';
	import SiteMenu from './SiteMenu.svelte';
	import { syncTheme } from './theme.svelte.ts';
	import ThemeSwitch from './ThemeSwitch.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import UpdateToast from './UpdateToast.svelte';

	let { children }: { children: Snippet } = $props();

	const TOOLS: ContentId[] = ['gif', 'video', 'photo', 'cutout', 'animated', 'pack'];
	const GUIDES: ContentId[] = ['guide', 'limits', 'faq', 'privacy'];
	const MENU_ID = 'site-menu';

	let scrollY = $state(0);
	let menuOpen = $state(false);

	const locale = $derived(i18n.locale);
	const other = $derived(locale === 'tr' ? 'en' : 'tr');
	const current = $derived(pageIdFrom(page.route.id, page.params));
	const pages = $derived(copyFor(locale).pages);
	const inMenu = $derived(current !== null && current !== 'home' && current !== 'library');
	const links = $derived([
		{ href: pageHref('home', locale), label: t('navStickers'), current: current === 'home' },
		{ href: pageHref('library', locale), label: t('navPacks'), current: current === 'library' }
	]);
	const groups = $derived([
		{ id: 'footer-tools', heading: t('footerTools'), ids: TOOLS },
		{ id: 'footer-guides', heading: t('footerGuides'), ids: GUIDES }
	]);

	onMount(() => {
		syncTheme();
		return watchInstall();
	});
</script>

<svelte:window bind:scrollY />

<a
	href="#main"
	class="fixed top-2 left-2 z-50 -translate-y-20 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background focus:translate-y-0"
>
	{t('skipToContent')}
</a>

<div class="flex min-h-dvh flex-col">
	<header
		data-scrolled={scrollY > 4 ? '' : undefined}
		class="sticky top-0 z-30 border-b border-transparent bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150 transition-[border-color,box-shadow] duration-(--duration-base) data-scrolled:border-border data-scrolled:shadow-soft"
	>
		<div class="mx-auto flex h-16 w-full max-w-6xl items-center gap-1.5 px-4 sm:gap-2">
			<a
				href={pageHref('home', locale)}
				class="flex min-h-11 items-center gap-2 rounded-sm font-bold tracking-tight"
			>
				<svg aria-hidden="true" viewBox="0 0 64 64" class="size-8">
					<defs>
						<linearGradient id="brand-mark" x1="0" y1="0" x2="1" y2="1">
							<stop offset="0" style="stop-color: var(--color-brand-from)" />
							<stop offset="1" style="stop-color: var(--color-brand-to)" />
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
								class="flex min-h-10 items-center rounded-full px-2.5 text-sm min-[380px]:px-3 font-semibold whitespace-nowrap text-muted-foreground transition-colors duration-(--duration-fast) hover:text-foreground aria-[current=page]:bg-card aria-[current=page]:text-foreground aria-[current=page]:shadow-soft"
							>
								{link.label}
							</a>
						</li>
					{/each}
					<li class="hidden md:block">
						<button
							type="button"
							popovertarget={MENU_ID}
							aria-expanded={menuOpen}
							data-current={inMenu ? '' : undefined}
							class="group flex min-h-10 items-center gap-1 rounded-full pr-2.5 pl-3 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors duration-(--duration-fast) hover:text-foreground data-current:text-foreground aria-expanded:bg-card aria-expanded:text-foreground aria-expanded:shadow-soft"
						>
							{t('footerTools')}
							<Icon
								name="chevronDown"
								class="size-4 transition-transform duration-(--duration-base) group-aria-expanded:rotate-180"
							/>
						</button>
					</li>
				</ul>
			</nav>
			<div class="flex items-center gap-1.5">
				{#if install.available}
					<button
						type="button"
						onclick={promptInstall}
						class="hidden min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft transition-colors duration-(--duration-fast) hover:bg-primary-hover lg:inline-flex"
					>
						<Icon name="download" class="size-4.5" />
						{t('installApp')}
					</button>
				{/if}
				<ThemeToggle class="hidden md:flex" />
				<LocaleSwitch />
				<button
					type="button"
					popovertarget={MENU_ID}
					aria-expanded={menuOpen}
					class="flex size-11 shrink-0 items-center justify-center rounded-full bg-card shadow-soft transition-colors duration-(--duration-fast) hover:bg-muted md:hidden"
				>
					<span class="sr-only">{t('menuOpen')}</span>
					<Icon name={menuOpen ? 'close' : 'menu'} />
				</button>
			</div>
		</div>
	</header>
	<SiteMenu id={MENU_ID} bind:open={menuOpen} />

	<main id="main" tabindex="-1" class="mx-auto w-full max-w-6xl flex-1 px-4 pt-2 pb-10 outline-none sm:pt-6">
		{@render children()}
	</main>

	<footer class="mt-8 border-t pb-[env(safe-area-inset-bottom)]">
		<div class="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
			{#each groups as group (group.id)}
				<nav aria-labelledby={group.id}>
					<h2 id={group.id} class="text-sm font-semibold">{group.heading}</h2>
					<ul class="mt-3 flex flex-col gap-1">
						{#each group.ids as id (id)}
							<li>
								<a
									href={pageHref(id, locale)}
									aria-current={current === id ? 'page' : undefined}
									class="inline-flex min-h-9 items-center text-sm text-muted-foreground transition-colors duration-(--duration-fast) hover:text-foreground aria-[current=page]:text-foreground"
								>
									{pages[id].label}
								</a>
							</li>
						{/each}
					</ul>
				</nav>
			{/each}
			<div class="flex flex-col items-start gap-4 sm:col-span-2">
				<ThemeSwitch />
				<a
					href={pageHref(current ?? 'home', other)}
					hreflang={other}
					lang={other}
					onclick={() => rememberLocale(other)}
					class="inline-flex min-h-9 items-center text-sm font-semibold underline-offset-4 hover:underline"
				>
					{LANGUAGE_NAMES[other]}
				</a>
				<p class="text-sm text-muted-foreground">{t('privacyNote')}</p>
				<p class="text-sm text-muted-foreground">{t('footerIndependent')}</p>
			</div>
		</div>
	</footer>
</div>

<UpdateToast />
