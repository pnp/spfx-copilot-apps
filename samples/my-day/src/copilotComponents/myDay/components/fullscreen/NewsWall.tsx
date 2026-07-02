import * as React from 'react';

import { Avatar, Badge, makeStyles, shorthands, tokens, Text } from '@fluentui/react-components';
import { Image24Regular, News20Regular } from '@fluentui/react-icons';

import type { INewsItem } from '../../models/myDay';
import { formatTimeAgo } from '../../utils/datetime';
import DashboardCard from './DashboardCard';

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
    width: '100%'
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    borderRadius: tokens.borderRadiusLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
    overflow: 'hidden',
    transitionDuration: tokens.durationFaster,
    transitionProperty: 'background-color, border-color, box-shadow',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      ...shorthands.borderColor(tokens.colorNeutralStroke1),
      boxShadow: tokens.shadow8
    }
  },
  thumb: {
    width: '100%',
    height: '110px',
    objectFit: 'cover',
    backgroundColor: tokens.colorNeutralBackground3,
    display: 'block'
  },
  thumbFallback: {
    width: '100%',
    height: '110px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground3
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '10px 12px 12px',
    minWidth: 0
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap'
  },
  time: {
    color: tokens.colorNeutralForeground3
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
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
  empty: {
    color: tokens.colorNeutralForeground3,
    padding: '8px 0'
  }
});

const NewsThumb: React.FunctionComponent<{
  src?: string;
  className: string;
  fallbackClassName: string;
}> = (props) => {
  const [failed, setFailed] = React.useState(false);
  if (!props.src || failed) {
    return (
      <span className={props.fallbackClassName} aria-hidden="true">
        <Image24Regular />
      </span>
    );
  }
  return (
    <img
      className={props.className}
      src={props.src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};

export interface INewsWallProps {
  news: INewsItem[];
  now: Date;
}

/** 2-up news wall with image thumbnails, source and author byline. */
const NewsWall: React.FunctionComponent<INewsWallProps> = ({ news, now }) => {
  const styles = useStyles();
  const items = news.slice(0, 4);

  return (
    <DashboardCard title="News" icon={<News20Regular />} action={{ label: 'View all' }}>
      {items.length === 0 ? (
        <Text className={styles.empty}>No news right now — check back later.</Text>
      ) : (
        <div className={styles.grid}>
          {items.map((n) => (
            <div key={n.id} className={styles.card}>
              <NewsThumb
                src={n.imageUrl}
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
    </DashboardCard>
  );
};

export default NewsWall;
