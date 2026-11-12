import {membershipStatus,membershipDraft} from './membership.js';
const panels=[];
export function initMembership({onRefresh,onSwitch,onCouncil}){
  for(const [prefix,anchor] of [['wallet','role-cards'],['quote','reserve']]){
    const panel=document.createElement('section');panel.className='membership-panel';panel.setAttribute('aria-label','Library membership');
    panel.innerHTML=`<p class="eyebrow">Library access</p><h3 data-member-title></h3><p data-member-body></p><code data-member-account></code><p data-custodian-note hidden>You are this equipment’s custodian. Use a different admitted account to borrow it.</p><div class="membership-actions"><button type="button" data-member-refresh>Refresh access</button><button type="button" data-member-switch>Switch wallet</button><button type="button" data-member-council>View council process →</button></div><details data-member-request><summary>Prepare a membership request</summary><p>Share this draft with your community organizer through a channel you already use. CommonKit does not send it or collect your contact details.</p><label for="${prefix}-membership-draft">Request draft · not sent</label><textarea id="${prefix}-membership-draft" rows="7" readonly></textarea><button type="button" data-member-copy>Copy request draft</button><p class="fine" role="status" data-member-copy-status></p><p class="fine" data-member-council-list></p></details>`;
    document.getElementById(anchor).before(panel);
    const $=selector=>panel.querySelector(selector);
    $('[data-member-refresh]').onclick=onRefresh;
    $('[data-member-switch]').onclick=()=>onSwitch(prefix==='quote');
    $('[data-member-council]').onclick=onCouncil;
    $('[data-member-copy]').onclick=async()=>{try{await navigator.clipboard.writeText($('textarea').value);$('[data-member-copy-status]').textContent='Draft copied. Nothing has been sent. Share it with your organizer.';}catch{$('textarea').focus();$('textarea').select();$('[data-member-copy-status]').textContent='Copy is unavailable here. The draft is selected so you can copy it manually.';}};
    panels.push({panel,$,prefix});
  }
}
export function renderMembership(context){
  const status=membershipStatus(context),needsRequest=['visitor','pending'].includes(status.kind);
  for(const {panel,$,prefix} of panels){
    panel.dataset.membership=status.kind;
    $('[data-member-title]').textContent=status.title;$('[data-member-body]').textContent=status.body;
    $('[data-member-account]').textContent=context.account||'';$('[data-member-account]').hidden=!context.account;
    $('[data-custodian-note]').hidden=!context.account||context.asset?.custodian!==context.account;
    $('[data-member-refresh]').disabled=context.busy||!context.contractId;
    $('[data-member-switch]').hidden=!context.account||prefix==='wallet';$('[data-member-switch]').disabled=context.busy;
    $('[data-member-council]').disabled=context.busy||!context.model;
    $('[data-member-request]').hidden=!needsRequest;
    if(needsRequest){const draft=membershipDraft(context.account,context.contractId,context.model.dao);if($('textarea').value!==draft){$('textarea').value=draft;$('[data-member-copy-status]').textContent='';}$('[data-member-council-list]').textContent=context.policyVerified?`Council accounts: ${context.council.join(' · ')}`:'Council policy could not be verified. Refresh access before relying on council details.';}
  }
}
