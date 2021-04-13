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

import React, { useContext, useEffect, useRef } from 'react';
import { Text, View, StyleSheet } from 'react-native';

import { fontStyles, components } from 'styles/index';
import testIDs from 'e2e/testIDs';
import { AccountsContext } from 'stores/AccountsContext';
import { ScannerContext } from 'stores/ScannerContext';
import { NavigationProps, NavigationScannerProps } from 'types/props';
import { FoundAccount } from 'types/walletTypes';
import QrView from 'components/QrView';
import Separator from 'components/Separator';
import PathCard from 'components/PathCard';

function SignTransactionFinish(
	props: NavigationProps<'SignTransactionFinish'>
): React.ReactElement {
	const scannerStore = useContext(ScannerContext);
	const { recipient, sender } = scannerStore.state;
	const cleanup = useRef(scannerStore.cleanup);

	useEffect(() => cleanup.current, [cleanup]);

	if (sender === null || recipient === null) return <View />;
	return (
		<SignTransactionFinishView
			sender={sender}
			scannerStore={scannerStore}
			{...props}
		/>
	);
}

interface Props extends NavigationScannerProps<'SignTransactionFinish'> {
	sender: FoundAccount;
}

function SignTransactionFinishView({
	sender,
	scannerStore
}: Props): React.ReactElement {
	const accountsStore = useContext(AccountsContext);
	const wallet = accountsStore.getWalletByAccountId(sender.accountId)!;
	const { signedData } = scannerStore.state;

	return (
		<View style={components.pageWide}>
			<Text style={styles.topTitle}>Signed extrinsic</Text>
			<PathCard wallet={wallet} path={sender.path} />
			<Separator
				shadow={true}
				style={{
					height: 0,
					marginVertical: 20
				}}
			/>
			<Text style={[{ paddingHorizontal: 16 }]}>{'Scan to publish'}</Text>
			<View style={styles.qr} testID={testIDs.SignTransactionFinish.qrView}>
				<QrView data={signedData} />
			</View>
		</View>
	);
}

export default SignTransactionFinish;

const styles = StyleSheet.create({
	body: {
		paddingTop: 24
	},
	bodyContent: {
		marginVertical: 16,
		paddingHorizontal: 20
	},
	qr: {
		marginBottom: 8
	},
	title: {
		...fontStyles.h2,
		paddingBottom: 20
	},
	topTitle: {
		...fontStyles.h2,
		textAlign: 'center'
	}
});
