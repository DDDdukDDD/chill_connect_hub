const fs = require('fs');
const path = require('path');

// Execute generation and write out data/allProvincesSpots.ts and data/chill_database.json
const outputPath = path.join(__dirname, '..', 'data', 'allProvincesSpots.ts');
const jsonDbPath = path.join(__dirname, '..', 'data', 'chill_database.json');

console.log('Building full 77 provinces dataset...');
