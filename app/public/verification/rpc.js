// Read-only JSON-RPC transport shared by the browser and Node command.
export const DEFAULT_ENDPOINTS = ['https://test.rpc.fastnear.com', 'https://rpc.testnet.near.org'];
export const ARCHIVAL_ENDPOINT = 'https://archival-rpc.testnet.near.org';
export class Unavailable extends Error {}
// The free archive is heavily rate limited. Share one queue across proof panels
// on the same page, without caching responses or delaying current-state reads.
export function createArchiveQueue({intervalMs = 6500, now = Date.now, wait = ms => new Promise(resolve => setTimeout(resolve, ms))} = {}) {
  let tail = Promise.resolve(), lastStart = -Infinity;
  return operation => {
    const task = tail.then(async () => {
      const delay = Math.max(0, lastStart + intervalMs - now());
      if (delay) await wait(delay);
      lastStart = now();
      return operation();
    });
    tail = task.catch(() => {}); // A rejected read must not poison later reads.
    return task;
  };
}
const sharedArchiveQueue = createArchiveQueue();
export function createRpc({endpoints = DEFAULT_ENDPOINTS, receiptEndpoints = endpoints === DEFAULT_ENDPOINTS ? [ARCHIVAL_ENDPOINT, ...endpoints] : endpoints, fetchImpl = fetch, timeoutMs = 12000, archiveQueue = sharedArchiveQueue} = {}) {
  const requests = [];
  const allowed = new Set(['status', 'block', 'query', 'EXPERIMENTAL_tx_status']);
  const queries = new Set(['view_account', 'view_access_key_list', 'call_function']);
  async function rpc(method, params) {
    if (!allowed.has(method) || (method === 'query' && !queries.has(params.request_type))) throw Error('Read-only RPC method required');
    const errors = [];
    // Completed rehearsals outlive the recent-node transaction retention window.
    // An explicit endpoint override still controls every request (including tests).
    for (const endpoint of method === 'EXPERIMENTAL_tx_status' ? receiptEndpoints : endpoints) {
      const read = async () => {
        const started = Date.now();
        try {
          const response = await fetchImpl(endpoint, {method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({jsonrpc: '2.0', id: 'commonkit-public-verifier', method, params}), signal: AbortSignal.timeout(timeoutMs), cache: 'no-store'});
          if (!response.ok) throw Error(`HTTP ${response.status}`);
          const body = await response.json();
          if (body.error) throw Error(body.error.message || body.error.name || 'RPC rejected query');
          if (!body.result || typeof body.result !== 'object') throw Error('Missing RPC result');
          requests.push({endpoint, method, ok: true, elapsedMs: Date.now() - started});
          return body.result;
        } catch (error) {
          requests.push({endpoint, method, ok: false, elapsedMs: Date.now() - started});
          throw error;
        }
      };
      try { return await (endpoint === ARCHIVAL_ENDPOINT && method === 'EXPERIMENTAL_tx_status' ? archiveQueue(read) : read()); }
      catch (error) { errors.push(`${endpoint}: ${error.message}`); }
    }
    throw new Unavailable(errors.join('; '));
  }
  return {rpc, requests};
}
