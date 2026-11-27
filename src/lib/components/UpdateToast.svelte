<script lang="ts">
	import { onMount } from 'svelte';
	import { SKIP_WAITING } from '#lib/core/share.ts';
	import { t } from '#lib/i18n/index.svelte.ts';

	let waiting = $state<ServiceWorker | null>(null);

	// A new version waits instead of taking over, so an open editor is never swapped mid-edit.
	// The visitor decides when to reload.
	onMount(() => {
		if (!('serviceWorker' in navigator)) return;
		let cancelled = false;
		const watch = (registration: ServiceWorkerRegistration) => {
			if (registration.waiting && navigator.serviceWorker.controller) waiting = registration.waiting;
			registration.addEventListener('updatefound', () => {
				const installing = registration.installing;
				installing?.addEventListener('statechange', () => {
					if (installing.state === 'installed' && navigator.serviceWorker.controller) waiting = installing;
				});
			});
		};
		void navigator.serviceWorker.getRegistration().then((registration) => {
			if (registration && !cancelled) watch(registration);
		});
		return () => {
			cancelled = true;
		};
	});

	function reload() {
		if (!waiting) return;
		navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
		waiting.postMessage(SKIP_WAITING);
	}
</script>

{#if waiting}
	<div
		role="status"
		class="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl bg-foreground p-3 pl-5 text-background shadow-float"
	>
		<p class="flex-1 text-sm font-semibold">{t('updateReady')}</p>
		<button
			type="button"
			onclick={() => (waiting = null)}
			class="min-h-11 rounded-full px-4 text-sm font-semibold opacity-80 transition-opacity duration-(--duration-fast) hover:opacity-100"
		>
			{t('updateLater')}
		</button>
		<button
			type="button"
			onclick={reload}
			class="min-h-11 rounded-full bg-background px-4 text-sm font-semibold text-foreground"
		>
			{t('updateReload')}
		</button>
	</div>
{/if}
