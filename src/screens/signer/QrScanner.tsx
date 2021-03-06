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

import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { RNCamera } from 'react-native-camera';

import { useProcessBarCode } from './utils';

import { colors, fonts } from 'styles/index';
import Button from 'components/Button';
import { useInjectionQR } from 'e2e/injections';
import { NetworksContext } from 'stores/NetworkContext';
import { ScannerContext } from 'stores/ScannerContext';
import { NavigationProps } from 'types/props';
import { Frames, TxRequestData } from 'types/scannerTypes';

export default function QrScanner({
	navigation,
	route
}: NavigationProps<'QrScanner'>): React.ReactElement {
	const scannerStore = useContext(ScannerContext);
	const networksContextState = useContext(NetworksContext);
	const [enableScan, setEnableScan] = useState<boolean>(true);
	const [lastFrame, setLastFrame] = useState<null | string>(null);
	const [mockIndex, onMockBarCodeRead] = useInjectionQR();
	const [multiFrames, setMultiFrames] = useState<Frames>({
		completedFramesCount: 0,
		isMultipart: false,
		missedFrames: [],
		missingFramesMessage: '',
		totalFramesCount: 0
	});
	function showAlertMessage(
		title: string,
		message: string,
		isAddNetworkSuccess?: boolean
	): void {
		const clearByTap = async (): Promise<void> => {
			scannerStore.cleanup();
			scannerStore.setReady();
			setLastFrame(null);
			setEnableScan(true);
		};
		setEnableScan(false);

		// if (isAddNetworkSuccess) {
		// 	setAlert(title, message, [
		// 		{
		// 			testID: testIDs.QrScanner.networkAddSuccessButton,
		// 			text: 'Done'
		// 		}
		// 	]);
		// } else {
		// 	setAlert(title, message, [
		// 		{
		// 			onPress: clearByTap,
		// 			text: 'Try again'
		// 		}
		// 	]);
		// }
	}

	const processBarCode = useProcessBarCode(
		showAlertMessage,
		networksContextState
	);
	// useEffect((): (() => void) => {
	// 	const unsubscribeFocus = navigation.addListener('focus', () => {
	// 		setLastFrame(null);
	// 		scannerStore.setReady();
	// 	});
	// 	const unsubscribeBlur = navigation.addListener(
	// 		'blur',
	// 		scannerStore.setBusy
	// 	);
	// 	return (): void => {
	// 		unsubscribeFocus();
	// 		unsubscribeBlur();
	// 	};
	// }, [navigation, scannerStore.setReady, scannerStore.setBusy]);
	useEffect(() => {
		const {
			missedFrames,
			completedFramesCount,
			totalFrameCount
		} = scannerStore.state;
		setMultiFrames({
			completedFramesCount,
			isMultipart: totalFrameCount > 1,
			missedFrames,
			missingFramesMessage: missedFrames && missedFrames.join(', '),
			totalFramesCount: totalFrameCount
		});
	}, [lastFrame, scannerStore.state]);

	const onBarCodeRead = async (event: any): Promise<void> => {
		if (event.type !== RNCamera.Constants.BarCodeType.qr) return;
		if (!enableScan) {
			return;
		}
		if (event.rawData === lastFrame) {
			return;
		}
		setLastFrame(event.rawData);
		const addressOrUndefined = await processBarCode(event as TxRequestData);
		if (route.params?.setAddress) {
			if (addressOrUndefined) {
				navigation.goBack();
				route.params.setAddress(addressOrUndefined);
			} else {
				navigation.goBack();
				showMessage('Could not parse address');
			}
		}
	};

	useEffect(() => {
		/** E2E Test Injection Code **/
		if (global.inTest && global.scanRequest !== undefined) {
			onMockBarCodeRead(
				global.scanRequest,
				async (tx: TxRequestData): Promise<void> => {
					await processBarCode(tx);
				}
			);
		}
		/* eslint-disable-next-line react-hooks/exhaustive-deps */
	}, [mockIndex]);

	const {
		completedFramesCount,
		isMultipart,
		missedFrames,
		totalFramesCount,
		missingFramesMessage
	} = multiFrames;
	return (
		<View style={{ backgroundColor: colors.text.white, flex: 1 }}>
			<RNCamera captureAudio={false} onBarCodeRead={onBarCodeRead}>
				<View style={styles.middle}>
					<View style={styles.middleLeft} />
					<View style={styles.middleCenter} />
					<View style={styles.middleRight} />
				</View>
				{isMultipart ? (
					<View style={styles.bottom}>
						<Text style={styles.descTitle}>
							Scanning Multipart Data, Please Hold Still...
						</Text>
						<Text style={styles.descSecondary}>
							{completedFramesCount} / {totalFramesCount} Completed.
						</Text>
						<Button
							onPress={(): void => scannerStore.clearMultipartProgress()}
							title="Start Over"
						/>
					</View>
				) : (
					<View style={styles.bottom}>
						<Text style={styles.descTitle}>Scan QR Code</Text>
					</View>
				)}
				{missedFrames && missedFrames.length >= 1 && (
					<View style={styles.bottom}>
						<Text style={styles.descTitle}>
							Missing following frame(s): {missingFramesMessage}
						</Text>
					</View>
				)}
			</RNCamera>
		</View>
	);
}

const styles = StyleSheet.create({
	bottom: {
		alignItems: 'center',
		backgroundColor: colors.background.light,
		flex: 1,
		justifyContent: 'flex-start',
		paddingHorizontal: 15
	},
	descSecondary: {
		color: colors.text.white,
		fontFamily: fonts.bold,
		fontSize: 14,
		paddingBottom: 20
	},
	descTitle: {
		color: colors.text.app,
		fontFamily: fonts.bold,
		fontSize: 18,
		height: 200,
		paddingBottom: 10,
		paddingTop: 20,
		textAlign: 'center'
	},
	middle: {
		backgroundColor: 'transparent',
		flexBasis: 280,
		flexDirection: 'row'
	},
	middleCenter: {
		backgroundColor: 'transparent',
		borderWidth: 1,
		flexBasis: 280
	},
	middleLeft: {
		backgroundColor: colors.background.light,
		flex: 1
	},
	middleRight: {
		backgroundColor: colors.background.light,
		flex: 1
	}
});
