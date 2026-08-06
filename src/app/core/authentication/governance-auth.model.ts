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

export interface GovernanceCodeExchangeRequest {
  code: string;
  client_id: string;
  return_url: string;
  device_name: string;
}
