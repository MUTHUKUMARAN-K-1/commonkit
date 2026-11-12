import {validAccount} from './amounts.js';

// Admission is proven by library state, never by a proposal's approval alone.
export function membershipStatus({account,model,fresh,policyVerified,proposals=[],contractId,council=[],policy,now=Date.now()}) {
  if(!account)return {kind:'disconnected',title:'Explore now. Borrow as a member.',body:'Connecting shares your testnet account. It does not grant library membership or reserve equipment.'};
  if(!model||!fresh)return {kind:'checking',title:'Membership needs a fresh check',body:'Refresh the library before relying on this wallet’s access. Booking stays disabled while live state is unavailable.'};
  if(model.members.includes(account))return {kind:'member',title:'Library member',body:'This wallet is admitted. You can reserve enabled equipment held by another custodian.'};
  const pending=policyVerified&&[...proposals].reverse().find(p=>{
    const call=p.kind?.FunctionCall,action=call?.actions?.[0];
    if(p.status!=='InProgress'||call?.receiver_id!==contractId||call.actions.length!==1||action.method_name!=='set_member'||action.deposit!=='0')return false;
    try{
      const args=JSON.parse(atob(action.args));
      const expires=BigInt(p.submission_time)+BigInt(policy.proposal_period);
      return args.member===account&&args.admitted===true&&expires>BigInt(now)*1000000n;
    }catch{return false;}
  });
  if(pending){const votes=council.filter(a=>['Approve','VoteApprove'].includes(pending.votes?.[a])).length;return {kind:'pending',proposalId:pending.id,title:`Admission proposal #${pending.id} · ${votes} of 2 votes`,body:'The council still needs to finish this decision. Membership is granted only when execution appears in the library. Refresh access after the votes.'};}
  return {kind:'visitor',title:'Not admitted to borrow',body:'Borrowing membership is separate from custodian or council roles. Ask a community organizer to propose admission; both council accounts must approve. You can explore both recorded flows while you wait.'};
}

export function membershipDraft(account,contractId,daoId){
  if(![account,contractId,daoId].every(validAccount))throw Error('Load the library and connect your wallet before preparing a request.');
  return `CommonKit membership request — NEAR testnet\nAccount: ${account}\nLibrary: ${contractId}\nCouncil DAO: ${daoId}\n\nPlease review my request to borrow community equipment. A council member can open Council → Propose a library change → Membership, enter my account and choose Admit member. Both council accounts must approve before I can borrow.\n\nDraft only — not sent or submitted on-chain. Never share a seed phrase or private key.`;
}
