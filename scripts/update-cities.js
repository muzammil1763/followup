const fs = require('fs');

// Read extracted cities
const cities = JSON.parse(fs.readFileSync('cities-extracted.json', 'utf8'));

// Generate cities.ts content
const content = `import { Country } from './types';

export const cities: Record<Country, string[]> = {
  UAE: ${JSON.stringify(cities.UAE, null, 4).replace(/\n/g, '\n  ')},
  KSA: ${JSON.stringify(cities.KSA, null, 4).replace(/\n/g, '\n  ')},
};
`;

fs.writeFileSync('lib/cities.ts', content);
console.log('✅ cities.ts updated');
console.log(`UAE: ${cities.UAE.length} cities`);
console.log(`KSA: ${cities.KSA.length} cities`);
