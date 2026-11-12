import {validAccount} from './amounts.js';

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

// connector.wallet() deletes the selected wallet when an account read fails.
// A read-only refresh must leave that selection intact so retry can recover.
export async function connectedWallet(connector){
  return (await connector.getConnectedWallet()).wallet;
}

export async function connectAccounts(connector,walletId){
  const connected=await connector.connect(walletId?{walletId}:undefined);
  // Read the wallet that just connected, rather than resolving a second wallet
  // from storage while its sign-in event is still being processed.
  const accounts=await connected.getAccounts({network:'testnet'});
  if(!Array.isArray(accounts)||!accounts.length)throw Error('No testnet account was returned. Choose an account in Meteor and reconnect.');
  return accounts;
}

export function connectionMessage(error){
  const detail=error?.message||String(error);
  if(/cancel|reject|closed|denied/i.test(detail))return 'Connection cancelled. Your quote is kept. You can explore or connect again when ready.';
  return `Could not finish connecting: ${detail}. Choose Meteor Web in the chooser, unlock Meteor, and allow its popup. Close the wallet chooser before retrying.`;
}
export function uniqueWalletAccounts(accounts){
  return [...new Map((Array.isArray(accounts)?accounts:[]).filter(a=>a&&validAccount(a.accountId)).map(a=>[a.accountId,a])).values()];
}
