/**
 * Live-data implementation of {@link IExecDashboardDataService} (stub).
 *
 * This class is intentionally structured but not fully implemented: it shows
 * exactly where a real REST call goes when the sample is connected to a backend.
 * It reads from the `dataServiceUrl` configured in the settings / component
 * properties and is expected to return an {@link IDashboardData}-shaped payload,
 * so the UI needs no changes when switching from mock to live.
 *
 * To complete it in a live phase:
 *  - swap `fetch` for an authenticated SPFx client (`AadHttpClient` /
 *    `SPHttpClient`) passed in via the constructor;
 *  - project the raw API response into {@link IDashboardData} with a mapper,
 *    keeping the view-model shape unchanged.
 */
import type { IDashboardData } from '../models/dashboard';
import type { IDashboardFilters } from '../mockData/salesData';
import type { IExecDashboardDataService } from './IExecDashboardDataService';

export class RealExecDashboardDataService implements IExecDashboardDataService {
  private readonly _dataServiceUrl: string;

  public constructor(dataServiceUrl: string) {
    this._dataServiceUrl = dataServiceUrl;
  }

  public async getDashboardData(now: Date, filters: IDashboardFilters): Promise<IDashboardData> {
    // NOTE: skeleton only. Replace with an authenticated call and a mapper that
    // projects the API response into IDashboardData. Kept minimal on purpose so
    // the mock path remains the exercised code path in this sample.
    const query: string =
      `?region=${encodeURIComponent(filters.region)}` +
      `&product=${encodeURIComponent(filters.product)}` +
      `&segment=${encodeURIComponent(filters.segment)}` +
      `&asOf=${encodeURIComponent(now.toISOString())}`;

    const response: Response = await fetch(`${this._dataServiceUrl}${query}`, {
      headers: { accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Dashboard data request failed with status ${response.status}.`);
    }

    // A real mapper would validate and project here.
    return (await response.json()) as IDashboardData;
  }
}
