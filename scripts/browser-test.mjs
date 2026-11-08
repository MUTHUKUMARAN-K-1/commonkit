import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const page=await browser.newPage({viewport:{width:1440,height:1100}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const checks=[];
async function check(name,fn){await fn();checks.push(name);console.log('PASS',name);}
const base=process.env.COMMONKIT_URL||'http://127.0.0.1:4317';
const state=async()=> (await page.request.get(base+'/api/state')).json();
async function click(selector){await Promise.all([page.waitForResponse(r=>r.url().includes('/api/')&&r.request().method()==='POST'),page.locator(selector).click()]);await page.waitForFunction(()=>document.querySelector('#balanced').textContent.includes('BALANCED'));}
try{
 await page.goto(base);await page.waitForSelector('.asset-card');await click('#reset');
 await check('Reservation creates funded escrow',async()=>{await click('button[type=submit]');const s=await state();assert.equal(Object.keys(s.model.bookings).length,1);assert(s.ledger.escrow>0);});
 await check('Overlapping reservation is blocked',async()=>{await click('[data-action=overlap]');await page.waitForFunction(()=>document.querySelector('#notice').className==='error');assert.equal(Object.keys((await state()).model.bookings).length,1);});
 await click('[data-action=clock]');await click('[data-action=pickup]');await click('[data-action=request_return]');
 await check('Borrower cannot approve their own return',async()=>{await click('[data-action=self_approve]');assert.equal(Object.values((await state()).model.bookings)[0].status,'ReturnPending');});
 await check('Custodian settlement returns bond and credits fee',async()=>{await click('[data-action=accept_return]');const s=await state();assert.equal(s.ledger.escrow,0);assert.equal(s.model.reputation['muthu.testnet'],1);assert(s.ledger.balanced);});
 await check('Failed withdrawal restores credit and retry succeeds',async()=>{const before=(await state()).model.credits['muthu.testnet'];await click('[data-withdraw="muthu.testnet"]');await click('[data-success=false]');assert.equal((await state()).model.credits['muthu.testnet'],before);await click('[data-withdraw="muthu.testnet"]');await click('[data-success=true]');assert.equal((await state()).ledger.withdrawn,before);});
 await check('Dispute settlement preserves the accounting invariant',async()=>{await click('[data-select=projector]');await click('button[type=submit]');await click('[data-action=pickup]');await click('[data-action=dispute]');await click('[data-action=resolve]');const s=await state();const b=Object.values(s.model.bookings).at(-1);assert.equal(b.status,'Closed');assert.equal(b.damage,Math.floor(b.bond/10));assert(s.ledger.balanced);});
 await page.screenshot({path:'/tmp/commonkit-desktop.png',fullPage:true});
 await check('Mobile has no horizontal overflow',async()=>{await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'/tmp/commonkit-mobile.png',fullPage:true});});
 await check('No uncaught browser errors',async()=>assert.deepEqual(errors,[]));
 console.log(JSON.stringify({passed:checks.length,checks},null,2));
}finally{await browser.close();}
