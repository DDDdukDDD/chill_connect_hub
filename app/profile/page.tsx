import { ProfileScreen } from './ProfileScreen';

export const metadata = { title: 'โปรไฟล์ · Chill & Connect Hub' };

// /profile (my own) · /profile?id=mem_… (a member's public profile) · /profile?id=host-… (sample profile)
export default async function ProfilePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await searchParams;
  const profileId = (Array.isArray(id) ? id[0] : id) || 'me';
  return <ProfileScreen profileId={profileId.slice(0, 80)} />;
}
