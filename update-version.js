const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
    // 1. Get current version from package.json
    const packageJson = require('./package.json');
    const version = packageJson.version;

    // 2. Generate Timestamp (YYYYMMDDHHmmss)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;

    const cacheName = `moukaeritai-v${version}-${timestamp}`;

    // 3. Update sw.js
    const swPath = path.join(__dirname, 'sw.js');
    let swContent = fs.readFileSync(swPath, 'utf8');

    // Regex to replace the CACHE_NAME line
    // const CACHE_NAME = '...';
    // We use a relatively flexible regex to catch the current value
    const regex = /const CACHE_NAME = ['"].*['"];/;
    if (regex.test(swContent)) {
        swContent = swContent.replace(regex, `const CACHE_NAME = '${cacheName}';`);
        fs.writeFileSync(swPath, swContent, 'utf8');
        console.log(`Updated sw.js CACHE_NAME to: ${cacheName}`);
    } else {
        console.error('Error: Could not find CACHE_NAME pattern in sw.js');
        process.exit(1);
    }

    // 4. Update index.html
    const indexPath = path.join(__dirname, 'index.html');
    let indexContent = fs.readFileSync(indexPath, 'utf8');

    // Regex to replace the version display in HTML
    // <span id="app-version-display" ...>...</span>
    const indexRegex = /(<span id="app-version-display"[^>]*>)(.*?)(<\/span>)/;

    if (indexRegex.test(indexContent)) {
        // Format: v0.1.0 (2025/12/22 09:00)
        const formattedDate = `${year}/${month}/${day} ${hours}:${minutes}`;
        const versionString = `v${version} (${formattedDate})`;

        indexContent = indexContent.replace(indexRegex, `$1${versionString}$3`);
        fs.writeFileSync(indexPath, indexContent, 'utf8');
        console.log(`Updated index.html version to: ${versionString}`);
    } else {
        console.warn('Warning: Could not find app-version-display in index.html');
    }

    // 5. Git Add (to include sw.js and index.html in the version commit)
    execSync(`git add sw.js index.html`, { stdio: 'inherit' });

} catch (error) {
    console.error('Failed to update version:', error);
    process.exit(1);
}
