import { default as React, useEffect, useReducer } from 'react';

import { loadAddressBook, saveAddressBook } from 'utils/db';

export type AddressBookContextState = {
	saveAddressBookEntry: (address: string) => void;
	removeAddressBookEntry: (address: string) => void;
	getAddressBookEntries: () => string[];
};

const defaultAddressBookState = {
	addressBook: []
};

export function useAddressBookContext(): AddressBookContextState {
	const initialState: AddressBookContextState = defaultAddressBookState;

	const reducer = (
		state: AddressBookContextState,
		delta: Partial<AddressBookContextState>
	): AddressBookContextState => ({
		...state,
		...delta
	});
	const [state, setState] = useReducer(reducer, initialState);

	useEffect(() => {
		const loadInitialContext = async (): Promise<void> => {
			const addressBook = await loadAddressBook();
			setState({
				addressBook
			});
		};
		loadInitialContext();
	}, []);

	function saveAddressBookEntry(address: string): void {
		const shallowCopyAddressBook = state.addressBook.slice(0);
		const index = shallowCopyAddressBook.indexOf(address);
		if (index === -1) {
			shallowCopyAddressBook.push(address);
		}
		saveAddressBook(shallowCopyAddressBook);
	}

	function removeAddressBookEntry(address: string): void {
		const shallowCopyAddressBook = state.addressBook.slice(0);
		const index = shallowCopyAddressBook.indexOf(address);
		if (index !== -1) {
			shallowCopyAddressBook.splice(index, 1);
		}
		saveAddressBook(shallowCopyAddressBook);
	}

	function getAddressBookEntries(): string[] {
		return state.addressBook;
	}

	return {
		getAddressBookEntries,
		removeAddressBookEntry,
		saveAddressBookEntry
	};
}

export const AddressBookContext = React.createContext(
	{} as AddressBookContextState
);
