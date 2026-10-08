# Personal Links Teams personal app

The Personal Links Teams app is packaged manually so the primary SharePoint package can continue to
contain the Copilot declarative-agent ZIP without also generating an SPFx Teams ZIP.

The package in `personalLinks/TeamsSPFxApp.zip` contains only:

- `manifest.json`;
- a 192 x 192 full-color PNG; and
- a 32 x 32 white-on-transparent outline PNG.

The Teams and Copilot icons share the same navy/blue link mark and the segmented blue, green, magenta,
and coral accent used by the product UX. The SharePoint web-part toolbox image is generated from the
same artwork.

## Package or validate

Run from the sample root:

```powershell
# Regenerate all shared icons and the isolated Teams ZIP.
.\teams-app\package-app.ps1

# Validate manifests, images, routing, package contents, and the packaging boundary.
.\teams-app\package-app.ps1 -Check
```

The primary web-part manifest deliberately continues to support only `SharePointWebPart` and
`SharePointFullPage`. Keeping this manual package outside SPFx's reserved top-level `teams` directory
also prevents SPFx from adding its files to the SPPKG beside the Copilot agent package. The handcrafted
Teams manifest routes its personal tab directly to the deployed web-part component through
`TeamsLogon.aspx` and `teamshostedapp.aspx`.

When Teams hosts the web part, the adapter selects the Full experience and suppresses the in-app product
bar because Teams already provides app and user chrome.

## Install

1. Deploy `sharepoint/solution/personal-links.sppkg` to the SharePoint App Catalog.
2. Approve the requested Microsoft Graph `Files.ReadWrite.AppFolder` permission.
3. Upload `personalLinks/TeamsSPFxApp.zip` as a custom app in Teams or to the organization app catalog.
4. Add **Personal Links** as a personal app and confirm the same OneDrive-backed collection appears in
   SharePoint, Copilot, and Teams.

The Teams package does not deploy or update the SPFx implementation. Rebuild and redeploy the SPPKG
when the shared application code changes.
