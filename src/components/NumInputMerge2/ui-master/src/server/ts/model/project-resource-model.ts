
export interface IProjectResource {
  name: string;
  crn?: string;
  guid: string;
  region: string;
  resource_group_id: string;
  resource_plan_id: string;
  created: number;
  state?: string;
  tags?: string[];
  last_operation?: {
    type: string;
    state: string;
  };
}

/**
 * {"error_code":"RC-IamErrorResponse","message":"Token is expired","status_code":401,"transaction_id":"bss-b454461a71ee474d"}
 */
export interface IResourceControllerErrorResponse {
  error_code: string;
  message: string;
  details?: string;
  status_code: number;
  transaction_id: string;
}

export interface IResourceGroup {
  crn: string;
  default: boolean;
  name: string;
  id: string;
  state: string;
}

export interface ITenantStatus {
  Namespacestatus: string;
  Domainstatus: string;
}

export interface IProjectInfo {
  ExpireTimestamp?: number;
  Expiry?: number;
  Namespacestatus: string;
  Domainstatus: string;
}
