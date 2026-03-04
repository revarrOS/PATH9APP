import { supabase } from '@/lib/supabase';

interface TimelineEventSuggestion {
  event_type: 'diagnosis' | 'appointment' | 'test' | 'treatment' | 'referral';
  date: string | null;
  description: string;
  provider: string | null;
}

interface CareTeamContactSuggestion {
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  facility: string | null;
}

interface ConsultationQuestionSuggestion {
  question_text: string;
  category: 'diagnosis' | 'treatment' | 'side_effects' | 'prognosis' | 'lifestyle' | 'general';
  priority: 'high' | 'medium' | 'low';
}

interface PrepopulationInput {
  documentId: string;
  timelineEvents: TimelineEventSuggestion[];
  careTeamContacts: CareTeamContactSuggestion[];
  consultationQuestions: ConsultationQuestionSuggestion[];
}

interface PrepopulationResult {
  timeline_created: number;
  contacts_created: number;
  questions_created: number;
  duplicates_skipped: number;
  errors: string[];
}

export class LetterPrepopulationService {
  private static async getAuthenticatedUser() {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      throw new Error('User not authenticated');
    }

    return session.user;
  }

  private static classifyAppointmentCategory(
    event: TimelineEventSuggestion
  ): 'investigation' | 'diagnosis' | 'treatment' | 'administrative' {
    const description = event.description.toLowerCase();

    if (
      description.includes('diagnosis') ||
      description.includes('results discussion') ||
      description.includes('biopsy results')
    ) {
      return 'diagnosis';
    }

    if (
      description.includes('treatment') ||
      description.includes('chemotherapy') ||
      description.includes('therapy') ||
      description.includes('procedure')
    ) {
      return 'treatment';
    }

    if (
      description.includes('follow-up') ||
      description.includes('check-up') ||
      description.includes('paperwork') ||
      description.includes('administrative')
    ) {
      return 'administrative';
    }

    return 'investigation';
  }

  private static async checkDuplicateAppointment(
    userId: string,
    appointmentDateTime: Date,
    eventCategory: string,
    description: string
  ): Promise<boolean> {
    const appointmentDate = appointmentDateTime.toISOString();
    const twentyFourHoursBefore = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const twentyFourHoursAfter = new Date(appointmentDateTime.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('appointments')
      .select('id, appointment_datetime, event_category, preparation_notes')
      .eq('user_id', userId)
      .gte('appointment_datetime', twentyFourHoursBefore)
      .lte('appointment_datetime', twentyFourHoursAfter);

    if (error) {
      console.error('Error checking duplicate appointment:', error);
      return false;
    }

    if (!data || data.length === 0) return false;

    const normalizedDescription = description.toLowerCase().trim();

    return data.some(existing => {
      const existingDate = new Date(existing.appointment_datetime);
      const timeDiffMinutes = Math.abs(existingDate.getTime() - appointmentDateTime.getTime()) / (1000 * 60);

      const sameCategory = existing.event_category === eventCategory;
      const similarTime = timeDiffMinutes < 15;

      const existingNotes = (existing.preparation_notes || '').toLowerCase().trim();
      const descriptionOverlap =
        normalizedDescription.includes(existingNotes.substring(0, 30)) ||
        existingNotes.includes(normalizedDescription.substring(0, 30));

      return sameCategory && similarTime && (descriptionOverlap || existingNotes.length === 0);
    });
  }

  private static async checkDuplicateDiagnosis(
    userId: string,
    diagnosisName: string,
    diagnosisDate: string
  ): Promise<boolean> {
    const normalizedName = diagnosisName.toLowerCase().trim();

    const { data, error } = await supabase
      .from('diagnoses')
      .select('id, diagnosis_name, diagnosis_date')
      .eq('user_id', userId)
      .eq('diagnosis_date', diagnosisDate);

    if (error) {
      console.error('Error checking duplicate diagnosis:', error);
      return false;
    }

    if (!data || data.length === 0) return false;

    return data.some(existing => {
      const existingName = existing.diagnosis_name.toLowerCase().trim();
      return existingName === normalizedName ||
             existingName.includes(normalizedName) ||
             normalizedName.includes(existingName);
    });
  }

  private static async checkDuplicateCareTeamMember(
    userId: string,
    name: string,
    role: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('care_team')
      .select('id')
      .eq('user_id', userId)
      .eq('provider_name', name)
      .eq('role', role)
      .maybeSingle();

    if (error) {
      console.error('Error checking duplicate care team member:', error);
      return false;
    }

    return !!data;
  }

  private static async checkDuplicateQuestion(
    userId: string,
    questionText: string
  ): Promise<boolean> {
    const normalizedQuestion = questionText.toLowerCase().trim();

    const { data, error } = await supabase
      .from('consultation_questions')
      .select('question_text')
      .eq('user_id', userId)
      .eq('domain', 'condition');

    if (error) {
      console.error('Error checking duplicate question:', error);
      return false;
    }

    if (!data) return false;

    return data.some(
      (q) => q.question_text.toLowerCase().trim() === normalizedQuestion
    );
  }

  static async prepopulateFromLetter(
    input: PrepopulationInput
  ): Promise<PrepopulationResult> {
    const result: PrepopulationResult = {
      timeline_created: 0,
      contacts_created: 0,
      questions_created: 0,
      duplicates_skipped: 0,
      errors: [],
    };

    try {
      const user = await this.getAuthenticatedUser();

      for (const event of input.timelineEvents) {
        try {
          if ((event.event_type === 'appointment' || event.event_type === 'test') && event.date) {
            let appointmentDateTime = new Date(event.date);

            const timeMatch = event.description.match(/\bat\s+(\d{1,2}):(\d{2})/i);
            if (timeMatch) {
              const hours = parseInt(timeMatch[1], 10);
              const minutes = parseInt(timeMatch[2], 10);
              appointmentDateTime.setHours(hours, minutes, 0, 0);
            }

            const eventCategory = this.classifyAppointmentCategory(event);

            const isDuplicate = await this.checkDuplicateAppointment(
              user.id,
              appointmentDateTime,
              eventCategory,
              event.description
            );

            if (isDuplicate) {
              result.duplicates_skipped++;
              continue;
            }

            const appointmentType = event.event_type === 'test' ? 'test' : 'follow-up';

            const { error } = await supabase
              .from('appointments')
              .insert({
                user_id: user.id,
                appointment_datetime: appointmentDateTime.toISOString(),
                provider_name: event.provider || undefined,
                provider_role: event.provider || undefined,
                appointment_type: appointmentType,
                status: 'scheduled',
                preparation_notes: event.description,
                event_category: eventCategory,
              });

            if (error) {
              result.errors.push(`Failed to create appointment: ${error.message}`);
            } else {
              result.timeline_created++;
            }
          } else if (event.event_type === 'diagnosis' && event.date) {
            const isDuplicate = await this.checkDuplicateDiagnosis(
              user.id,
              event.description,
              event.date
            );

            if (isDuplicate) {
              result.duplicates_skipped++;
              continue;
            }

            const { error } = await supabase
              .from('diagnoses')
              .insert({
                user_id: user.id,
                diagnosis_name: event.description,
                diagnosis_date: event.date,
                plain_english_summary: event.description,
              });

            if (error) {
              result.errors.push(`Failed to create diagnosis: ${error.message}`);
            } else {
              result.timeline_created++;
            }
          } else {
            const { error } = await supabase
              .from('condition_trend_signals')
              .insert({
                user_id: user.id,
                document_id: input.documentId,
                signal_date: event.date || new Date().toISOString().split('T')[0],
                signal_type: 'other',
                polarity: 'neutral',
                category: 'other',
                description: event.description,
                confidence: 0.85,
              });

            if (error) {
              result.errors.push(`Failed to create timeline signal: ${error.message}`);
            } else {
              result.timeline_created++;
            }
          }
        } catch (err) {
          result.errors.push(
            `Failed to process timeline event: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
      }

      for (const contact of input.careTeamContacts) {
        try {
          const isDuplicate = await this.checkDuplicateCareTeamMember(
            user.id,
            contact.name,
            contact.role
          );

          if (isDuplicate) {
            result.duplicates_skipped++;
            continue;
          }

          const { error } = await supabase
            .from('care_team')
            .insert({
              user_id: user.id,
              provider_name: contact.name,
              role: contact.role,
              specialty: contact.role,
              contact_info: {
                phone: contact.phone || null,
                email: contact.email || null,
                facility: contact.facility || null,
              },
              notes: `Added from letter analysis`,
            });

          if (error) {
            result.errors.push(`Failed to create care team member: ${error.message}`);
          } else {
            result.contacts_created++;
          }
        } catch (err) {
          result.errors.push(
            `Failed to process care team contact: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
      }

      for (const question of input.consultationQuestions) {
        try {
          const isDuplicate = await this.checkDuplicateQuestion(
            user.id,
            question.question_text
          );

          if (isDuplicate) {
            result.duplicates_skipped++;
            continue;
          }

          const priorityMapping: Record<string, 'clinical' | 'logistical' | 'general'> = {
            high: 'clinical',
            medium: 'logistical',
            low: 'general',
          };

          const { error } = await supabase
            .from('consultation_questions')
            .insert({
              user_id: user.id,
              question_text: question.question_text,
              domain: 'condition',
              priority: priorityMapping[question.priority] || 'general',
              source: 'ai_suggested',
              is_answered: false,
            });

          if (error) {
            result.errors.push(`Failed to create consultation question: ${error.message}`);
          } else {
            result.questions_created++;
          }
        } catch (err) {
          result.errors.push(
            `Failed to process consultation question: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
      }

      return result;
    } catch (err) {
      result.errors.push(
        `Fatal error during prepopulation: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
      return result;
    }
  }
}
