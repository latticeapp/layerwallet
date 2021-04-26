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

import React, { ReactElement, useContext } from 'react';
import DropDownPicker, { ItemType } from 'react-native-dropdown-picker';
import { showMessage } from 'react-native-flash-message';
import { StackNavigationProp } from '@react-navigation/stack';

import { components } from 'styles/index';
import { NetworksContext } from 'stores/NetworkContext';
import { isSubstrateNetworkParams, NetworkParams } from 'types/networkTypes';
import { useSeedRef } from 'utils/seedRefHooks';
import { AccountsContext } from 'stores/AccountsContext';
import { RootStackParamList } from 'types/routes';
import { Wallet } from 'types/walletTypes';
import { ApiContext } from 'stores/ApiContext';

export function SelectNetworkDropdown({
	currentWallet,
	defaultValue,
	navigation,
	networks,
	setIsDeriving
}: {
	currentWallet: Wallet;
	defaultValue?: string;
	navigation: StackNavigationProp<RootStackParamList, 'Wallet'>;
	networks: [string, NetworkParams][];
	setIsDeriving: (isDeriving: boolean) => void;
}): ReactElement {
	const accountsStore = useContext(AccountsContext);
	const { initApi } = useContext(ApiContext);
	const networkContextState = useContext(NetworksContext);
	const { getSubstrateNetwork, allNetworks } = networkContextState;
	const seedRefHooks = useSeedRef(currentWallet.encryptedSeed);

	const onNetworkChosen = async (item: ItemType): Promise<void> => {
		const [networkKey, networkType] = item.value.split('-');
		const networkParams = allNetworks.get(networkKey)!;
		if (!networkParams) return;

		// remove existing network (TODO: remove)
		accountsStore.clearAddress();

		// add new network
		if (isSubstrateNetworkParams(networkParams)) {
			// derive substrate account
			const { pathId } = networkParams;
			const fullPath = `//${pathId}`;
			try {
				setIsDeriving(true);
				await accountsStore.deriveNewAccount(
					networkKey,
					fullPath,
					seedRefHooks.substrateAddress,
					getSubstrateNetwork(networkKey)
				);
				setIsDeriving(false);
			} catch (error) {
				setIsDeriving(false);
				showMessage(
					'Could not derive a valid account from the seed: ' + error.message
				);
				return;
			}

			if (networkType === 'custom') {
				// redirect if using custom node and do not init API
				navigation.navigate('CustomNetwork', { networkKey });
			} else {
				// re-init on new default selection
				console.log('calling reinit hook');
				initApi(networkKey);
			}
		} else {
			// derive ethereum account
			try {
				await accountsStore.deriveEthereumAccount(
					seedRefHooks.brainWalletAddress,
					networkKey
				);
			} catch (error) {
				showMessage(
					'Could not derive a valid account from the seed: ' + error.message
				);
				return;
			}
		}
	};

	const items: ItemType[] = [];
	networks.forEach(([key, nParams]) => {
		if (!isSubstrateNetworkParams(nParams)) return;
		items.push({
			label: nParams.title,
			untouchable: true,
			value: key
		});
		items.push({
			label: nParams.url,
			parent: key,
			value: `${key}-1`
		});
		items.push({
			label: '+ Custom...',
			parent: key,
			value: `${key}-custom`
		});
	});

	return (
		<DropDownPicker
			items={items}
			defaultValue={`${defaultValue}-1`}
			containerStyle={components.dropdownContainer}
			style={components.dropdown}
			globalTextStyle={components.dropdownText}
			dropDownMaxHeight={400}
			placeholder="Select a network"
			placeholderStyle={components.dropdownPlaceholder}
			itemStyle={components.dropdownItem}
			dropDownStyle={components.dropdownDropdown}
			onChangeItem={(item: ItemType): Promise<void> => onNetworkChosen(item)}
		/>
	);
}
