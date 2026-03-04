import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '@/config/theme';
import { QuestionStatus } from '../types/consultation-prep.types';

interface FilterTabsProps {
  activeFilter: 'all' | QuestionStatus;
  onFilterChange: (filter: 'all' | QuestionStatus) => void;
  counts: {
    all: number;
    open: number;
    asked: number;
    resolved: number;
  };
}

export function FilterTabs({ activeFilter, onFilterChange, counts }: FilterTabsProps) {
  const tabs: Array<{ key: 'all' | QuestionStatus; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'asked', label: 'Asked' },
    { key: 'resolved', label: 'Resolved' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeFilter === tab.key;
        const count = counts[tab.key];

        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onFilterChange(tab.key)}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {count > 0 && (
              <View style={[styles.badge, isActive && styles.badgeActive]}>
                <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  tabActive: {
    backgroundColor: theme.colors.brand.cyan + '20',
    borderColor: theme.colors.brand.cyan,
  },
  tabText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.secondary,
  },
  tabTextActive: {
    color: theme.colors.brand.cyan,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  badge: {
    backgroundColor: theme.colors.background.tertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeActive: {
    backgroundColor: theme.colors.brand.cyan,
  },
  badgeText: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.muted,
  },
  badgeTextActive: {
    color: theme.colors.text.inverse,
  },
});
