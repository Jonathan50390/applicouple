import { View, Text, StyleSheet } from 'react-native';

interface PointsDisplayProps {
  points: number;
  level: number;
}

export default function PointsDisplay({ points, level }: PointsDisplayProps) {
  return (
    <View style={styles.container}>
      <View style={styles.pointsCard}>
        <Text style={styles.label}>Points</Text>
        <Text style={styles.value}>{points}</Text>
      </View>
      <View style={styles.levelCard}>
        <Text style={styles.label}>Level</Text>
        <Text style={styles.value}>{level}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  pointsCard: {
    flex: 1,
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  levelCard: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 4,
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
});
