import {
  TIME_OFF_LISTS_SITE_PATH,
  TIME_OFF_SITE_TENANT_PROPERTY,
  resolveListsWebUrl,
  resolveListsSitePath,
  type IStorageEntityHttpClient,
  type IStorageEntityResponse
} from './listsSiteConfig';

describe('resolveListsWebUrl', () => {
  it('combines the host from the ambient web with the configured site path', () => {
    expect(
      resolveListsWebUrl('https://contoso.sharepoint.com', '/sites/hr')
    ).toBe('https://contoso.sharepoint.com/sites/hr');
  });

  it('keeps the host but ignores any site segment already in the ambient URL', () => {
    expect(
      resolveListsWebUrl(
        'https://contoso.sharepoint.com/sites/teamA/SitePages/Home.aspx',
        '/sites/hr'
      )
    ).toBe('https://contoso.sharepoint.com/sites/hr');
  });

  it('preserves the host port when present', () => {
    expect(
      resolveListsWebUrl('https://contoso.sharepoint.com:8080', '/sites/hr')
    ).toBe('https://contoso.sharepoint.com:8080/sites/hr');
  });

  it('normalizes a site path supplied without a leading slash', () => {
    expect(
      resolveListsWebUrl('https://contoso.sharepoint.com', 'sites/hr')
    ).toBe('https://contoso.sharepoint.com/sites/hr');
  });

  it('falls back to the ambient web when no site path is configured', () => {
    expect(
      resolveListsWebUrl('https://contoso.sharepoint.com/sites/hr', '')
    ).toBe('https://contoso.sharepoint.com/sites/hr');
  });

  it('treats a whitespace-only site path as unset', () => {
    expect(
      resolveListsWebUrl('https://contoso.sharepoint.com/sites/hr', '   ')
    ).toBe('https://contoso.sharepoint.com/sites/hr');
  });

  it('falls back to the ambient value when it has no parseable origin', () => {
    expect(resolveListsWebUrl('', '/sites/hr')).toBe('');
  });

  it('uses the module default (TIME_OFF_LISTS_SITE_PATH) when no override is passed', () => {
    expect(resolveListsWebUrl('https://contoso.sharepoint.com')).toBe(
      `https://contoso.sharepoint.com${TIME_OFF_LISTS_SITE_PATH}`
    );
  });

  it('uses a full-URL override verbatim, ignoring the ambient host', () => {
    expect(
      resolveListsWebUrl(
        'https://contoso.sharepoint.com',
        'https://other.sharepoint.com/sites/hr/'
      )
    ).toBe('https://other.sharepoint.com/sites/hr');
  });
});

interface IFakeGet {
  url: string;
  headers: { [name: string]: string };
}

function storageResponse(
  body: Record<string, unknown>,
  ok: boolean = true,
  status: number = 200
): IStorageEntityResponse {
  return {
    ok: ok,
    status: status,
    json: () => Promise.resolve(body)
  };
}

class FakeStorageHttp implements IStorageEntityHttpClient {
  public calls: IFakeGet[] = [];
  public response: IStorageEntityResponse = storageResponse({ Value: null });
  public throwOnGet: boolean = false;

  public get(
    url: string,
    headers: { [name: string]: string }
  ): Promise<IStorageEntityResponse> {
    this.calls.push({ url: url, headers: headers });
    if (this.throwOnGet) {
      return Promise.reject(new Error('network down'));
    }
    return Promise.resolve(this.response);
  }
}

describe('resolveListsSitePath', () => {
  it('returns the tenant property Value when present and non-empty', async () => {
    const http = new FakeStorageHttp();
    http.response = storageResponse({ Value: '/sites/hr' });

    const path = await resolveListsSitePath(
      http,
      'https://contoso.sharepoint.com'
    );

    expect(path).toBe('/sites/hr');
  });

  it("reads GetStorageEntity('TimeOffSite') with odata=nometadata against the ambient web", async () => {
    const http = new FakeStorageHttp();
    http.response = storageResponse({ Value: '/sites/hr' });

    await resolveListsSitePath(http, 'https://contoso.sharepoint.com/');

    expect(http.calls.length).toBe(1);
    // Trailing slash on the ambient is stripped before building the URL.
    expect(http.calls[0].url).toBe(
      `https://contoso.sharepoint.com/_api/web/GetStorageEntity('${TIME_OFF_SITE_TENANT_PROPERTY}')`
    );
    expect(http.calls[0].headers.Accept).toBe(
      'application/json;odata=nometadata'
    );
  });

  it('trims surrounding whitespace from the property Value', async () => {
    const http = new FakeStorageHttp();
    http.response = storageResponse({ Value: '  /sites/hr  ' });

    const path = await resolveListsSitePath(
      http,
      'https://contoso.sharepoint.com'
    );

    expect(path).toBe('/sites/hr');
  });

  it('accepts a full-URL property Value (passed through to resolveListsWebUrl)', async () => {
    const http = new FakeStorageHttp();
    http.response = storageResponse({
      Value: 'https://other.sharepoint.com/sites/hr'
    });

    const path = await resolveListsSitePath(
      http,
      'https://contoso.sharepoint.com'
    );

    expect(resolveListsWebUrl('https://contoso.sharepoint.com', path)).toBe(
      'https://other.sharepoint.com/sites/hr'
    );
  });

  it('falls back to the default when the Value is an empty string', async () => {
    const http = new FakeStorageHttp();
    http.response = storageResponse({ Value: '' });

    expect(
      await resolveListsSitePath(http, 'https://contoso.sharepoint.com')
    ).toBe(TIME_OFF_LISTS_SITE_PATH);
  });

  it('falls back to the default when the Value is null', async () => {
    const http = new FakeStorageHttp();
    http.response = storageResponse({ Value: null });

    expect(
      await resolveListsSitePath(http, 'https://contoso.sharepoint.com')
    ).toBe(TIME_OFF_LISTS_SITE_PATH);
  });

  it('falls back to the default when the Value is whitespace only', async () => {
    const http = new FakeStorageHttp();
    http.response = storageResponse({ Value: '   ' });

    expect(
      await resolveListsSitePath(http, 'https://contoso.sharepoint.com')
    ).toBe(TIME_OFF_LISTS_SITE_PATH);
  });

  it('falls back to the default when the Value is missing from the body', async () => {
    const http = new FakeStorageHttp();
    http.response = storageResponse({ 'odata.null': true });

    expect(
      await resolveListsSitePath(http, 'https://contoso.sharepoint.com')
    ).toBe(TIME_OFF_LISTS_SITE_PATH);
  });

  it('falls back to the default when the Value is not a string', async () => {
    const http = new FakeStorageHttp();
    http.response = storageResponse({ Value: 42 });

    expect(
      await resolveListsSitePath(http, 'https://contoso.sharepoint.com')
    ).toBe(TIME_OFF_LISTS_SITE_PATH);
  });

  it('falls back to the default on a non-OK response (no body read)', async () => {
    const http = new FakeStorageHttp();
    http.response = storageResponse({ Value: '/sites/hr' }, false, 404);

    expect(
      await resolveListsSitePath(http, 'https://contoso.sharepoint.com')
    ).toBe(TIME_OFF_LISTS_SITE_PATH);
  });

  it('falls back to the default when the GET rejects', async () => {
    const http = new FakeStorageHttp();
    http.throwOnGet = true;

    expect(
      await resolveListsSitePath(http, 'https://contoso.sharepoint.com')
    ).toBe(TIME_OFF_LISTS_SITE_PATH);
  });

  it('returns the fallback without calling http when the ambient URL is empty', async () => {
    const http = new FakeStorageHttp();

    const path = await resolveListsSitePath(http, '');

    expect(path).toBe(TIME_OFF_LISTS_SITE_PATH);
    expect(http.calls.length).toBe(0);
  });

  it('honors a custom fallback path argument', async () => {
    const http = new FakeStorageHttp();
    http.response = storageResponse({ Value: null });

    expect(
      await resolveListsSitePath(
        http,
        'https://contoso.sharepoint.com',
        '/sites/custom'
      )
    ).toBe('/sites/custom');
  });
});
