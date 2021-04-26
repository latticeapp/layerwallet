import React, { useContext, useEffect, useReducer } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { ApiPromise } from '@polkadot/api/promise';
import { WsProvider } from '@polkadot/rpc-provider';
import { TypeRegistry } from '@polkadot/types';

import { NetworksContext, NetworksContextState } from './NetworkContext';
import { RegistriesContext, RegistriesStoreState } from './RegistriesContext';

import { isSubstrateNetworkParams } from 'types/networkTypes';

export type ApiStoreState = {
	api: ApiPromise | null;
	apiError: string | null;
	url: string;
	isApiConnected: boolean;
	isApiInitialized: boolean;
	isApiReady: boolean;
};

export type ApiContextState = {
	state: ApiStoreState;
	initApi: (networkKey: string, url?: string) => void;
	disconnect: () => void;
};

const defaultApiState = {
	api: null,
	apiError: null,
	isApiConnected: false,
	isApiInitialized: false,
	isApiReady: false,
	url: ''
};

export function useApiContext(
	networksContext: NetworksContextState,
	registriesContext: RegistriesStoreState
): ApiContextState {
	const { networks, getNetwork } = networksContext;
	const { getTypeRegistry } = registriesContext;

	const initialState: ApiStoreState = defaultApiState;
	const reducer = (
		state: ApiStoreState,
		delta: Partial<ApiStoreState>
	): ApiStoreState => {
		return {
			...state,
			...delta
		};
	};
	const [state, setState] = useReducer(reducer, initialState);

	// TODO: load an initial context
	const onConnected = (): void =>
		setState({ apiError: null, isApiConnected: true });
	const onDisconnected = (): void => setState({ isApiConnected: false });
	const onError = (error: Error): void =>
		setState({ apiError: error.message, isApiReady: false });
	const onReady = (): void => {
		setState({ apiError: null, isApiReady: true });
		console.log('API READY');
	};

	// TODO: ensure this cleanup works as expected
	async function disconnectAsync(): Promise<void> {
		if (state.api && state.api.isConnected) {
			console.log('DISCONNECTING API');
			const api = state.api;
			setState({
				api: null,
				apiError: null,
				isApiConnected: false,
				isApiInitialized: false,
				isApiReady: false,
				url: ''
			});
			api.off('connected', onConnected);
			api.off('disconnected', onDisconnected);
			api.off('error', onError);
			api.off('ready', onReady);
			return api.disconnect();
		}
	}

	function disconnect(): void {
		disconnectAsync();
	}

	async function restoreApi(): Promise<void> {
		if (!state.api) return;
		const api = new ApiPromise({ source: state.api });
		console.log('RESTORING API');
		api.on('connected', onConnected);
		api.on('disconnected', onDisconnected);
		api.on('error', onError);
		api.on('ready', onReady);
		setState({ apiError: null, isApiInitialized: true });
		await api.isReady;
	}

	function initApi(networkKey: string, url?: string): void {
		// populate default url if omitted
		if (!url) {
			const networkParams = getNetwork(networkKey);
			if (!isSubstrateNetworkParams(networkParams)) return;
			url = networkParams.url;
		}

		// if not changing url, ignore call
		if (state.url === url) return;
		const registryData = getTypeRegistry(networks, networkKey);
		if (!registryData) return;
		const [registry, metadata] = registryData;
		disconnect();

		console.log(`CREATING API: ${url}`);
		setState({ url });
		const provider = new WsProvider(url, false); // disable automatic reconnect
		provider
			.connect()
			.then(_result => {
				console.log('WSPROVIDER CONNECTED');
			})
			.catch(_error => {
				console.log('WSPROVIDER DISCONNECTED', _error);
			});
		const api = new ApiPromise({
			metadata,
			provider,
			registry
		});

		api.on('connected', onConnected);
		api.on('disconnected', onDisconnected);
		api.on('error', onError);
		api.on('ready', onReady);

		setState({ api, apiError: null, isApiInitialized: true });
	}

	// manage entering/leaving the app
	const [appState, setAppState] = React.useState<AppStateStatus>(
		AppState.currentState
	);

	React.useEffect(() => {
		const _handleAppStateChange = async (
			nextAppState: AppStateStatus
		): Promise<void> => {
			console.log(`state change triggered: ${appState} -> ${nextAppState}`);
			if (nextAppState.match(/inactive|background/) && appState === 'active') {
				// disconnect on inactive
				await disconnectAsync();
			} else if (
				nextAppState === 'active' &&
				(appState === 'inactive' || appState === 'background')
			) {
				// reconnect on active if not connected
				await restoreApi();
			}
			setAppState(nextAppState);
		};
		AppState.addEventListener('change', _handleAppStateChange);

		return (): void => {
			AppState.removeEventListener('change', _handleAppStateChange);
		};
	}, [appState]);

	return {
		disconnect,
		initApi,
		state
	};
}

export const ApiContext = React.createContext({} as ApiContextState);
