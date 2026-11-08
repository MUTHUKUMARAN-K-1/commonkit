const $=id=>document.getElementById(id);
let state,selected='camera',busy=false;
const format=n=>(n/1e6).toLocaleString('en-US',{maximumFractionDigits:6})+' NEAR';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={camera:'<rect x="12" y="28" width="85" height="51" rx="8"/><path d="M32 28l7-12h31l7 12"/><circle cx="56" cy="53" r="18"/><circle cx="56" cy="53" r="11"/><path d="M20 37h10m49 0h9"/>',projector:'<rect x="9" y="30" width="95" height="42" rx="8"/><circle cx="31" cy="51" r="13"/><circle cx="31" cy="51" r="7"/><path d="M59 43h33M59 50h33M59 57h33M24 73v5m67-5v5M29 22h58"/>',printer:'<path d="M20 16h73v65H20zM29 24h55v45H29zM24 81h65M56 24v18m-12 0h24l-5 10H49zM39 67l17-10 17 10M55 52v4"/>'};
function localInput(t){const d=new Date(t*1000);return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}
function notify(message,error=false){$('notice').textContent=message;$('notice').className=error?'error':'';}
async function request(path,data){const response=await fetch(path,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:undefined,body:data?JSON.stringify(data):undefined});const result=await response.json();if(result.model){state=result;render()}if(!response.ok||result.ok===false)throw Error(result.error||'Request failed');return result;}
function render(){
 const m=state.model,l=state.ledger;
 $('asset-count').textContent=Object.keys(m.assets).length;$('member-count').textContent=m.members.length;
 $('return-count').textContent=Object.values(m.reputation).reduce((a,b)=>a+b,0);
 $('assets').innerHTML=Object.values(m.assets).map((a,i)=>`<button class="asset-card ${a.id===selected?'selected':''}" data-select="${escape(a.id)}" aria-pressed="${a.id===selected}"><div class="asset-art"><span class="asset-number">CK / 00${i+1}</span><svg viewBox="0 0 114 100" aria-hidden="true">${icons[a.id]}</svg></div><div class="asset-content"><span class="category">${({camera:'CREATE & DOCUMENT',projector:'MEET & TEACH',printer:'BUILD & PROTOTYPE'})[a.id]}</span><h3>${escape(a.name)}</h3><div class="asset-meta">Managed by ${escape(a.custodian)}</div><div class="asset-bottom"><b>${format(a.fee)} / booking</b><span>${a.id===selected?'Selected ✓':'Choose ↗'}</span></div></div></button>`).join('');
 const a=m.assets[selected];$('selected-name').textContent=a.name;$('fee').textContent=format(a.fee);$('bond').textContent=format(a.bond);$('total').textContent=format(a.fee+a.bond);
 const bookings=Object.values(m.bookings).reverse();$('booking-count').textContent=bookings.length+' BOOKINGS';
 $('booking-list').innerHTML=bookings.length?bookings.map(b=>{
  let actions='';const add=(action,label,cls='')=>actions+=`<button class="${cls}" data-action="${action}" data-id="${b.id}">${label}</button>`;
  if(b.status==='Reserved'){if(state.now<b.start){add('clock','Move demo clock to pickup');add('cancel','Borrower: cancel')}else if(state.now<b.end)add('pickup','Custodian: confirm pickup');else add('expire','Refund unused booking');add('overlap','Test conflicting booking','danger');}
  if(b.status==='CheckedOut'){add('request_return','Borrower: request return');add('dispute','Custodian: report damage','danger');}
  if(b.status==='ReturnPending'){add('accept_return','Custodian: accept return');add('self_approve','Test borrower self-approval','danger');add('dispute','Custodian: report damage','danger');}
  if(b.status==='Disputed'){add('resolve','DAO: settle with 10% bond deduction');}
  if(['CheckedOut','ReturnPending'].includes(b.status)&&state.now>=b.end+86400)add('escalate','Escalate overdue case to DAO');
  return `<article class="booking" data-booking="${b.id}"><div class="booking-header"><h3>#${b.id} · ${escape(m.assets[b.asset_id].name)}</h3><span class="tag">${b.status.replace(/([a-z])([A-Z])/g,'$1 $2')}</span></div><p>${escape(b.borrower)} · ${new Date(b.start*1000).toLocaleString()} · ${Math.round((b.end-b.start)/3600)}h</p><p>Bond ${format(b.bond)} · Fee ${format(b.fee)}${b.damage?' · DAO-awarded damages '+format(b.damage):''}</p>${b.return_hash?`<p>Return evidence: ${b.return_hash.slice(0,16)}… (local sample)</p>`:''}<div class="actions">${actions}</div></article>`;
 }).join(''):'<div class="empty">The equipment is ready. Your first reservation starts the story.</div>';
 $('balanced').textContent=l.balanced?'BALANCED ✓':'MISMATCH';
 $('ledger').innerHTML=[['Deposited',l.deposited],['In escrow',l.escrow],['Available',l.credits],['Pending',l.pending],['Withdrawn',l.withdrawn]].map(([name,n])=>`<div><span>${name}</span><b>${format(n).replace(' NEAR','')}</b></div>`).join('');
 $('credits').innerHTML=Object.entries(m.credits).filter(([,v])=>v>0).map(([account,v])=>`<div class="credit"><span>${escape(account)} · ${format(v)}</span><button data-withdraw="${escape(account)}">Simulate withdrawal</button></div>`).join('');
 $('pending').innerHTML=Object.values(m.pending).map(w=>`<div class="pending">Pending #${w.nonce} · ${format(w.amount)} to ${escape(w.account)}<br><button data-callback="${w.nonce}" data-success="true">Simulate success</button><button data-callback="${w.nonce}" data-success="false">Simulate transfer failure</button></div>`).join('');
 $('clock').textContent='Demo clock: '+new Date(state.now*1000).toLocaleString();
 $('events').innerHTML=state.events.length?state.events.slice(0,12).map(e=>`<div class="event"><span class="${e.ok?'pass':'fail'}">${e.ok?'APPLIED':'BLOCKED'}</span><span>${escape(e.action.replaceAll('_',' '))}</span><span>${escape(e.actor)}</span><span>${escape(e.detail)}</span></div>`).join(''):'<p class="fine">No events yet. Every attempted action appears here, including rejected actions.</p>';
}
async function evidence(label,id){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`commonkit-local-example:${label}:${id}`));return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function action(action,actor,args){return request('/api/action',{action,actor,args});}
async function task(fn){if(busy)return;busy=true;try{await fn()}catch(e){notify(e.message,true)}finally{busy=false;}}
$('reserve-form').addEventListener('submit',e=>{e.preventDefault();task(async()=>{const a=state.model.assets[selected];const start=Math.floor(new Date($('start').value).getTime()/1000);const result=await action('reserve',$('borrower').value,{asset_id:selected,start,end:start+Number($('duration').value),deposit:a.fee+a.bond});notify(`Booking #${result.result.booking_id} reserved in the local demo. Bond held separately.`);});});
document.addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;
 if(button.dataset.select){selected=button.dataset.select;render();return;}
 if(button.dataset.withdraw)return task(async()=>{await action('withdraw',button.dataset.withdraw,{});notify('Withdrawal pending. Choose a simulated receipt result below.');});
 if(button.dataset.callback)return task(async()=>{await action('callback','local-simulator',{nonce:Number(button.dataset.callback),success:button.dataset.success==='true'});notify(button.dataset.success==='true'?'Demo withdrawal completed.':'Transfer failure restored the credit. It can be retried.');});
 if(button.dataset.action)return task(async()=>{
  const id=Number(button.dataset.id),b=state.model.bookings[id],custodian=state.model.assets[b.asset_id].custodian;let kind=button.dataset.action,actor=b.borrower,args={id};
  if(kind==='clock'){await request('/api/clock',{now:b.start});notify('Demo clock moved to pickup time.');return;}
  if(kind==='overlap'){await action('reserve',b.borrower,{asset_id:b.asset_id,start:Math.max(state.now,b.start),end:b.end,deposit:b.fee+b.bond});return;}
  if(['pickup','accept_return','dispute'].includes(kind))actor=custodian;
  if(kind==='pickup'||kind==='dispute'||kind==='request_return')args.hash=await evidence(kind,id);
  if(kind==='accept_return')args.hash=b.return_hash;
  if(kind==='self_approve'){kind='accept_return';args.hash=b.return_hash;}
  if(kind==='resolve'){actor=state.model.dao;args.damage=Math.floor(b.bond/10);args.hash=await evidence('dao-resolution',id);}
  await action(kind,actor,args);notify('Applied in the local simulation. Accounting remains visible below.');
 });
});
$('advance-day').addEventListener('click',()=>task(()=>request('/api/clock',{now:state.now+172800})));
$('reset').addEventListener('click',()=>task(async()=>{await request('/api/reset',{});$('start').value=localInput(Math.ceil((state.now+60)/3600)*3600);notify('Demo reset. No real funds were involved.');}));
request('/api/state').then(()=>{$('start').value=localInput(Math.ceil((state.now+60)/3600)*3600)}).catch(e=>notify('Start the local server to use this demo: '+e.message,true));
