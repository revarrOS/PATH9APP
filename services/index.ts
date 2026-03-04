export { authService } from './auth.service';
export { apiService } from './api.service';
export { profileService } from './profile.service';
export { auditService } from './audit.service';
export { orchestrationService } from './orchestration.service';
export { gemmaConversationService } from './gemma-conversation.service';
export { subscriptionService } from './subscription.service';

export type { AuthCredentials, AuthResponse } from './auth.service';
export type { Profile } from './profile.service';
export type { AuditEvent, CreateAuditEventParams } from './audit.service';
export type { GemmaMessage, GemmaConversation } from './gemma-conversation.service';
export type {
  SubscriptionTier,
  UserSubscription,
  UsageTracking,
} from './subscription.service';

export {
  getUserDiagnosis,
  getUserAppointments,
  getUserTimeline,
  getCurrentPhase,
  getNextMilestones,
  getEmotionalProgress,
} from './medical-journey.service';

export type {
  Diagnosis,
  Appointment,
  TimelinePhase,
  EmotionalCheckin,
} from './medical-journey.service';
