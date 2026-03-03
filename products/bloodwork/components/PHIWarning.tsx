import { View, Text, StyleSheet } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

export function PHIWarning() {
  return (
    <View style={styles.container}>
      <AlertCircle size={16} color="#666" style={styles.icon} />
      <Text style={styles.text}>
        Do not include personal identifiers (name, DOB, NHS number, hospital ID, address).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  icon: {
    marginRight: 8,
    marginTop: 2,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});
