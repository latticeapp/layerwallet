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
import { StackActions } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import { DispatchError } from '@polkadot/types/interfaces';
import BN from 'bn.js';

import { colors, components } from 'styles/index';
import { AddressBookContext } from 'stores/AddressBookContext';
import { NetworksContext } from 'stores/NetworkContext';
import { AccountsStoreStateWithWallet } from 'types/walletTypes';
import { NavigationAccountWalletProps } from 'types/props';
import { withCurrentWallet } from 'utils/HOC';
import { getNetworkKey, getWalletKeyring } from 'utils/walletsUtils';
import Button from 'components/Button';
import TextInput from 'components/TextInput';
import { ApiContext } from 'stores/ApiContext';
import { SubstrateNetworkParams } from 'types/networkTypes';

interface Props {
	path: string;
	networkKey: string;
	accountsStore: AccountsStoreStateWithWallet;
}

function SendBalance({
	accountsStore,
	navigation,
	route
}: NavigationAccountWalletProps<'SendBalance'>): React.ReactElement {
	const { currentWallet } = accountsStore.state;
	const path = route.params.path;
	const networksContextState = useContext(NetworksContext);
	const addressBookContextState = useContext(AddressBookContext);
	const { state } = useContext(ApiContext);

	const networkKey = getNetworkKey(
		path,
		accountsStore.state.currentWallet,
		networksContextState
	);
	const networkParams = networksContextState.getNetwork(
		networkKey ?? ''
	) as SubstrateNetworkParams;

	const [amount, setAmount] = useState('');
	const onChangeAmount = async (name: string): Promise<void> => {
		setAmount(name);
	};

	const [recipient, setRecipient] = useState('');
	const [sendResultText, setSendResultText] = useState('');
	const [isSendResultError, setIsSendResultError] = useState(false);

	const onSend = async (sendAmount: string, to: string): Promise<void> => {
		if (!state || !state.api || !state.isApiReady) {
			setSendResultText('API not initialized!');
			setIsSendResultError(true);
			return;
		}
		setSendResultText('Sending...');
		const amountWei = new BN(sendAmount).mul(
			new BN('10').pow(new BN(networkParams.decimals))
		);
		const keyring = await getWalletKeyring(currentWallet, networkParams.prefix);
		return new Promise(resolve => {
			state?.api?.tx.balances
				.transferKeepAlive(to, amountWei)
				.signAndSend(keyring, result => {
					if (result.status.isFinalized || result.status.isInBlock) {
						for (const e of result.events) {
							if (state?.api?.events.system.ExtrinsicSuccess.is(e.event)) {
								setSendResultText('Transfer success!');
								resolve();
							} else if (
								state?.api?.events.system.ExtrinsicFailed.is(e.event)
							) {
								const errorData = e.event.data[0] as DispatchError;
								let errorInfo: string;
								if (errorData.isModule) {
									const details = state.api.registry.findMetaError(
										errorData.asModule.toU8a()
									);
									errorInfo = `${details.section}::${details.name}: ${details.documentation[0]}`;
								} else if (errorData.isBadOrigin) {
									errorInfo = 'TX Error: invalid sender origin';
								} else if (errorData.isCannotLookup) {
									errorInfo = 'TX Error: cannot lookup call';
								} else {
									errorInfo = 'TX Error: unknown';
								}
								setSendResultText(errorInfo);
								setIsSendResultError(true);
								resolve();
							}
						}
					} else if (result.isError) {
						setSendResultText('An error occurred.');
						setIsSendResultError(true);
						resolve();
					}
				});
		});
	};

	return (
		<View style={components.page}>
			<TextInput
				suffix={networkParams.unit}
				label="Amount"
				onChangeText={onChangeAmount}
				value={amount}
				placeholder="0"
				autoCorrect={false}
				keyboardType="numeric"
			/>
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
				items={addressBookContextState.getAddressBookEntries().map(a => ({
					label: a,
					value: a
				}))}
				defaultValue={recipient}
				value={recipient}
				dropDownMaxHeight={400}
				containerStyle={components.dropdownContainer}
				style={components.dropdown}
				globalTextStyle={components.dropdownText}
				placeholderStyle={components.dropdownPlaceholder}
				itemStyle={components.dropdownItem}
				dropDownStyle={components.dropdownDropdown}
				placeholder="Select an address"
				onChangeItem={(item): void => {
					setRecipient(item.value);
				}}
			/>
			<Button
				title="Add new address"
				fluid={true}
				secondary={true}
				style={{
					marginBottom: 20,
					marginTop: -5
				}}
				onPress={(): void => {
					navigation.dispatch(StackActions.push('SendBalanceAddAddress'));
				}}
			/>
			<Button
				title="Clear"
				fluid={true}
				secondary={true}
				style={{
					marginBottom: 20,
					marginTop: -10
				}}
				onPress={(): void => {
					setRecipient(null);
				}}
			/>
			<Button
				title="Send"
				fluid={true}
				disabled={!!sendResultText}
				onPress={(): void => {
					if (!amount || !recipient) return;
					onSend(amount, recipient);
				}}
			/>
			{!!sendResultText && (
				<View>
					<Text
						style={{
							color: isSendResultError ? colors.text.error : colors.text.accent
						}}
					>
						{sendResultText}
					</Text>
				</View>
			)}
		</View>
	);
}

export default withCurrentWallet(SendBalance);
