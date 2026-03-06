import { get, writable } from 'svelte/store';
import { fetchEncryptedJson } from '$lib/crypto/encrypted-json';

export const passphrase = writable<string | null>(null);

export async function unlockWithProbe(candidate: string, probeUrl: string) {
    const trimmed = candidate.trim();

    if (!trimmed) {
        throw new Error('Enter a passcode');
    }

    await fetchEncryptedJson(probeUrl, trimmed);
    passphrase.set(trimmed);
}

export function currentPassphrase() {
    const value = get(passphrase);

    if (!value) {
        throw new Error('App is locked');
    }

    return value;
}

export function lock() {
    passphrase.set(null);
}