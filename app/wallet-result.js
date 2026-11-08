// A wallet response is not proof of final receipt execution. Confirm via testnet RPC.
export function transactionHash(result) {
  const hash = result?.transaction?.hash;
  return typeof hash === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(hash) ? hash : null;
}

export function inspectFinalOutcome(result, expected) {
  if (result?.final_execution_status !== 'FINAL') throw Error('Transaction is not final yet');
  const tx = result.transaction;
  if (tx?.hash !== expected.hash || tx.signer_id !== expected.signerId || tx.receiver_id !== expected.receiverId) {
    throw Error('Transaction does not match the requested signer and receiver');
  }
  if (tx.actions?.length !== 1 || tx.actions[0]?.FunctionCall?.method_name !== expected.method) {
    throw Error('Transaction does not match the requested contract method');
  }
  const statuses = [result.status, result.transaction_outcome?.outcome?.status,
    ...(result.receipts_outcome || []).map(receipt => receipt.outcome?.status)];
  const failed = statuses.find(status => status && typeof status === 'object' && 'Failure' in status);
  if (failed) return {status: 'failed', error: JSON.stringify(failed.Failure)};
  if (!result.status || typeof result.status !== 'object' || !('SuccessValue' in result.status)) {
    throw Error('Final execution result is unavailable');
  }
  return {status: 'executed', error: null};
}
