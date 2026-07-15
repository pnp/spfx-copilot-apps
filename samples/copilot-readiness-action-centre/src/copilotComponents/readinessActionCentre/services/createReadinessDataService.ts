import { SPHttpClient } from '@microsoft/sp-http';
import { IReadinessDataService } from './IReadinessDataService';
import { MockReadinessDataService } from './MockReadinessDataService';
import { SharePointReadinessDataService } from './SharePointReadinessDataService';

export function createReadinessDataService(
  useMockData: boolean | undefined,
  client: SPHttpClient,
  siteUrl: string
): IReadinessDataService {
  if (useMockData) {
    return new MockReadinessDataService();
  }
  return new SharePointReadinessDataService(client, siteUrl);
}
