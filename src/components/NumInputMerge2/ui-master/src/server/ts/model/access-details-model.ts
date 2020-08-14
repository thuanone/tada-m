/**
 * The AccessDetails object contain all information that are necessary to access the KubeAPI of a project/namespace
 */
export interface IAccessDetails {
  accessToken: string;
  guid: string;
  name: string;
  region: string;
  serviceEndpointBaseUrl: string;
}

export function stringify(accessDetails: IAccessDetails): string {
  return accessDetails && accessDetails.name ? `AccessDetails[${accessDetails.name}]` : 'AccessDetails[UNDEFINED]';
}
