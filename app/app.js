import './style.css';
import {NearConnector} from '@hot-labs/near-connect';
import {Near} from 'near-kit';
import {transactionHash,inspectFinalOutcome} from './wallet-result.js';
import {chooseBooking,walletRoles,statusLabel,bookingJourney,nextBookingStep,proposalSummary,settlementMatches} from './presentation.js';
const $=id=>document.getElementById(id);
const near=new Near({network:'testnet'});
const connector=new NearConnector({network:'testnet',features:{testnet:true}});
const devEnabled=import.meta.env.DEV&&import.meta.env.VITE_DEV_WALLET==='1';
let devWallet=null,account='',walletAccounts=[],contractId='',model=null,ledger=null,storage=0,config={},assetId='',bookingId=null,busy=false,readSequence=0;
let manualBookingSelection=false;
let daoPolicy=null,proposals=[],policyVerified=false,daoError='',receiptHistory=[];
const receiptKey='commonkit.testnet.receipts.v1';
try{const records=JSON.parse(localStorage.getItem(receiptKey)||'[]');if(Array.isArray(records))receiptHistory=records.filter(r=>r&&typeof r.hash==='string'&&/^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(r.hash)).slice(0,100);}catch{}
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const micro=n=>{if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid amount from contract');return BigInt(n);};
const money=n=>{const v=micro(n),f=(v%1000000n).toString().padStart(6,'0').replace(/0+$/,'');return `${v/1000000n}${f?'.'+f:''} NEAR`;};
const yoctoMoney=n=>{const v=BigInt(n),f=(v%10n**24n).toString().padStart(24,'0').replace(/0+$/,'');return `${v/10n**24n}${f?'.'+f:''} NEAR`;};
const toMicro=value=>{if(!/^\d+(\.\d{1,6})?$/.test(value))throw Error('Enter an amount with at most six decimals');const [w,f='']=value.split('.');const n=BigInt(w)*1000000n+BigInt(f.padEnd(6,'0'));if(n>1000000000n)throw Error('Maximum amount is 1,000 NEAR');return Number(n);};
const validAccount=s=>typeof s==='string'&&s.length>=2&&s.length<=64&&/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(s);
const contract=s=>{if(!validAccount(s)||!s.endsWith('.testnet'))throw Error('Use a named .testnet contract account');return s;};
const date=n=>new Date(n*1000).toLocaleString([],{dateStyle:'medium',timeStyle:'short'});
const wallet=async()=>devWallet||await connector.wallet();
const council=()=>daoPolicy?.roles?.find(r=>r.name==='council')?.kind?.Group||[];
function message(text,error=false){$('notice').textContent=text;$('notice').classList.toggle('error',error);}
async function guard(fn){if(busy)return;busy=true;render();try{await fn();}catch(e){message(e.message||String(e),true);}finally{busy=false;render();}}
function validatePolicy(policy){
  const roles=policy?.roles||[],role=roles.find(r=>r.name==='council'),group=role?.kind?.Group;
  if(!Array.isArray(group)||group.length!==2||new Set(group).size!==2)return false;
  const vote=role.vote_policy?.call||policy.default_vote_policy;
  if(vote?.weight_kind!=='RoleWeight'||String(vote.quorum)!=='2'||String(vote.threshold)!=='2')return false;
  const canApprove=r=>(r.permissions||[]).some(p=>['*:VoteApprove','call:VoteApprove','*:*','call:*'].includes(p));
  if(!canApprove(role)||roles.some(r=>r!==role&&canApprove(r)))return false;
  return /^\d+$/.test(policy.proposal_bond);
}
async function refresh(){
  if(!contractId)return;
  const seq=++readSequence,current=contractId;
  const [state,balance,charge]=await Promise.all([near.view(current,'get_state',{}),near.view(current,'get_ledger',{}),near.view(current,'storage_charge_micro_near',{})]);
  if(seq!==readSequence||current!==contractId)return;
  if(!state.assets||!state.bookings||!Array.isArray(state.members)||typeof balance.balanced!=='boolean')throw Error('Unsupported CommonKit library state');
  micro(charge);model=state;ledger=balance;storage=charge;
  if(!state.assets[assetId])assetId=Object.keys(state.assets)[0]||'';
  if(!manualBookingSelection||!state.bookings[bookingId])bookingId=chooseBooking(state.bookings,account,state.assets);
  daoPolicy=null;proposals=[];policyVerified=false;daoError='';
  try{
    const [policy,last]=await Promise.all([near.view(state.dao,'get_policy',{}),near.view(state.dao,'get_last_proposal_id',{})]);
    const count=Number(last);if(!Number.isSafeInteger(count)||count<0)throw Error('Invalid proposal count');
    const list=await near.view(state.dao,'get_proposals',{from_index:Math.max(0,count-50),limit:50});
    if(seq!==readSequence||current!==contractId)return;
    if(!Array.isArray(list))throw Error('Invalid proposal list');daoPolicy=policy;proposals=list;policyVerified=validatePolicy(policy);
    if(!policyVerified)daoError='The loaded DAO does not match the required two-person council and 2-of-2 approval policy. Proposal and voting actions are disabled.';
  }catch(e){if(seq!==readSequence||current!==contractId)return;daoError='DAO policy unavailable: '+e.message;}
  render();
}
function renderReceipts(){
  $('receipts').replaceChildren();
  const list=receiptHistory.filter(r=>!contractId||r.contractId===contractId);
  for(const r of list){const li=node('li');li.append(node('span',`${r.method} · ${r.status} · ${r.signerId} → ${r.receiverId} · `));const a=node('a',r.hash);a.href=`https://testnet.nearblocks.io/txns/${encodeURIComponent(r.hash)}`;a.target='_blank';a.rel='noopener noreferrer';li.append(a);if(r.status==='unconfirmed'){const verify=node('button','Check confirmation');verify.disabled=busy;verify.onclick=()=>guard(async()=>{await confirmReceipt(r);await refresh();message('Transaction confirmation checked on testnet.');});li.append(verify);}$('receipts').append(li);}
  if(!list.length)$('receipts').append(node('li','Public transaction receipts will appear here and persist on this device.','muted'));
}
function saveReceipt(record){receiptHistory=[record,...receiptHistory.filter(r=>r.hash!==record.hash)].slice(0,100);try{localStorage.setItem(receiptKey,JSON.stringify(receiptHistory));}catch{}renderReceipts();}
async function confirmReceipt(record){
  const final=await near.getTransactionStatus(record.hash,record.signerId,'FINAL');
  const checked=inspectFinalOutcome(final,record);saveReceipt({...record,status:checked.status});
  if(checked.error)throw Error('Transaction failed: '+checked.error);
  return final;
}
async function transact(method,args={},deposit='0',receiverId=contractId){
  if(!account||!model)throw Error('Connect a testnet wallet and load the library first');
  const w=await wallet(),accounts=await w.getAccounts({network:'testnet'});
  if(!accounts.some(a=>a.accountId===account))throw Error('Wallet account changed. Reconnect before signing.');
  const signerId=account;
  message('Review and approve the transaction in your wallet. Allow its popup, and keep this tab open until confirmation.');
  const result=await w.signAndSendTransaction({network:'testnet',signerId:account,receiverId,actions:[{type:'FunctionCall',params:{methodName:method,args,gas:receiverId===model.dao?'250000000000000':'100000000000000',deposit}}]});
  const hash=transactionHash(result);
  if(!hash){await refresh();message('Wallet returned without a transaction receipt. Check wallet activity before retrying; execution has not been confirmed.',true);return result;}
  const record={hash,method,receiverId,signerId,contractId,createdAt:new Date().toISOString(),status:'unconfirmed'};saveReceipt(record);
  message('Submitted. Waiting for final testnet execution and contract receipts…');
  try{await confirmReceipt(record);}catch(error){await refresh().catch(()=>{});throw Error(error.message+' Check the receipt before submitting again.');}
  await refresh();
  message(receiverId===model.dao?'DAO transaction confirmed on testnet. Review the proposal and resulting library state below.':'Transaction confirmed on testnet. Library state refreshed.');
  return result;
}
const encodeArgs=args=>btoa(Array.from(new TextEncoder().encode(JSON.stringify(args)),b=>String.fromCharCode(b)).join(''));
function decodeArgs(value){try{const parsed=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(value),c=>c.charCodeAt(0))));return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:{unrecognized_arguments:parsed};}catch{return {unreadable_base64:value};}}
async function propose(method,args){
  if(!policyVerified||!council().includes(account))throw Error('A verified 2-of-2 council member must submit this proposal');
  const description=`CommonKit ${method}: ${JSON.stringify(args)}`;
  if(description.length>1500)throw Error('Proposal description is too long');
  const proposal={description,kind:{FunctionCall:{receiver_id:contractId,actions:[{method_name:method,args:encodeArgs(args),deposit:'0',gas:'100000000000000'}]}}};
  await transact('add_proposal',{proposal},daoPolicy.proposal_bond,model.dao);
}
async function vote(proposal){
  if(!policyVerified||!council().includes(account))throw Error('Only the verified council can vote');
  if(proposal.status!=='InProgress'||proposal.votes?.[account])throw Error('This proposal is no longer available for this wallet to vote');
  await transact('act_proposal',{id:proposal.id,action:'VoteApprove',proposal:proposal.kind,memo:null},'0',model.dao);
}
const approvalCount=p=>council().filter(a=>['Approve','VoteApprove'].includes(p.votes?.[a])).length;
function selectBooking(id){manualBookingSelection=true;bookingId=id;$('evidence-hash').value='';$('evidence-file').value='';render();$('booking-detail').scrollIntoView({behavior:'smooth',block:'nearest'});}
function renderRoles(){
  $('wallet-connection').textContent=account?'Wallet connected':'Viewing public state';
  $('wallet-role').textContent=walletRoles(account,model,council()).join(' + ')+(account&&model&&!model.members.includes(account)&&!council().includes(account)&&!Object.values(model.assets).some(a=>a.custodian===account)?' · Ask the council for membership to borrow.':'');
  const selected=model?.bookings[bookingId],asset=model?.assets[selected?.asset_id||assetId];
  const borrower=selected?.borrower||(model?.members.includes(config.accounts?.borrower)?config.accounts.borrower:model?.members[0]);
  $('role-cards').replaceChildren();
  for(const [number,title,ids,description] of [['01','Borrower',[borrower].filter(Boolean),'Reserves, requests return and withdraws their credit.'],['02','Custodian',[asset?.custodian].filter(Boolean),'Confirms pickup, inspects returns and reports damage.'],['03','Council',council(),'Two separate accounts approve the same decision.']]){
    const active=!!account&&ids.includes(account),card=node('article',undefined,`role-card${active?' active':''}`),heading=node('div',undefined,'role-title');heading.append(node('span',number),node('h3',title));if(active)heading.append(node('span','Your role','role-marker'));card.append(heading,node('p',description));
    for(const id of ids)card.append(node('code',id));if(!ids.length)card.append(node('small',model?'Not assigned':'Loading on-chain roles…'));$('role-cards').append(card);
  }
}
function renderProposals(){
  const historyOpen=$('proposal-history').open,opened=new Set([...document.querySelectorAll('.proposal details[open]')].map(d=>d.dataset.proposal));
  $('proposals').replaceChildren();$('past-proposals').replaceChildren();$('dao-policy').textContent=policyVerified?'2 OF 2 REQUIRED':'POLICY UNVERIFIED';
  $('dao-proposal-bond').textContent=daoPolicy?`Proposal bond: ${yoctoMoney(daoPolicy.proposal_bond)}`:daoError||'Load the DAO policy to submit proposals.';
  const pending=proposals.filter(p=>p.status==='InProgress').length;
  $('proposal-count').textContent=daoPolicy?`${pending} awaiting a decision · ${proposals.length} recent proposals`:'Loading council decisions…';
  if(daoError)$('proposals').append(node('p',daoError,'notice error'));
  let historical=0;
  const newest=Math.max(-1,...proposals.map(p=>p.id));
  for(const p of [...proposals].sort((a,b)=>(b.status==='InProgress')-(a.status==='InProgress')||b.id-a.id)){
    const call=p.kind?.FunctionCall,action=call?.actions?.[0],args=action?decodeArgs(action.args):{},summary=call?.actions?.length===1?proposalSummary(action?.method_name,args):{title:call?.actions?.length>1?`Review ${call.actions.length} proposed actions`:'Review DAO proposal',detail:'Inspect every requested action before voting.'},approved=approvalCount(p);
    const box=node('article',undefined,`proposal ${p.status==='InProgress'?'pending-proposal':''}`),head=node('div',undefined,'proposal-heading'),title=node('div');title.append(node('span',`PROPOSAL ${String(p.id).padStart(2,'0')}`,'eyebrow'),node('h3',summary.title));head.append(title,node('span',({InProgress:'Awaiting votes',Approved:'Approved',Rejected:'Rejected',Failed:'Execution failed',Removed:'Removed',Expired:'Expired'})[p.status]||p.status,`tag ${p.status==='Approved'?'good':p.status==='InProgress'?'warning':''}`));box.append(head,node('p',summary.detail,'proposal-description'));
    if(action?.method_name==='resolve'&&Number.isSafeInteger(args.damage_micro_near))box.append(node('p',`Damage withheld: ${money(args.damage_micro_near)} · Booking #${args.id}`,'decision-amount'));
    const voteRow=node('div',undefined,'vote-row'),score=node('div',undefined,'vote-score');score.append(node('strong',`${approved}`),node('span','/ 2'),node('small','council approvals'));voteRow.append(score);const voters=node('div',undefined,'voters');
    for(const voter of council()){const decision=p.votes?.[voter],yes=['Approve','VoteApprove'].includes(decision),row=node('div',undefined,`voter ${yes?'voted':''}`);row.append(node('span',yes?'✓':decision?'−':'○','vote-icon'),node('code',voter),node('span',yes?'Approved':decision||'No vote','vote-label'));voters.append(row);}voteRow.append(voters);box.append(voteRow);
    if(call?.actions?.length===1&&action?.method_name==='resolve'&&settlementMatches(p,model?.bookings[args.id],args,call?.receiver_id,contractId))box.append(node('p','✓ Settlement visible in the library: the booking is closed with this damage amount and decision evidence.','execution-note'));
    else if(p.status==='Approved')box.append(node('p','Council approval recorded. Check the resulting library state and final execution receipts to verify the action.','execution-note'));
    else if(p.status==='InProgress')box.append(node('p',approved?'One more council approval is needed. The proposed action has not executed.':'Both council accounts must approve before this action can execute.','execution-note'));
    const details=node('details');details.dataset.proposal=String(p.id);details.open=opened.has(String(p.id));details.append(node('summary','Review target, arguments & proposal details'),node('p',`Proposer: ${p.proposer}`,'fine'),node('p',`Target: ${call?.receiver_id||'Other DAO action'}`,'fine'),node('p',p.description,'fine'));
    for(const item of call?.actions||[])details.append(node('p',`Method: ${item.method_name} · Deposit: ${yoctoMoney(item.deposit)} · Gas: ${item.gas}`,'fine'),node('pre',JSON.stringify(decodeArgs(item.args),null,2)));
    details.append(node('pre',JSON.stringify(p.kind,null,2)));box.append(details);
    const supported=call?.receiver_id===contractId&&call.actions?.length>0&&(call.actions||[]).every(a=>['set_member','register_asset','handover','resolve','withdraw'].includes(a.method_name)&&a.deposit==='0');
    if(p.status==='InProgress'){const button=node('button',p.votes?.[account]?'Your vote is recorded':'Approve proposal ↗');button.type='button';button.disabled=busy||!policyVerified||!council().includes(account)||!!p.votes?.[account]||!supported;button.onclick=()=>guard(()=>vote(p));box.append(button);if(!account||!council().includes(account))box.append(node('p','Connect a council account to vote.','fine'));}
    if(!supported)box.append(node('p','Voting here is limited to supported CommonKit actions targeting this library. Review other actions in the DAO interface.','fine'));
    if(summary.bookingId&&model?.bookings[summary.bookingId]){const link=node('button',`View booking #${summary.bookingId}`,'text-button');link.onclick=()=>selectBooking(summary.bookingId);box.append(link);}
    const highlighted=p.status==='InProgress'||p.id===newest||(summary.bookingId===bookingId&&action?.method_name==='resolve');
    $(highlighted?'proposals':'past-proposals').append(box);if(!highlighted)historical++;
  }
  $('proposal-history').hidden=!historical;$('proposal-history').open=historyOpen;$('proposal-history-label').textContent=`Earlier decisions (${historical})`;
  if(daoPolicy&&!proposals.length)$('proposals').append(node('p','No proposals yet. Council members can submit a library change below.','empty'));
}
function render(){
  renderReceipts();$('dev-connect').hidden=!devEnabled;$('dev-connect').disabled=busy;
  $('account').textContent=account?account+(devWallet?' · development signer':''):'Wallet disconnected';$('connect').hidden=!!account;$('disconnect').hidden=!account;
  $('meteor-connect').hidden=!!account;$('meteor-connect').disabled=busy;
  $('wallet-account').replaceChildren();for(const a of walletAccounts){const option=node('option',a.accountId);option.value=a.accountId;$('wallet-account').append(option);}$('wallet-account').value=account;$('wallet-account').hidden=walletAccounts.length<2;$('wallet-account').disabled=busy;
  renderRoles();
  $('connect').disabled=busy;$('disconnect').disabled=busy;$('refresh').disabled=busy||!contractId;$('contract-form').querySelector('button[type=submit]').disabled=busy;
  $('asset-count').textContent=model?Object.keys(model.assets).length:'—';$('member-count').textContent=model?model.members.length:'—';$('credit').textContent=model&&account?money(model.credits[account]||0):'—';$('balance-status').textContent=ledger?(ledger.balanced?'Balanced':'Check required'):'—';
  $('assets').replaceChildren();$('bookings').replaceChildren();$('ledger').replaceChildren();
  for(const a of Object.values(model?.assets||{})){
    const b=node('button',undefined,`asset${a.id===assetId?' selected':''}`);b.type='button';b.disabled=busy;b.setAttribute('aria-pressed',String(a.id===assetId));const left=node('span');left.append(node('strong',a.name),node('small',`${a.id} · Custodian: ${a.custodian}`));const right=node('span',money(a.fee),'price');right.append(node('small',`${money(a.bond)} bond`));b.append(left,right);b.onclick=()=>{assetId=a.id;render();};$('assets').append(b);
  }
  if(!model||!Object.keys(model.assets).length)$('assets').append(node('p',model?'The library is ready for its first equipment. Council members can propose it below.':'Load a deployed library to see equipment and live availability.','empty'));
  const bookings=Object.values(model?.bookings||{}).sort((a,b)=>b.id-a.id);$('booking-count').textContent=`${bookings.length} BOOKINGS`;
  for(const b of bookings){const button=node('button',undefined,`booking${b.id===bookingId?' selected':''}`);button.type='button';button.disabled=busy;button.setAttribute('aria-pressed',String(b.id===bookingId));const info=node('span');info.append(node('strong',`#${b.id} · ${model.assets[b.asset_id]?.name||b.asset_id}`),node('small',`${b.borrower} · ${date(b.start)}`));button.append(info,node('span',statusLabel(b.status),`tag ${b.status==='Closed'?'good':b.status==='Disputed'?'warning':''}`));button.onclick=()=>selectBooking(b.id);$('bookings').append(button);}
  if(!bookings.length)$('bookings').append(node('p',model?'No reservations yet. Choose equipment and a pickup time to get started.':'Bookings appear after the library is loaded.','empty'));
  const a=model?.assets[assetId];$('selected-name').textContent=a?.name||'Choose your equipment';$('fee').textContent=a?money(a.fee):'—';$('bond').textContent=a?money(a.bond):'—';$('storage').textContent=model?money(storage):'—';$('total').textContent=a?money(a.fee+a.bond+storage):'—';
  $('reserve').disabled=busy||!account||!a?.enabled||!model.members.includes(account)||a.custodian===account;
  $('reserve-help').textContent=!account?'Connect an admitted member’s wallet to reserve.':!model?'Load the library first.':!model.members.includes(account)?'This wallet is not an admitted member. Ask the council to propose admission.':a?.custodian===account?'A custodian cannot borrow their own equipment.':'Your wallet will show the exact attached deposit before you sign.';
  $('withdraw').disabled=busy||!account||!model||(model.credits[account]||0)<=0||Object.values(model.pending).some(w=>w.account===account);
  $('withdraw-help').textContent=!account?'Connect a wallet to check its withdrawable credit.':!model?'Load the library to check credit.':Object.values(model.pending).some(w=>w.account===account)?'Your withdrawal is awaiting confirmation.':(model.credits[account]||0)>0?`${money(model.credits[account])} is available for this wallet to withdraw.`:'This wallet has no available credit. Previously withdrawn funds are included in the library totals.';
  if(ledger)for(const [key,label] of [['deposited','Total principal deposited'],['escrow','Active escrow'],['credits','Available credits'],['pending','Transfers pending'],['withdrawn','Withdrawn principal']]){const item=node('div');item.append(node('dt',label),node('dd',money(ledger[key])));$('ledger').append(item);}
  const governance=!!account&&policyVerified&&council().includes(account);document.querySelectorAll('.admin-action').forEach(b=>b.disabled=busy||!governance);
  $('dao-account').textContent=model?`Governance authority: ${model.dao}`:'Load the library to view its governance authority.';
  $('governance-mode').textContent=model?`${contractId} · ${policyVerified?'DAO governance · 2 of 2 council approvals':'Governance policy is unverified. DAO actions remain disabled.'}`:'No live library loaded. Enter a deployed CommonKit testnet contract.';
  $('treasury-credit').textContent=model?`${money(model.credits[model.dao]||0)} available credit · ${model.dao}`:'Load the library to check treasury credit.';
  $('dao-withdraw').disabled=busy||!governance||!(model?.credits[model.dao]>0);renderProposals();
  const b=model?.bookings[bookingId];$('booking-detail').hidden=!b;$('booking-actions').replaceChildren();$('resolve').disabled=busy||!governance||b?.status!=='Disputed';
  $('resolve-context').textContent=b?`Selected booking #${b.id}: ${statusLabel(b.status)}${b.status==='Disputed'?' — council proposal available.':' — select a disputed booking to propose settlement.'}`:'Select a disputed booking to begin.';
  if(b){$('detail-title').textContent=`Booking #${b.id} · ${model.assets[b.asset_id]?.name||b.asset_id}`;$('detail-status').textContent=statusLabel(b.status);$('detail-status').className=`tag ${b.status==='Closed'?'good':b.status==='Disputed'?'warning':''}`;$('detail-info').textContent=`Borrower: ${b.borrower} · ${date(b.start)} → ${date(b.end)} · Bond ${money(b.bond)} · Fee ${money(b.fee)}`;$('recorded-evidence').textContent=`Pickup evidence: ${b.pickup_hash||'not recorded'} · Return evidence: ${b.return_hash||'not recorded'} · Dispute / decision evidence: ${b.dispute_hash||'not recorded'}`;
    $('booking-journey').replaceChildren();
    for(const [i,step] of bookingJourney(b).entries()){const li=node('li',undefined,step.state);li.setAttribute('aria-current',step.state==='current'?'step':'false');li.append(node('span',step.state==='done'?'✓':String(i+1).padStart(2,'0'),'step-number'),node('strong',step.label),node('small',step.actor),node('span',step.state==='done'?'Complete':step.state==='current'?'Current stage':'Up next','step-state'));$('booking-journey').append(li);}
    const activeProposal=[...proposals].reverse().find(p=>['InProgress','Approved'].includes(p.status)&&p.kind?.FunctionCall?.receiver_id===contractId&&p.kind.FunctionCall.actions?.length===1&&p.kind.FunctionCall.actions.some(a=>a.method_name==='resolve'&&decodeArgs(a.args).id===b.id));
    const step=nextBookingStep(b,model.assets[b.asset_id],Math.floor(Date.now()/1000),activeProposal?approvalCount(activeProposal):0);
    if(b.status==='Disputed'&&activeProposal&&!approvalCount(activeProposal)){step.title='Cast the first council vote';step.body='A settlement proposal is ready. Review its damage amount and evidence, then approve it with each council account. Funds remain in escrow until execution.';}
    $('next-step').replaceChildren(node('span',step.actor,'eyebrow'),node('h3',step.title),node('p',step.body));
    if(b.status==='Disputed'){const link=node('a',activeProposal?`Review proposal #${activeProposal.id} →`:'Propose a settlement →');link.href=activeProposal?'#council':'#governance';link.onclick=()=>{if(!activeProposal)$('governance').open=true;};$('next-step').append(link);}
    $('booking-settlement').hidden=!['Closed','Cancelled'].includes(b.status);$('booking-settlement').replaceChildren();
    if(b.status==='Closed'){for(const [label,value] of [['Borrower credit at settlement',b.bond-b.damage],['DAO credit at settlement',b.fee+b.damage]]){const item=node('div');item.append(node('span',label),node('strong',money(value)));$('booking-settlement').append(item);}$('booking-settlement').append(node('p','Historical allocation for this booking. Current credits and withdrawals are tracked separately below.','fine'));}
    else if(b.status==='Cancelled')$('booking-settlement').append(node('p',`${money(b.fee+b.bond)} credited to the borrower. This status does not distinguish a cancellation from an expired reservation refund. Retained storage is not refunded.`,'fine'));
    const custodian=account===model.assets[b.asset_id]?.custodian,borrower=account===b.borrower,now=Math.floor(Date.now()/1000),actions=[
      ['pickup','Confirm pickup',custodian&&b.status==='Reserved'&&now>=b.start&&now<b.end,async()=>({id:b.id,evidence_hash:await evidence()})],
      ['request_return','Request return',borrower&&b.status==='CheckedOut',async()=>({id:b.id,evidence_hash:await evidence()})],
      ['accept_return','Accept return',custodian&&b.status==='ReturnPending',async()=>({id:b.id,expected_hash:b.return_hash})],
      ['dispute','Report damage / dispute',custodian&&['CheckedOut','ReturnPending'].includes(b.status),async()=>({id:b.id,evidence_hash:await evidence()})],
      ['cancel','Cancel reservation',borrower&&b.status==='Reserved'&&now<b.start,async()=>({id:b.id})],
      ['expire','Refund expired reservation',b.status==='Reserved'&&now>=b.end,async()=>({id:b.id})],
      ['escalate','Escalate overdue return',['CheckedOut','ReturnPending'].includes(b.status)&&now>=b.end+86400,async()=>({id:b.id})]
    ];const visible={Reserved:now>=b.end?['expire']:['pickup',...(now<b.start?['cancel']:[])],CheckedOut:['request_return','dispute',...(now>=b.end+86400?['escalate']:[])],ReturnPending:['accept_return','dispute',...(now>=b.end+86400?['escalate']:[])]}[b.status]||[];
    for(const [method,label,allowed,args] of actions){if(!visible.includes(method))continue;const group=node('div',undefined,'action-item'),button=node('button',label+' ↗');button.type='button';button.disabled=busy||!account||!allowed;button.onclick=()=>guard(async()=>transact(method,await args()));group.append(button);const role=['pickup','accept_return','dispute'].includes(method)?'Custodian':['cancel','request_return'].includes(method)?'Borrower':'Any wallet';group.append(node('small',!account?`Connect ${role.toLowerCase()} to continue`:method==='pickup'&&now<b.start?`Opens ${date(b.start)}`:!allowed?`${role} account required`:['pickup','request_return','dispute'].includes(method)?'Add evidence above before signing':`${role} action`));$('booking-actions').append(group);}

  }
}
async function evidence(){const file=$('evidence-file').files[0];if(file){if(file.size>25*1024*1024)throw Error('Choose an evidence file smaller than 25 MB');const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer())),n=>n.toString(16).padStart(2,'0')).join('');$('evidence-hash').value=hash;return hash;}const hash=$('evidence-hash').value.trim();if(!/^[a-f0-9]{64}$/.test(hash))throw Error('Choose a file or enter its 64-character lowercase SHA-256 hash');return hash;}
function setAccounts(accounts){const previous=account;walletAccounts=(accounts||[]).filter(a=>validAccount(a.accountId));if(!walletAccounts.some(a=>a.accountId===account))account=walletAccounts[0]?.accountId||'';if(previous!==account){manualBookingSelection=false;if(model)bookingId=chooseBooking(model.bookings,account,model.assets);}}
async function syncWallet(){try{setAccounts(await(await wallet()).getAccounts({network:'testnet'}));}catch{setAccounts([]);}}
async function connectWallet(walletId){if(devWallet){await devWallet.disconnect?.();devWallet=null;}message('Choose your testnet account in the wallet window. Allow popups for this site.');await connector.connect(walletId?{walletId}:undefined);await syncWallet();await refresh();message(account?'Testnet wallet connected. Your available actions reflect its on-chain roles.':'No wallet account selected.');}
$('connect').onclick=()=>guard(()=>connectWallet());
$('meteor-connect').onclick=()=>guard(()=>connectWallet('meteor-wallet'));
$('wallet-account').onchange=()=>{account=$('wallet-account').value;manualBookingSelection=false;if(model)bookingId=chooseBooking(model.bookings,account,model.assets);render();};
$('disconnect').onclick=()=>guard(async()=>{if(devWallet){await devWallet.disconnect?.();devWallet=null;}else await connector.disconnect();setAccounts([]);message('Wallet disconnected. Choose another account in your wallet, then reconnect.');});
$('dev-connect').onclick=()=>guard(async()=>{if(!devEnabled)throw Error('Development wallet unavailable');const module=await import('./dev-wallet.js');const selected=await module.connectDevWallet();if(selected){devWallet=selected;setAccounts(await devWallet.getAccounts({network:'testnet'}));message('Development testnet signer connected. Every action still sends a real signed testnet transaction.');}});
connector.on('wallet:signIn',event=>{if(devWallet)return;setAccounts(event.accounts);render();});connector.on('wallet:signOut',()=>{if(devWallet)return;setAccounts([]);render();});
$('contract-form').onsubmit=e=>{e.preventDefault();guard(async()=>{contractId=contract($('contract').value.trim());manualBookingSelection=false;model=null;ledger=null;daoPolicy=null;proposals=[];policyVerified=false;readSequence++;render();await refresh();localStorage.setItem('commonkit.testnet.contract',contractId);message('Library and DAO loaded from NEAR testnet.');});};
$('refresh').onclick=()=>guard(async()=>{await syncWallet();await refresh();message('Wallet, library and DAO refreshed from testnet.');});
$('reserve-form').onsubmit=e=>{e.preventDefault();guard(async()=>{const a=model?.assets[assetId];if(!a)throw Error('Choose equipment');const start=Math.floor(new Date($('start').value).getTime()/1000),duration=Number($('duration').value);if(!Number.isSafeInteger(start)||start<=Math.floor(Date.now()/1000)+10)throw Error('Choose pickup at least a minute ahead for transaction confirmation');await transact('reserve',{asset_id:a.id,start,end:start+duration},((micro(a.fee)+micro(a.bond)+micro(storage))*10n**18n).toString());});};
$('withdraw').onclick=()=>guard(()=>transact('withdraw'));
$('member-form').onsubmit=e=>{e.preventDefault();guard(async()=>{const member=$('member').value.trim();if(!validAccount(member))throw Error('Enter a valid member account');await propose('set_member',{member,admitted:$('admitted').value==='true'});});};
$('asset-form').onsubmit=e=>{e.preventDefault();guard(async()=>{const custodian=$('custodian').value.trim();if(!validAccount(custodian))throw Error('Enter a valid custodian account');await propose('register_asset',{id:$('asset-id').value.trim(),name:$('asset-name').value.trim(),custodian,fee_micro_near:toMicro($('asset-fee').value),bond_micro_near:toMicro($('asset-bond').value)});});};
$('resolve-form').onsubmit=e=>{e.preventDefault();guard(async()=>{const b=model?.bookings[bookingId];if(!b||b.status!=='Disputed')throw Error('Choose a disputed booking');const damage=toMicro($('damage').value);if(damage>b.bond)throw Error('Damages cannot exceed the bond');await propose('resolve',{id:b.id,damage_micro_near:damage,evidence_hash:await evidence()});});};
$('dao-withdraw').onclick=()=>guard(()=>propose('withdraw',{}));
const future=new Date(Date.now()+5*60000);future.setSeconds(0,0);$('start').value=new Date(future.getTime()-future.getTimezoneOffset()*60000).toISOString().slice(0,16);
async function init(){try{const r=await fetch('/deployment.json',{cache:'no-store'});if(r.ok)config=await r.json();}catch{}try{contractId=contract(localStorage.getItem('commonkit.testnet.contract')||config.contractId||'');$('contract').value=contractId;await refresh();message('Testnet library loaded. Connect your wallet to borrow or manage equipment.');}catch(e){message(contractId?e.message:'No deployment configured. Enter the deployed CommonKit .testnet account above.',true);}await syncWallet();render();}
init();setInterval(()=>{if(!busy)render();},15000);
