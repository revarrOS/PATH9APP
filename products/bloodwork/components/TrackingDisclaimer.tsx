import { View, Text, StyleSheet } from 'react-native';

export function TrackingDisclaimer() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>For tracking only. Not medical advice.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FAFAFA',
  },
  text: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});
