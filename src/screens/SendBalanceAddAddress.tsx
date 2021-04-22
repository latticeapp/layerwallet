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
import { StackActions } from '@react-navigation/native';
import { View, Text, TouchableOpacity } from 'react-native';
import Clipboard from '@react-native-community/clipboard';
import { decodeAddress } from '@polkadot/keyring';

import { components } from 'styles/index';
import { AddressBookContext } from 'stores/AddressBookContext';
import { NavigationAccountWalletProps } from 'types/props';
import Button from 'components/Button';
import TextInput from 'components/TextInput';

function SendBalanceAddAddress({
	navigation
}: NavigationAccountWalletProps<'SendBalanceAddAddress'>): React.ReactElement {
	const addressBookContextState = useContext(AddressBookContext);

	const [newAddressBookEntry, setNewAddressBookEntry] = useState('');
	const [newAddressBookEntryIsValid, setNewAddressBookEntryIsValid] = useState(
		true
	);
	const onChangeNewAddressBookEntry = async (
		newEntry: string
	): Promise<void> => {
		if (!newEntry) {
			setNewAddressBookEntry(newEntry);
			setNewAddressBookEntryIsValid(true);
			return;
		}
		try {
			const decoded = decodeAddress(newEntry);
			console.log('decoded:', decoded);
			setNewAddressBookEntry(newEntry);
			setNewAddressBookEntryIsValid(true);
		} catch (e) {
			setNewAddressBookEntry(newEntry);
			setNewAddressBookEntryIsValid(false);
		}
	};

	return (
		<View style={components.page}>
			<View>
				<TextInput
					label="New address"
					clearButtonMode="unless-editing"
					labelRight={
						<View
							style={{
								display: 'flex',
								flexDirection: 'row',
								justifyContent: 'flex-end'
							}}
						>
							<TouchableOpacity
								onPress={(): void => {
									navigation.navigate('QrScanner', {
										setAddress: (address: string) => {
											setNewAddressBookEntry(address);
										}
									});
								}}
								style={{ marginRight: 10 }}
							>
								<Text style={components.linkSmall}>Scan QR</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={async (): void => {
									const newEntry = await Clipboard.getString();
									onChangeNewAddressBookEntry(newEntry);
									// TODO: Set focus
								}}
							>
								<Text style={components.linkSmall}>Paste</Text>
							</TouchableOpacity>
						</View>
					}
					onChangeText={onChangeNewAddressBookEntry}
					value={newAddressBookEntry}
					placeholder="Address"
					fluid={true}
					autoCorrect={false}
				/>
				<View
					style={{
						display: 'flex',
						flexDirection: 'row',
						justifyContent: 'space-between',
						paddingTop: 8
					}}
				>
					<Button
						title={
							newAddressBookEntryIsValid ? 'Add new address' : 'Invalid address'
						}
						fluid={true}
						disabled={!newAddressBookEntry || !newAddressBookEntryIsValid}
						style={{ width: '62%' }}
						onPress={(): void => {
							if (!newAddressBookEntry) return;
							addressBookContextState.saveAddressBookEntry(newAddressBookEntry);
							onChangeNewAddressBookEntry('');
							navigation.dispatch(StackActions.pop(1));
						}}
					/>
					<Button
						title="Cancel"
						fluid={true}
						style={{ width: '35%' }}
						secondary={true}
						onPress={(): void => {
							navigation.dispatch(StackActions.pop(1));
						}}
					/>
				</View>
			</View>
		</View>
	);
}

export default SendBalanceAddAddress;
