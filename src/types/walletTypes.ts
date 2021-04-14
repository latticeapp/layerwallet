// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// Copyright 2021 Commonwealth Labs, Inc.
// This file is part of Layer Wallet.

// Layer Wallet is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Layer Wallet is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Layer Wallet. If not, see <http://www.gnu.org/licenses/>.

import { AccountsContextState } from 'stores/AccountsContext';

export type Account = {
	address: string;
	createdAt: number;
	updatedAt: number;
	path: string;
	networkKey: string;
	networkPathId?: string;
};

export interface FoundAccount extends Account {
	accountId: string;
	encryptedSeed: string;
	validBip39Seed: true;
	name: string;
}

export type Wallet = {
	account?: Account;
	allAccounts: Map<string, Account>;
	encryptedSeed: string;
	name: string;
};

export type SerializedWallet = {
	account: Account;
	allAccounts: Array<[string, Account]>;
	encryptedSeed: string;
	name: string;
};

export type AccountsStoreState = {
	wallets: Wallet[];
	currentWallet: Wallet | null;
	loaded: boolean;
	newWallet: Wallet;
};

type LensSet<T, R> = Omit<T, keyof R> & R;
export type AccountsStoreStateWithWallet = LensSet<
	AccountsContextState,
	{ state: LensSet<AccountsStoreState, { currentWallet: Wallet }> }
>;
