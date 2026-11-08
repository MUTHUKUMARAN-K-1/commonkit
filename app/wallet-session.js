// Resolve the actual connected signer immediately before every wallet request.
export async function assertWalletAccount(wallet,expected){
  const accounts=await wallet.getAccounts({network:'testnet'});
  if(!accounts.some(a=>a.accountId===expected))throw Error('Wallet account changed. Reconnect before signing.');
  return expected;
}
export function pendingReceipt(records,signerId,contractId){
  return records.find(r=>r.signerId===signerId&&r.contractId===contractId&&r.status==='unconfirmed');
}
export const executionSucceeded=record=>record?.status==='executed';
