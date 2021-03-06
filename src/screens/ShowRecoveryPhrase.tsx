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

import React from 'react';
import { Text, View } from 'react-native';

import { components } from 'styles/index';
import { NavigationProps } from 'types/props';
import AccountSeedCopyable from 'components/AccountSeedCopyable';

function ShowRecoveryPhrase({
	route
}: NavigationProps<'ShowRecoveryPhrase'>): React.ReactElement {
	return (
		<View style={components.page}>
			<Text style={components.textBlock}>
				Save this phrase somewhere secure.
			</Text>
			<Text style={components.textBlock}>
				Do not screenshot or save it on your computer, or anyone with access
				could compromise your account.
			</Text>
			<AccountSeedCopyable seed={route.params.seedPhrase} />
		</View>
	);
}

export default ShowRecoveryPhrase;
