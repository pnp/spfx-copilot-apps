import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';
import type { MSGraphClientV3 } from '@microsoft/sp-http';

import * as strings from 'PersonalLinksWebPartStrings';
import {
  PersonalLinksApp
} from '../../shared/components/PersonalLinksApp';
import { PersonalLinksErrorBoundary } from '../../shared/components/PersonalLinksErrorBoundary';
import { PersonalLinksThemeProvider } from '../../shared/components/PersonalLinksThemeProvider';
import type { PersonalLinksExperienceMode } from '../../shared/models/personalLinks';
import { GraphPersonalLinksService } from '../../shared/services/GraphPersonalLinksService';
import type { IPersonalLinksService } from '../../shared/services/IPersonalLinksService';
import { MemoryPersonalLinksService } from '../../shared/services/MemoryPersonalLinksService';

export interface IPersonalLinksWebPartProps {
  experienceMode: 'auto' | PersonalLinksExperienceMode;
  demoMode: boolean;
  linksPerPage: number;
}

interface IPersonalLinksPropertyPaneConfiguration extends IPropertyPaneConfiguration {
  disableVisibilityGroup: boolean;
}

export default class PersonalLinksWebPart extends BaseClientSideWebPart<IPersonalLinksWebPartProps> {
  private _isDarkTheme: boolean = false;
  private _root: Root | undefined;
  private _graphService: IPersonalLinksService | undefined;
  private readonly _demoService: IPersonalLinksService = new MemoryPersonalLinksService();

  public render(): void {
    if (!this._graphService) {
      return;
    }

    const mode = this._resolveExperienceMode();
    const isTeamsPersonalApp = !!this.context.sdks.microsoftTeams;
    const useDemoMode = !isTeamsPersonalApp && this.properties.demoMode;
    const service = useDemoMode ? this._demoService : this._graphService;
    const element = React.createElement(
      PersonalLinksThemeProvider,
      {
        targetDocument: this.domElement.ownerDocument,
        theme: this._isDarkTheme ? 'dark' : 'light'
      },
      React.createElement(
        PersonalLinksErrorBoundary,
        { key: mode },
        React.createElement(PersonalLinksApp, {
          service,
          mode,
          demoMode: useDemoMode,
          compactPageSize: this.properties.linksPerPage,
          hideProductBar: isTeamsPersonalApp && mode === 'full',
          userDisplayName: this.context.pageContext.user.displayName || 'Microsoft 365 user',
          onOpenLink: async (url: string): Promise<void> => {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        })
      )
    );

    if (!this._root) {
      this._root = createRoot(this.domElement);
    }

    this._root.render(element);
  }

  protected async onInit(): Promise<void> {
    const graphClient: MSGraphClientV3 = await this.context.msGraphClientFactory.getClient('3');
    this._graphService = new GraphPersonalLinksService(graphClient);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    this.render();
  }

  protected onDispose(): void {
    this._root?.unmount();
    this._root = undefined;
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  private _resolveExperienceMode(): PersonalLinksExperienceMode {
    if (this.context.sdks.microsoftTeams) {
      return 'full';
    }

    if (this.properties.experienceMode === 'compact' || this.properties.experienceMode === 'full') {
      return this.properties.experienceMode;
    }

    const path = window.location.pathname.toLocaleLowerCase();
    return path.indexOf('/componenthost.aspx') >= 0 ? 'full' : 'compact';
  }

  protected getPropertyPaneConfiguration(): IPersonalLinksPropertyPaneConfiguration {
    return {
      disableVisibilityGroup: true,
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneDropdown('experienceMode', {
                  label: strings.ExperienceModeFieldLabel,
                  options: [
                    { key: 'auto', text: strings.ExperienceModeAuto },
                    { key: 'compact', text: strings.ExperienceModeCompact },
                    { key: 'full', text: strings.ExperienceModeFull }
                  ]
                }),
                PropertyPaneDropdown('linksPerPage', {
                  label: strings.LinksPerPageFieldLabel,
                  options: [
                    { key: 3, text: '3' },
                    { key: 6, text: '6' },
                    { key: 9, text: '9' },
                    { key: 12, text: '12' }
                  ]
                }),
                PropertyPaneToggle('demoMode', {
                  label: strings.DemoModeFieldLabel,
                  onText: strings.DemoModeOn,
                  offText: strings.DemoModeOff
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
