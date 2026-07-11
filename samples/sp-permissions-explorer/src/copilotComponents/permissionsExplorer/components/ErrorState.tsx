import * as React from 'react';
import {
  Button,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  type MessageBarIntent
} from '@fluentui/react-components';
import { ArrowClockwiseRegular } from '@fluentui/react-icons';

export type ErrorKind = 'accessDenied' | 'notFound' | 'throttled' | 'generic';

export interface IErrorStateProps {
  kind: ErrorKind;
  message?: string;
  onRetry?: () => void;
}

interface IErrorCopy {
  intent: MessageBarIntent;
  title: string;
  body: string;
}

function getCopy(kind: ErrorKind, message: string | undefined): IErrorCopy {
  switch (kind) {
    case 'accessDenied':
      return {
        intent: 'warning',
        title: 'Access denied',
        body: "You don't have permission to review access for this site."
      };
    case 'notFound':
      return {
        intent: 'info',
        title: 'Site not found',
        body: 'No matching site was found. Try the full site URL.'
      };
    case 'throttled':
      return {
        intent: 'info',
        title: 'Service busy',
        body: 'The service is busy. Please retry in a moment.'
      };
    default:
      return {
        intent: 'error',
        title: 'Something went wrong',
        body: message ?? 'Something went wrong.'
      };
  }
}

export const ErrorState: React.FC<IErrorStateProps> = ({ kind, message, onRetry }) => {
  const copy = getCopy(kind, message);
  return (
    <MessageBar intent={copy.intent} politeness="polite">
      <MessageBarBody>
        <MessageBarTitle>{copy.title}</MessageBarTitle>
        {copy.body}
      </MessageBarBody>
      {onRetry && (
        <MessageBarActions>
          <Button
            appearance="transparent"
            icon={<ArrowClockwiseRegular />}
            onClick={onRetry}
            aria-label="Retry"
          >
            Retry
          </Button>
        </MessageBarActions>
      )}
    </MessageBar>
  );
};

export default ErrorState;
