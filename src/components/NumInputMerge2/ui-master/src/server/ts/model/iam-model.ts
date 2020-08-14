
export interface IIamTokens {
  access_token: string;
  delegated_refresh_token?: string;
  expiration?: number; // 1594081674
  expires_in?: number; // 3600
  token_type: string; // Bearer
  refresh_token: string;
  scope: string; // ibm openid
}

export interface IApiKeyDetails {
  id: string;
  entity_tag: string;
  crn: string;
  locked: boolean;
  created_at: string;
  created_by: string; // 2020-07-06T23:18+0000
  modified_at: string;
  name: string;
  description: string;
  iam_id: string;
  account_id: string;
}
