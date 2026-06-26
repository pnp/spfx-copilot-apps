import { faces } from './faces';

/**
 * Standard Microsoft 365 demo-tenant personas used across the sample's mock data
 * (mail senders, news authors, …). Each carries a display name, a contoso email
 * alias, and an embedded face photo (base64 data URI from {@link faces}) so the
 * sample is fully self-contained inside the bundle.
 */
export interface IMockPerson {
  displayName: string;
  email: string;
  photoUrl: string;
}

export const people = {
  megan: { displayName: 'Megan Bowen', email: 'meganb@contoso.com', photoUrl: faces['megan-bowen'] },
  diego: { displayName: 'Diego Siciliani', email: 'diegos@contoso.com', photoUrl: faces['diego-siciliani'] },
  grady: { displayName: 'Grady Archie', email: 'gradya@contoso.com', photoUrl: faces['grady-archie'] },
  isaiah: { displayName: 'Isaiah Langer', email: 'isaiahl@contoso.com', photoUrl: faces['isaiah-langer'] },
  johanna: { displayName: 'Johanna Lorenz', email: 'johannal@contoso.com', photoUrl: faces['johanna-lorenz'] },
  joni: { displayName: 'Joni Sherman', email: 'jonis@contoso.com', photoUrl: faces['joni-sherman'] },
  lee: { displayName: 'Lee Gu', email: 'leeg@contoso.com', photoUrl: faces['lee-gu'] },
  miriam: { displayName: 'Miriam Graham', email: 'miriamg@contoso.com', photoUrl: faces['miriam-graham'] },
  nestor: { displayName: 'Nestor Wilke', email: 'nestorw@contoso.com', photoUrl: faces['nestor-wilke'] },
  patti: { displayName: 'Patti Fernandez', email: 'pattif@contoso.com', photoUrl: faces['patti-fernandez'] },
  pradeep: { displayName: 'Pradeep Gupta', email: 'pradeepg@contoso.com', photoUrl: faces['pradeep-gupta'] }
} satisfies Record<string, IMockPerson>;

export type MockPersonKey = keyof typeof people;
