/**
 * Member accounts (the public site's users, not admin staff).
 * Storage goes through MemberRepository so the JSON prototype store can be replaced by a database
 * (e.g. Postgres) without touching the API routes.
 */
export type OAuthProvider = 'google' | 'facebook' | 'apple';
export type LoginMethod = OAuthProvider | 'email';
export type MemberStatus = 'active' | 'suspended' | 'banned';

export interface LinkedProvider {
  provider: OAuthProvider;
  /** The provider's stable user id ("sub") */
  subject: string;
  linkedAt: string;
}

export interface Member {
  id: string;
  displayName: string;
  email?: string;
  emailVerified: boolean;
  avatarUrl?: string;
  /** scrypt$<salt>$<hash>; absent for social-only accounts */
  passwordHash?: string;
  providers: LinkedProvider[];
  status: MemberStatus;
  /** For suspensions: when the account becomes active again */
  suspendedUntil?: string;
  statusReason?: string;
  /** Bumped when the password changes, the status changes or sessions are revoked */
  sessionVersion: number;
  /** Pending "forgot password" link: sha256 of the token's secret part, single use */
  passwordReset?: { tokenHash: string; expiresAt: string };
  /** PDPA: when the member accepted the terms and privacy policy */
  consentAt: string;
  createdAt: string;
  lastLoginAt?: string;
  lastLoginMethod?: LoginMethod;
}

/** What the member's own browser may see */
export interface PublicMember {
  id: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  loginMethods: LoginMethod[];
  createdAt: string;
}

export interface MemberQuery {
  q?: string | null;
  status?: MemberStatus | 'all';
  page: number;
  limit: number;
}

export interface MemberRepository {
  findById(id: string): Promise<Member | null>;
  findByEmail(email: string): Promise<Member | null>;
  findByProvider(provider: OAuthProvider, subject: string): Promise<Member | null>;
  create(member: Member): Promise<Member>;
  update(id: string, changes: Partial<Member>): Promise<Member>;
  remove(id: string): Promise<boolean>;
  query(query: MemberQuery): Promise<{ items: Member[]; totalCount: number; counts: Record<MemberStatus | 'all', number> }>;
}

export function toPublicMember(member: Member): PublicMember {
  return {
    id: member.id,
    displayName: member.displayName,
    email: member.email,
    avatarUrl: member.avatarUrl,
    loginMethods: [...(member.passwordHash ? ['email' as const] : []), ...member.providers.map((p) => p.provider)],
    createdAt: member.createdAt,
  };
}
