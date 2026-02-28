/**
 * Toast notification store (Svelte 5 runes).
 * Usage:
 *   import { toasts, addToast, dismissToast } from '$lib/stores/toast.svelte';
 *   addToast({ message: 'Hello', type: 'success' });
 */

export interface Toast {
	id: string;
	message: string;
	type: 'success' | 'error' | 'info';
	duration?: number;
}

let _toasts = $state<Toast[]>([]);

export const toasts = {
	get list() {
		return _toasts;
	}
};

let counter = 0;

export function addToast(opts: Omit<Toast, 'id'>) {
	const id = `toast-${++counter}-${Date.now()}`;
	const toast: Toast = { id, ...opts };
	const duration = opts.duration ?? 3500;

	_toasts = [..._toasts, toast];

	if (duration > 0) {
		setTimeout(() => {
			dismissToast(id);
		}, duration);
	}
}

export function dismissToast(id: string) {
	_toasts = _toasts.filter((t) => t.id !== id);
}
