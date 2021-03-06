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

/**
 * @typedef {Object} SURIObject
 * @property {string} phrase - The valid bip39 seed phrase
 * @property {string} derivePath - The derivation path consisting in `/soft` and or `//hard`, can be repeated and interchanges
 * @property {string} password - The optionnal password password without the `///`
 */

/**
 * @typedef {Object} DerivationPathObject
 * @property {string} derivePath - The derivation path consisting in `/soft` and or `//hard`, can be repeated and interchanges
 * @property {string} password - The optionnal password password without the `///`
 */

import { SURIObject } from 'types/scannerTypes';

/**
 * @description Extract the phrase, path and password from a SURI format for specifying secret keys `<secret>/<soft-key>//<hard-key>///<password>` (the `///password` may be omitted, and `/<soft-key>` and `//<hard-key>` maybe repeated and mixed).
 * @param {string} suri The SURI to be parsed
 * @returns {SURIObject}
 */

/**
 * @description Extract the path and password from a SURI format for specifying secret keys `/<soft-key>//<hard-key>///<password>` (the `///password` may be omitted, and `/<soft-key>` and `//<hard-key>` maybe repeated and mixed).
 * @param {string} input: suri The SURI to be parsed
 * @returns {DerivationPathObject}
 */

export function parseDerivationPath(
	input: string
): {
	derivePath: string;
	password: string;
} {
	const RE_CAPTURE = /^((?:\/\/?[^/]+)*)(?:\/\/\/(.*))?$/;
	const matches = input.match(RE_CAPTURE);
	let derivePath, password;

	if (matches) {
		[, derivePath = '', password = ''] = matches;
	} else {
		throw new Error('Invalid derivation path input.');
	}

	return {
		derivePath,
		password
	};
}

export function parseSURI(suri: string): SURIObject {
	const RE_CAPTURE = /^([\w ]+(?: +\w*)*)?(.*)$/;
	const matches = suri.match(RE_CAPTURE);
	let phrase,
		parsedDerivationPath,
		derivationPath = '';
	const ERROR = 'Invalid SURI input.';

	if (matches) {
		[, phrase, derivationPath = ''] = matches;
		try {
			parsedDerivationPath = parseDerivationPath(derivationPath);
		} catch {
			throw new Error(ERROR);
		}
	} else {
		throw new Error(ERROR);
	}

	if (!phrase) {
		throw new Error('SURI must contain a phrase.');
	}

	return {
		derivePath: parsedDerivationPath.derivePath || '',
		password: parsedDerivationPath.password || '',
		phrase
	};
}
