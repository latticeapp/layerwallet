import { SubstrateNetworkParams } from './networkTypes';
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
	CustomNetwork: {
		url: string;
		setUrl: (url: string) => void;
	};
	Settings: undefined;
	MessageDetails: undefined;
	Empty: undefined;
	ReceiveBalance: { path: string };
	SendBalance: { path: string };
	SendBalanceAddAddress: { path: string };
	Security: undefined;
	QrScanner: { setAddress?: (address: string) => void } | undefined;
	SignTransactionFinish: undefined;
	TxDetails: undefined;
};
