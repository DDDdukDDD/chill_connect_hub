const fs = require('fs');

const bkk = fs.readFileSync('data/spots/bangkok.ts', 'utf8');
const central = fs.readFileSync('data/spots/central.ts', 'utf8');
const north = fs.readFileSync('data/spots/north.ts', 'utf8');
const south = fs.readFileSync('data/spots/south.ts', 'utf8');
const ne = fs.readFileSync('data/spots/northeast.ts', 'utf8');
const ew = fs.readFileSync('data/spots/east_west.ts', 'utf8');

const countSpots = (content) => (content.match(/title:\s*['"`]/g) || []).length;
console.log('Bangkok spots:', countSpots(bkk));
console.log('Central spots:', countSpots(central));
console.log('North spots:', countSpots(north));
console.log('South spots:', countSpots(south));
console.log('Northeast spots:', countSpots(ne));
console.log('East/West spots:', countSpots(ew));

const total = countSpots(bkk) + countSpots(central) + countSpots(north) + countSpots(south) + countSpots(ne) + countSpots(ew);
console.log('TOTAL SPOTS in files:', total);
