import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import { createCopilotTextContent } from '@microsoft/sp-copilot-component';
import type { MSGraphClientV3 } from '@microsoft/sp-http';
import type { IPersonalLinksCopilotComponentProperties } from './PersonalLinksCopilotComponentProperties';
import {
  PersonalLinksApp,
  type IPersonalLinksModelContext
} from '../../shared/components/PersonalLinksApp';
import { PersonalLinksErrorBoundary } from '../../shared/components/PersonalLinksErrorBoundary';
import { PersonalLinksThemeProvider } from '../../shared/components/PersonalLinksThemeProvider';
import { GraphPersonalLinksService } from '../../shared/services/GraphPersonalLinksService';
import type { IPersonalLinksService } from '../../shared/services/IPersonalLinksService';

const INLINE_WIDTH = 680;
const INLINE_COMPACT_HEIGHT = 320;
const INLINE_EDITOR_HEIGHT = 720;

export default class PersonalLinksCopilotComponent extends BaseCopilotComponent<IPersonalLinksCopilotComponentProperties> {
  private _root: Root | undefined;
  private _service: IPersonalLinksService | undefined;
  private _lastContextSignature: string = '';

  protected async onInit(): Promise<void> {
    const graphClient: MSGraphClientV3 = await this.context.msGraphClientFactory.getClient('3');
    this._service = new GraphPersonalLinksService(graphClient);
  }

  protected render(): void {
    if (!this._service) {
      return;
    }

    const mode = this.hostContext.displayMode === 'fullscreen' ? 'full' : 'compact';
    const canRequestFullScreen = mode === 'compact'
      && (this.hostContext.availableDisplayModes || []).indexOf('fullscreen') >= 0;
    const app = React.createElement(PersonalLinksApp, {
      service: this._service,
      mode,
      userDisplayName: this.context.pageContext.user?.displayName || 'Microsoft 365 user',
      canRequestFullScreen,
      onRequestFullScreen: canRequestFullScreen
        ? async (): Promise<void> => {
          await this.requestDisplayModeAsync('fullscreen');
        }
        : undefined,
      onRequestInlineEditorSize: mode === 'compact'
        ? async (open: boolean): Promise<void> => {
          await this.requestSizeChangeAsync(
            INLINE_WIDTH,
            open ? INLINE_EDITOR_HEIGHT : INLINE_COMPACT_HEIGHT
          );
        }
        : undefined,
      onOpenLink: async (url: string): Promise<void> => {
        const result = await this.context.copilotBridge.openLinkAsync(url);
        if (result.isError) {
          throw new Error('Copilot could not open this link.');
        }
      },
      onModelContextChange: (snapshot: IPersonalLinksModelContext): void => {
        this._publishModelContext(snapshot).catch((error: unknown) => {
          console.error('Personal Links could not publish model context.', error);
        });
      }
    });
    const element = React.createElement(
      PersonalLinksThemeProvider,
      {
        targetDocument: this.context.domElement.ownerDocument,
        theme: this.hostContext.theme === 'dark' ? 'dark' : 'light'
      },
      React.createElement(PersonalLinksErrorBoundary, { key: mode }, app)
    );

    if (!this._root) {
      this._root = createRoot(this.context.domElement);
    }

    this._root.render(element);
  }

  private async _publishModelContext(snapshot: IPersonalLinksModelContext): Promise<void> {
    const signature = JSON.stringify(snapshot);
    if (signature === this._lastContextSignature) {
      return;
    }
    this._lastContextSignature = signature;
    try {
      await this.context.copilotBridge.updateModelContextAsync({
        content: [createCopilotTextContent(
          `Personal Links shows ${snapshot.visibleLinks.length} visible links in ${snapshot.mode} mode.`
        )],
        structuredContent: snapshot as unknown as Record<string, unknown>
      });
    } catch (error: unknown) {
      console.error('Personal Links could not update Copilot model context.', error);
    }
  }

  protected async onTeardown(reason?: string): Promise<void> {
    this._root?.unmount();
    this._root = undefined;
    await super.onTeardown(reason);
  }
}
