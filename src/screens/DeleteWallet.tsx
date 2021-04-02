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

import { AccountsContext } from 'stores/AccountsContext';
import { AlertStateContext } from 'stores/alertContext';

import Button from 'components/Button';
import { SafeAreaViewContainer } from 'components/SafeAreaContainer';
import TextInput from 'components/TextInput';
import ScreenHeading from 'components/ScreenHeading';

import { NavigationAccountIdentityProps } from 'types/props';
import { alertError } from 'utils/alertUtils';
import { resetNavigationTo } from 'utils/navigationHelpers';

type Props = NavigationAccountIdentityProps<'DeleteWallet'>;

function DeleteWallet({ navigation, route }: Props): React.ReactElement {
	const accountsStore = useContext(AccountsContext);
	const { setAlert } = useContext(AlertStateContext);
	const { identity } = route.params;

	const deleteIdentity = async (targetIdentity: Identity): Promise<void> => {
		try {
			resetNavigationTo(navigation, 'Main');
			await accountsStore.deleteIdentity(identity);
		} catch (err) {
			console.error(err);
			alertError(setAlert, "Can't delete wallet");
		}
	};

	return (<SafeAreaViewContainer>
		<ScreenHeading title="Delete Wallet" />
		<Button title="Delete" onPress={() => deleteIdentity()} />
	</SafeAreaViewContainer>);
}

export default DeleteWallet;