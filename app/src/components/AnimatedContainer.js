import React from 'react';
import { Text, StyleSheet, Animated, Dimensions, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ColorInterpolator from '../utils/ColorInterpolator.js';

export default class AnimatedContainer extends React.Component {
  constructor(props) {
    super(props);
    this.animation = new Animated.Value(0);
    this.state = {
      gradientColors: ['#000', '#222'],
      gradientOpacity: new Animated.Value(0.3),
    };
    this.colorInterpolator = new ColorInterpolator();
  }
  componentDidMount() {
    this.startAnimation();
    this.animation.addListener(({ value }) => {
      this.setState({
        gradientColors: [
          this.colorInterpolator.interpolate('#000000', '#000000', value),
          this.colorInterpolator.interpolate('#FF8C00', '#000000', value),
        ],
      });
    });
  }

  componentWillUnmount() {
    this.animation.removeAllListeners();
  }

  startAnimation() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(this.animation, {
          toValue: 0.8,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(this.animation, {
          toValue: 0,
          duration: 10000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }

  render() {
    return (
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: 0.2 }]}>
        <LinearGradient
          colors={this.state.gradientColors}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.9, y: 0.5 }}
          end={{ x: 0.9, y: 0.02 }}
        />

        {this.props.children}
      </Animated.View>
    );
  }
}
