/**
 * Data contract for the Executive Sales & Revenue Dashboard.
 *
 * The React UI depends only on this interface, never on a concrete
 * implementation. A `MockExecDashboardDataService` ships for the offline
 * sample; a `RealExecDashboardDataService` can be dropped in later to read from
 * a live endpoint without any UI change.
 */
import type { IDashboardData } from '../models/dashboard';
import type { IDashboardFilters } from '../mockData/salesData';

export interface IExecDashboardDataService {
  /**
   * Load the dashboard payload for the given render time and filters.
   *
   * @param now - The render time; used to anchor all dates/labels to "today".
   * @param filters - Region / product / segment scope.
   */
  getDashboardData(now: Date, filters: IDashboardFilters): Promise<IDashboardData>;
}
