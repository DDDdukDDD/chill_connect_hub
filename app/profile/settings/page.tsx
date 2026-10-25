import { SettingsScreen } from './SettingsScreen';

export const metadata = { title: 'ตั้งค่าบัญชี', robots: { index: false, follow: false } };

// /profile/settings: the account side of my profile (trust steps, host request, email and password, log out)
export default function ProfileSettingsPage() {
  return <SettingsScreen />;
}
