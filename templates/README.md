# Templates

This folder contains the templates you should use when contributing a new sample to this repository.

| File                                             | Purpose                                                                                  |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| [README-template.md](./README-template.md)       | Starting point for the `README.md` file inside your sample folder. Copy it and fill in every placeholder. |
| [sample-template.json](./sample-template.json)   | Starting point for the `sample.json` metadata file. This file is **mandatory** and must be placed in your sample's `assets` folder. |

## Mandatory `assets` folder

Every sample submitted to this repository **must** include an `assets` folder containing, at a minimum:

- `sample.json` — the sample metadata file (based on [sample-template.json](./sample-template.json)).
- `preview.png` — the preview image for the sample.

## How to use

1. Create your sample folder under [`samples`](../samples).
2. Copy `README-template.md` into your sample folder, rename it to `README.md`, and replace all placeholders.
3. Create an `assets` folder inside your sample folder.
4. Copy `sample-template.json` into the `assets` folder, rename it to `sample.json`, and fill in the metadata.
5. Add the mandatory `preview.png` (and any other screenshots) into the same `assets` folder.

See the [Contribution Guidance](../CONTRIBUTING.md) for full details.
