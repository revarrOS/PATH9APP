import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/config/theme';

interface RangePositionBarProps {
  latestValue: number;
  lowRange: number;
  typicalLow: number;
  typicalHigh: number;
  highRange: number;
  unit: string;
}

export function RangePositionBar({
  latestValue,
  lowRange,
  typicalLow,
  typicalHigh,
  highRange,
  unit,
}: RangePositionBarProps) {
  const totalRange = highRange - lowRange;
  const valuePosition = ((latestValue - lowRange) / totalRange) * 100;

  const clampedPosition = Math.max(0, Math.min(100, valuePosition));

  const getPositionStatus = () => {
    if (latestValue < typicalLow) return 'low';
    if (latestValue > typicalHigh) return 'high';
    return 'typical';
  };

  const status = getPositionStatus();

  const statusColors = {
    low: theme.colors.state.info,
    typical: theme.colors.state.success,
    high: theme.colors.state.warning,
  };

  const markerColor = statusColors[status];

  const typicalStart = ((typicalLow - lowRange) / totalRange) * 100;
  const typicalWidth = ((typicalHigh - typicalLow) / totalRange) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Below</Text>
        <Text style={[styles.label, styles.typicalLabel]}>Typical Range</Text>
        <Text style={styles.label}>Above</Text>
      </View>

      <View style={styles.barContainer}>
        <View style={styles.bar}>
          <View style={styles.lowSection} />
          <View
            style={[
              styles.typicalSection,
              {
                left: `${typicalStart}%`,
                width: `${typicalWidth}%`,
              }
            ]}
          />
          <View style={styles.highSection} />
        </View>

        <View
          style={[
            styles.marker,
            {
              left: `${clampedPosition}%`,
              backgroundColor: markerColor,
            },
          ]}
        >
          <View style={[styles.markerDot, { backgroundColor: markerColor }]} />
        </View>
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.valueText}>
          Current: <Text style={[styles.valueNumber, { color: markerColor }]}>
            {latestValue.toFixed(1)} {unit}
          </Text>
        </Text>
      </View>

      <View style={styles.rangeRow}>
        <Text style={styles.rangeText}>{lowRange.toFixed(1)}</Text>
        <Text style={styles.rangeText}>
          {typicalLow.toFixed(1)} – {typicalHigh.toFixed(1)}
        </Text>
        <Text style={styles.rangeText}>{highRange.toFixed(1)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  label: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
    fontWeight: theme.typography.fontWeights.semibold,
    flex: 1,
    textAlign: 'center',
  },
  typicalLabel: {
    flex: 1.5,
  },
  barContainer: {
    height: 40,
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  bar: {
    height: 24,
    borderRadius: theme.borderRadius.sm,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: theme.colors.background.tertiary,
    position: 'relative',
  },
  lowSection: {
    flex: 1,
    backgroundColor: theme.colors.state.info + '20',
  },
  typicalSection: {
    position: 'absolute',
    height: '100%',
    backgroundColor: theme.colors.state.success + '30',
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: theme.colors.state.success,
  },
  highSection: {
    flex: 1,
    backgroundColor: theme.colors.state.warning + '20',
  },
  marker: {
    position: 'absolute',
    top: 0,
    width: 3,
    height: 24,
    marginLeft: -1.5,
  },
  markerDot: {
    position: 'absolute',
    top: -6,
    left: -4.5,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  valueRow: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  valueText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  valueNumber: {
    fontWeight: theme.typography.fontWeights.bold,
    fontSize: theme.typography.fontSizes.md,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rangeText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
    flex: 1,
    textAlign: 'center',
  },
});
