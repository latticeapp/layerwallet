import { RouteProp } from '@react-navigation/native';
import {
	GestureResponderEvent,
	NativeSyntheticEvent,
	TextInputChangeEventData,
	TextInputFocusEventData
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

import { AccountsContextState } from 'stores/AccountsContext';
import { ScannerContextState } from 'stores/ScannerContext';
import { AccountsStoreStateWithWallet, Wallet } from 'types/walletTypes';
import { RootStackParamList } from 'types/routes';

export interface NavigationProps<ScreenName extends keyof RootStackParamList> {
	route: RouteProp<RootStackParamList, ScreenName>;
	navigation: StackNavigationProp<RootStackParamList, ScreenName>;
}

export type ButtonListener = (event: GestureResponderEvent) => void;
export type TextChangeListener = (
	event: NativeSyntheticEvent<TextInputChangeEventData>
) => void;
export type FocusListener = (
	event: NativeSyntheticEvent<TextInputFocusEventData>
) => void;

export interface NavigationAccountIdentityProps<
	ScreenName extends keyof RootStackParamList
> extends NavigationProps<ScreenName> {
	accountsStore: AccountsStoreStateWithWallet;
}

export interface NavigationTargetIdentityProps<
	ScreenName extends keyof RootStackParamList
> extends NavigationProps<ScreenName> {
	targetIdentity: Wallet;
}

export interface NavigationAccountScannerProps<
	ScreenName extends keyof RootStackParamList
> extends NavigationProps<ScreenName> {
	scannerStore: ScannerContextState;
	accountsStore: AccountsContextState;
}

export interface NavigationScannerProps<
	ScreenName extends keyof RootStackParamList
> extends NavigationProps<ScreenName> {
	scannerStore: ScannerContextState;
}
