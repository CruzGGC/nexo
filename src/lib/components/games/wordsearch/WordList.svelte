<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import type { WordsearchWordClient } from '$lib/games/wordsearch/types';
	import { Check, Eye } from 'lucide-svelte';

	interface Props {
		words: WordsearchWordClient[];
		foundWords: Set<string>;
		class?: string;
	}

	let {
		words,
		foundWords,
		class: className = ''
	}: Props = $props();

	let foundCount = $derived(foundWords.size);
	let totalCount = $derived(words.length);
</script>

<div class="flex flex-col gap-3 {className}">
	<div class="flex items-center justify-between border-b border-border pb-2">
		<h3 class="font-accent text-xs uppercase tracking-[0.2em] text-accent-tertiary">
			{m.sopa_lista_palavras()}
		</h3>
		<span class="font-accent text-xs text-muted-foreground">
			{foundCount}/{totalCount} {m.sopa_encontradas()}
		</span>
	</div>

	<ul class="grid grid-cols-2 gap-1.5">
		{#each words as word}
			{@const isFound = foundWords.has(word.word)}
			<li
				class="flex items-center gap-2 px-2 py-1.5 font-body text-xs transition-all duration-150 {isFound
					? 'bg-accent/10 text-accent line-through opacity-60'
					: 'text-foreground'}"
			>
				{#if isFound}
					<Check class="h-3 w-3 shrink-0 text-accent" strokeWidth={2.5} />
				{:else}
					<Eye class="h-3 w-3 shrink-0 text-muted-foreground/40" strokeWidth={1.5} />
				{/if}
				<span class="truncate">{word.displayWord}</span>
				{#if word.hint && !isFound}
					<span class="ml-auto shrink-0 font-accent text-[9px] uppercase text-muted-foreground/50">
						{word.hint}
					</span>
				{/if}
			</li>
		{/each}
	</ul>
</div>
