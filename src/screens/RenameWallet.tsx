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
import { View } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import { components } from 'styles/index';
import { AccountsContext } from 'stores/AccountsContext';
import Button from 'components/Button';
import TextInput from 'components/TextInput';
import { NavigationAccountWalletProps } from 'types/props';

type Props = NavigationAccountWalletProps<'RenameWallet'>;

function RenameWallet({ navigation, route }: Props): React.ReactElement {
	const accountsStore = useContext(AccountsContext);
	const { wallet } = route.params;
	const [newWalletName, setNewWalletName] = useState(wallet?.name || '');

	if (!wallet) return <View />;

	const onChangeWallet = async (name: string): Promise<void> => {
		setNewWalletName(name);
	};

	const onSaveWallet = async (): Promise<void> => {
		try {
			accountsStore.updateWalletName(newWalletName);
			showMessage('Wallet renamed.');
			navigation.goBack();
		} catch (err) {
			showMessage(`Could not rename: ${err.message}`);
		}
	};

	return (
		<View style={components.page}>
			<TextInput
				label="Display Name"
				onChangeText={onChangeWallet}
				value={newWalletName}
				placeholder="Enter a new wallet name"
				autofocus
			/>
			<Button title="Save" onPress={onSaveWallet} fluid={true} />
		</View>
	);
}

export default RenameWallet;
