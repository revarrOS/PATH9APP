export type AccessLevel = 'read_only' | 'read_write';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface BloodworkSupportInvitation {
  id: string;
  owner_user_id: string;
  invitee_email: string;
  invitee_name: string;
  access_level: AccessLevel;
  invitation_token: string;
  expires_at: string;
  status: InvitationStatus;
  created_at: string;
}

export interface BloodworkSupportAccess {
  id: string;
  owner_user_id: string;
  supporter_user_id: string;
  supporter_name: string;
  access_level: AccessLevel;
  created_at: string;
  updated_at: string;
}

export interface CreateInviteInput {
  invitee_email: string;
  invitee_name: string;
  access_level: AccessLevel;
}

export interface SupportAccessResponse {
  owned: BloodworkSupportAccess[];
  granted: BloodworkSupportAccess[];
}
