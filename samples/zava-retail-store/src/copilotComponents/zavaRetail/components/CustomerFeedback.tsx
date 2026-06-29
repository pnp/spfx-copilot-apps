import * as React from 'react';
import { Star16Filled, Star16Regular } from '@fluentui/react-icons';
import { useZavaStyles } from './useZavaStyles';

interface IFeedbackEntry {
  name: string;
  rating: number;
  date: string;
  text: string;
}

const FEEDBACK: IFeedbackEntry[] = [
  {
    name: 'Olivia M.',
    rating: 5,
    date: 'May 15',
    text: 'The staff were incredibly helpful and the store looked beautiful. Found everything I needed.'
  },
  {
    name: 'James T.',
    rating: 4,
    date: 'May 15',
    text: 'Good selection and prices. Checkout was quick and easy on a busy afternoon.'
  }
];

function renderStars(rating: number, styles: ReturnType<typeof useZavaStyles>): React.ReactElement {
  return (
    <span className={styles.feedbackStars}>
      {[1, 2, 3, 4, 5].map((index) => (index <= rating ? <Star16Filled key={index} /> : <Star16Regular key={index} />))}
    </span>
  );
}

/**
 * Recent customer feedback cards with star ratings and sentiment badges.
 */
export default function CustomerFeedback(): React.ReactElement {
  const styles = useZavaStyles();

  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHead}>
        <div className={styles.panelTitle}>Recent Customer Feedback</div>
        <span className={styles.linkText}>View all</span>
      </div>

      <div className={styles.feedbackList}>
        {FEEDBACK.map((entry) => (
          <div key={entry.name} className={styles.feedbackCard}>
            <div className={styles.feedbackHead}>
              <span className={styles.feedbackName}>{entry.name}</span>
              {renderStars(entry.rating, styles)}
            </div>
            <div className={styles.feedbackText}>{entry.text}</div>
            <div className={styles.feedbackMeta}>
              <span className={styles.feedbackDate}>{entry.date}</span>
              <span className={styles.positiveBadge}>Positive</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
