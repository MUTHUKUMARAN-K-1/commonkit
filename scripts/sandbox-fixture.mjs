// Read-only fixture download. Never imports operator credentials or signs.
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

export const DAO_WASM_SHA256 = '880bae9a58c99ec1efe8b10cf834b3f0c0ebc7a05d71206f3c1202c4280952da';
export const DAO_SOURCE = 'ckdao-mw7e25at.sputnikv2.testnet';
const fixture = new URL('../artifacts/sputnik-dao.wasm', import.meta.url);
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export async function loadDaoWasm() {
  let bytes;
  try { bytes = await readFile(fixture); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    let lastError;
    for (const endpoint of ['https://test.rpc.fastnear.com', 'https://rpc.testnet.near.org']) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST', headers: {'content-type':'application/json'},
          body: JSON.stringify({jsonrpc:'2.0', id:1, method:'query', params:{request_type:'view_code', account_id:DAO_SOURCE, finality:'final'}}),
          signal: AbortSignal.timeout(20000),
        });
        assert.ok(response.ok, `Fixture RPC HTTP ${response.status}`);
        const result = await response.json();
        assert.ok(result.result?.code_base64, `Fixture RPC: ${JSON.stringify(result.error)}`);
        bytes = Buffer.from(result.result.code_base64, 'base64');
        assert.equal(sha256(bytes), DAO_WASM_SHA256, 'Sputnik bytecode changed; review the fixture pin before updating it');
        break;
      } catch (error) { lastError = error; }
    }
    if (!bytes || sha256(bytes) !== DAO_WASM_SHA256) throw lastError;
    await mkdir(new URL('../artifacts/', import.meta.url), {recursive:true});
    await writeFile(fixture, bytes);
  }
  assert.equal(sha256(bytes), DAO_WASM_SHA256, 'Cached Sputnik fixture hash mismatch');
  return bytes;
}
