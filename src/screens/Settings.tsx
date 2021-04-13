// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// Copyright 2021 Commonwealth Labs, Inc.
// This file is part of Layer Wallet.

// Layer Wallet is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Layer Wallet is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Parity.	If not, see <http://www.gnu.org/licenses/>.

import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import Onboarding from 'components/Onboarding';
import { colors, components, fontStyles } from 'styles';
import Button from 'components/Button';
import ButtonIcon from 'components/ButtonIcon';
import Separator from 'components/Separator';
import NavigationTab from 'components/NavigationTab';
import { AccountsContext } from 'stores/AccountsContext';
import { Wallet } from 'types/walletTypes';
import { NavigationProps } from 'types/props';
import { RootStackParamList } from 'types/routes';
import { getWalletSeed, getWalletName } from 'utils/walletsUtils';

function ButtonWithArrow(props: {
	onPress: () => void;
	testID?: string;
	title: string;
}): React.ReactElement {
	return <ButtonIcon {...props} {...i_arrowOptions} />;
}

function Settings({}: NavigationProps<'Settings'>): React.ReactElement {
	const accountsStore = useContext(AccountsContext);
	const navigation: StackNavigationProp<RootStackParamList> = useNavigation();
	const { currentWallet, wallets } = accountsStore.state;
	if (wallets.length === 0) return <Onboarding />;
	if (!currentWallet) return <View />;

	const renderWallet = (wallet: Wallet): React.ReactElement => {
		const title = getWalletName(wallet, wallets);
		const showRecoveryPhrase = async (targetWallet: Wallet): Promise<void> => {
			const seedPhrase = await getWalletSeed(targetWallet);
			navigation.navigate('ShowRecoveryPhrase', { seedPhrase });
		};

		return (
			<View key={wallet.encryptedSeed}>
				<View style={styles.card}>
					<ButtonIcon
						title={title}
						iconType="antdesign"
						iconName="user"
						iconSize={24}
						style={styles.indentedButton}
						textStyle={fontStyles.h2}
					/>
					{currentWallet.encryptedSeed !== wallet.encryptedSeed ? (
						<ButtonWithArrow
							title="Select this wallet"
							onPress={(): void => {
								accountsStore.selectWallet(wallet);
								showMessage('Wallet switched.');
							}}
						/>
					) : null}
					{currentWallet.encryptedSeed === wallet.encryptedSeed ? (
						<>
							<ButtonWithArrow
								title="Rename"
								onPress={(): void =>
									navigation.navigate('RenameWallet', {
										accountsStore,
										wallet,
										navigation
									})
								}
							/>
							<ButtonWithArrow
								title="Delete"
								onPress={(): void =>
									navigation.navigate('DeleteWallet', {
										accountsStore,
										wallet,
										navigation
									})
								}
							/>
							<ButtonWithArrow
								title="Show Recovery Phrase"
								onPress={(): Promise<void> => showRecoveryPhrase(wallet)}
							/>
						</>
					) : null}
				</View>
				<Separator style={{ marginBottom: 0 }} />
			</View>
		);
	};

	return (
		<>
			<View style={components.pageWideFullBleed}>
				{wallets.map(renderWallet)}
				<View style={{ paddingHorizontal: 32, paddingVertical: 16 }}>
					<Button
						title="Add wallet"
						onPress={(): void => navigation.navigate('CreateWallet')}
						fluid={true}
					/>
				</View>
			</View>
			<View style={styles.tab}>
				<NavigationTab />
			</View>
		</>
	);
}

const styles = StyleSheet.create({
	card: {
		paddingBottom: 6,
		paddingTop: 14
	},
	container: {
		justifyContent: 'center',
		paddingHorizontal: 16
	},
	i_arrowStyle: {
		paddingLeft: 64,
		paddingTop: 0
	},
	indentedButton: {
		paddingLeft: 32
	},
	tab: {
		flex: 1,
		justifyContent: 'flex-end'
	}
});

const i_arrowOptions = {
	iconColor: colors.text.accent,
	iconName: 'arrowright',
	iconSize: 18,
	iconType: 'antdesign',
	style: styles.i_arrowStyle,
	textStyle: { ...fontStyles.a_text, color: colors.text.accent }
};

export default Settings;
