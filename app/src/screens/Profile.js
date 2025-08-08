import React from 'react';
import { Text, StyleSheet, View, Dimensions } from 'react-native';
import AnimatedContainer from '../components/AnimatedContainer';

const { width, height } = Dimensions.get('window');

export default function Profile() {
  return (
    <View style={styles.container}>
      <AnimatedContainer>
        <View style={styles.content}>
          <Text style={styles.textItems}>"Profile"</Text>
        </View>
      </AnimatedContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  textItems: { color: 'white' },
  content: {
    flex: 1,
    justifyContent: 'center', // Center vertically
    alignItems: 'center',
  },
});
