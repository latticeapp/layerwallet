import { default as React, useEffect, useReducer } from 'react';

import {
	ETHEREUM_NETWORK_LIST,
	NetworkProtocols,
	UnknownNetworkKeys
} from 'constants/networkSpecs';
import { NetworksContextState } from 'stores/NetworkContext';
import { AccountsStoreState, FoundAccount, Wallet } from 'types/walletTypes';
import { NetworkParams, SubstrateNetworkParams } from 'types/networkTypes';
import { generateAccountId } from 'utils/account';
import { loadWallets, saveWallets } from 'utils/db';
import {
	accountExistedError,
	addressGenerateError,
	duplicatedWalletError,
	emptyWalletError,
	walletUpdateError
} from 'utils/errors';
import {
	deepCopyWallets,
	deepCopyWallet,
	emptyWallet,
	extractAddressFromAccountId,
	getAddressKeyByPath,
	getNetworkKey,
	isEthereumAccountId
} from 'utils/walletsUtils';
import { brainWalletAddressWithRef, encryptData } from 'utils/native';
import {
	CreateSeedRefWithNewSeed,
	TryBrainWalletAddress,
	TrySubstrateAddress
} from 'utils/seedRefHooks';
import { PIN } from 'constants/pin';

export type AccountsContextState = {
	clearWallet: () => void;
	state: AccountsStoreState;
	deriveEthereumAccount: (
		createBrainWalletAddress: TryBrainWalletAddress,
		networkKey: string,
		allNetworks: Map<string, NetworkParams>
	) => Promise<void>;
	getById: (
		address: string,
		networkKey: string,
		networkContext: NetworksContextState
	) => null | FoundAccount;
	getAccountByAddress: (
		address: string,
		networkContext: NetworksContextState
	) => false | FoundAccount;
	getWalletByAccountId: (accountId: string) => Wallet | undefined;
	saveNewWallet: (
		seedPhrase: string,
		generateSeedRef: CreateSeedRefWithNewSeed
	) => Promise<void>;
	selectWallet: (wallet: Wallet) => void;
	updateNewWallet: (walletUpdate: Partial<Wallet>) => void;
	updateWalletName: (name: string) => void;
	updatePathName: (path: string, name: string) => void;
	deriveNewPath: (
		newPath: string,
		createSubstrateAddress: TrySubstrateAddress,
		networkParams: SubstrateNetworkParams,
		name: string
	) => Promise<void>;
	deleteWallet: (wallet: Wallet) => Promise<void>;
	deleteCurrentAddress: () => void;
};

const defaultAccountState = {
	currentWallet: null,
	wallets: [],
	loaded: false,
	newWallet: emptyWallet()
};

export function useAccountContext(): AccountsContextState {
	const initialState: AccountsStoreState = defaultAccountState;

	const reducer = (
		state: AccountsStoreState,
		delta: Partial<AccountsStoreState>
	): AccountsStoreState => ({
		...state,
		...delta
	});
	const [state, setState] = useReducer(reducer, initialState);
	useEffect(() => {
		const loadInitialContext = async (): Promise<void> => {
			const wallets = await loadWallets();
			const currentWallet = wallets.length > 0 ? wallets[0] : null;
			setState({
				currentWallet,
				wallets,
				loaded: true
			});
		};
		loadInitialContext();
	}, []);

	function _updateWalletswithCurrentWallet(
		updatedCurrentWallet: Wallet
	): void {
		setState({
			currentWallet: updatedCurrentWallet
		});
		const newWallets = deepCopyWallets(state.wallets);
		if (state.currentWallet === null) return;
		const walletIndex = newWallets.findIndex(
			(wallet: Wallet) =>
				wallet.encryptedSeed === state.currentWallet!.encryptedSeed
		);
		newWallets.splice(walletIndex, 1, updatedCurrentWallet);
		setState({ wallets: newWallets });
		saveWallets(newWallets);
	}

	function _updateCurrentWallet(updatedWallet: Wallet): void {
		try {
			_updateWalletswithCurrentWallet(updatedWallet);
		} catch (error) {
			throw new Error(walletUpdateError);
		}
	}

	function updateWalletName(name: string): void {
		const updatedCurrentWallet = deepCopyWallet(state.currentWallet!);
		updatedCurrentWallet.name = name;
		_updateCurrentWallet(updatedCurrentWallet);
	}

	async function deriveEthereumAccount(
		createBrainWalletAddress: TryBrainWalletAddress,
		networkKey: string,
		allNetworks: Map<string, NetworkParams>
	): Promise<void> {
		const networkParams = ETHEREUM_NETWORK_LIST[networkKey];
		const ethereumAddress = await brainWalletAddressWithRef(
			createBrainWalletAddress
		);
		if (ethereumAddress.address === '') throw new Error(addressGenerateError);
		const { ethereumChainId } = networkParams;
		const accountId = generateAccountId(
			ethereumAddress.address,
			networkKey,
			allNetworks
		);
		if (state.currentWallet === null) throw new Error(emptyWalletError);
		const updatedCurrentWallet = deepCopyWallet(state.currentWallet);
		if (updatedCurrentWallet.meta.has(ethereumChainId))
			throw new Error(accountExistedError);
		updatedCurrentWallet.meta.set(ethereumChainId, {
			address: ethereumAddress.address,
			createdAt: new Date().getTime(),
			name: '',
			updatedAt: new Date().getTime()
		});
		updatedCurrentWallet.addresses.set(accountId, ethereumChainId);
		_updateCurrentWallet(updatedCurrentWallet);
	}

	function _getAccountFromWallet(
		accountIdOrAddress: string,
		networkContext: NetworksContextState
	): false | FoundAccount {
		const { allNetworks } = networkContext;
		const isAccountId = accountIdOrAddress.split(':').length > 1;
		let targetAccountId = null;
		let targetWallet = null;
		let targetNetworkKey = null;
		let targetPath = null;
		for (const wallet of state.wallets) {
			const searchList = Array.from(wallet.addresses.entries());
			for (const [addressKey, path] of searchList) {
				const networkKey = getNetworkKey(path, wallet, networkContext);
				let accountId, address;
				if (isEthereumAccountId(addressKey)) {
					accountId = addressKey;
					address = extractAddressFromAccountId(addressKey);
				} else {
					accountId = generateAccountId(addressKey, networkKey, allNetworks);
					address = addressKey;
				}
				const searchAccountIdOrAddress = isAccountId ? accountId : address;
				const found = isEthereumAccountId(accountId)
					? searchAccountIdOrAddress.toLowerCase() ===
					  accountIdOrAddress.toLowerCase()
					: searchAccountIdOrAddress === accountIdOrAddress;
				if (found) {
					targetPath = path;
					targetWallet = wallet;
					targetAccountId = accountId;
					targetNetworkKey = networkKey;
					break;
				}
			}
		}

		if (
			targetPath === null ||
			targetWallet === null ||
			targetAccountId === null
		)
			return false;
		setState({ currentWallet: targetWallet });

		const metaData = targetWallet.meta.get(targetPath);
		if (metaData === undefined) return false;
		return {
			accountId: targetAccountId,
			encryptedSeed: targetWallet.encryptedSeed,
			networkKey: targetNetworkKey!,
			path: targetPath,
			validBip39Seed: true,
			...metaData
		};
	}

	function getById(
		address: string,
		networkKey: string,
		networkContext: NetworksContextState
	): null | FoundAccount {
		const { allNetworks } = networkContext;
		const accountId = generateAccountId(address, networkKey, allNetworks);
		let derivedAccount;
		//assume it is an accountId
		if (networkKey !== UnknownNetworkKeys.UNKNOWN) {
			derivedAccount = _getAccountFromWallet(accountId, networkContext);
		}
		//TODO backward support for user who has create account in known network for an unknown network. removed after offline network update
		derivedAccount =
			derivedAccount || _getAccountFromWallet(address, networkContext);

		if (derivedAccount instanceof Object) return { ...derivedAccount };
		return null;
	}

	function getAccountByAddress(
		address: string,
		networkContext: NetworksContextState
	): false | FoundAccount {
		if (!address) {
			return false;
		}

		return _getAccountFromWallet(address, networkContext);
	}

	function getWalletByAccountId(accountId: string): Wallet | undefined {
		const networkProtocol = accountId.split(':')[0];
		const searchAddress =
			networkProtocol === NetworkProtocols.SUBSTRATE
				? extractAddressFromAccountId(accountId)
				: accountId;
		return state.wallets.find(wallet => wallet.addresses.has(searchAddress));
	}

	async function _updateWalletPath(
		newPath: string,
		createSubstrateAddress: TrySubstrateAddress,
		updatedWallet: Wallet,
		name: string,
		networkParams: SubstrateNetworkParams
	): Promise<Wallet> {
		const { prefix, pathId } = networkParams;
		if (updatedWallet.meta.has(newPath)) throw new Error(accountExistedError);
		let address = '';
		try {
			address = await createSubstrateAddress('', prefix);
		} catch (e) {
			throw new Error(addressGenerateError);
		}
		if (address === '') throw new Error(addressGenerateError);
		const pathMeta = {
			address,
			createdAt: new Date().getTime(),
			name,
			networkPathId: pathId,
			updatedAt: new Date().getTime()
		};
		// always clear all addresses on switch
		updatedWallet.meta.clear();
		updatedWallet.meta.set(newPath, pathMeta);
		updatedWallet.currentAddress = address;
		return updatedWallet;
	}

	async function saveNewWallet(
		seedPhrase: string,
		generateSeedRef: CreateSeedRefWithNewSeed
	): Promise<void> {
		const updatedWallet = deepCopyWallet(state.newWallet);
		const suri = seedPhrase;

		updatedWallet.encryptedSeed = await encryptData(suri, PIN);
		//prevent duplication
		if (
			state.wallets.find(i => i.encryptedSeed === updatedWallet.encryptedSeed)
		)
			throw new Error(duplicatedWalletError);
		await generateSeedRef(updatedWallet.encryptedSeed, PIN);
		const newWallets = state.wallets.concat(updatedWallet);
		setState({
			currentWallet: updatedWallet,
			newWallet: emptyWallet(),
			wallets: newWallets
		});
		await saveWallets(newWallets);
	}

	function selectWallet(wallet: Wallet): void {
		setState({ currentWallet: wallet });
	}

	function clearWallet(): void {
		setState({ newWallet: emptyWallet() });
	}

	function updateNewWallet(walletUpdate: Partial<Wallet>): void {
		setState({
			newWallet: { ...state.newWallet, ...walletUpdate }
		});
	}

	function updatePathName(path: string, name: string): void {
		const updatedCurrentWallet = deepCopyWallet(state.currentWallet!);
		const updatedPathMeta = Object.assign(
			{},
			updatedCurrentWallet.meta.get(path),
			{ name }
		);
		updatedCurrentWallet.meta.set(path, updatedPathMeta);
		_updateCurrentWallet(updatedCurrentWallet);
	}

	async function deriveNewPath(
		newPath: string,
		createSubstrateAddress: TrySubstrateAddress,
		networkParams: SubstrateNetworkParams,
		name: string
	): Promise<void> {
		const updatedCurrentWallet = deepCopyWallet(state.currentWallet!);
		await _updateWalletPath(
			newPath,
			createSubstrateAddress,
			updatedCurrentWallet,
			name,
			networkParams
		);
		_updateCurrentWallet(updatedCurrentWallet);
	}

	function deleteCurrentAddress(): void {
		if (state.currentWallet === null) throw new Error(emptyWalletError);
		const updatedCurrentWallet = deepCopyWallet(state.currentWallet);
		updatedCurrentWallet.meta.clear();
		updatedCurrentWallet.addresses.clear();
		updatedCurrentWallet.currentAddress = undefined;
		updatedCurrentWallet.currentNetworkKey = undefined;
		updatedCurrentWallet.currentPath = undefined;
		_updateCurrentWallet(updatedCurrentWallet);
	}

	function deleteWallet(wallet: Wallet): Promise<void> {
		const newWallets = deepCopyWallets(state.wallets);
		const walletIndex = newWallets.findIndex(
			(i: Wallet) => wallet.encryptedSeed === i.encryptedSeed
		);
		newWallets.splice(walletIndex, 1);
		setState({
			currentWallet: newWallets.length >= 1 ? newWallets[0] : null,
			wallets: newWallets
		});
		saveWallets(newWallets);
	}

	return {
		clearWallet,
		deleteCurrentAddress,
		deleteWallet,
		deriveEthereumAccount,
		deriveNewPath,
		getAccountByAddress,
		getById,
		getWalletByAccountId,
		saveNewWallet,
		selectWallet,
		state,
		updateWalletName,
		updateNewWallet,
		updatePathName
	};
}

export const AccountsContext = React.createContext({} as AccountsContextState);
