export type PublicUser = {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
};

type UserRow = {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
};

export function toPublicUser(user: UserRow): PublicUser {
  return {
    id: user.id,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
  };
}
