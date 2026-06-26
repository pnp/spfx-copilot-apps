import type { IQuickAction } from '../models/myDay';

/**
 * Mock quick-action tiles for the full-screen view. **Demo only / no-op** — each
 * tile is illustrative and does not perform a real action in the sample.
 */
export const mockQuickActions: IQuickAction[] = [
  {
    id: 'book-room',
    title: 'Book a room',
    description: 'Find and reserve a space nearby',
    icon: 'room'
  },
  {
    id: 'new-note',
    title: 'New note',
    description: 'Capture a quick thought',
    icon: 'note'
  },
  {
    id: 'time-off',
    title: 'Request time off',
    description: 'Submit a leave request',
    icon: 'timeoff'
  }
];
