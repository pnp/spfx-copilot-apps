import * as React from 'react';
import { useState } from 'react';
import {
  makeStyles,
  tokens,
  Badge,
  Button,
  Text,
  Caption1,
  Subtitle2,
  type BadgeProps
} from '@fluentui/react-components';

import type { ITimeOffRequest, RequestStatus } from '../data/types';
import { formatDateRange, statusLabel, daysLabel } from './format';

const useStyles = makeStyles({
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`
  },
  rowMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    minWidth: 0
  },
  rowDates: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1
  },
  rowMeta: {
    color: tokens.colorNeutralForeground3
  },
  rowSide: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexShrink: 0
  },
  confirm: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS
  },
  empty: {
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic'
  }
});

function badgeColor(status: RequestStatus): BadgeProps['color'] {
  switch (status) {
    case 'approved':
      return 'success';
    case 'pending':
      return 'warning';
    case 'declined':
      return 'danger';
    case 'cancelled':
    default:
      return 'informative';
  }
}

function isCancellable(req: ITimeOffRequest, todayIso: string): boolean {
  return (
    req.status === 'pending' ||
    (req.status === 'approved' && req.startDate > todayIso)
  );
}

export interface IRequestsListProps {
  title: string;
  requests: readonly ITimeOffRequest[];
  todayIso: string;
  emptyText: string;
  onCancel: (id: string) => void;
}

export const RequestsList: React.FunctionComponent<IRequestsListProps> = (
  props
) => {
  const styles = useStyles();
  const { title, requests, todayIso, emptyText, onCancel } = props;
  const [confirmingId, setConfirmingId] = useState<string | undefined>(
    undefined
  );

  return (
    <div className={styles.section}>
      <Subtitle2>{title}</Subtitle2>
      {requests.length === 0 ? (
        <Caption1 className={styles.empty}>{emptyText}</Caption1>
      ) : (
        <div className={styles.list}>
          {requests.map((req) => {
            const cancellable = isCancellable(req, todayIso);
            const leaveLabel =
              req.leaveType.charAt(0).toUpperCase() + req.leaveType.slice(1);
            return (
              <div key={req.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <Text className={styles.rowDates}>
                    {formatDateRange(req.startDate, req.endDate)}
                  </Text>
                  <Caption1 className={styles.rowMeta}>
                    {`${leaveLabel} \u00b7 ${daysLabel(req.workingDays)}${
                      req.note ? ` \u00b7 ${req.note}` : ''
                    }`}
                  </Caption1>
                </div>
                <div className={styles.rowSide}>
                  <Badge appearance="filled" color={badgeColor(req.status)}>
                    {statusLabel(req.status)}
                  </Badge>
                  {cancellable &&
                    (confirmingId === req.id ? (
                      <span className={styles.confirm}>
                        <Button
                          size="small"
                          appearance="primary"
                          onClick={() => {
                            onCancel(req.id);
                            setConfirmingId(undefined);
                          }}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="small"
                          appearance="subtle"
                          onClick={() => setConfirmingId(undefined)}
                        >
                          Keep
                        </Button>
                      </span>
                    ) : (
                      <Button
                        size="small"
                        appearance="outline"
                        onClick={() => setConfirmingId(req.id)}
                      >
                        Cancel
                      </Button>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
