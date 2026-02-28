<script lang="ts">
	import { enhance } from '$app/forms';
</script>

<!-- This page only exists as a POST action target for logout. -->
<!-- If accessed via GET, redirect to home. -->
<svelte:head>
	<meta http-equiv="refresh" content="0; url=/" />
</svelte:head>
