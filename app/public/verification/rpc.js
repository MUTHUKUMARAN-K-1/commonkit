// Read-only JSON-RPC transport shared by the browser and Node command.
export const DEFAULT_ENDPOINTS = ['https://test.rpc.fastnear.com', 'https://rpc.testnet.near.org'];
export class Unavailable extends Error {}
export function createRpc({endpoints = DEFAULT_ENDPOINTS, fetchImpl = fetch, timeoutMs = 12000} = {}) {
  const requests = [];
  const allowed = new Set(['status', 'block', 'query', 'EXPERIMENTAL_tx_status']);
  const queries = new Set(['view_account', 'view_access_key_list', 'call_function']);
  async function rpc(method, params) {
    if (!allowed.has(method) || (method === 'query' && !queries.has(params.request_type))) throw Error('Read-only RPC method required');
    const errors = [];
    for (const endpoint of endpoints) {
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
        errors.push(`${endpoint}: ${error.message}`);
      }
    }
    throw new Unavailable(errors.join('; '));
  }
  return {rpc, requests};
}
