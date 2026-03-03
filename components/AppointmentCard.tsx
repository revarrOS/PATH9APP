/**
 * INACTIVE / FUTURE — DO NOT MODIFY OR ACTIVATE WITHOUT EXPLICIT APPROVAL
 *
 * This is a generic shared component not currently integrated into the app.
 * Domain-specific versions exist in /products/bloodwork/ and /products/condition/.
 */

import { View, Text, StyleSheet } from 'react-native';
import { Calendar, MapPin, User } from 'lucide-react-native';
import { Appointment } from '@/services/medical-journey.service';
import { theme } from '@/config/theme';

interface AppointmentCardProps {
  appointment: Appointment;
}

const PROVIDER_ROLE_DESCRIPTIONS: Record<string, string> = {
  oncologist: 'Cancer specialist who coordinates your overall treatment',
  'medical oncologist': 'Specialist in chemotherapy and drug treatments',
  surgeon: 'Doctor who performs operations to remove tumors',
  'surgical oncologist': 'Surgeon specializing in cancer operations',
  'radiation oncologist': 'Specialist who uses radiation therapy',
  radiologist: 'Doctor who interprets imaging scans (CT, MRI, etc.)',
  'nurse navigator': 'Specialized nurse who helps coordinate your care',
  pathologist: 'Doctor who examines tissue samples',
  'plastic surgeon': 'Surgeon who performs reconstructive surgery',
};

export default function AppointmentCard({ appointment }: AppointmentCardProps) {
  const appointmentDate = new Date(appointment.appointment_datetime);
  const formattedDate = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const roleDescription = appointment.provider_role
    ? PROVIDER_ROLE_DESCRIPTIONS[appointment.provider_role.toLowerCase()] || 'Medical provider'
    : 'Medical provider';

  return (
    <View style={styles.container}>
      <View style={styles.dateHeader}>
        <View style={styles.dateIcon}>
          <Calendar size={20} color={theme.colors.brand.cyan} />
        </View>
        <View>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <Text style={styles.timeText}>{formattedTime}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.providerSection}>
          <View style={styles.providerHeader}>
            <User size={18} color={theme.colors.text.secondary} />
            <Text style={styles.providerName}>
              {appointment.provider_name || 'Medical Appointment'}
            </Text>
          </View>

          {appointment.provider_role && (
            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>{appointment.provider_role}</Text>
              <Text style={styles.roleDescription}>{roleDescription}</Text>
            </View>
          )}
        </View>

        {appointment.location && (
          <View style={styles.locationSection}>
            <MapPin size={16} color={theme.colors.text.muted} />
            <Text style={styles.locationText}>{appointment.location}</Text>
          </View>
        )}

        {appointment.appointment_type && (
          <View style={styles.typeContainer}>
            <Text style={styles.typeLabel}>Type:</Text>
            <Text style={styles.typeValue}>{appointment.appointment_type}</Text>
          </View>
        )}

        {appointment.questions_to_ask && appointment.questions_to_ask.length > 0 && (
          <View style={styles.questionsSection}>
            <Text style={styles.questionsTitle}>Questions to Ask:</Text>
            {appointment.questions_to_ask.slice(0, 3).map((question, index) => (
              <Text key={index} style={styles.question}>
                • {question}
              </Text>
            ))}
            {appointment.questions_to_ask.length > 3 && (
              <Text style={styles.moreQuestions}>
                +{appointment.questions_to_ask.length - 3} more
              </Text>
            )}
          </View>
        )}

        {appointment.preparation_notes && (
          <View style={styles.prepSection}>
            <Text style={styles.prepTitle}>How to Prepare:</Text>
            <Text style={styles.prepText}>{appointment.preparation_notes}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  dateIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dateText: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
  },
  timeText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.muted,
  },
  card: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.sm,
  },
  providerSection: {
    marginBottom: theme.spacing.md,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  providerName: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  roleContainer: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.sm,
    padding: 10,
  },
  roleLabel: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.brand.cyan,
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  locationText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginLeft: 6,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  typeLabel: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.muted,
    marginRight: 6,
  },
  typeValue: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    textTransform: 'capitalize',
  },
  questionsSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.default,
  },
  questionsTitle: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  question: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  moreQuestions: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.brand.cyan,
    fontWeight: theme.typography.fontWeights.semibold,
    marginTop: 4,
  },
  prepSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.default,
  },
  prepTitle: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  prepText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
});
