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

import Identicon from '@polkadot/reactnative-identicon';
import React, { ReactElement, useEffect, useState } from 'react';
import { Image, ImageStyle, StyleSheet, View, ViewStyle } from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { colors } from 'styles/index';
import { NetworkProtocols } from 'constants/networkSpecs';
import { blockiesIcon } from 'utils/native';
import { NetworkParams, SubstrateNetworkParams } from 'types/networkTypes';

export default function AccountIcon(props: {
	address: string;
	network: NetworkParams;
	style?: ViewStyle | ImageStyle;
}): ReactElement {
	const { address, style, network } = props;
	const [ethereumIconUri, setEthereumIconUri] = useState('');
	const protocol = network.protocol;

	useEffect((): (() => void) => {
		let promiseDisabled = false;

		if (protocol === NetworkProtocols.ETHEREUM && address !== '') {
			const setEthereumIcon = async (): Promise<void> => {
				const generatedIconUri = await blockiesIcon('0x' + address);
				if (promiseDisabled) return;
				setEthereumIconUri(generatedIconUri);
			};
			setEthereumIcon();
		}
		return (): void => {
			promiseDisabled = true;
		};
	}, [address, protocol]);

	if (address === '') {
		return (
			<View style={style as ViewStyle}>
				{(network as SubstrateNetworkParams).logo ? (
					<Image
						source={(network as SubstrateNetworkParams).logo}
						style={styles.logo}
					/>
				) : (
					<View style={styles.logo}>
						<FontAwesome name="question" color={colors.text.white} size={28} />
					</View>
				)}
			</View>
		);
	}
	if (protocol === NetworkProtocols.ETHEREUM && ethereumIconUri) {
		return (
			<Image source={{ uri: ethereumIconUri }} style={style as ImageStyle} />
		);
	} else if (address !== '') {
		let iconSize;
		if (typeof style?.width === 'string') {
			const parseIconSize = parseInt(style.width, 10);
			iconSize = isNaN(parseIconSize) ? undefined : parseIconSize;
		} else {
			iconSize = style?.width;
		}
		return <Identicon value={address} size={iconSize || 40} />;
	} else {
		return <MaterialIcon color={colors.text.error} name={'error'} size={44} />;
	}
}

const styles = StyleSheet.create({
	logo: {
		alignItems: 'center',
		backgroundColor: '#111',
		borderRadius: 18,
		height: 36,
		justifyContent: 'center',
		width: 36
	}
});
