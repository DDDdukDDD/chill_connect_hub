// scripts/build_full_datasets.js
const fs = require('fs');
const path = require('path');

// Helper to write TypeScript files
function writeTs(filePath, varName, spots) {
  const content = `import { Spot } from '../spotsData';

export const ${varName}: Spot[] = ${JSON.stringify(spots, null, 2)};
`;
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully wrote ${spots.length} spots to ${filePath}`);
}

console.log('Writing comprehensive builder for all 4 remaining regions...');
