export const closedStatuses = new Set(['Closed', 'Cancelled', 'Expired']);
export const statusLabel = status => ({Reserved:'Reserved',CheckedOut:'In use',ReturnPending:'Return requested',Disputed:'Council review',Closed:'Settled',Cancelled:'Cancelled',Expired:'Expired'})[status] || status;

export function chooseBooking(bookings, account, assets = {}) {
  const ordered = Object.values(bookings || {}).sort((a,b) => b.id-a.id);
  const active = ordered.filter(b => !closedStatuses.has(b.status));
  return (active.find(b => account && (b.borrower === account || assets[b.asset_id]?.custodian === account)) || active[0] || ordered[0])?.id ?? null;
}

export function walletRoles(account, state, council = []) {
  if (!account) return ['Not connected'];
  if (!state) return ['Checking role'];
  const roles=[];
  if (state.members.includes(account)) roles.push('Member / borrower');
  if (Object.values(state.assets).some(asset=>asset.custodian===account)) roles.push('Custodian');
  if (council.includes(account)) roles.push('Council voter');
  return roles.length ? roles : ['Visitor'];
}

export function bookingJourney(booking) {
  if (!booking) return [];
  if (['Cancelled','Expired'].includes(booking.status)) return [{label:'Reserved',actor:'Borrower',state:'done'},{label:statusLabel(booking.status),actor:'Fee + bond credited',state:'current'}];
  const disputed=booking.status==='Disputed'||!!booking.dispute_hash;
  const steps=[{label:'Reserved',actor:'Borrower'},{label:'Picked up',actor:'Custodian'}];
  if (!disputed || booking.return_hash) steps.push({label:'Return requested',actor:'Borrower'});
  if (disputed) steps.push({label:'Council review',actor:'2 council votes'});
  else steps.push({label:'Return accepted',actor:'Custodian'});
  steps.push({label:'Settled',actor:'Credits allocated'});
  const index=booking.status==='Reserved'?0:booking.status==='CheckedOut'?1:booking.status==='ReturnPending'?2:booking.status==='Disputed'?steps.length-2:booking.status==='Closed'?steps.length-1:-1;
  return steps.map((step,i)=>({...step,state:i<index?'done':i===index?'current':'upcoming'}));
}

export function nextBookingStep(booking, asset, now, approvals=0) {
  if (!booking) return {title:'Choose equipment to begin',body:'An admitted member reserves equipment with a refundable bond.',actor:'Borrower'};
  const who=asset?.custodian || 'the assigned custodian';
  switch(booking.status){
    case 'Reserved': return now>=booking.end?{title:'Refund the uncollected reservation',actor:'Any connected wallet',body:'The pickup window has ended. Refund the fee and bond; retained storage is not refunded.'}:now<booking.start?{title:'Waiting for the pickup window',actor:'Custodian next',body:`${who} confirms pickup once the reservation starts. The borrower can cancel before then.`}:{title:'Confirm the equipment handover',actor:'Custodian next',body:`${who} adds pickup evidence and confirms the borrower has collected the equipment.`};
    case 'CheckedOut': return {title:'Request return when the equipment is ready',actor:'Borrower next',body:`${booking.borrower} adds return evidence. The custodian can report damage if needed.`};
    case 'ReturnPending': return {title:'Inspect the returned equipment',actor:'Custodian next',body:`${who} accepts the return or reports a dispute. The borrower cannot approve their own return.`};
    case 'Disputed': if(approvals>=2)return {title:'Both council votes are recorded',actor:'Verify execution',body:'Settlement is not reflected in the library yet. Refresh the state and inspect final execution receipts before taking another action.'}; return {title:approvals?`${approvals} of 2 votes recorded`:'Propose a fair settlement',actor:'Council next',body:approvals?'The other council account must approve the same proposal. Funds stay in escrow until settlement executes.':'A council member proposes the damage amount and decision evidence. Both council accounts must approve.'};
    case 'Closed': return {title:'Settlement is recorded',actor:'Borrower + DAO treasury',body:'The fee and bond allocation is historical. Withdrawals are separate transactions; check current wallet credit and receipts below.'};
    case 'Cancelled': case 'Expired': return {title:'Reservation ended without pickup',actor:'Borrower',body:'The fee and bond are credited for withdrawal. The storage charge remains with the library.'};
    default:return {title:'Review the latest library state',actor:'Refresh required',body:'This booking status is not recognized by this interface.'};
  }
}

export function proposalSummary(method,args={}) {
  if(method==='resolve')return {title:`Settle booking #${args.id}`,detail:'Decide how the refundable bond is split.',bookingId:args.id};
  if(method==='withdraw')return {title:'Withdraw DAO credit',detail:'Transfer the DAO’s available library credit into its treasury.'};
  if(method==='set_member')return {title:args.admitted?'Admit a member':'Revoke membership',detail:args.member||'Review member account'};
  if(method==='register_asset')return {title:'Register equipment',detail:args.name||args.id||'Review equipment details'};
  if(method==='handover')return {title:'Change equipment custodian',detail:'Review the designated custodian in the proposal details.'};
  return {title:'Review DAO proposal',detail:'Inspect the requested action before voting.'};
}

export function settlementMatches(proposal, booking, args, receiver, contractId) {
  return proposal.status==='Approved' && receiver===contractId && booking?.status==='Closed' &&
    booking.damage===args.damage_micro_near && booking.dispute_hash===args.evidence_hash;
}
