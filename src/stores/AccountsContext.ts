import { default as React, useEffect, useReducer } from 'react';

import {
	ETHEREUM_NETWORK_LIST,
	NetworkProtocols,
	UnknownNetworkKeys
} from 'constants/networkSpecs';
import { NetworksContextState } from 'stores/NetworkContext';
import { AccountsStoreState, FoundAccount, Wallet } from 'types/walletTypes';
import { SubstrateNetworkParams } from 'types/networkTypes';
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
		networkKey: string
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
	deriveNewPath: (
		networkKey: string,
		newPath: string,
		createSubstrateAddress: TrySubstrateAddress,
		networkParams: SubstrateNetworkParams
	) => Promise<void>;
	deleteWallet: (wallet: Wallet) => void;
	clearAddress: () => void;
};

const defaultAccountState = {
	currentWallet: null,
	loaded: false,
	newWallet: emptyWallet(),
	wallets: []
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
				loaded: true,
				wallets
			});
		};
		loadInitialContext();
	}, []);

	function _updateCurrentWallet(updatedWallet: Wallet): void {
		try {
			setState({
				currentWallet: updatedWallet
			});
			const newWallets = deepCopyWallets(state.wallets);
			if (state.currentWallet === null) return;
			const walletIndex = newWallets.findIndex(
				(wallet: Wallet) =>
					wallet.encryptedSeed === state.currentWallet!.encryptedSeed
			);
			newWallets.splice(walletIndex, 1, updatedWallet);
			setState({ wallets: newWallets });
			saveWallets(newWallets);
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
		networkKey: string
	): Promise<void> {
		const networkParams = ETHEREUM_NETWORK_LIST[networkKey];
		const { ethereumChainId } = networkParams;
		if (state.currentWallet === null) throw new Error(emptyWalletError);
		const updatedCurrentWallet = deepCopyWallet(state.currentWallet);
		if (updatedCurrentWallet.account?.path === ethereumChainId)
			throw new Error(accountExistedError);
		if (updatedCurrentWallet.allAccounts.has(networkKey)) {
			updatedCurrentWallet.account = updatedCurrentWallet.allAccounts.get(
				networkKey
			);
		} else {
			const ethereumAddress = await brainWalletAddressWithRef(
				createBrainWalletAddress
			);
			if (ethereumAddress.address === '') throw new Error(addressGenerateError);
			updatedCurrentWallet.account = {
				address: ethereumAddress.address,
				createdAt: new Date().getTime(),
				networkKey,
				path: ethereumChainId,
				updatedAt: new Date().getTime()
			};
			updatedCurrentWallet.allAccounts.set(
				networkKey,
				updatedCurrentWallet.account
			);
		}
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
		for (const wallet of state.wallets) {
			if (!wallet.account) continue;
			const { address, networkKey } = wallet.account;
			const currentAccountId = generateAccountId(
				address,
				networkKey,
				allNetworks
			);

			const searchAccountIdOrAddress = isAccountId ? currentAccountId : address;
			const found = isEthereumAccountId(currentAccountId)
				? searchAccountIdOrAddress.toLowerCase() ===
				  accountIdOrAddress.toLowerCase()
				: searchAccountIdOrAddress === accountIdOrAddress;
			if (found) {
				targetWallet = wallet;
				targetAccountId = currentAccountId;
				break;
			}
		}

		if (targetWallet === null || targetAccountId === null) return false;
		setState({ currentWallet: targetWallet });

		const account = targetWallet.account;
		if (account === undefined) return false;
		return {
			accountId: targetAccountId,
			encryptedSeed: targetWallet.encryptedSeed,
			name: targetWallet.name,
			validBip39Seed: true,
			...account
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
		return state.wallets.find(
			wallet => wallet?.account?.address === searchAddress
		);
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

	async function deriveNewPath(
		networkKey: string,
		newPath: string,
		createSubstrateAddress: TrySubstrateAddress,
		networkParams: SubstrateNetworkParams
	): Promise<void> {
		const updatedWallet = deepCopyWallet(state.currentWallet!);
		if (updatedWallet.allAccounts.has(networkKey)) {
			updatedWallet.account = updatedWallet.allAccounts.get(networkKey);
		} else {
			const { prefix, pathId } = networkParams;
			let address = '';
			try {
				address = await createSubstrateAddress('', prefix);
			} catch (e) {
				throw new Error(addressGenerateError);
			}
			if (address === '') throw new Error(addressGenerateError);
			const newAccount = {
				address,
				createdAt: new Date().getTime(),
				networkKey,
				networkPathId: pathId,
				path: newPath,
				updatedAt: new Date().getTime()
			};
			updatedWallet.account = newAccount;
			updatedWallet.allAccounts.set(networkKey, newAccount);
		}
		_updateCurrentWallet(updatedWallet);
	}

	function clearAddress(): void {
		if (state.currentWallet === null) throw new Error(emptyWalletError);
		const updatedCurrentWallet = deepCopyWallet(state.currentWallet);
		updatedCurrentWallet.account = undefined;
		_updateCurrentWallet(updatedCurrentWallet);
	}

	function deleteWallet(wallet: Wallet): void {
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
		clearAddress,
		clearWallet,
		deleteWallet,
		deriveEthereumAccount,
		deriveNewPath,
		getAccountByAddress,
		getById,
		getWalletByAccountId,
		saveNewWallet,
		selectWallet,
		state,
		updateNewWallet,
		updateWalletName
	};
}

export const AccountsContext = React.createContext({} as AccountsContextState);
