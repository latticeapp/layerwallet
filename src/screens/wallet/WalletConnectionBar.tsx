import React, { useContext } from 'react';
import { View, Text } from 'react-native';

import { colors, fonts } from 'styles/index';
import { ApiContext } from 'stores/ApiContext';

export function WalletConnectionBar({
	isDeriving,
	showConnected
}: {
	isDeriving?: boolean;
	showConnected?: boolean;
}): React.ReactElement | null {
	const { state } = useContext(ApiContext);
	const text = isDeriving
		? 'Deriving account...'
		: state.apiError
		? `ERROR: ${state.apiError}`
		: !state.isApiInitialized
		? 'Waiting for API connection...'
		: !state.isApiConnected
		? 'Connecting to API...'
		: !state.isApiReady
		? 'Connecting to API...'
		: showConnected
		? 'Connected!'
		: null;
	if (text === null) return null;

	return (
		<View
			style={{
				backgroundColor: colors.background.accentAlternate,
				paddingBottom: 13,
				paddingHorizontal: 24,
				paddingTop: 14,
				position: 'relative',
				top: -24,
				width: '100%'
			}}
		>
			<Text
				style={{
					color: colors.text.dark,
					fontFamily: fonts.regular,
					fontSize: 16
				}}
			>
				{text}
			</Text>
		</View>
	);
}
