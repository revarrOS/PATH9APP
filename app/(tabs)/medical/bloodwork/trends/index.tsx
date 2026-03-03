import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, TrendingUp, Info } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { BloodworkService } from '@/products/bloodwork/services/bloodwork.service';
import { CBC_MARKERS } from '@/products/bloodwork/types/bloodwork.types';
import { TrendChart, TrendDataPoint } from '@/products/bloodwork/components/TrendChart';
import { RangePositionBar } from '@/products/bloodwork/components/RangePositionBar';
import { ExtendedSex, AgeRange, getReferenceRange } from '@/products/bloodwork/reference/ranges';
import { UserPreferencesService } from '@/services/user-preferences.service';
import { getMarkerExplanation } from '@/products/bloodwork/reference/marker-explanations';
import { theme } from '@/config/theme';

type TimeRange = '1M' | '3M' | '6M' | '1Y' | '2Y' | '3Y' | 'ALL';

export default function BloodworkTrends() {
  const router = useRouter();
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [allTrendData, setAllTrendData] = useState<TrendDataPoint[]>([]);
  const [filteredData, setFilteredData] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableMarkers, setAvailableMarkers] = useState<string[]>([]);
  const [selectedSex, setSelectedSex] = useState<ExtendedSex>('prefer-not-to-say');
  const [selectedAgeRange, setSelectedAgeRange] = useState<AgeRange>('30-39');
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('6M');
  const [showMarkerSelector, setShowMarkerSelector] = useState(false);
  const [showContextSettings, setShowContextSettings] = useState(false);
  const [showMarkerInfo, setShowMarkerInfo] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadBloodworkProfile();
    loadAvailableMarkers();
  }, []);

  useEffect(() => {
    if (selectedMarker) {
      loadTrendData(selectedMarker);
    }
  }, [selectedMarker]);

  useEffect(() => {
    filterDataByTimeRange();
  }, [allTrendData, selectedTimeRange]);

  useEffect(() => {
    if (error) {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = setTimeout(() => {
        setError(null);
      }, 5000);
    }

    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [error]);

  const loadBloodworkProfile = async () => {
    try {
      const profile = await UserPreferencesService.getBloodworkProfile();
      if (profile.sex) {
        setSelectedSex(profile.sex as ExtendedSex);
      }
      if (profile.ageGroup) {
        setSelectedAgeRange(profile.ageGroup as AgeRange);
      }
      setProfileLoaded(true);
    } catch (err) {
      setProfileLoaded(true);
    }
  };

  const saveBloodworkProfile = async (sex: ExtendedSex, ageGroup: AgeRange) => {
    try {
      await UserPreferencesService.setBloodworkProfile(sex, ageGroup);
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };

  const loadAvailableMarkers = async () => {
    try {
      setLoading(true);
      const tests = await BloodworkService.getTests();

      const markerSet = new Set<string>();
      tests.forEach(test => {
        test.markers.forEach(marker => {
          markerSet.add(marker.marker_name);
        });
      });

      const markers = Array.from(markerSet).sort();
      setAvailableMarkers(markers);

      if (markers.length > 0 && !selectedMarker) {
        setSelectedMarker(markers[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load markers');
    } finally {
      setLoading(false);
    }
  };

  const loadTrendData = async (markerName: string) => {
    try {
      setLoading(true);
      setError(null);
      const tests = await BloodworkService.getTests();

      const data: TrendDataPoint[] = [];
      tests.forEach(test => {
        const marker = test.markers.find(m => m.marker_name === markerName);
        if (marker) {
          data.push({
            date: test.test_date,
            value: marker.value,
            testId: test.id,
          });
        }
      });

      setAllTrendData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trend data');
    } finally {
      setLoading(false);
    }
  };

  const filterDataByTimeRange = () => {
    if (allTrendData.length === 0) {
      setFilteredData([]);
      return;
    }

    if (selectedTimeRange === 'ALL') {
      setFilteredData(allTrendData);
      return;
    }

    const now = new Date();
    const cutoffMap: Record<Exclude<TimeRange, 'ALL'>, number> = {
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      '2Y': 730,
      '3Y': 1095,
    };

    const cutoffDays = cutoffMap[selectedTimeRange as Exclude<TimeRange, 'ALL'>];
    const cutoffDate = new Date(now.getTime() - (cutoffDays * 24 * 60 * 60 * 1000));

    const filtered = allTrendData.filter(point => {
      const pointDate = new Date(point.date);
      return pointDate >= cutoffDate;
    });

    setFilteredData(filtered);
  };

  const getMarkerUnit = (markerName: string): string => {
    const markerDef = CBC_MARKERS.find(m => m.name === markerName);
    return markerDef?.unit || '';
  };

  const getTimeRangeLabel = (range: TimeRange): string => {
    const labels: Record<TimeRange, string> = {
      '1M': '1 Month',
      '3M': '3 Months',
      '6M': '6 Months',
      '1Y': '1 Year',
      '2Y': '2 Years',
      '3Y': '3 Years',
      'ALL': 'All Time',
    };
    return labels[range];
  };

  const handleProfileChange = (sex: ExtendedSex, ageGroup: AgeRange) => {
    setSelectedSex(sex);
    setSelectedAgeRange(ageGroup);
    saveBloodworkProfile(sex, ageGroup);
  };

  const latestValue = filteredData.length > 0
    ? [...filteredData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].value
    : null;

  const refRange = selectedMarker && selectedSex && selectedAgeRange
    ? getReferenceRange(selectedMarker, selectedSex, selectedAgeRange)
    : null;

  const markerExplanation = selectedMarker ? getMarkerExplanation(selectedMarker) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Bloodwork Trends</Text>
          <Text style={styles.subtitle}>Visualize markers over time</Text>
        </View>
        <View style={styles.headerIcon}>
          <TrendingUp size={24} color={theme.colors.brand.violet} />
        </View>
      </View>

      {error && (
        <TouchableOpacity
          style={styles.errorBanner}
          onPress={() => setError(null)}
          activeOpacity={0.9}>
          <Text style={styles.errorText}>{error}</Text>
        </TouchableOpacity>
      )}

      {availableMarkers.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <TrendingUp size={64} color={theme.colors.text.disabled} />
          <Text style={styles.emptyTitle}>No data available</Text>
          <Text style={styles.emptyDescription}>
            Record some blood tests to see trends
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/medical/bloodwork/entry/new')}>
            <Text style={styles.emptyButtonText}>Record First Test</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          onScroll={() => {
            if (error) setError(null);
          }}
          scrollEventThrottle={400}>
          {selectedMarker && (
            <>
              <View style={styles.heroSection}>
                <View style={styles.markerHeader}>
                  <Text style={styles.markerTitle}>{selectedMarker}</Text>
                  {markerExplanation && (
                    <TouchableOpacity
                      style={styles.infoButton}
                      onPress={() => setShowMarkerInfo(true)}
                      activeOpacity={0.7}>
                      <Info size={20} color={theme.colors.brand.cyan} />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.timeframe}>{getTimeRangeLabel(selectedTimeRange)}</Text>
              </View>

              <View style={styles.timeRangeSection}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.timeRangeScroll}>
                  {(['1M', '3M', '6M', '1Y', '2Y', '3Y', 'ALL'] as TimeRange[]).map((range) => (
                    <TouchableOpacity
                      key={range}
                      style={[
                        styles.timeRangeChip,
                        selectedTimeRange === range && styles.timeRangeChipActive
                      ]}
                      onPress={() => setSelectedTimeRange(range)}
                      activeOpacity={0.7}>
                      <Text style={[
                        styles.timeRangeChipText,
                        selectedTimeRange === range && styles.timeRangeChipTextActive
                      ]}>
                        {range === 'ALL' ? 'All' : range}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.chartSection}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.brand.cyan} />
                  </View>
                ) : (
                  <>
                    <TrendChart
                      data={filteredData}
                      markerName={selectedMarker}
                      unit={getMarkerUnit(selectedMarker)}
                      sex={selectedSex}
                      ageRange={selectedAgeRange}
                    />
                    {latestValue !== null && refRange && (
                      <RangePositionBar
                        latestValue={latestValue}
                        lowRange={refRange.low * 0.9}
                        typicalLow={refRange.low}
                        typicalHigh={refRange.high}
                        highRange={refRange.high * 1.1}
                        unit={getMarkerUnit(selectedMarker)}
                      />
                    )}
                  </>
                )}
              </View>

              <View style={styles.controlsSection}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setShowMarkerSelector(!showMarkerSelector)}
                  activeOpacity={0.7}>
                  <Text style={styles.controlButtonText}>Change marker</Text>
                  <Text style={styles.controlButtonValue}>{selectedMarker}</Text>
                </TouchableOpacity>

                {showMarkerSelector && (
                  <View style={styles.expandedPanel}>
                    <View style={styles.markerGrid}>
                      {availableMarkers.map((marker) => {
                        const explanation = getMarkerExplanation(marker);
                        return (
                          <TouchableOpacity
                            key={marker}
                            style={[
                              styles.markerChip,
                              selectedMarker === marker && styles.markerChipActive
                            ]}
                            onPress={() => {
                              setSelectedMarker(marker);
                              setShowMarkerSelector(false);
                            }}
                            activeOpacity={0.7}>
                            <Text style={[
                              styles.markerChipText,
                              selectedMarker === marker && styles.markerChipTextActive
                            ]}>
                              {marker}
                            </Text>
                            {explanation && (
                              <Text style={[
                                styles.markerChipExplanation,
                                selectedMarker === marker && styles.markerChipExplanationActive
                              ]}>
                                {explanation.explanation}
                              </Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setShowContextSettings(!showContextSettings)}
                  activeOpacity={0.7}>
                  <Text style={styles.controlButtonText}>Your profile</Text>
                  <Text style={styles.controlButtonValue}>
                    {selectedSex === 'prefer-not-to-say' ? 'Not set' : selectedSex.charAt(0).toUpperCase() + selectedSex.slice(1)}, {selectedAgeRange}
                  </Text>
                </TouchableOpacity>

                {showContextSettings && (
                  <View style={styles.expandedPanel}>
                    <Text style={styles.contextHelper}>
                      Used for reference ranges. Saved across sessions.
                    </Text>

                    <Text style={styles.contextLabel}>Sex</Text>
                    <View style={styles.contextGrid}>
                      {(['male', 'female', 'intersex', 'prefer-not-to-say'] as ExtendedSex[]).map((sex) => (
                        <TouchableOpacity
                          key={sex}
                          style={[
                            styles.contextChip,
                            selectedSex === sex && styles.contextChipActive
                          ]}
                          onPress={() => {
                            handleProfileChange(sex, selectedAgeRange);
                          }}
                          activeOpacity={0.7}>
                          <Text style={[
                            styles.contextChipText,
                            selectedSex === sex && styles.contextChipTextActive
                          ]}>
                            {sex === 'prefer-not-to-say' ? 'Prefer not to say' : sex.charAt(0).toUpperCase() + sex.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.contextLabel}>Age Range</Text>
                    <View style={styles.contextGrid}>
                      {(['18-29', '30-39', '40-49', '50-59', '60-69', '70+'] as AgeRange[]).map((age) => (
                        <TouchableOpacity
                          key={age}
                          style={[
                            styles.contextChip,
                            selectedAgeRange === age && styles.contextChipActive
                          ]}
                          onPress={() => {
                            handleProfileChange(selectedSex, age);
                          }}
                          activeOpacity={0.7}>
                          <Text style={[
                            styles.contextChipText,
                            selectedAgeRange === age && styles.contextChipTextActive
                          ]}>
                            {age}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={styles.doneButton}
                      onPress={() => setShowContextSettings(false)}
                      activeOpacity={0.7}>
                      <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      <View style={styles.disclaimer}>
        <View style={styles.disclaimerRow}>
          <Text style={styles.disclaimerText}>
            For tracking only. Not medical advice.
          </Text>
          <TouchableOpacity
            onPress={() => {
              setError('Reference ranges sourced from NHS, Mayo Clinic, Cleveland Clinic, LabCorp, and Quest Diagnostics. These are population averages for visualization only.');
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Info size={16} color={theme.colors.text.muted} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showMarkerInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMarkerInfo(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMarkerInfo(false)}>
          <View style={styles.modalContent}>
            {markerExplanation && (
              <>
                <Text style={styles.modalTitle}>{markerExplanation.name}</Text>
                <Text style={styles.modalText}>{markerExplanation.explanation}</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowMarkerInfo(false)}
                  activeOpacity={0.7}>
                  <Text style={styles.modalCloseButtonText}>Got it</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: 60,
    backgroundColor: theme.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
    gap: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  errorBanner: {
    backgroundColor: `${theme.colors.state.error}20`,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.state.error,
  },
  errorText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.state.error,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  markerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  markerTitle: {
    fontSize: 32,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
  },
  infoButton: {
    padding: theme.spacing.xs,
  },
  timeframe: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.muted,
    marginTop: theme.spacing.xs,
  },
  timeRangeSection: {
    marginBottom: theme.spacing.md,
  },
  timeRangeScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  timeRangeChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  timeRangeChipActive: {
    backgroundColor: theme.colors.brand.cyan,
    borderColor: theme.colors.brand.cyan,
  },
  timeRangeChipText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.secondary,
  },
  timeRangeChipTextActive: {
    color: theme.colors.text.inverse,
  },
  chartSection: {
    paddingHorizontal: theme.spacing.lg,
  },
  controlsSection: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  controlButton: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeights.medium,
  },
  controlButtonValue: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  expandedPanel: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    marginTop: -theme.spacing.sm,
  },
  doneButton: {
    backgroundColor: theme.colors.brand.cyan,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  doneButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  markerGrid: {
    gap: theme.spacing.sm,
  },
  markerChip: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.elevated,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  markerChipActive: {
    backgroundColor: theme.colors.brand.violet,
    borderColor: theme.colors.brand.violet,
  },
  markerChipText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  markerChipTextActive: {
    color: theme.colors.text.inverse,
  },
  markerChipExplanation: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
    lineHeight: 16,
  },
  markerChipExplanationActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  contextHelper: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
    marginBottom: theme.spacing.md,
  },
  contextLabel: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  contextGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  contextChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background.elevated,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  contextChipActive: {
    backgroundColor: theme.colors.brand.cyan,
    borderColor: theme.colors.brand.cyan,
  },
  contextChipText: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.secondary,
  },
  contextChipTextActive: {
    color: theme.colors.text.inverse,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  emptyButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.brand.cyan,
    borderRadius: theme.borderRadius.sm,
  },
  emptyButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  disclaimer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  disclaimerText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  modalText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  modalCloseButton: {
    backgroundColor: theme.colors.brand.cyan,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
  },
});
