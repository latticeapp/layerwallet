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

import Clipboard from '@react-native-community/clipboard';
import React from 'react';
import { Text, Alert } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import { components, fonts, colors } from 'styles/index';
import TouchableItem from 'components/TouchableItem';

export default function AccountSeedCopyable({
	seed
}: {
	seed: string;
}): React.ReactElement {
	return (
		<TouchableItem
			onPress={(): void => {
				Alert.alert(
					'Copy recovery phrase?',
					'This could expose it to malicious software if clipboard sync is enabled.',
					[
						{
							onPress: (): void => {
								showMessage('Recovery phrase copied.');
								Clipboard.setString(seed);
							},
							style: 'destructive',
							text: 'Copy'
						},
						{
							style: 'cancel',
							text: 'Cancel'
						}
					]
				);
			}}
			style={components.textBlockPreformatted}
		>
			<Text style={components.textBlockPreformattedText}>{seed}</Text>
			<Text
				style={{
					color: colors.text.accent,
					fontFamily: fonts.regular,
					fontSize: 14
				}}
			>
				Press to copy
			</Text>
		</TouchableItem>
	);
}
