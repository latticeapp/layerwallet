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

import { pathsRegex } from './regex';
import { decryptData } from './native';
import { parseSURI } from './suri';
import { generateAccountId } from './account';

import { NetworksContextState } from 'stores/NetworkContext';
import { SubstrateNetworkParams } from 'types/networkTypes';
import {
	ETHEREUM_NETWORK_LIST,
	SubstrateNetworkKeys,
	UnknownNetworkKeys,
	unknownNetworkPathId
} from 'constants/networkSpecs';
import {
	Account,
	FoundAccount,
	Wallet,
	SerializedWallet
} from 'types/walletTypes';
import {
	edgewareMetadata,
	kulupuMetadata,
	kusamaMetadata,
	polkadotMetaData,
	rococoMetadata,
	westendMetadata
} from 'constants/networkMetadata';
import { PIN } from 'constants/pin';

//walk around to fix the regular expression support for positive look behind;
const removeSlash = (str: string): string => str.replace(/\//g, '');

const extractPathId = (path: string, pathIds: string[]): string => {
	const matchNetworkPath = path.match(pathsRegex.networkPath);
	if (matchNetworkPath && matchNetworkPath[0]) {
		const targetPathId = removeSlash(matchNetworkPath[0]);
		if (pathIds.includes(targetPathId)) {
			return targetPathId;
		}
	}
	return unknownNetworkPathId;
};

const extractSubPathName = (path: string): string => {
	const pathFragments = path.match(pathsRegex.allPath);
	if (!pathFragments || pathFragments.length === 0) return '';
	if (pathFragments.length === 1) return removeSlash(pathFragments[0]);
	return removeSlash(pathFragments.slice(1).join(''));
};

export const isSubstratePath = (path: string): boolean =>
	path.match(pathsRegex.allPath) !== null || path === '';

export const isEthereumAccountId = (v: string): boolean =>
	v.indexOf('ethereum:') === 0;

export const extractAddressFromAccountId = (id: string): string => {
	const withoutNetwork = id.split(':')[1];
	const address = withoutNetwork.split('@')[0];
	if (address.indexOf('0x') !== -1) {
		return address.slice(2);
	}
	return address;
};

export const getAddressKeyByPath = (
	path: string,
	pathMeta: Account,
	networkContext: NetworksContextState
): string => {
	const { allNetworks } = networkContext;
	const address = pathMeta.address;
	return isSubstratePath(path)
		? address
		: generateAccountId(
				address,
				getNetworkKeyByPath(path, pathMeta, networkContext),
				allNetworks
		  );
};

export function emptyWallet(): Wallet {
	return {
		allAccounts: new Map(),
		encryptedSeed: '',
		name: ''
	};
}

const serializeWallet = (wallet: Wallet): SerializedWallet =>
	Object.entries(wallet).reduce((newWallet: any, entry: [string, any]) => {
		const [key, value] = entry;
		if (value instanceof Map) {
			newWallet[key] = Array.from(value.entries());
		} else {
			newWallet[key] = value;
		}
		return newWallet;
	}, {});

const deserializeWallet = (walletJSON: SerializedWallet): Wallet =>
	Object.entries(walletJSON).reduce((newWallet: any, entry: [string, any]) => {
		const [key, value] = entry;
		if (value instanceof Array) {
			newWallet[key] = new Map(value);
		} else {
			newWallet[key] = value;
		}
		return newWallet;
	}, {});

export const serializeWallets = (wallets: Wallet[]): string => {
	const walletsWithObject = wallets.map(serializeWallet);
	return JSON.stringify(walletsWithObject);
};

export const deserializeWallets = (walletsJSON: string): Wallet[] => {
	const walletsWithObject = JSON.parse(walletsJSON);
	return walletsWithObject.map(deserializeWallet);
};

export const deepCopyWallets = (wallets: Wallet[]): Wallet[] =>
	deserializeWallets(serializeWallets(wallets));

export const deepCopyWallet = (wallet: Wallet): Wallet =>
	deserializeWallet(serializeWallet(wallet));

export const getSubstrateNetworkKeyByPathId = (
	pathId: string,
	networks: Map<string, SubstrateNetworkParams>
): string => {
	const networkKeyIndex = Array.from(networks.entries()).findIndex(
		([, networkParams]) => networkParams.pathId === pathId
	);
	if (networkKeyIndex !== -1) {
		const findNetworkEntry: [string, SubstrateNetworkParams] = Array.from(
			networks.entries()
		)[networkKeyIndex];
		return findNetworkEntry[0];
	}
	return UnknownNetworkKeys.UNKNOWN;
};

export const getNetworkKey = (
	path: string,
	wallet: Wallet,
	networkContextState: NetworksContextState
): string => {
	if (wallet.account?.path === path) {
		return getNetworkKeyByPath(path, wallet.account!, networkContextState);
	}
	return UnknownNetworkKeys.UNKNOWN;
};

export const getNetworkKeyByPath = (
	path: string,
	pathMeta: Account,
	networkContextState: NetworksContextState
): string => {
	const { networks, pathIds } = networkContextState;
	if (!isSubstratePath(path) && ETHEREUM_NETWORK_LIST.hasOwnProperty(path)) {
		//It is a ethereum path
		return path;
	}
	const pathId = pathMeta.networkPathId || extractPathId(path, pathIds);

	return getSubstrateNetworkKeyByPathId(pathId, networks);
};

export const getWalletFromSender = (
	sender: FoundAccount,
	wallets: Wallet[]
): Wallet | undefined =>
	wallets.find(i => i.encryptedSeed === sender.encryptedSeed);

export const getAddressWithPath = (
	path: string,
	wallet: Wallet | null
): string => {
	if (wallet == null) return '';
	const account = wallet.account?.path === path ? wallet.account : undefined;
	if (!account) return '';
	const { address } = account;
	return isEthereumAccountId(address)
		? extractAddressFromAccountId(address)
		: address;
};

export const getWalletSeed = async (wallet: Wallet): Promise<string> => {
	const { encryptedSeed } = wallet;
	const seed = await decryptData(encryptedSeed, PIN);
	const { phrase } = parseSURI(seed);
	return phrase;
};

export const getExistedNetworkKeys = (wallet: Wallet): string[] => {
	return wallet.account ? [wallet.account.networkKey] : [];
};

export const validateDerivedPath = (derivedPath: string): boolean =>
	pathsRegex.validateDerivedPath.test(derivedPath);

export const getWalletName = (wallet: Wallet, wallets: Wallet[]): string => {
	if (wallet.name) return wallet.name;
	const walletIndex = wallets.findIndex(
		i => i.encryptedSeed === wallet.encryptedSeed
	);
	return `Wallet #${walletIndex + 1}`;
};

export const getPathName = (
	path: string,
	lookUpwallet: Wallet | null
): string => {
	if (
		lookUpwallet &&
		lookUpwallet.account?.path === path &&
		lookUpwallet.name !== ''
	) {
		return lookUpwallet.name;
	}
	if (!isSubstratePath(path)) return 'No name';
	if (path === '') return 'Wallet root';
	return extractSubPathName(path);
};

export const getMetadata = (networkKey: string): [string, number] | null => {
	switch (networkKey) {
		case SubstrateNetworkKeys.KUSAMA:
			return [kusamaMetadata, 2029];
		case SubstrateNetworkKeys.WESTEND:
			return [westendMetadata, 49];
		case SubstrateNetworkKeys.EDGEWARE:
			return [edgewareMetadata, 45];
		case SubstrateNetworkKeys.KULUPU:
			return [kulupuMetadata, 17];
		case SubstrateNetworkKeys.POLKADOT:
			return [polkadotMetaData, 29];
		case SubstrateNetworkKeys.ROCOCO:
			return [rococoMetadata, 229];
		default:
			return null;
	}
};
