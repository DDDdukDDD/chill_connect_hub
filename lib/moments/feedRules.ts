import type { Moment } from './types';

/** Words the form used to fill in when no place was chosen; a post without a place now simply shows none */
export const NOT_A_PLACE = ['ไลฟ์สไตล์ทั่วไป', 'ตำแหน่งปัจจุบันของฉัน (GPS)', 'กรุงเทพมหานคร (พิกัดใกล้ฉัน)'];
const NOT_A_PLACE_SET = new Set(NOT_A_PLACE);

export const realPlace = (value: string | undefined) => (value && !NOT_A_PLACE_SET.has(value) ? value : '');

/** Belongs under "สถานที่": tied to a place, or a post with a place typed by hand and nothing else to file it under (owner 2026-11-04) */
export const isPlaceMoment = (moment: Pick<Moment, 'targetType' | 'location'>) =>
  moment.targetType === 'spot' || (moment.targetType === 'general' && realPlace(moment.location).trim() !== '');
