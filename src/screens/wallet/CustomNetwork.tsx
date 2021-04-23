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

import React, { useState } from 'react';
import { View, Text } from 'react-native';

import { WalletConnectionBar } from './WalletConnectionBar';

import { components } from 'styles/index';
import { NavigationProps } from 'types/props';
import Button from 'components/Button';
import TextInput from 'components/TextInput';
import NavigationTab from 'components/NavigationTab';

// TODO: take network key/params for chain we're using a custom network on
// TODO: take pre-populated network param
// TODO: ensure the bar shows something useful and that we prompt a redirect
//    back on successful save.
function CustomNetwork({
	navigation
}: NavigationProps<'CustomNetwork'>): React.ReactElement {
	const [customUrl, setCustomUrl] = useState('');
	const updateUrl = (url: string): void => {
		setCustomUrl(url);
	};

	const onSaveUrl = (): void => {
		// TODO: init chain using customURL
	};

	return (
		<>
			<View style={components.pageWide}>
				<WalletConnectionBar />
				<Text style={components.textBlock}>Custom Node </Text>
				<TextInput
					onChangeText={updateUrl}
					value={customUrl}
					placeholder="e.g. wss://mainnet1.edgewa.re"
					autofocus={true}
				/>
				<Button title="Save" onPress={onSaveUrl} fluid={true} />
				<Button
					title="Cancel"
					onPress={(): void => navigation.goBack()}
					fluid={true}
				/>
			</View>
			<NavigationTab />
		</>
	);
}

export default CustomNetwork;
