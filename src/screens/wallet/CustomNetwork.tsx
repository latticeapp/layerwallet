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

import React, { useContext, useState } from 'react';
import { View, Text } from 'react-native';

import { WalletConnectionBar } from './WalletConnectionBar';

import { components } from 'styles/index';
import { NavigationProps } from 'types/props';
import Button from 'components/Button';
import TextInput from 'components/TextInput';
import NavigationTab from 'components/NavigationTab';
import { ApiContext } from 'stores/ApiContext';

function isValidWsUrl(urlString: string): boolean {
	const pattern = new RegExp(
		'^(wss?:\\/\\/)?' + // protocol
		'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
		'((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
			'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*$', // port and path
		'i'
	); // fragment locator
	return !!pattern.test(urlString);
}

function CustomNetwork({
	navigation,
	route
}: NavigationProps<'CustomNetwork'>): React.ReactElement {
	const { networkKey } = route.params;
	const { state, initApi, disconnect } = useContext(ApiContext);
	const isConnecting =
		(state.isApiConnected || state.isApiInitialized) && !state.isApiReady;
	const [customUrl, setCustomUrl] = useState(state.url);
	const updateUrl = (newUrl: string): void => {
		setCustomUrl(newUrl);
	};

	const onSaveUrl = (): void => {
		// init chain using customURL
		initApi(networkKey, customUrl);
	};

	const onBack = (): void => {
		if (isConnecting) disconnect();
		navigation.goBack();
	};

	return (
		<>
			<View style={components.pageWide}>
				<WalletConnectionBar showConnected={true} />
				<View style={{ paddingHorizontal: 20 }}>
					<Text style={components.textBlock}>Custom Node </Text>
					<TextInput
						onChangeText={updateUrl}
						value={customUrl}
						autofocus={true}
						disabled={isConnecting}
					/>
					<Button
						title="Save"
						disabled={!isValidWsUrl(customUrl) || isConnecting}
						onPress={onSaveUrl}
						fluid={true}
					/>
					<Button title="Back" onPress={onBack} fluid={true} secondary={true} />
				</View>
			</View>
			<NavigationTab />
		</>
	);
}

export default CustomNetwork;
