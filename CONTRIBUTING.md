# Contributing to SharePoint Copilot Apps Samples

Thank you for your interest in contributing! This repository thrives on community contributions, and we welcome new samples, improvements to existing samples, bug fixes, and documentation updates.

This project welcomes contributions and suggestions. Most contributions require you to agree to a Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us the rights to use your contribution. For details, visit [https://cla.opensource.microsoft.com](https://cla.opensource.microsoft.com).

When you submit a pull request, a CLA bot will automatically determine whether you need to provide a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions provided by the bot. You will only need to do this once across all repositories using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Before you start

- Search the [existing samples](./samples) and [open issues](https://github.com/pnp/spfx-copilot-apps/issues) to avoid duplicating work.
- For larger contributions, consider [opening an issue](https://github.com/pnp/spfx-copilot-apps/issues/new) first to discuss your idea with the maintainers.
- Make sure any third-party libraries you use are licensed in a way that allows redistribution as part of an open source sample.

## Contributing a new sample

1. **Fork** this repository and create a working branch for your contribution.
2. **Create a new folder** under [`samples`](./samples). Use a descriptive, lowercase, hyphen-separated folder name (for example, `react-copilot-agent-quickstart`).
3. **Add your source code** to the folder, including everything required to build and run the sample.
4. **Add a `README.md`** based on [`templates/README-template.md`](./templates/README-template.md). Replace every placeholder with information specific to your sample.
5. **Create a mandatory `assets` folder** inside your sample. Every sample must include this folder.
6. **Add a `sample.json`** based on [`templates/sample-template.json`](./templates/sample-template.json) **into the `assets` folder**, filling in the metadata for your sample. This file is required.
7. **Add a `preview.png`** (and optionally additional screenshots or a video link) into the same `assets` folder so others can preview your work without installing it. The `preview.png` is required.
8. **Test thoroughly** to confirm the sample builds and runs from a clean clone using only the steps documented in your `README.md`.

### Folder structure for a sample

The `assets` folder is mandatory and must contain both `sample.json` and `preview.png`.

```text
samples/
└── your-sample-name/
    ├── assets/
    │   ├── sample.json   (required)
    │   └── preview.png   (required)
    ├── src/
    └── README.md
```

## Submitting your pull request

- Keep each pull request focused on a single sample or a single logical change.
- Reference any related issue in the pull request description.
- Make sure your branch is up to date with the latest `main` before submitting.
- Fill in the pull request description so reviewers understand what your sample does.

A maintainer will review your contribution, may request changes, and will help finalize details such as the compatibility matrix before merging.

## Updating an existing sample

If you are fixing a bug or improving an existing sample, please:

- Update the **Version history** table in that sample's `README.md`.
- Update the `updateDateTime` value in that sample's `assets/sample.json`.
- Clearly describe what changed in your pull request.

## Reporting issues and suggesting samples

- Use the [issue list](https://github.com/pnp/spfx-copilot-apps/issues) to report bugs in a sample or to suggest a new sample.
- Be as specific as possible, including the affected sample name, steps to reproduce, and your environment details.

Thank you for helping the community! You rock ❤️
