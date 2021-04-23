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

import React, { ReactElement, useContext, useState } from 'react';
import { View, Text, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { NetworkCard } from './NetworkCard';
import { SelectNetworkDropdown } from './SelectNetworkDropdown';
import { WalletConnectionBar } from './WalletConnectionBar';

import { UnknownNetworkKeys } from 'constants/networkSpecs';
import { components, fontStyles } from 'styles/index';
import { NetworksContext } from 'stores/NetworkContext';
import { AccountsContext } from 'stores/AccountsContext';
import testIDs from 'e2e/testIDs';
import {
	isEthereumNetworkParams,
	isSubstrateNetworkParams
} from 'types/networkTypes';
import { NavigationProps } from 'types/props';
import { navigateToReceiveBalance } from 'utils/navigationHelpers';
import Onboarding from 'components/Onboarding';
import NavigationTab from 'components/NavigationTab';

function Wallet({ navigation }: NavigationProps<'Wallet'>): React.ReactElement {
	const accountsStore = useContext(AccountsContext);
	const { wallets, currentWallet, loaded } = accountsStore.state;
	const networkContextState = useContext(NetworksContext);
	const [isDeriving, setIsDeriving] = useState(false);
	const { allNetworks } = networkContextState;

	// catch android back button and prevent exiting the app
	useFocusEffect(
		React.useCallback((): any => {
			const handleBackButton = (): boolean => true;
			const backHandler = BackHandler.addEventListener(
				'hardwareBackPress',
				handleBackButton
			);
			return (): void => backHandler.remove();
		}, [])
	);

	const networkKey = currentWallet?.account?.networkKey;
	const networkParams = networkKey ? allNetworks.get(networkKey)! : undefined;

	if (!loaded) return <View />;
	if (wallets.length === 0) return <Onboarding />;

	if (currentWallet === null)
		return (
			<>
				<View style={components.pageWide}>
					<Text style={fontStyles.quote}>Select a wallet to get started.</Text>
				</View>
				<NavigationTab />
			</>
		);

	const onNetworkChosen = (): void => {
		if (!networkKey || !networkParams) return;
		if (isSubstrateNetworkParams(networkParams)) {
			// navigate to substrate account
			const { pathId } = networkParams;
			const fullPath = `//${pathId}`;
			navigateToReceiveBalance(navigation, networkKey, fullPath);
		} else {
			// navigate to ethereum account
			navigateToReceiveBalance(navigation, networkKey, networkKey);
		}
	};

	const renderNetwork = (): ReactElement => {
		if (!networkKey || !networkParams) return <View />; // should never reach
		const networkIndexSuffix = isEthereumNetworkParams(networkParams)
			? networkParams.ethereumChainId
			: networkParams.pathId;
		return (
			<NetworkCard
				key={networkKey}
				testID={testIDs.Wallet.networkButton + networkIndexSuffix}
				networkKey={networkKey}
				onPress={(): void => onNetworkChosen()}
				title={networkParams.title}
				wallet={currentWallet}
			/>
		);
	};

	return (
		<>
			<View style={components.pageWide}>
				{(currentWallet?.account || isDeriving) && (
					<WalletConnectionBar isDeriving={isDeriving} />
				)}
				{networkKey && networkParams && renderNetwork()}
				<View style={{ marginBottom: 12, paddingHorizontal: 15 }}>
					<SelectNetworkDropdown
						currentWallet={currentWallet}
						defaultValue={networkKey}
						networks={Array.from(allNetworks.entries()).filter(
							([key, _nParams]) => key !== UnknownNetworkKeys.UNKNOWN
						)}
						setIsDeriving={setIsDeriving}
					/>
				</View>
			</View>
			<NavigationTab />
		</>
	);
}

export default Wallet;
