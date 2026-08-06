export interface GovernanceUser {
  id: string;
  name: string;
  email: string;
  role: string | null;
}

export interface GovernanceAuthPayload {
  token: string;
  token_type: string;
  user: GovernanceUser | null;
}

export interface GovernanceAuthMessage {
  type: 'governance_auth';
  data: GovernanceAuthPayload;
}
