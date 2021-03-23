// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// This file is part of Parity.

// Parity is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Parity is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Parity.	If not, see <http://www.gnu.org/licenses/>.

import { StackNavigationProp } from '@react-navigation/stack';
import React, { useContext, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import ButtonIcon from 'components/ButtonIcon';
import { SafeAreaViewContainer } from 'components/SafeAreaContainer';
import ScreenHeading from 'components/ScreenHeading';
import Separator from 'components/Separator';
import { AccountsContext } from 'stores/AccountsContext';
import { RootStackParamList } from 'types/routes';
import testIDs from 'e2e/testIDs';
import colors from 'styles/colors';
import fontStyles from 'styles/fontStyles';
import { getIdentityName } from 'utils/identitiesUtils';
import {
	unlockAndReturnSeed,
	resetNavigationTo,
	resetNavigationWithNetworkChooser
} from 'utils/navigationHelpers';
import { Identity } from 'types/identityTypes';
import { NavigationProps } from 'types/props';
import NavigationTab from 'components/NavigationTab';

function ButtonWithArrow(props: {
	onPress: () => void;
	testID?: string;
	title: string;
}): React.ReactElement {
	return <ButtonIcon {...props} {...i_arrowOptions} />;
}

function IdentitySwitch({}: NavigationProps<
	'IdentitySwitch'
>): React.ReactElement {
	const accountsStore = useContext(AccountsContext);
	const navigation: StackNavigationProp<RootStackParamList> = useNavigation();
	const { currentIdentity, identities } = accountsStore.state;

	const onIdentitySelectedAndNavigate = async <
		RouteName extends keyof RootStackParamList
	>(
		identity: Identity,
		screenName: RouteName,
		params?: RootStackParamList[RouteName]
	): Promise<void> => {
		accountsStore.selectIdentity(identity);
		if (screenName === 'Main') {
			resetNavigationTo(navigation, screenName, params);
		} else if (screenName === 'IdentityBackup') {
			const seedPhrase = await unlockAndReturnSeed(navigation);
			resetNavigationWithNetworkChooser(navigation, screenName, {
				isNew: false,
				seedPhrase
			});
		} else {
			resetNavigationWithNetworkChooser(navigation, screenName, params);
		}
	};

	const renderIdentityOptions = (identity: Identity): React.ReactElement => {
		return (
			<>
				<ButtonWithArrow
					title="Manage Identity"
					onPress={(): Promise<void> =>
						onIdentitySelectedAndNavigate(identity, 'IdentityManagement')
					}
					testID={testIDs.IdentitiesSwitch.manageIdentityButton}
				/>
				<ButtonWithArrow
					title="Show Recovery Phrase"
					onPress={(): Promise<void> =>
						onIdentitySelectedAndNavigate(identity, 'IdentityBackup')
					}
				/>
			</>
		);
	};

	const renderCurrentIdentityCard = (): React.ReactNode => {
		if (!currentIdentity) return;

		const currentIdentityTitle = getIdentityName(currentIdentity, identities);

		return (
			<>
				<ButtonIcon
					title={currentIdentityTitle}
					onPress={(): Promise<void> =>
						onIdentitySelectedAndNavigate(currentIdentity, 'Main')
					}
					iconType="antdesign"
					iconName="user"
					iconSize={40}
					style={{ paddingLeft: 16 }}
					textStyle={fontStyles.h1}
				/>
				{renderIdentityOptions(currentIdentity)}
				<Separator style={{ marginBottom: 0 }} />
			</>
		);
	};

	const renderNonSelectedIdentity = (
		identity: Identity
	): React.ReactElement => {
		const title = getIdentityName(identity, identities);

		return (
			<ButtonIcon
				title={title}
				onPress={(): Promise<void> =>
					onIdentitySelectedAndNavigate(identity, 'Main')
				}
				key={identity.encryptedSeed}
				iconType="antdesign"
				iconName="user"
				iconSize={24}
				style={styles.indentedButton}
				textStyle={fontStyles.h2}
			/>
		);
	};

	const renderIdentities = (): React.ReactNode => {
		// if no identity or the only one we have is the selected one

		if (!identities.length || (identities.length === 1 && currentIdentity))
			return <Separator style={{ height: 0, marginVertical: 4 }} />;

		const identitiesToShow = currentIdentity
			? identities.filter(
					identity => identity.encryptedSeed !== currentIdentity.encryptedSeed
			  )
			: identities;

		return (
			<>
				<ScrollView
					bounces={false}
					style={{
						maxHeight: 160
					}}
				>
					<View style={{ paddingVertical: 8 }}>
						{identitiesToShow.map(renderNonSelectedIdentity)}
					</View>
				</ScrollView>
				{identities.length > 5 && (
					<Separator shadow={true} style={{ marginTop: 0 }} />
				)}
			</>
		);
	};

	return (
		<SafeAreaViewContainer>
			<ScreenHeading title={'Identity Switch'} />
			<View style={styles.card}>
				{renderCurrentIdentityCard()}
				{renderIdentities()}

				<ButtonIcon
					title="Add Identity"
					testID={testIDs.IdentitiesSwitch.addIdentityButton}
					onPress={(): void => navigation.navigate('IdentityNew')}
					iconName="plus"
					iconType="antdesign"
					iconSize={24}
					textStyle={fontStyles.t_big}
					style={styles.indentedButton}
				/>
			</View>
			{/* TODO: get this footer on every page */}
			<View style={styles.tab}>
				<NavigationTab />
			</View>
		</SafeAreaViewContainer>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: colors.background.app,
		borderRadius: 4,
		paddingBottom: 16,
		paddingTop: 8
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
	iconColor: colors.signal.main,
	iconName: 'arrowright',
	iconSize: fontStyles.i_medium.fontSize,
	iconType: 'antdesign',
	style: styles.i_arrowStyle,
	textStyle: { ...fontStyles.a_text, color: colors.signal.main }
};

export default IdentitySwitch;