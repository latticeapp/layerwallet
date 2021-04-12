import React, { Component, ReactElement } from 'react';
import { View, Text, Animated } from 'react-native';

import { colors, fonts } from 'styles';

export default class LoadingContainer extends Component {
	state = {
		progressStatus: 0
	};
	anim = new Animated.Value(0);

	componentDidMount(): void {
		this.onAnimate();
	}

	onAnimate(): void {
		this.anim.addListener(({ value }) => {
			this.setState({ progressStatus: parseInt(value, 10) });
		});
		Animated.timing(this.anim, {
			duration: 5000,
			toValue: 100,
			useNativeDriver: true
		}).start();
	}

	render(): ReactElement {
		return (
			<>
				<View
					style={{
						backgroundColor: colors.background.accent,
						flex: 1,
						height: '100%',
						width: '100%'
					}}
				>
					<View style={{ paddingTop: '100%' }}>
						<View
							style={{
								borderColor: colors.text.white,
								borderRadius: 7,
								borderWidth: 1,
								height: 14,
								marginBottom: 20,
								marginLeft: '15%',
								width: '70%'
							}}
						>
							<Animated.View
								style={{
									backgroundColor: colors.text.white,
									borderRadius: 4,
									height: 8,
									marginLeft: 2,
									marginTop: 2,
									transition: 'all 0.25s',
									width: `${this.state.progressStatus * 0.985}%`
								}}
							/>
						</View>
						<Text
							style={{
								color: colors.text.white,
								fontFamily: fonts.bold,
								fontSize: 16,
								textAlign: 'center',
								width: '100%'
							}}
						>
							Updating metadata... {this.state.progressStatus}%
						</Text>
					</View>
				</View>
			</>
		);
	}
}
