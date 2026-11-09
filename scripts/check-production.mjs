import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {PROOF_CASES} from '../app/public/verification/cases.js';

// Validate the actual static artifact, not the source tree.
const root = path.resolve('dist');
const required = ['index.html', 'judge.html', 'judge/story.js', 'judge/story.css', 'judge/dm-sans.woff2', 'judge/instrument-serif.woff2', 'verify.html', 'verification/page.js', 'verification/page.css', 'verification/engine.js', 'verification/rpc.js', 'verification/manifest.json', 'verification/normal-manifest.json', 'verification/normal-historical-single-vote.json', 'verification/normal-historical-settled.json', 'verification/normal-historical-final.json', 'verification/historical-single-vote.json', 'verification/historical-settled.json', 'verification/historical-final.json', 'deployment.json', 'demo-guide.html', 'evidence/pickup.txt', 'evidence/return.txt', 'evidence/damage.txt', 'evidence/decision.txt'];
for (const name of required) await fs.access(path.join(root, name));
await fs.access(path.join(root, 'verification/cases.js'));
await fs.access(path.join(root, 'verification/vercel/deployment.json'));
for (const [flow, proof] of Object.entries(PROOF_CASES)) {
  const manifest = JSON.parse(await fs.readFile(path.join(root, proof.manifest), 'utf8'));
  assert.equal(manifest.flow, flow);
  assert.equal(manifest.booking.id, proof.bookingId);
  for (const name of ['settled', 'treasury-single-vote', 'final', 'receipts', ...(flow === 'dispute' ? ['single-vote'] : [])]) {
    await fs.access(path.join(root, 'verification', proof.archive, `${name}.json`));
  }
}
const deployment = JSON.parse(await fs.readFile(path.join(root, 'deployment.json'), 'utf8'));
assert.equal(deployment.network, 'testnet');
assert(deployment.contractId.endsWith('.testnet') && deployment.daoId.endsWith('.testnet'));
let checked = 0;
async function scan(dir) {
  for (const entry of await fs.readdir(dir, {withFileTypes: true})) {
    const file = path.join(dir, entry.name);
    assert(!entry.isSymbolicLink(), 'Static output must not contain symlinks');
    if (entry.isDirectory()) { await scan(file); continue; }
    assert(!/^(?:\.env|accounts\.json)|\.(?:key|pem|map)$/.test(entry.name), `Unexpected production file: ${entry.name}`);
    const content = await fs.readFile(file, 'utf8');
    assert(!/ed25519:[1-9A-HJ-NP-Za-km-z]{80,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content), `Potential private key in ${entry.name}`);
    assert(!content.includes('/__dev-wallet/keys') && !content.includes('connectDevWallet'), `Development signer leaked into ${entry.name}`);
    checked++;
  }
}
await scan(root);
console.log(`PASS production artifact: ${checked} files, testnet configuration, guide and evidence present, development signer excluded.`);
