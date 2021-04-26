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

import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/core';
import React, { ReactElement, useContext, useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import BN from 'bn.js';

import { NetworksContext } from 'stores/NetworkContext';
import AccountIcon from 'components/AccountIcon';
import Button from 'components/Button';
import PopupMenu from 'components/PopupMenu';
import { ButtonListener } from 'types/props';
import { RootStackParamList } from 'types/routes';
import { isSubstrateNetworkParams } from 'types/networkTypes';
import { colors, fonts, fontStyles } from 'styles/index';
import {
	navigateToReceiveBalance,
	navigateToSendBalance
} from 'utils/navigationHelpers';
import { Wallet } from 'types/walletTypes';
import { ApiContext } from 'stores/ApiContext';
import { getAddressWithPath } from 'utils/walletsUtils';

interface State {
	freeBalance: string;
}

const EMPTY_STATE: State = {
	freeBalance: 'Loading...'
};

export function NetworkCard({
	networkKey,
	title,
	wallet
}: {
	networkKey?: string;
	onPress?: ButtonListener;
	title: string;
	wallet: Wallet;
}): ReactElement {
	const navigation: StackNavigationProp<RootStackParamList> = useNavigation();
	const { getNetwork } = useContext(NetworksContext);
	const networkParams = getNetwork(networkKey ?? '');
	const [balance, setBalance] = useState(EMPTY_STATE);
	const {
		state: { isApiReady, api }
	} = useContext(ApiContext);

	// initialize balances
	useEffect((): void | (() => void) => {
		console.log('balances hook called!');
		if (isApiReady && networkKey) {
			if (!isSubstrateNetworkParams(networkParams)) return;
			console.log(`Use API: ${networkKey}`);
			const path = `//${networkParams.pathId}`;
			const address = getAddressWithPath(path, wallet);
			const decimals = networkParams.decimals;
			if (api?.derive?.balances) {
				console.log(`FETCHING BALANCES: ${address}`);
				let isMounted = true;
				api.derive.balances
					.all(address, fetchedBalance => {
						const base = new BN(10).pow(new BN(decimals));
						const div = fetchedBalance.availableBalance.div(base);
						const mod = fetchedBalance.availableBalance.mod(base);
						const nDisplayDecimals = 3;
						if (isMounted) {
							setBalance({
								freeBalance:
									div + '.' + mod.toString(10).slice(0, nDisplayDecimals)
							});
						}
					})
					.catch(error => {
						console.log('FETCHING BALANCE ERROR', error);
					});
				return (): void => {
					isMounted = false;
				};
			}
		}
	}, [networkKey, wallet, isApiReady]);

	const onPressed = async (isSend: boolean): Promise<void> => {
		if (isSubstrateNetworkParams(networkParams)) {
			// navigate to substrate account
			const { pathId } = networkParams;
			const fullPath = `//${pathId}`;
			if (isSend) {
				navigateToSendBalance(navigation, networkKey ?? '', fullPath);
			} else {
				navigateToReceiveBalance(navigation, networkKey ?? '', fullPath);
			}
		} else {
			// navigate to ethereum account
			if (isSend) {
				navigateToSendBalance(navigation, networkKey ?? '', networkKey ?? '');
			} else {
				navigateToReceiveBalance(
					navigation,
					networkKey ?? '',
					networkKey ?? ''
				);
			}
		}
	};
	const onOptionSelect = async (value: string): Promise<void> => {
		switch (value) {
			case 'QrScanner':
				navigation.navigate('QrScanner');
				break;
		}
	};

	return (
		<View style={styles.wrapper}>
			<View style={styles.content}>
				<View style={styles.contentRow}>
					<AccountIcon
						address={''}
						network={networkParams}
						style={styles.icon}
					/>
					<View style={styles.desc}>
						<Text numberOfLines={1} style={[fontStyles.h2, { marginTop: -2 }]}>
							{title}
						</Text>
					</View>
					{isSubstrateNetworkParams(networkParams) && (
						<View style={styles.contentRow}>
							<Text style={styles.text}>
								{balance?.freeBalance ?? '...'} {networkParams.unit}
							</Text>
						</View>
					)}
					<PopupMenu
						onSelect={onOptionSelect}
						menuTriggerIconName={'more-vert'}
						menuItems={[
							{
								text: 'Sign transaction',
								value: 'QrScanner'
							}
						]}
					/>
				</View>
				<View style={styles.contentRow}>
					<View style={styles.contentColumn}>
						<Button
							title="Send"
							fluid={'left'}
							onPress={(): Promise<void> => onPressed(true)}
						/>
					</View>
					<View style={styles.contentColumn}>
						<Button
							title="Receive"
							fluid={'right'}
							onPress={(): Promise<void> => onPressed(false)}
						/>
					</View>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	content: {
		backgroundColor: colors.background.accentLight,
		borderRadius: 16,
		marginBottom: 12,
		paddingBottom: 12,
		paddingHorizontal: 24,
		paddingTop: 20
	},
	contentColumn: {
		flex: 1
	},
	contentRow: {
		alignItems: 'center',
		display: 'flex',
		flexDirection: 'row'
	},
	desc: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'space-between',
		paddingLeft: 16
	},
	footer: {
		alignSelf: 'stretch',
		height: 80,
		marginLeft: 8,
		width: 4
	},
	icon: {
		height: 40,
		width: 40
	},
	text: {
		color: colors.text.dark,
		fontFamily: fonts.regular,
		fontSize: 17
	},
	wrapper: {
		marginHorizontal: 16
	}
});
