import type { IMockUserSeed } from '../models/seeds';

/** Mock signed-in user shaped like Microsoft Graph `user` (`/me`). */
export const mockUser: IMockUserSeed = {
  id: 'user-0',
  displayName: 'Vesa Juvonen',
  givenName: 'Vesa',
  mail: 'vesa@contoso.com',
  userPrincipalName: 'vesa@contoso.com'
};
