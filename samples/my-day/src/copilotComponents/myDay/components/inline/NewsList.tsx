import * as React from 'react';

import { Avatar, Badge, makeStyles, shorthands, tokens, Text } from '@fluentui/react-components';
import { Image20Regular } from '@fluentui/react-icons';

import type { INewsItem } from '../../models/myDay';
import { formatTimeAgo } from '../../utils/datetime';
import InlineDetailHeader from './InlineDetailHeader';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    boxSizing: 'border-box',
    minWidth: 0
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  card: {
    display: 'flex',
    gap: '12px',
    width: '100%',
    boxSizing: 'border-box',
    minWidth: 0,
    padding: '10px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
    transitionDuration: tokens.durationFaster,
    transitionProperty: 'background-color, border-color, box-shadow',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      ...shorthands.borderColor(tokens.colorNeutralStroke1),
      boxShadow: tokens.shadow8
    }
  },
  thumb: {
    flexShrink: 0,
    width: '72px',
    height: '72px',
    borderRadius: tokens.borderRadiusMedium,
    objectFit: 'cover',
    backgroundColor: tokens.colorNeutralBackground3
  },
  thumbFallback: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '72px',
    height: '72px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground3,
    fontSize: '24px'
  },
  body: {
    flexGrow: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap'
  },
  byline: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: tokens.colorNeutralForeground3,
    minWidth: 0
  },
  bylineName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  summary: {
    color: tokens.colorNeutralForeground3,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  time: {
    color: tokens.colorNeutralForeground3
  },
  empty: {
    padding: '16px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground3
  }
});

const NewsThumb: React.FunctionComponent<{ src?: string; alt: string; className: string; fallbackClassName: string }> = (
  props
) => {
  const [failed, setFailed] = React.useState(false);
  if (!props.src || failed) {
    return (
      <span className={props.fallbackClassName} aria-hidden="true">
        <Image20Regular />
      </span>
    );
  }
  return (
    <img
      className={props.className}
      src={props.src}
      alt={props.alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};

export interface INewsListProps {
  news: INewsItem[];
  now: Date;
  onBack: () => void;
}

/** Drill-down: latest news posts with thumbnails. */
const NewsList: React.FunctionComponent<INewsListProps> = (props) => {
  const styles = useStyles();
  const { news, now, onBack } = props;

  return (
    <div className={styles.root}>
      <InlineDetailHeader title="News" onBack={onBack} />
      {news.length === 0 ? (
        <Text className={styles.empty}>No news right now — check back later.</Text>
      ) : (
        <div className={styles.list}>
          {news.map((n) => (
            <div key={n.id} className={styles.card}>
              <NewsThumb
                src={n.imageUrl}
                alt=""
                className={styles.thumb}
                fallbackClassName={styles.thumbFallback}
              />
              <div className={styles.body}>
                <div className={styles.metaRow}>
                  <Badge appearance="tint" color="brand" size="small">
                    {n.category}
                  </Badge>
                  <Text size={200} className={styles.time}>
                    {formatTimeAgo(n.publishedAt, now)}
                  </Text>
                </div>
                <Text size={300} className={styles.title}>
                  {n.title}
                </Text>
                {n.summary && (
                  <Text size={200} className={styles.summary}>
                    {n.summary}
                  </Text>
                )}
                {n.author && (
                  <span className={styles.byline}>
                    <Avatar
                      name={n.author.displayName}
                      image={n.author.photoUrl ? { src: n.author.photoUrl } : undefined}
                      size={20}
                    />
                    <Text size={200} className={styles.bylineName}>
                      {n.author.displayName}
                    </Text>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsList;
