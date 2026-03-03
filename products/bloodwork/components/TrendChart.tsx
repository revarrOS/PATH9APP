import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import Svg, { Line, Rect, Circle, Polyline } from 'react-native-svg';
import { theme } from '@/config/theme';
import { ExtendedSex, AgeRange, getReferenceRange } from '@/products/bloodwork/reference/ranges';

export interface TrendDataPoint {
  date: string;
  value: number;
  testId: string;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  markerName: string;
  unit: string;
  sex?: ExtendedSex;
  ageRange?: AgeRange;
}

export function TrendChart({ data, markerName, unit, sex, ageRange }: TrendChartProps) {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const sortedData = [...data].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const values = sortedData.map(d => d.value);
  const minDataValue = Math.min(...values);
  const maxDataValue = Math.max(...values);

  const refRange = sex && ageRange ? getReferenceRange(markerName, sex, ageRange) : null;

  const minValue = refRange
    ? Math.min(minDataValue, refRange.low) * 0.95
    : minDataValue * 0.95;
  const maxValue = refRange
    ? Math.max(maxDataValue, refRange.high) * 1.05
    : maxDataValue * 1.05;
  const valueRange = maxValue - minValue || 1;

  const padding = 16;
  const yAxisLabelWidth = refRange ? 50 : 0;
  const chartWidth = Dimensions.get('window').width - (theme.spacing.lg * 2) - (padding * 2) - yAxisLabelWidth;
  const chartHeight = 200;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit'
    });
  };

  const getPointPosition = (index: number, value: number) => {
    const x = (chartWidth / Math.max(sortedData.length - 1, 1)) * index;
    const y = chartHeight - ((value - minValue) / valueRange) * chartHeight;
    return { x, y };
  };

  const getYPosition = (value: number) => {
    return chartHeight - ((value - minValue) / valueRange) * chartHeight;
  };

  const getPositionLabel = (value: number): string => {
    if (!refRange) return '';

    if (value < refRange.low) {
      return 'Below typical';
    } else if (value > refRange.high) {
      return 'Above typical';
    } else {
      return 'Typical range';
    }
  };

  const linePoints = sortedData.map((point, index) => {
    const { x, y } = getPointPosition(index, point.value);
    return `${x},${y}`;
  }).join(' ');

  const hasReferenceContext = !!sex && !!ageRange;

  return (
    <View style={styles.container}>
      {!hasReferenceContext && (
        <View style={styles.helperContainer}>
          <Text style={styles.helperText}>
            Select age range and sex to view reference ranges
          </Text>
        </View>
      )}

      <View style={styles.chartContainer}>
        <View style={{ flexDirection: 'row' }}>
          {refRange && (
            <View style={[styles.yAxisLabels, { height: chartHeight }]}>
              <View style={[styles.yLabel, { top: getYPosition(refRange.high) - 8 }]}>
                <Text style={styles.yLabelText}>{refRange.high.toFixed(1)}</Text>
              </View>
              <View style={[styles.yLabel, { top: getYPosition(refRange.typical) - 8 }]}>
                <Text style={styles.yLabelText}>{refRange.typical.toFixed(1)}</Text>
              </View>
              <View style={[styles.yLabel, { top: getYPosition(refRange.low) - 8 }]}>
                <Text style={styles.yLabelText}>{refRange.low.toFixed(1)}</Text>
              </View>
            </View>
          )}
          <View style={[styles.chart, { width: chartWidth, height: chartHeight }]}>
            <Svg width={chartWidth} height={chartHeight}>
            {refRange && (
              <>
                <Rect
                  x={0}
                  y={getYPosition(refRange.high)}
                  width={chartWidth}
                  height={getYPosition(refRange.low) - getYPosition(refRange.high)}
                  fill={theme.colors.brand.cyan}
                  opacity={0.03}
                />

                <Line
                  x1={0}
                  y1={getYPosition(refRange.low)}
                  x2={chartWidth}
                  y2={getYPosition(refRange.low)}
                  stroke={theme.colors.text.muted}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  opacity={0.2}
                />

                <Line
                  x1={0}
                  y1={getYPosition(refRange.typical)}
                  x2={chartWidth}
                  y2={getYPosition(refRange.typical)}
                  stroke={theme.colors.text.muted}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  opacity={0.15}
                />

                <Line
                  x1={0}
                  y1={getYPosition(refRange.high)}
                  x2={chartWidth}
                  y2={getYPosition(refRange.high)}
                  stroke={theme.colors.text.muted}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  opacity={0.2}
                />
              </>
            )}

            {sortedData.length > 1 && (
              <Polyline
                points={linePoints}
                fill="none"
                stroke={theme.colors.brand.cyan}
                strokeWidth={3.5}
              />
            )}

            {sortedData.map((point, index) => {
              const { x, y } = getPointPosition(index, point.value);
              return (
                <Circle
                  key={point.testId}
                  cx={x}
                  cy={y}
                  r={7}
                  fill={theme.colors.brand.cyan}
                  stroke={theme.colors.background.surface}
                  strokeWidth={3}
                />
              );
            })}
          </Svg>

          {sortedData.map((point, index) => {
            const { x, y } = getPointPosition(index, point.value);
            return (
              <TouchableOpacity
                key={`touch-${point.testId}`}
                style={[
                  styles.touchArea,
                  {
                    left: x - 20,
                    top: y - 20,
                  },
                ]}
                onPress={() => setSelectedPoint(selectedPoint === index ? null : index)}
                activeOpacity={0.7}
              />
            );
          })}

          {selectedPoint !== null && sortedData[selectedPoint] && (
            <View
              style={[
                styles.tooltip,
                {
                  left: Math.min(
                    Math.max(getPointPosition(selectedPoint, sortedData[selectedPoint].value).x - 60, 0),
                    chartWidth - 120
                  ),
                  top: Math.max(getPointPosition(selectedPoint, sortedData[selectedPoint].value).y - 60, 0),
                },
              ]}>
              <Text style={styles.tooltipValue}>
                {sortedData[selectedPoint].value.toFixed(2)} {unit}
              </Text>
              <Text style={styles.tooltipDate}>{formatDate(sortedData[selectedPoint].date)}</Text>
              {refRange && (
                <Text style={styles.tooltipPosition}>
                  {getPositionLabel(sortedData[selectedPoint].value)}
                </Text>
              )}
            </View>
          )}
          </View>
        </View>

        <View style={styles.xAxis}>
          {sortedData.map((point, index) => {
            const { x } = getPointPosition(index, point.value);
            const isFirst = index === 0;
            const isLast = index === sortedData.length - 1;
            const shouldShow = isFirst || isLast;

            if (!shouldShow) return null;

            return (
              <View
                key={point.testId}
                style={[
                  styles.xLabel,
                  { position: 'absolute', left: x },
                  isLast && { right: 0, left: 'auto' }
                ]}>
                <Text style={styles.xLabelText}>{formatDate(point.date)}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <Text style={styles.legendLabel}>Values range:</Text>
          <Text style={styles.legendValue}>
            {minDataValue.toFixed(2)} - {maxDataValue.toFixed(2)} {unit}
          </Text>
        </View>
        {refRange && (
          <View style={styles.legendRow}>
            <Text style={styles.legendLabel}>Typical range:</Text>
            <Text style={styles.legendValue}>
              {refRange.low.toFixed(2)} - {refRange.high.toFixed(2)} {unit}
            </Text>
          </View>
        )}
        <View style={styles.legendRow}>
          <Text style={styles.legendLabel}>Data points:</Text>
          <Text style={styles.legendValue}>{sortedData.length}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.muted,
  },
  helperContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    marginBottom: theme.spacing.md,
  },
  helperText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
  chartContainer: {
    marginBottom: theme.spacing.lg,
  },
  chart: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.sm,
    position: 'relative',
  },
  touchArea: {
    position: 'absolute',
    width: 40,
    height: 40,
    zIndex: 10,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: theme.colors.background.elevated,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    minWidth: 120,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipValue: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  tooltipDate: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.secondary,
  },
  tooltipPosition: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  yAxisLabels: {
    width: 50,
    position: 'relative',
    justifyContent: 'center',
    marginRight: theme.spacing.xs,
  },
  yLabel: {
    position: 'absolute',
    right: 0,
    alignItems: 'flex-end',
  },
  yLabelText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
    fontWeight: theme.typography.fontWeights.medium,
  },
  xAxis: {
    marginTop: theme.spacing.md,
    position: 'relative',
    height: 40,
  },
  xLabel: {
    position: 'absolute',
  },
  xLabelText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
  },
  legend: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
  },
  legendValue: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.secondary,
  },
});
