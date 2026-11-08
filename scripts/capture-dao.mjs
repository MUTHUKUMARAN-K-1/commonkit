import fs from 'node:fs/promises';import {Near}from'near-kit';import assert from'node:assert/strict';
const label=process.argv[2];if(!/^[a-z0-9-]+$/.test(label||''))throw Error('Provide a report label');
const d=JSON.parse(await fs.readFile('app/public/deployment.json'));const n=new Near({network:'testnet'});
const [state,ledger,policy,proposals]=await Promise.all([n.view(d.contractId,'get_state',{}),n.view(d.contractId,'get_ledger',{}),n.view(d.daoId,'get_policy',{}),n.view(d.daoId,'get_proposals',{from_index:0,limit:50})]);
assert.equal(ledger.balanced,true);
if(label==='single-vote'){assert.equal(state.bookings['1'].status,'Disputed');assert.equal(proposals[2].status,'InProgress');assert.equal(Object.keys(proposals[2].votes).length,1);assert.equal(ledger.escrow,11000);assert.equal(ledger.credits,0)}
if(label==='settled'){assert.equal(state.bookings['1'].status,'Closed');assert.equal(state.bookings['1'].damage,3000);assert.equal(state.credits[d.accounts.borrower],7000);assert.equal(state.credits[d.daoId],4000);assert.equal(proposals[2].status,'Approved')}
if(label==='final'){assert.equal(state.bookings['1'].status,'Closed');assert.equal(state.bookings['2'].status,'Closed');assert.equal(ledger.escrow,0);assert.equal(ledger.credits,0);assert.equal(ledger.pending,0);assert.equal(ledger.withdrawn,22000)}
await fs.writeFile(`docs/testnet/browser-${label}.json`,JSON.stringify({at:new Date().toISOString(),deployment:d,state,ledger,policy,proposals,passed:true},null,2));console.log(label,ledger);
