import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {Near} from 'near-kit';
const label=process.argv[2];
assert(['single-vote','settled','final'].includes(label),'Use single-vote, settled or final');
const deployment=JSON.parse(await fs.readFile('app/public/deployment.json'));
const near=new Near({network:'testnet'});
const [state,ledger,proposals]=await Promise.all([
  near.view(deployment.contractId,'get_state',{}),near.view(deployment.contractId,'get_ledger',{}),
  near.view(deployment.daoId,'get_proposals',{from_index:4,limit:20})
]);
assert.equal(ledger.balanced,true);
const booking=state.bookings['3'];
const settlement=proposals.find(p=>p.kind?.FunctionCall?.actions?.some(a=>a.method_name==='resolve'&&JSON.parse(Buffer.from(a.args,'base64').toString()).id===3));
assert(settlement,'Missing browser settlement proposal');
if(label==='single-vote'){
  assert.equal(booking.status,'Disputed');assert.equal(settlement.status,'InProgress');
  assert.equal(Object.keys(settlement.votes).length,1);assert.equal(ledger.escrow,11000);assert.equal(ledger.credits,0);
}else{
  assert.equal(booking.status,'Closed');assert.equal(booking.damage,3000);assert.equal(settlement.status,'Approved');
  assert.equal(Object.keys(settlement.votes).length,2);
  if(label==='settled'){assert.equal(state.credits[deployment.accounts.borrower],7000);assert.equal(state.credits[deployment.daoId],4000);}
  if(label==='final'){assert.equal(ledger.deposited,33000);assert.equal(ledger.withdrawn,33000);for(const key of ['escrow','credits','pending'])assert.equal(ledger[key],0);}
}
const report={at:new Date().toISOString(),url:'https://commonkit-testnet.muthukumarank.chatgpt.site',wallet:'Meteor Web in Chrome',deployment,state,ledger,proposals,passed:true};
await fs.writeFile(`docs/testnet/meteor-${label}.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify({label,ledger,booking:booking.status,proposal:settlement.id,status:settlement.status,votes:Object.keys(settlement.votes).length}));
