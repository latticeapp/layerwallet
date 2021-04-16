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
import { View, Text, TouchableOpacity } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import Clipboard from '@react-native-community/clipboard';
import DropDownPicker from 'react-native-dropdown-picker';
import Icon from 'react-native-vector-icons/Feather';

import { components, colors, fonts } from 'styles/index';
import { NetworksContext } from 'stores/NetworkContext';
import { AccountsStoreStateWithWallet } from 'types/walletTypes';
import { NavigationAccountWalletProps } from 'types/props';
import { withCurrentWallet } from 'utils/HOC';
import { getNetworkKey } from 'utils/walletsUtils';
import Button from 'components/Button';
import TextInput from 'components/TextInput';

interface Props {
	path: string;
	networkKey: string;
	accountsStore: AccountsStoreStateWithWallet;
}

function SendBalance({
	accountsStore,
	route
}: NavigationAccountWalletProps<'SendBalance'>): React.ReactElement {
	const path = route.params.path;
	const networksContextState = useContext(NetworksContext);
	const networkKey = getNetworkKey(
		path,
		accountsStore.state.currentWallet,
		networksContextState
	);
	const networkParams = networksContextState.getNetwork(networkKey ?? '');

	const [amount, setAmount] = useState('');
	const onChangeAmount = async (name: string): Promise<void> => {
		setAmount(name);
	};

	const [recipient, setRecipient] = useState('');
	const onChangeRecipient = async (name: string): Promise<void> => {
		setRecipient(name);
	};

	const [newAddressBookEntry, setNewAddressBookEntry] = useState('');
	const onChangeNewAddressBookEntry = async (name: string): Promise<void> => {
		setNewAddressBookEntry(name);
	};

	const [addingNewAddress, setAddingNewAddress] = useState(false);

	return (
		<View style={components.page}>
			<TextInput
				suffix={networkParams.unit}
				label="Amount"
				onChangeText={onChangeAmount}
				value={amount}
				placeholder="0"
				autoCorrect={false}
				clearButtonMode="unless-editing"
				keyboardType="numeric"
			/>
			{!addingNewAddress && (
				<>
					<View
						style={{
							display: 'flex',
							flexDirection: 'row',
							marginBottom: 8,
							marginTop: 12
						}}
					>
						<Text style={components.textInputLabelLeft}>Recipient</Text>
					</View>
					<DropDownPicker
						items={[
							{
								icon: (): React.ReactElement => (
									<Icon name="plus" size={18} color="#111" />
								),
								label: 'Add new address',
								value: 'new'
							}
						]}
						defaultValue={undefined}
						containerStyle={{
							height: 46,
							marginBottom: 20
						}}
						style={{
							borderBottomLeftRadius: 8,
							borderBottomRightRadius: 8,
							borderColor: colors.border.light,
							borderTopLeftRadius: 8,
							borderTopRightRadius: 8,
							fontFamily: fonts.regular
						}}
						globalTextStyle={{
							fontFamily: fonts.regular,
							fontSize: 18
						}}
						placeholder="Select an address"
						placeholderStyle={{
							backgroundColor: colors.text.white,
							color: colors.text.medium
						}}
						itemStyle={{
							fontFamily: fonts.regular,
							justifyContent: 'flex-start'
						}}
						dropDownStyle={{
							backgroundColor: '#fafafa',
							borderBottomLeftRadius: 8,
							borderBottomRightRadius: 8,
							fontFamily: fonts.regular
						}}
						onChangeItem={(item): void => {
							if (item.value === 'new') {
								setAddingNewAddress(true);
							} else {
								setAddingNewAddress(false);
							}
						}}
					/>
				</>
			)}
			{addingNewAddress ? (
				<View>
					<TextInput
						label="New recipient"
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
										showMessage('Unimplemented');
										// TODO: Go to scanner
									}}
									style={{ marginRight: 10 }}
								>
									<Text style={components.linkSmall}>Scan QR</Text>
								</TouchableOpacity>
								<TouchableOpacity
									onPress={async (): void => {
										onChangeNewAddressBookEntry(await Clipboard.getString());
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
							title="Add recipient"
							fluid={true}
							style={{ width: '62%' }}
							onPress={(): void => {
								return;
							}}
						/>
						<Button
							title="Cancel"
							fluid={true}
							style={{ width: '35%' }}
							secondary={true}
							onPress={(): void => {
								setAddingNewAddress(false);
							}}
						/>
					</View>
				</View>
			) : (
				<Button
					title="Send"
					fluid={true}
					onPress={(): void => {
						return;
					}}
				/>
			)}
		</View>
	);
}

export default withCurrentWallet(SendBalance);
