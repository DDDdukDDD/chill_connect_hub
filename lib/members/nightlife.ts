/** Thai law sets 20 for drinking venues. The year of birth is what the member told us, so this is a check, not proof */
export const NIGHTLIFE_CATEGORY = 'bars_nightlife';

/** Why this member cannot take part in a bar ตี้, or null. No server imports: the forms say it before anything is filled in */
export function nightlifeAgeMessage(birthYear: number | undefined): string | null {
  if (!birthYear) return 'ตี้หมวดบาร์สำหรับอายุ 20 ปีขึ้นไป บอกปีเกิดของคุณในหน้าเริ่มต้นก่อนนะ';
  return new Date().getFullYear() - birthYear < 20 ? 'ตี้หมวดบาร์สำหรับอายุ 20 ปีขึ้นไป' : null;
}
