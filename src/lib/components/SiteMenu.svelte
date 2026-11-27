<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { copyFor } from '#lib/content/index.ts';
	import { i18n, t } from '#lib/i18n/index.svelte.ts';
	import type { MessageKey } from '#lib/i18n/tr.ts';
	import { pageHref } from '#lib/seo/links.ts';
	import { pageIdFrom, type ContentId } from '#lib/seo/site.ts';
	import Icon from './Icon.svelte';
	import type { IconName } from './icons.ts';
	import { install, promptInstall } from './install.svelte.ts';
	import ThemeSwitch from './ThemeSwitch.svelte';

	let { id, open = $bindable(false) }: { id: string; open?: boolean } = $props();

	let panel: HTMLElement;

	type Entry = { id: ContentId; icon: IconName };
	const TOOLS: (Entry & { tint: string; blurb: MessageKey })[] = [
		{ id: 'gif', icon: 'film', tint: 'bg-tint-1', blurb: 'menu.gif' },
		{ id: 'video', icon: 'video', tint: 'bg-tint-4', blurb: 'menu.video' },
		{ id: 'photo', icon: 'photo', tint: 'bg-tint-2', blurb: 'menu.photo' },
		{ id: 'cutout', icon: 'scissors', tint: 'bg-tint-3', blurb: 'menu.cutout' },
		{ id: 'animated', icon: 'sparkles', tint: 'bg-tint-5', blurb: 'menu.animated' },
		{ id: 'pack', icon: 'layers', tint: 'bg-tint-1', blurb: 'menu.pack' }
	];
	const GUIDES: Entry[] = [
		{ id: 'guide', icon: 'book' },
		{ id: 'limits', icon: 'frame' },
		{ id: 'faq', icon: 'help' },
		{ id: 'privacy', icon: 'shield' }
	];

	const locale = $derived(i18n.locale);
	const pages = $derived(copyFor(locale).pages);
	const current = $derived(pageIdFrom(page.route.id, page.params));

	// The popover works without JavaScript, so it may already be open when the app hydrates.
	onMount(() => (open = panel.matches(':popover-open')));

	// Links navigate on the client, which leaves a popover open.
	afterNavigate(() => panel?.hidePopover());
</script>

<div
	bind:this={panel}
	{id}
	popover="auto"
	ontoggle={(event) => (open = (event as ToggleEvent).newState === 'open')}
	class="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+4.5rem)] bottom-auto mx-auto my-0 max-h-[calc(100dvh-env(safe-area-inset-top)-5.5rem)] max-w-3xl -translate-y-1 overflow-y-auto overscroll-contain rounded-lg border bg-card p-3 text-card-foreground opacity-0 shadow-float transition-[opacity,translate,display,overlay] transition-discrete duration-(--duration-base) ease-out backdrop:bg-foreground/25 open:translate-y-0 open:opacity-100 sm:p-4 md:backdrop:bg-transparent starting:open:-translate-y-1 starting:open:opacity-0"
>
	<nav aria-label={t('menuLabel')} class="grid gap-5 md:grid-cols-[1fr_15rem] md:gap-4">
		<section aria-labelledby="{id}-tools">
			<h2 id="{id}-tools" class="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
				{t('footerTools')}
			</h2>
			<ul class="mt-2 grid gap-1 sm:grid-cols-2">
				{#each TOOLS as tool (tool.id)}
					<li>
						<a
							href={pageHref(tool.id, locale)}
							aria-current={current === tool.id ? 'page' : undefined}
							class="flex items-center gap-3 rounded-md p-2 transition-colors duration-(--duration-fast) hover:bg-muted aria-[current=page]:bg-muted"
						>
							<span
								class="flex size-11 shrink-0 items-center justify-center rounded-sm text-foreground {tool.tint}"
							>
								<Icon name={tool.icon} />
							</span>
							<span class="min-w-0">
								<span class="block text-sm font-semibold">{pages[tool.id].label}</span>
								<span class="block text-xs text-muted-foreground">{t(tool.blurb)}</span>
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
		<section aria-labelledby="{id}-guides" class="md:border-l md:pl-4">
			<h2 id="{id}-guides" class="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
				{t('footerGuides')}
			</h2>
			<ul class="mt-2 grid gap-0.5 sm:grid-cols-2 md:grid-cols-1">
				{#each GUIDES as guide (guide.id)}
					<li>
						<a
							href={pageHref(guide.id, locale)}
							aria-current={current === guide.id ? 'page' : undefined}
							class="flex min-h-11 items-center gap-3 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
						>
							<Icon name={guide.icon} class="size-4.5 shrink-0" />
							{pages[guide.id].label}
						</a>
					</li>
				{/each}
			</ul>
		</section>
	</nav>
	<!-- On narrower screens the header has no room for these. -->
	<div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t px-2 pt-4 lg:hidden">
		<ThemeSwitch name="{id}-theme" />
		{#if install.available}
			<button
				type="button"
				onclick={promptInstall}
				class="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors duration-(--duration-fast) hover:bg-primary-hover"
			>
				<Icon name="download" class="size-4.5" />
				{t('installApp')}
			</button>
		{/if}
	</div>
</div>
