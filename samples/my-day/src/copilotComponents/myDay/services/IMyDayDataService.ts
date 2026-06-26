import type { IMyDayData } from '../models/myDay';

/**
 * Contract for supplying My Day data. Two implementations are planned:
 * a mock provider (this phase) and a Graph-backed provider (deferred). Both
 * return the same `IMyDayData` view models.
 */
export interface IMyDayDataService {
  /**
   * Returns the aggregated My Day data. `now` lets callers resolve relative
   * times deterministically (and keeps the demo live at render time).
   */
  getMyDay(now?: Date): IMyDayData;
}
