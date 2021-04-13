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

import { components } from 'styles/index';
import { defaultNetworkKey, UnknownNetworkKeys } from 'constants/networkSpecs';
import { NetworksContext } from 'stores/NetworkContext';
import { AccountsStoreStateWithWallet } from 'types/walletTypes';
import { NavigationAccountWalletProps } from 'types/props';
import { withCurrentWallet } from 'utils/HOC';
import {
	getAddressWithPath,
	getNetworkKey,
	getPathName
} from 'utils/walletsUtils';
import { generateAccountId } from 'utils/account';
import { UnknownAccountWarning } from 'components/Warnings';
import PathCard from 'components/PathCard';
import QrView from 'components/QrView';

interface Props {
	path: string;
	networkKey: string;
	accountsStore: AccountsStoreStateWithWallet;
}

function ReceiveBalance({
	accountsStore,
	route
}: NavigationAccountWalletProps<'ReceiveBalance'>): React.ReactElement {
	const path = route.params.path;
	const networksContextState = useContext(NetworksContext);
	const networkKey = getNetworkKey(
		path,
		accountsStore.state.currentWallet,
		networksContextState
	);
	const { currentWallet } = accountsStore.state;
	const address = getAddressWithPath(path, currentWallet);
	const accountName = getPathName(path, currentWallet);
	const { allNetworks } = networksContextState;
	if (!address) return <View />;
	const isUnknownNetwork = networkKey === UnknownNetworkKeys.UNKNOWN;
	const formattedNetworkKey = isUnknownNetwork ? defaultNetworkKey : networkKey;
	const accountId = generateAccountId(
		address,
		formattedNetworkKey,
		allNetworks
	);

	return (
		<View style={components.pageWide}>
			<PathCard wallet={currentWallet} path={path} />
			<QrView data={`${accountId}:${accountName}`} />
			{isUnknownNetwork && <UnknownAccountWarning isPath />}
		</View>
	);
}

export default withCurrentWallet(ReceiveBalance);
