import { Wallet } from './walletTypes';

export type RootStackParamList = {
	Wallet: undefined;
	ShowRecoveryPhrase: { seedPhrase: string };
	RenameWallet: { wallet: Wallet };
	DeleteWallet: { wallet: Wallet };
	CreateWallet: undefined;
	CreateWallet2: undefined;
	CreateWallet3: { seedPhrase: string };
	CreateWalletImport: undefined;
	Settings: undefined;
	MessageDetails: undefined;
	Empty: undefined;
	ReceiveBalance: { path: string };
	SendBalance: { path: string };
	Security: undefined;
	SignTransaction: { isScanningNetworkSpec: true } | undefined;
	SignTransactionFinish: undefined;
	TxDetails: undefined;
};
