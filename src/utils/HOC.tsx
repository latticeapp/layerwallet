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

import React, { useContext } from 'react';
import { View } from 'react-native';

import { AccountsContext } from 'stores/AccountsContext';
import { AccountsStoreStateWithWallet, Wallet } from 'types/walletTypes';
import {
	RegistriesContext,
	RegistriesStoreState
} from 'stores/RegistriesContext';

interface RegistriesInjectedProps {
	registriesStore: RegistriesStoreState;
}

export function withRegistriesStore<T extends RegistriesInjectedProps>(
	WrappedComponent: React.ComponentType<any>
): React.ComponentType<Omit<T, keyof RegistriesInjectedProps>> {
	return (props): React.ReactElement => {
		const registriesStore = useContext(RegistriesContext);
		return <WrappedComponent {...props} registriesStore={registriesStore} />;
	};
}

export function withCurrentWallet<
	T extends { accountsStore: AccountsStoreStateWithWallet }
>(WrappedComponent: React.ComponentType<T>): React.ComponentType<T> {
	return (props): React.ReactElement => {
		const accountsStore = useContext(AccountsContext);
		const { currentWallet } = accountsStore.state;
		if (currentWallet === null) return <View />;
		return <WrappedComponent {...props} accountsStore={accountsStore} />;
	};
}

interface UnlockScreenProps {
	targetWallet: Wallet;
}

export function withTargetWallet<T extends UnlockScreenProps>(
	WrappedComponent: React.ComponentType<T>
): React.ComponentType<T> {
	return (props): React.ReactElement => {
		const accountsStore = useContext(AccountsContext);
		const targetWallet = accountsStore.state.currentWallet;
		if (!targetWallet) return <View />;
		return <WrappedComponent {...props} targetWallet={targetWallet} />;
	};
}
