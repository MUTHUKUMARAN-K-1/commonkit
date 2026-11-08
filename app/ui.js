import {animate} from 'motion/mini';
import 'number-flow';
const $=id=>document.getElementById(id);
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const viewCopy={
  library:['LESS OWNING. MORE DOING.','Good gear.','Better together.','Borrow from your community. A little trust, built into every handover.'],
  bookings:['EVERY HANDOVER HAS A NEXT STEP','Your borrowing,','all in order.','The right person. The right action. A clear record.'],
  council:['COMMUNITY GOVERNANCE / LIVE ON NEAR','A fair decision.','Made together.','Clear votes and visible outcomes. See where the decision stands.']
};
let currentView='',filter='all',query='',review=null;
const focusReturn=new WeakMap();
const voteValues=new Map();
export function animateVoteProgress(key,bar,value){const previous=voteValues.get(key);voteValues.set(key,value);bar.style.width=`${value*50}%`;if(previous!==undefined&&previous!==value&&!reduced())animate(bar,{width:[`${previous*50}%`,`${value*50}%`]},{duration:.28,ease:'easeOut'});}
export const element=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
function motionEnter(el){if(!reduced())animate(el,{opacity:[0,1],transform:['translateY(8px)','translateY(0)']},{duration:.24,ease:'easeOut'});}
export function showView(view){
  if(!viewCopy[view])view='library';
  if(currentView===view)return;
  currentView=view;
  document.querySelectorAll('[data-view]').forEach(el=>el.hidden=el.dataset.view!==view);
  document.querySelectorAll('[data-route]').forEach(el=>{if(el.dataset.route===view)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
  const [eyebrow,title,emphasis,intro]=viewCopy[view];
  $('view-eyebrow').textContent=eyebrow;$('view-title').replaceChildren(document.createTextNode(title),element('br'),element('em',emphasis));$('view-intro').textContent=intro;
  motionEnter($(`${view}-view`));window.scrollTo({top:0,left:0,behavior:'instant'});
  document.title=`${view==='library'?'Shared equipment':view==='bookings'?'Your borrowing':'Council decisions'} · CommonKit`;
}
export function navigate(view){if(location.hash!==`#${view}`)location.hash=view;showView(view);}
export function openDialog(id){const dialog=$(id);if(dialog.open)return;focusReturn.set(dialog,document.activeElement);dialog.showModal();if(!reduced())animate(dialog,{opacity:[0,1],transform:['translateY(16px)','translateY(0)']},{duration:.24,ease:'easeOut'});}
export function closeDialog(id){const dialog=$(id);if(!dialog.open)return;dialog.close();focusReturn.get(dialog)?.focus?.();}
export function openReservation(){resetReview();openDialog('reserve-dialog');}
export function resetReview(){review?.remove();review=null;$('reserve').textContent='Review booking →';$('reserve-form').querySelectorAll('input,select').forEach(e=>e.disabled=false);}
export function reservationReview({name,start,end,total,signer,onConfirm}){
  review?.remove();review=element('section',undefined,'review-confirmation');review.id='reservation-review';review.setAttribute('aria-label','Review reservation before signing');
  review.append(element('h3','Ready to make it yours?'),element('p',`${name} · ${start} → ${end}`),element('p',`Attached deposit: ${total}`),element('p',`Signing account: ${signer}`),element('p','Network gas is charged separately by NEAR. Review the exact request in Meteor before approving.','fine'));
  const actions=element('div',undefined,'review-actions'),back=element('button','Edit booking'),confirm=element('button','Confirm in wallet ↗','primary');back.type=confirm.type='button';confirm.id='confirm-reservation';back.onclick=resetReview;confirm.onclick=()=>onConfirm(confirm);actions.append(back,confirm);review.append(actions);$('reserve-form').append(review);
  $('reserve-form').querySelectorAll('input,select').forEach(e=>e.disabled=true);$('reserve').textContent='Update review';motionEnter(review);confirm.focus();
}
export function updateTransactionNotice(text,stage='idle'){
  $('notice').dataset.stage=stage;
  for(const id of ['reserve-dialog','wallet-dialog']){const d=$(id);let status=d.querySelector('.dialog-status');if(!status){status=element('p',undefined,'dialog-status notice');status.setAttribute('role','status');d.append(status);}status.textContent=text;status.dataset.stage=stage;status.classList.toggle('error',stage==='error');}
}
export function setCount(id,value){const el=$(id);if(value==='—'){el.textContent=value;return;}let flow=el.querySelector('number-flow');if(!flow){flow=document.createElement('number-flow');el.replaceChildren(flow);}flow.update(value);}
export function applyFilters(){
  for(const card of document.querySelectorAll('#assets .asset'))card.hidden=!(card.dataset.search.includes(query)&&(filter!=='available'||card.dataset.available==='true'));
  let empty=$('filter-empty');if(!empty){empty=element('p','No equipment matches. Try another search or choose All gear.','empty');empty.id='filter-empty';$('assets').append(empty);}empty.hidden=!document.querySelector('#assets .asset')||!!document.querySelector('#assets .asset:not([hidden])');
  const chosen=$('booking-filter').value;
  for(const card of document.querySelectorAll('#bookings .booking'))card.hidden=chosen==='mine'?card.dataset.related!=='true':chosen==='active'?card.dataset.closed==='true':chosen==='closed'?card.dataset.closed!=='true':false;
  let blank=$('bookings-filter-empty');if(!blank){blank=element('p','No bookings match this filter.','empty');blank.id='bookings-filter-empty';$('bookings').append(blank);}blank.hidden=!document.querySelector('#bookings .booking')||!!document.querySelector('#bookings .booking:not([hidden])');
  let selectionNote=$('selected-filter-note');if(!selectionNote){selectionNote=element('p','Selected booking is outside this filter. Its details remain open.','notice');selectionNote.id='selected-filter-note';selectionNote.setAttribute('role','status');$('booking-filter').insertAdjacentElement('afterend',selectionNote);}selectionNote.hidden=!document.querySelector('#bookings .booking.selected')?.hidden;
}
export function preserveFocus(){const active=document.activeElement;const key=active?.dataset?.focusKey;return()=>{if(key){const target=[...document.querySelectorAll('[data-focus-key]')].find(e=>e.dataset.focusKey===key);if(target&&!target.disabled&&target!==document.activeElement)target.focus({preventScroll:true});}};}
export function setBusy(value){document.querySelectorAll('.review-actions button,[data-close],#wallet-open').forEach(e=>e.disabled=value);}
export function initUi(){
  document.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>closeDialog(button.dataset.close));
  document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(d.id);}});d.addEventListener('close',()=>focusReturn.get(d)?.focus?.());});
  $('wallet-open').onclick=()=>openDialog('wallet-dialog');$('refresh-short').onclick=()=>$('refresh').click();
  $('equipment-search').oninput=e=>{query=e.target.value.trim().toLowerCase();applyFilters();};
  document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));applyFilters();});
  $('booking-filter').onchange=applyFilters;
  function route(){const hash=location.hash.slice(1);showView(hash==='workspace'?(currentView||'library'):hash==='governance'?'council':hash);if(hash==='governance'){$('governance').open=true;$('governance').scrollIntoView();}}
  window.addEventListener('hashchange',route);route();
}
