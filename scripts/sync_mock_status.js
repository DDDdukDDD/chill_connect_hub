const fs = require('fs');
const path = require('path');

const mockPath = path.join(__dirname, '..', 'data', 'mockData.ts');
let content = fs.readFileSync(mockPath, 'utf-8');

const THAI_MONTHS_MAP = {
  'ม.ค.': 0, 'มกราคม': 0, 'jan': 0,
  'ก.พ.': 1, 'กุมภาพันธ์': 1, 'feb': 1,
  'มี.ค.': 2, 'มีนาคม': 2, 'mar': 2,
  'เม.ย.': 3, 'เมษายน': 3, 'apr': 3,
  'พ.ค.': 4, 'พฤษภาคม': 4, 'may': 4,
  'มิ.ย.': 5, 'มิถุนายน': 5, 'jun': 5,
  'ก.ค.': 6, 'กรกฎาคม': 6, 'jul': 6,
  'ส.ค.': 7, 'สิงหาคม': 7, 'aug': 7,
  'ก.ย.': 8, 'กันยายน': 8, 'sep': 8,
  'ต.ค.': 9, 'ตุลาคม': 9, 'oct': 9,
  'พ.ย.': 10, 'พฤศจิกายน': 10, 'nov': 10,
  'ธ.ค.': 11, 'ธันวาคม': 11, 'dec': 11,
};

function parseEventEndDateToTimestamp(dateStr) {
  if (!dateStr) return 9999999999999;
  const str = dateStr.trim().toLowerCase();
  let year = 2026;
  const yearMatch = str.match(/(202[4-9]|203[0-9]|256[7-9]|257[0-9])/);
  if (yearMatch) {
    let y = parseInt(yearMatch[1], 10);
    if (y > 2500) y -= 543;
    year = y;
  }
  let month = 7;
  for (const [mName, mIdx] of Object.entries(THAI_MONTHS_MAP)) {
    if (str.includes(mName)) month = mIdx;
  }
  let day = 1;
  const allDays = Array.from(str.matchAll(/(\d{1,2})/g)).map((m) => parseInt(m[1], 10));
  if (allDays.length > 0) day = allDays[allDays.length - 1];
  return new Date(year, month, day, 23, 59, 59).getTime();
}

const now = new Date(2026, 7, 25, 0, 0, 0).getTime(); // 25 Aug 2026

// Match every event object in mockData.ts and ensure its status is correctly marked
const eventRegex = /\{\s*id:\s*'([^']+)'[\s\S]*?date:\s*'([^']+)'[\s\S]*?status:\s*'([^']+)'/g;

let match;
let countEnded = 0;
let countActive = 0;
let updatedContent = content;

// Replace accurately block by block
const blocks = content.split(/(?=\{\s*id:\s*'[a-zA-Z0-9_-]+')/);

const processedBlocks = blocks.map((block) => {
  const idMatch = block.match(/id:\s*'([^']+)'/);
  const dateMatch = block.match(/date:\s*'([^']+)'/);
  const statusMatch = block.match(/status:\s*'([^']+)'/);

  if (idMatch && dateMatch && statusMatch) {
    const id = idMatch[1];
    const dateStr = dateMatch[1];
    const oldStatus = statusMatch[1];
    
    const endT = parseEventEndDateToTimestamp(dateStr);
    const correctStatus = endT < now ? 'ended' : 'active';

    if (correctStatus === 'ended') countEnded++;
    else countActive++;

    if (oldStatus !== correctStatus) {
      return block.replace(`status: '${oldStatus}'`, `status: '${correctStatus}'`);
    }
  }
  return block;
});

fs.writeFileSync(mockPath, processedBlocks.join(''), 'utf-8');
console.log('mockData.ts updated successfully! Total ended:', countEnded, 'Total active:', countActive);
