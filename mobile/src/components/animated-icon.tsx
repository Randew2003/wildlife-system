import { StyleSheet, Text, View } from 'react-native';

export function AnimatedSplashOverlay() {
  return null;
}

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Text style={styles.mark}>WO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    backgroundColor: '#14532d',
    borderRadius: 8,
    width: 128,
    height: 128,
    justifyContent: 'center',
  },
  mark: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0,
  },
});
