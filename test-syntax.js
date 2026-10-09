const fs = require('fs');
const content = fs.readFileSync('C:/Users/Likitha Reddy/.gemini/antigravity/scratch/storycraft-local/index.html', 'utf8');
console.log('File size:', content.length, 'characters');
console.log('Has search input:', content.includes('id="main-search-input"'));
console.log('Has clear button:', content.includes('id="search-clear-btn"'));
console.log('Has autocomplete:', content.includes('id="autocomplete-dropdown"'));
console.log('Has cards grid:', content.includes('id="results-cards-grid"'));
console.log('Has details modal:', content.includes('id="details-modal"'));
console.log('Has database:', content.includes('TOURISM_DATABASE'));
