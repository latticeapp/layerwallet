// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// This file is part of Parity.

// Parity is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Parity is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Parity.  If not, see <http://www.gnu.org/licenses/>.

import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';

import { SafeAreaViewContainer } from 'components/SafeAreaContainer';
import testIDs from 'e2e/testIDs';
import { AlertStateContext } from 'stores/alertContext';
import { NavigationAccountIdentityProps } from 'types/props';
import { withCurrentIdentity } from 'utils/HOC';
import TextInput from 'components/TextInput';
import { navigateToLandingPage } from 'utils/navigationHelpers';
import { alertDeleteIdentity, alertError } from 'utils/alertUtils';
import ScreenHeading from 'components/ScreenHeading';
import colors from 'styles/colors';
import PopupMenu from 'components/PopupMenu';
import { useSeedRef } from 'utils/seedRefHooks';
import { unlockIdentitySeedWithReturn } from 'utils/identitiesUtils';

type Props = NavigationAccountIdentityProps<'RenameWallet'>;

function RenameWallet({
	accountsStore,
	navigation
}: Props): React.ReactElement {
	const { currentIdentity } = accountsStore.state;
	const { setAlert } = useContext(AlertStateContext);
	const { createSeedRef, destroySeedRef } = useSeedRef(
		currentIdentity.encryptedSeed
	);
	if (!currentIdentity) return <View />;

	const onRenameIdentity = async (name: string): Promise<void> => {
		try {
			await accountsStore.updateIdentityName(name);
		} catch (err) {
			alertError(setAlert, `Can't rename: ${err.message}`);
		}
	};

	const onOptionSelect = async (value: string): Promise<void> => {
		if (value === 'IdentityDelete') {
			alertDeleteIdentity(
				setAlert,
				async (): Promise<void> => {
					try {
						await destroySeedRef();
						await accountsStore.deleteCurrentIdentity();
						navigateToLandingPage(navigation);
					} catch (err) {
						alertError(setAlert, "Can't delete wallet");
					}
				}
			);
		} else if (value === 'ShowRecoveryPhrase') {
			const seedPhrase = await unlockIdentitySeedWithReturn(
				currentIdentity,
				createSeedRef
			);
			navigation.navigate(value, { isNew: false, seedPhrase });
		}
	};

	return (
		<SafeAreaViewContainer>
			<ScreenHeading
				title="Rename Wallet"
				headMenu={
					<PopupMenu
						testID={testIDs.RenameWallet.popupMenuButton}
						onSelect={onOptionSelect}
						menuTriggerIconName={'more-vert'}
						menuItems={[
							{ text: 'Backup', value: 'ShowRecoveryPhrase' },
							{
								testID: testIDs.RenameWallet.deleteButton,
								text: 'Delete',
								textStyle: styles.deleteText,
								value: 'IdentityDelete'
							}
						]}
					/>
				}
			/>
			<TextInput
				label="Display Name"
				onChangeText={onRenameIdentity}
				value={currentIdentity.name}
				placeholder="Enter a new wallet name"
				focus
			/>
		</SafeAreaViewContainer>
	);
}

export default withCurrentIdentity(RenameWallet);

const styles = StyleSheet.create({
	deleteText: {
		color: colors.signal.error
	},
	header: {
		flexDirection: 'row',
		paddingBottom: 24,
		paddingLeft: 16,
		paddingRight: 16
	}
});