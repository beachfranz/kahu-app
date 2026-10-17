// After `expo export --platform web`: make dist/ ready for GitHub Pages.
//  - .nojekyll: Pages' Jekyll would drop the `_expo` folder (leading underscore).
//  - 404.html: unknown paths get the app shell instead of GitHub's 404.
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';

const dist = new URL('../dist/', import.meta.url);
writeFileSync(new URL('.nojekyll', dist), '');
const notFound = new URL('+not-found.html', dist);
copyFileSync(existsSync(notFound) ? notFound : new URL('index.html', dist), new URL('404.html', dist));
console.log('dist/ ready for GitHub Pages (.nojekyll, 404.html)');
