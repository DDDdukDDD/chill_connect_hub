const fs = require('fs');
const content = fs.readFileSync('scripts/generate_77_spots.js', 'utf8');
const provMatches = content.match(/province:\s*['"`]([^'"`]+)['"`]/g) || [];
console.log('Provinces found in generate_77_spots.js:', provMatches.length);
provMatches.forEach(p => console.log(p));
