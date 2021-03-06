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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useContext } from 'react';

import strings from './strings';

import { AccountsContext } from 'stores/AccountsContext';
import { NetworksContextState } from 'stores/NetworkContext';
import { ScannerContext } from 'stores/ScannerContext';
import { SeedRefsContext, SeedRefsState } from 'stores/SeedRefStore';
import { FoundAccount } from 'types/walletTypes';
import { isEthereumNetworkParams } from 'types/networkTypes';
import { RootStackParamList } from 'types/routes';
import {
	CompletedParsedData,
	EthereumParsedData,
	isAddressParsedData,
	isMultiFramesInfo,
	isMultipartData,
	isNetworkParsedData,
	NetworkParsedData,
	ParsedData,
	QrInfo,
	SubstrateParsedData,
	TxRequestData
} from 'types/scannerTypes';
import {
	constructDataFromBytes,
	isAddressString,
	isJsonString,
	rawDataToU8A
} from 'utils/decoders';
import {
	extractAddressFromAccountId,
	getWalletFromSender
} from 'utils/walletsUtils';
import { SeedRefClass } from 'utils/native';

function getSeedRef(
	encryptedSeed: string,
	seedRefs: Map<string, SeedRefClass>
): SeedRefClass | undefined {
	if (seedRefs.has(encryptedSeed)) {
		return seedRefs.get(encryptedSeed);
	}
}

export function useProcessBarCode(
	showAlertMessage: (
		title: string,
		message: string,
		isSuccess?: boolean
	) => void,
	networksContextState: NetworksContextState
): (txRequestData: TxRequestData) => Promise<undefined | string> {
	const { allNetworks, networks } = networksContextState;
	const accountsStore = useContext(AccountsContext);
	const scannerStore = useContext(ScannerContext);
	const [seedRefs] = useContext<SeedRefsState>(SeedRefsContext);
	const navigation: StackNavigationProp<
		RootStackParamList,
		'QrScanner'
	> = useNavigation();

	async function parseQrData(
		txRequestData: TxRequestData
	): Promise<ParsedData> {
		if (isAddressString(txRequestData.data)) {
			const address = extractAddressFromAccountId(txRequestData.data);
			return {
				action: 'address',
				data: {
					address
				}
			};
		} else if (isJsonString(txRequestData.data)) {
			// Add Network
			const parsedJsonData = JSON.parse(txRequestData.data);
			if (parsedJsonData.hasOwnProperty('genesisHash')) {
				return {
					action: 'addNetwork',
					data: parsedJsonData
				} as NetworkParsedData;
			}
			// Ethereum Legacy
			return parsedJsonData;
		} else if (!scannerStore.state.multipartComplete) {
			const strippedData = rawDataToU8A(txRequestData.rawData);
			if (strippedData === null) throw new Error(strings.ERROR_NO_RAW_DATA);
			const parsedData = await constructDataFromBytes(
				strippedData,
				false,
				networks
			);
			return parsedData;
		} else {
			throw new Error(strings.ERROR_NO_RAW_DATA);
		}
	}

	async function checkMultiFramesData(
		parsedData: SubstrateParsedData | EthereumParsedData
	): Promise<null | CompletedParsedData> {
		if (isMultipartData(parsedData)) {
			const multiFramesResult = await scannerStore.setPartData(
				parsedData.currentFrame,
				parsedData.frameCount,
				parsedData.partData,
				networksContextState
			);
			if (isMultiFramesInfo(multiFramesResult)) {
				return null;
			}
			//Otherwise all the frames are assembled as completed parsed data
			return multiFramesResult;
		} else {
			return parsedData;
		}
	}

	async function _unlockSeedAndSign(
		sender: FoundAccount,
		qrInfo: QrInfo
	): Promise<void> {
		const senderNetworkParams = allNetworks.get(sender.networkKey);
		if (!senderNetworkParams) throw new Error(strings.ERROR_NO_NETWORK);
		const isEthereum = isEthereumNetworkParams(senderNetworkParams);

		// 1. check if sender existed
		const senderWallet = getWalletFromSender(
			sender,
			accountsStore.state.wallets
		);
		if (!senderWallet) throw new Error(strings.ERROR_NO_SENDER_IDENTITY);

		let seedRef = getSeedRef(sender.encryptedSeed, seedRefs);
		// 2. unlock and get Seed reference
		if (seedRef === undefined || !seedRef.isValid()) {
			seedRef = getSeedRef(sender.encryptedSeed, seedRefs)!;
		}
		// 3. sign data
		if (isEthereum) {
			await scannerStore.signEthereumData(
				seedRef.tryBrainWalletSign.bind(seedRef),
				qrInfo
			);
		} else {
			await scannerStore.signSubstrateData(
				seedRef.trySubstrateSign.bind(seedRef),
				'',
				qrInfo,
				networks
			);
		}
	}

	async function unlockAndNavigationToSignedQR(qrInfo: QrInfo): Promise<void> {
		const { sender } = qrInfo;
		if (!sender)
			return showAlertMessage(
				strings.ERROR_TITLE,
				strings.ERROR_NO_SENDER_FOUND
			);
		const seedRef = getSeedRef(sender.encryptedSeed, seedRefs);
		const isSeedRefValid = seedRef && seedRef.isValid();

		await _unlockSeedAndSign(sender, qrInfo);
		if (isSeedRefValid) {
			navigation.replace('SignTransactionFinish');
		} else {
			navigation.navigate('SignTransactionFinish');
		}
	}

	function addNewNetwork(networkParsedData: NetworkParsedData): void {
		networksContextState.addNetwork(networkParsedData);
		return showAlertMessage(
			strings.SUCCESS_TITLE,
			strings.SUCCESS_ADD_NETWORK + networkParsedData.data.title,
			true
		);
	}

	async function processBarCode(
		txRequestData: TxRequestData
	): Promise<undefined | string> {
		try {
			const parsedData = await parseQrData(txRequestData);
			if (isNetworkParsedData(parsedData)) {
				addNewNetwork(parsedData);
				return;
			}
			if (isAddressParsedData(parsedData)) {
				return parsedData.data.address;
			}
			const unsignedData = await checkMultiFramesData(parsedData);
			if (unsignedData === null) return;
			const qrInfo = await scannerStore.setData(
				accountsStore,
				unsignedData,
				networksContextState
			);

			await unlockAndNavigationToSignedQR(qrInfo);
			scannerStore.clearMultipartProgress();
		} catch (e) {
			showAlertMessage(strings.ERROR_TITLE, e.message);
		}
	}

	return processBarCode;
}
