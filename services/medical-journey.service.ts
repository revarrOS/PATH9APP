import { supabase } from '@/lib/supabase';

export interface Diagnosis {
  id: string;
  diagnosis_name: string;
  diagnosis_date: string;
  stage_or_severity: string | null;
  plain_english_summary: string | null;
  raw_pathology_text: string | null;
}

export interface Appointment {
  id: string;
  appointment_datetime: string;
  provider_name: string | null;
  provider_role: string | null;
  appointment_type: string | null;
  location: string | null;
  preparation_notes: string | null;
  questions_to_ask: string[];
  status: string;
}

export interface TimelinePhase {
  id: string;
  timeline_phase: string;
  phase_order: number;
  estimated_start_date: string | null;
  estimated_duration_weeks: number | null;
  description: string | null;
  key_milestones: string[];
  status: string;
  actual_start_date: string | null;
  actual_end_date: string | null;
}

export interface EmotionalCheckin {
  id: string;
  checkin_time: string;
  anxiety_level: number | null;
  overwhelm_level: number | null;
  hope_level: number | null;
  physical_wellbeing: number | null;
}

export async function getUserDiagnosis(userId: string): Promise<{ data: Diagnosis | null; error: any }> {
  const { data, error } = await supabase
    .from('diagnoses')
    .select('*')
    .eq('user_id', userId)
    .order('diagnosis_date', { ascending: false })
    .maybeSingle();

  return { data, error };
}

export async function getUserAppointments(userId: string, limit = 5): Promise<{ data: Appointment[] | null; error: any }> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .gte('appointment_datetime', new Date().toISOString())
    .order('appointment_datetime', { ascending: true })
    .limit(limit);

  return { data, error };
}

export async function getUserTimeline(userId: string): Promise<{ data: TimelinePhase[] | null; error: any }> {
  const { data, error } = await supabase
    .from('treatment_timeline')
    .select('*')
    .eq('user_id', userId)
    .order('phase_order', { ascending: true });

  return { data, error };
}

export async function getEmotionalProgress(userId: string, days = 7): Promise<{ data: EmotionalCheckin[] | null; error: any }> {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);

  const { data, error } = await supabase
    .from('emotional_checkins')
    .select('*')
    .eq('user_id', userId)
    .gte('checkin_time', daysAgo.toISOString())
    .order('checkin_time', { ascending: true });

  return { data, error };
}

export async function getCurrentPhase(userId: string): Promise<string> {
  const { data } = await getUserTimeline(userId);

  if (!data || data.length === 0) return 'chaos';

  const inProgress = data.find(phase => phase.status === 'in_progress');
  if (inProgress) {
    return inProgress.timeline_phase.toLowerCase();
  }

  const upcoming = data.find(phase => phase.status === 'upcoming');
  if (upcoming) {
    return 'chaos';
  }

  return 'recovery';
}

export async function getNextMilestones(userId: string, count = 5): Promise<string[]> {
  const { data } = await getUserTimeline(userId);

  if (!data || data.length === 0) return [];

  const currentPhase = data.find(phase => phase.status === 'in_progress') || data[0];
  const milestones: string[] = [];

  if (currentPhase && currentPhase.key_milestones) {
    milestones.push(...currentPhase.key_milestones.slice(0, count));
  }

  const nextPhase = data.find(phase => phase.phase_order === (currentPhase?.phase_order || 0) + 1);
  if (nextPhase && milestones.length < count && nextPhase.key_milestones) {
    milestones.push(...nextPhase.key_milestones.slice(0, count - milestones.length));
  }

  return milestones.slice(0, count);
}
