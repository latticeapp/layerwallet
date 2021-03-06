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

import { isHex } from '@polkadot/util';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, View, ViewStyle } from 'react-native';

import { qrCode, qrCodeHex } from 'utils/native';
import { colors } from 'styles/index';

interface Props {
	data: string;
	size?: number;
	height?: number;
	style?: ViewStyle;
	testID?: string;
}

export default function QrView(props: Props): React.ReactElement {
	const [qr, setQr] = useState('');

	useEffect((): (() => void) => {
		let promiseDisabled = false;
		async function displayQrCode(data: string): Promise<void> {
			try {
				const generatedQr = isHex(data)
					? await qrCodeHex(data)
					: await qrCode(data);
				if (promiseDisabled) return;
				setQr(generatedQr);
			} catch (e) {
				console.error(e);
			}
		}

		displayQrCode(props.data);
		return (): void => {
			promiseDisabled = true;
		};
	}, [props.data]);

	const { width: deviceWidth } = Dimensions.get('window');
	const size = props.size || deviceWidth - 64;
	const flexBasis = props.height || deviceWidth - 32;

	return (
		<View
			style={[
				{
					alignItems: 'center',
					backgroundColor: colors.background.white,
					flexBasis,
					height: flexBasis,
					justifyContent: 'center',
					marginHorizontal: 16,
					marginVertical: 24,
					width: deviceWidth - 32
				},
				props.style
			]}
			testID={props.testID}
		>
			{qr !== '' && (
				<Image source={{ uri: qr }} style={{ height: size, width: size }} />
			)}
		</View>
	);
}
