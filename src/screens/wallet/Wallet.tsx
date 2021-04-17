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
import { View, Text, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';

import { NetworkCard } from './NetworkCard';

import { UnknownNetworkKeys } from 'constants/networkSpecs';
import { components, colors, fonts, fontStyles } from 'styles/index';
import { NetworksContext } from 'stores/NetworkContext';
import { AccountsContext } from 'stores/AccountsContext';
import testIDs from 'e2e/testIDs';
import {
	isEthereumNetworkParams,
	isSubstrateNetworkParams
} from 'types/networkTypes';
import { NavigationProps } from 'types/props';
import { navigateToReceiveBalance } from 'utils/navigationHelpers';
import Button from 'components/Button';
import Onboarding from 'components/Onboarding';
import NavigationTab from 'components/NavigationTab';
import { ApiContext } from 'stores/ApiContext';

function WalletConnectionBar(): React.ReactElement | null {
	const { state } = useContext(ApiContext);
	const text = state.apiError
		? `ERROR: ${state.apiError}`
		: !state.isApiInitialized
		? 'Waiting for API connection...'
		: !state.isApiConnected
		? 'Connecting to API...'
		: !state.isApiReady
		? 'Connecting to API...'
		: null;
	if (text === null) return null;

	return (
		<View
			style={{
				backgroundColor: colors.background.accentAlternate,
				paddingBottom: 13,
				paddingHorizontal: 24,
				paddingTop: 14,
				position: 'relative',
				top: -24,
				width: '100%'
			}}
		>
			<Text
				style={{
					color: colors.text.dark,
					fontFamily: fonts.regular,
					fontSize: 16
				}}
			>
				{text}
			</Text>
		</View>
	);
}

function Wallet({ navigation }: NavigationProps<'Wallet'>): React.ReactElement {
	const accountsStore = useContext(AccountsContext);
	const { wallets, currentWallet, loaded } = accountsStore.state;
	const networkContextState = useContext(NetworksContext);
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
				{currentWallet?.account && <WalletConnectionBar />}
				{networkKey && networkParams && renderNetwork()}
				<View style={{ marginBottom: 12, paddingHorizontal: 15 }}>
					<Button
						title="Switch network"
						onPress={(): void => navigation.navigate('AddNetwork')}
						fluid={true}
					/>
					<DropDownPicker
						items={Array.from(allNetworks.entries())
                                                       .filter(([key, _nParams]) => key !== UnknownNetworkKeys.UNKNOWN)
							.map(([_key, nParams]) => ({
								label: nParams.title,
								value: nParams.title
							}))}
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
						placeholder="Select a network"
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
							// TODO: Switch chain
						}}
					/>
				</View>
			</View>
			<NavigationTab />
		</>
	);
}

export default Wallet;
