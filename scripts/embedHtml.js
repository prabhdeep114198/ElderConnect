/**
 * embedHtml.js
 * Run: node scripts/embedHtml.js
 * Regenerates assets/webrtcCallPage.ts from webrtc_call.html
 */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(
  path.join(__dirname, '../frontend/webrtc_call.html'), 'utf-8'
);

// Escape for template literal
const escaped = html
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${');

const ts = `/**
 * webrtcCallPage.ts – AUTO-GENERATED
 * Run: node scripts/embedHtml.js to regenerate
 */
export const WEBRTC_HTML: string = \`${escaped}\`;
`;

fs.writeFileSync(
  path.join(__dirname, '../frontend/assets/webrtcCallPage.ts'),
  ts
);

console.log('✅ webrtcCallPage.ts regenerated');