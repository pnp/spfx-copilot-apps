declare interface IPersonalLinksWebPartStrings {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  ExperienceModeFieldLabel: string;
  ExperienceModeAuto: string;
  ExperienceModeCompact: string;
  ExperienceModeFull: string;
  LinksPerPageFieldLabel: string;
  DemoModeFieldLabel: string;
  DemoModeOn: string;
  DemoModeOff: string;
}

declare module 'PersonalLinksWebPartStrings' {
  const strings: IPersonalLinksWebPartStrings;
  export = strings;
}
