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

import { colors } from 'styles/index';
import {
	EthereumNetworkDefaultConstants,
	EthereumNetworkParams,
	NetworkParams,
	NetworkProtocol,
	SubstrateNetworkDefaultConstant,
	SubstrateNetworkParams,
	UnknownNetworkParams
} from 'types/networkTypes';

export const unknownNetworkPathId = '';

export const NetworkProtocols: Record<string, NetworkProtocol> = Object.freeze({
	ETHEREUM: 'ethereum',
	SUBSTRATE: 'substrate',
	UNKNOWN: 'unknown'
});

// accounts for which the network couldn't be found (failed migration, removed network)
export const UnknownNetworkKeys: Record<string, string> = Object.freeze({
	UNKNOWN: 'unknown'
});

// ethereumChainId is used as Network key for Ethereum networks
export const EthereumNetworkKeys: Record<string, string> = Object.freeze({
	// FRONTIER: '1',
	// ROPSTEN: '3',
	// GOERLI: '5'
});

// genesisHash is used as Network key for Substrate networks
export const SubstrateNetworkKeys: Record<string, string> = Object.freeze({
	// genesis hashes can be found at e.g. https://edgeware.subscan.io/block/0
	// or https://polkadot.js.org/apps/#/explorer/query/0
	BERESHEET:
		'0x67640d4c0087ed6b8d3d7654b7df557a0d14e470ce7b0ec0c0ba0e4d0ce2f5e8',
	EDGEWARE:
		'0x742a2ca70c2fda6cee4f8df98d64c4c670a052d9568058982dad9d5a7a135c5b',
	KUSAMA: '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe'
});

export const unknownNetworkParams: UnknownNetworkParams = {
	color: colors.text.error,
	order: 99,
	pathId: unknownNetworkPathId,
	prefix: 2,
	protocol: NetworkProtocols.UNKNOWN,
	secondaryColor: colors.background.card,
	title: 'Unknown network'
};

export const dummySubstrateNetworkParams: SubstrateNetworkParams = {
	...unknownNetworkParams,
	decimals: 12,
	deleted: false,
	genesisHash: UnknownNetworkKeys.UNKNOWN,
	logo: require('res/img/logos/Substrate_Dev.png'),
	protocol: NetworkProtocols.SUBSTRATE,
	unit: 'UNIT',
	url: ''
};

const unknownNetworkBase: Record<string, UnknownNetworkParams> = {
	[UnknownNetworkKeys.UNKNOWN]: unknownNetworkParams
};

const substrateNetworkBase: Record<string, SubstrateNetworkDefaultConstant> = {
	[SubstrateNetworkKeys.BERESHEET]: {
		color: '#000',
		decimals: 18,
		genesisHash: SubstrateNetworkKeys.BERESHEET,
		isTestnet: true,
		logo: require('res/img/logos/Edgeware.png'),
		order: 1,
		pathId: 'edgeware',
		prefix: 7,
		title: 'Beresheet',
		unit: 'tEDG',
		url: 'wss://beresheet1.edgewa.re'
	},
	[SubstrateNetworkKeys.EDGEWARE]: {
		color: '#000',
		decimals: 18,
		genesisHash: SubstrateNetworkKeys.EDGEWARE,
		isTestnet: false,
		logo: require('res/img/logos/Edgeware.png'),
		order: 0,
		pathId: 'edgeware',
		prefix: 7,
		title: 'Edgeware',
		unit: 'EDG',
		url: 'wss://mainnet1.edgewa.re'
	},
	[SubstrateNetworkKeys.KUSAMA]: {
		color: '#000',
		decimals: 12,
		genesisHash: SubstrateNetworkKeys.KUSAMA,
		isTestnet: false,
		logo: require('res/img/logos/Kusama.png'),
		order: 2,
		pathId: 'kusama',
		prefix: 2,
		title: 'Kusama',
		unit: 'KSM',
		url: 'wss://kusama-rpc.polkadot.io'
	}
};

const ethereumNetworkBase: Record<string, EthereumNetworkDefaultConstants> = {
	// [EthereumNetworkKeys.FRONTIER]: {
	// 	color: '#8B94B3',
	// 	ethereumChainId: EthereumNetworkKeys.FRONTIER,
	// 	isTestnet: false,
	// 	order: 101,
	// 	secondaryColor: colors.background.card,
	// 	title: 'Ethereum'
	// },
	// [EthereumNetworkKeys.ROPSTEN]: {
	// 	ethereumChainId: EthereumNetworkKeys.ROPSTEN,
	// 	isTestnet: true,
	// 	order: 104,
	// 	title: 'Ropsten Testnet'
	// },
	// [EthereumNetworkKeys.GOERLI]: {
	// 	ethereumChainId: EthereumNetworkKeys.GOERLI,
	// 	isTestnet: true,
	// 	order: 105,
	// 	title: 'Görli Testnet'
	// }
};

const ethereumDefaultValues = {
	color: '#434875',
	logo: require('res/img/logos/Ethereum.png'),
	protocol: NetworkProtocols.ETHEREUM,
	secondaryColor: colors.background.card
};

const substrateDefaultValues = {
	color: '#4C4646',
	deleted: false,
	logo: require('res/img/logos/Substrate_Dev.png'),
	protocol: NetworkProtocols.SUBSTRATE,
	secondaryColor: colors.background.card
};

function setEthereumNetworkDefault(): Record<string, EthereumNetworkParams> {
	return Object.keys(ethereumNetworkBase).reduce((acc, networkKey) => {
		return {
			...acc,
			[networkKey]: {
				...ethereumDefaultValues,
				...ethereumNetworkBase[networkKey]
			}
		};
	}, {});
}

function setSubstrateNetworkDefault(): Record<string, SubstrateNetworkParams> {
	return Object.keys(substrateNetworkBase).reduce((acc, networkKey) => {
		return {
			...acc,
			[networkKey]: {
				...substrateDefaultValues,
				...substrateNetworkBase[networkKey]
			}
		};
	}, {});
}

export const ETHEREUM_NETWORK_LIST: Record<
	string,
	EthereumNetworkParams
> = Object.freeze(setEthereumNetworkDefault());
export const SUBSTRATE_NETWORK_LIST: Record<
	string,
	SubstrateNetworkParams
> = Object.freeze(setSubstrateNetworkDefault());
export const UNKNOWN_NETWORK: Record<
	string,
	UnknownNetworkParams
> = Object.freeze(unknownNetworkBase);

export const NETWORK_LIST: Record<string, NetworkParams> = Object.freeze(
	Object.assign(
		{},
		SUBSTRATE_NETWORK_LIST,
		ETHEREUM_NETWORK_LIST,
		UNKNOWN_NETWORK
	)
);

export const defaultNetworkKey = SubstrateNetworkKeys.KUSAMA;
