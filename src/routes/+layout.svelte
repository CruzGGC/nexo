<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import Scanlines from '$lib/components/effects/Scanlines.svelte';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';

	interface Props {
		data: {
			user: { id: string; username: string; email: string; name?: string; avatar?: string } | null;
		};
		children: Snippet;
	}

	let { data, children }: Props = $props();
</script>

<svelte:head>
	<title>Nexo — Arena de Jogos</title>
</svelte:head>

<!-- CRT Scanlines overlay (always present) -->
<Scanlines />

<!-- Navigation -->
<Navbar user={data.user} />

<!-- Main content with page transition -->
<main class="min-h-screen pt-14">
	{#key page.url.pathname}
		<div in:fade={{ duration: 180 }}>
			{@render children()}
		</div>
	{/key}
</main>

<!-- Footer -->
<Footer />

<!-- Toast notifications -->
<Toast />
