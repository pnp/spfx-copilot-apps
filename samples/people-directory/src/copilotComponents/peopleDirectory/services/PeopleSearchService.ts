import { isEmpty } from '@microsoft/sp-lodash-subset';
import type { MSGraphClientFactory } from '@microsoft/sp-http';
import type { PageCollection } from '@microsoft/microsoft-graph-client';

/**
 * Wraps the Microsoft Graph `/users` endpoint used to populate and search the
 * people directory. `searchParameter` drives an eventually-consistent
 * `$search` query against `displayName`, which matches on both first and
 * last name.
 */
export class PeopleSearchService {
  public pageSize: number = 25;
  public selectParameter: string = 'id,displayName,mail,userPrincipalName,jobTitle,department,userType,accountEnabled';
  public filterParameter: string = '';
  public orderByParameter: string = 'displayName';
  public searchParameter: string = '';

  constructor(private _msGraphClientFactory: MSGraphClientFactory) { }

  public async searchUsers(): Promise<PageCollection> {
    const graphClient = await this._msGraphClientFactory.getClient('3');

    let resultQuery = graphClient
      .api('/users')
      .version('beta')
      .header('ConsistencyLevel', 'eventual')
      .count(true)
      .top(this.pageSize);

    if (!isEmpty(this.selectParameter)) {
      resultQuery = resultQuery.select(this.selectParameter);
    }

    if (!isEmpty(this.filterParameter)) {
      resultQuery = resultQuery.filter(this.filterParameter);
    }

    if (!isEmpty(this.orderByParameter)) {
      resultQuery = resultQuery.orderby(this.orderByParameter);
    }

    if (!isEmpty(this.searchParameter)) {
      resultQuery = resultQuery.query({ $search: `"displayName:${this.searchParameter}"` });
    }

    return await resultQuery.get();
  }
}
