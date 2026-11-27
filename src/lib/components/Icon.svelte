<script lang="ts">
	import { ICONS, type IconName } from './icons.ts';

	let { name, class: className = 'size-5' }: { name: IconName; class?: string } = $props();
</script>

<svg
	aria-hidden="true"
	viewBox="0 0 24 24"
	class={className}
	fill="none"
	stroke="currentColor"
	stroke-width="1.8"
	stroke-linecap="round"
	stroke-linejoin="round"
>
	<path d={ICONS[name]} />
</svg>
