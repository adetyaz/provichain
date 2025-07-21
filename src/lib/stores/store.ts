import { writable } from 'svelte/store';
import type { Account } from '@massalabs/massa-web3';

export const connectedClient = writable<Account | null>(null);
export const userAddress = writable<string | null>(null);
