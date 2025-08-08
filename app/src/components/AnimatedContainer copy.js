import React from 'react';
import { Text, StyleSheet, Animated, Dimensions, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ColorInterpolator from '../utils/ColorInterpolator.js';

const { width, height } = Dimensions.get('window');

export default class AnimatedContainer extends React.Component {
  constructor(props) {
    super(props);
    this.animation = new Animated.Value(0);
    this.state = {
      gradientColors: ['#000', '#222'],
      gradientOpacity: new Animated.Value(0.6),
    };
    this.colorInterpolator = new ColorInterpolator();
  }
  componentDidMount() {
    this.startAnimation();
    this.animation.addListener(({ value }) => {
      this.setState({
        gradientColors: [
          this.colorInterpolator.interpolate('#9bc063', '#455d3b', value),
          this.colorInterpolator.interpolate('#455d3b', '#455d3b', value),
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
          toValue: 1,
          duration: 5000,
          useNativeDriver: false,
        }),
        Animated.timing(this.animation, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }

  render() {
    return (
      <Animated.View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={this.state.gradientColors}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />

        {this.props.children}
      </Animated.View>
    );
  }
}
