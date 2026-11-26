/**
 * When and where a photo was taken, read in the browser from the JPEG's EXIF block before the photo is made small
 * (making it small on a canvas drops EXIF). Only the time and the GPS point are read. Phones often strip the GPS point
 * when a photo is picked in a browser (iPhone does unless the location option is on), so both may be missing: the trip
 * editor then falls back to the file's date and asks for the city of the day.
 */

export interface PhotoFacts {
  /** Wall-clock time where it was taken: "YYYY-MM-DDTHH:MM" */
  takenLocal?: string;
  lat?: number;
  lng?: number;
}

const HEAD_BYTES = 256 * 1024;

function readExif(view: DataView): PhotoFacts {
  // JPEG: FF D8, then segments; EXIF lives in APP1 (FF E1) starting with "Exif\0\0"
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return {};
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset);
    const size = view.getUint16(offset + 2);
    if (marker === 0xffe1 && view.getUint32(offset + 4) === 0x45786966 && view.getUint16(offset + 8) === 0) return readTiff(view, offset + 10);
    if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) break; // start of the image data: no EXIF before it
    offset += 2 + size;
  }
  return {};
}

function readTiff(view: DataView, start: number): PhotoFacts {
  const little = view.getUint16(start) === 0x4949;
  const u16 = (at: number) => view.getUint16(start + at, little);
  const u32 = (at: number) => view.getUint32(start + at, little);
  const inRange = (at: number, length: number) => start + at + length <= view.byteLength;

  type Entry = { tag: number; type: number; count: number; valueAt: number };
  const entries = (ifd: number): Entry[] => {
    if (!inRange(ifd, 2)) return [];
    const count = u16(ifd);
    const list: Entry[] = [];
    for (let i = 0; i < count; i++) {
      const at = ifd + 2 + i * 12;
      if (!inRange(at, 12)) break;
      const type = u16(at + 2);
      const n = u32(at + 4);
      const bytes = n * ({ 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 } as Record<number, number>)[type];
      list.push({ tag: u16(at), type, count: n, valueAt: bytes > 4 ? u32(at + 8) : at + 8 });
    }
    return list;
  };
  const ascii = (e: Entry) => {
    let out = '';
    for (let i = 0; i < e.count && inRange(e.valueAt + i, 1); i++) {
      const c = view.getUint8(start + e.valueAt + i);
      if (c === 0) break;
      out += String.fromCharCode(c);
    }
    return out;
  };
  const rationals = (e: Entry) => {
    const out: number[] = [];
    for (let i = 0; i < e.count; i++) {
      const at = e.valueAt + i * 8;
      if (!inRange(at, 8)) break;
      const den = u32(at + 4);
      out.push(den ? u32(at) / den : 0);
    }
    return out;
  };

  const ifd0 = entries(u32(4));
  const facts: PhotoFacts = {};
  const dateTime = ifd0.find((e) => e.tag === 0x0132);
  const exifPointer = ifd0.find((e) => e.tag === 0x8769);
  let original = '';
  if (exifPointer) {
    const exif = entries(u32(exifPointer.valueAt));
    const taken = exif.find((e) => e.tag === 0x9003) ?? exif.find((e) => e.tag === 0x9004);
    if (taken) original = ascii(taken);
  }
  if (!original && dateTime) original = ascii(dateTime);
  const match = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2})/.exec(original);
  if (match && match[1] !== '0000') facts.takenLocal = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}`;

  const gpsPointer = ifd0.find((e) => e.tag === 0x8825);
  if (gpsPointer) {
    const gps = entries(u32(gpsPointer.valueAt));
    const latRef = gps.find((e) => e.tag === 1);
    const lat = gps.find((e) => e.tag === 2);
    const lngRef = gps.find((e) => e.tag === 3);
    const lng = gps.find((e) => e.tag === 4);
    if (lat && lng && lat.type === 5 && lng.type === 5) {
      const toDegrees = ([d = 0, m = 0, s = 0]: number[]) => d + m / 60 + s / 3600;
      let latValue = toDegrees(rationals(lat));
      let lngValue = toDegrees(rationals(lng));
      if (latRef && ascii(latRef).startsWith('S')) latValue = -latValue;
      if (lngRef && ascii(lngRef).startsWith('W')) lngValue = -lngValue;
      if ((latValue || lngValue) && Math.abs(latValue) <= 90 && Math.abs(lngValue) <= 180) {
        facts.lat = latValue;
        facts.lng = lngValue;
      }
    }
  }
  return facts;
}

/** The phone's wall-clock time of a moment as "YYYY-MM-DDTHH:MM" */
function localStamp(ms: number): string {
  const date = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Time and place of a picked photo; the time falls back to the file's date, which is when it was saved */
export async function readPhotoFacts(file: File): Promise<PhotoFacts & { takenLocal: string; fromFileDate: boolean }> {
  let facts: PhotoFacts = {};
  try {
    facts = readExif(new DataView(await file.slice(0, HEAD_BYTES).arrayBuffer()));
  } catch {
    facts = {};
  }
  return facts.takenLocal
    ? { ...facts, takenLocal: facts.takenLocal, fromFileDate: false }
    : { ...facts, takenLocal: localStamp(file.lastModified || Date.now()), fromFileDate: true };
}
