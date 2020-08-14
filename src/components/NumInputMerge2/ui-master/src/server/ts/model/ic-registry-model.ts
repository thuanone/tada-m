export function stringify(image: IContainerImage): string {
  return image ? `IContainerImage[${(image.RepoTags && image.RepoTags.length > 0 && image.RepoTags[0]) || image.Id}]` : 'IContainerImage[UNDEFINED]';
}
export interface IContainerImage {
  Id: string;
  DigestTags: { [key: string]: string[] };
  RepoTags: string[];
  Created: number;
  Size: number;
  VulnerabilityCount: number;
  IssueCount: number;
  ExemptIssueCount: number;
}
