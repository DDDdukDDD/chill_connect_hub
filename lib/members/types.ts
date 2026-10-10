import { tidyDisplayName } from '../displayName';
import { trustOf } from './trust';

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

/** Onboarding answers; ids match master data (community categories, spot vibes, fair categories, provinces) */
export interface MemberPreferences {
  /** What the member came to do. "host" / "venue" / "organizer" is an intent, not a granted role. */
  intent: 'member' | 'host' | 'venue' | 'organizer';
  goals: string[];
  birthYear?: number;
  gender?: 'female' | 'male' | 'lgbtq';
  interests: { communityCategories: string[]; spotVibes: string[]; fairCategories: string[] };
  province?: string;
  updatedAt: string;
}

/** PDPA: what the member agreed to, when, and where they agreed */
export interface MemberConsent {
  termsVersion: string;
  acceptedAt: string;
  /** Set when the member ticked "I am 18 or older" */
  ageConfirmedAt?: string;
  /**
   * signup_form: ticked both boxes on the sign-up screen (email or social).
   * social_login: a new account created from the log-in screen, which only states the terms beside the buttons.
   */
  source: 'signup_form' | 'social_login';
}

/* ---------- Trust and safety ---------- */

export type TrustLevel = 'new' | 'verified' | 'trusted';
export type HostStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type RiskFlagCode = 'disposable_email' | 'shared_ip' | 'risky_name' | 'risky_text' | 'contact_info' | 'reported';

export interface RiskFlag {
  code: RiskFlagCode;
  detail: string;
  at: string;
}

/** What a browser may know about a member's standing (the member's own, or shown as badges on a public profile) */
export interface MemberTrust {
  level: TrustLevel;
  emailVerified: boolean;
  hasEmail: boolean;
  pledged: boolean;
  hostStatus: HostStatus;
  accountDays: number;
}

/** A request to open public activities as a host, venue or organizer; staff approve it in the admin console */
export interface HostApplication {
  kind: 'host' | 'venue' | 'organizer';
  /** What they plan to run and their experience */
  about: string;
  /** A page that shows who they are (shop page, portfolio, past events) */
  link?: string;
  status: Exclude<HostStatus, 'none'>;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  /** Staff note; shown to the member when rejected */
  note?: string;
}

/** Optional "about me" details. Every field is optional and can be hidden from the public profile. */
export interface MemberProfile {
  bio?: string;
  occupation?: string;
  workplace?: string;
  education?: string;
  hometown?: string;
  livingArea?: string;
  relationshipStatus?: string;
  connectGoal?: string;
  /** Keys of PROFILE_FIELD_KEYS the member chose not to show */
  hidden: string[];
}

export const PROFILE_TEXT_FIELDS = ['bio', 'occupation', 'workplace', 'education', 'hometown', 'livingArea', 'relationshipStatus', 'connectGoal'] as const;
/** Everything that can be shown or hidden on a public profile (text fields plus answers from onboarding) */
export const PROFILE_FIELD_KEYS = [...PROFILE_TEXT_FIELDS, 'gender', 'age', 'province', 'interests'] as const;
export type ProfileFieldKey = (typeof PROFILE_FIELD_KEYS)[number];
/** Hidden unless the member turns them on: details that help someone target a person */
export const PROFILE_HIDDEN_BY_DEFAULT: ProfileFieldKey[] = ['workplace', 'relationshipStatus', 'age'];

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
  /** Details of that acceptance (absent on accounts created before 2026-10-10) */
  consent?: MemberConsent;
  preferences?: MemberPreferences;
  /** When onboarding was first completed */
  onboardedAt?: string;
  profile?: MemberProfile;
  /** Community pledge (no selling, real identity, respect): when and which version was accepted */
  pledgeAcceptedAt?: string;
  pledgeVersion?: string;
  /** Pending "confirm your email" link: sha256 of the token's secret part */
  emailVerification?: { tokenHash: string; expiresAt: string };
  hostApplication?: HostApplication;
  /** Automatic warning signs for staff; never shown to members */
  riskFlags?: RiskFlag[];
  /** Flags and reports older than this have been looked at by staff */
  riskReviewedAt?: string;
  /** One-way fingerprint of the sign-up IP (see trust.hashIp) */
  signupIpHash?: string;
  reportsReceived?: { byId: string; reason: string; at: string }[];
  /** Members this member does not want to see */
  blockedIds?: string[];
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
  /** False until the member finishes (or skips through) onboarding once */
  onboarded: boolean;
  trust: MemberTrust;
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
    // Names saved before the clean-up existed are tidied when shown
    displayName: tidyDisplayName(member.displayName).trim() || member.displayName,
    email: member.email,
    avatarUrl: member.avatarUrl,
    loginMethods: [...(member.passwordHash ? ['email' as const] : []), ...member.providers.map((p) => p.provider)],
    createdAt: member.createdAt,
    onboarded: Boolean(member.onboardedAt),
    trust: trustOf(member),
  };
}
