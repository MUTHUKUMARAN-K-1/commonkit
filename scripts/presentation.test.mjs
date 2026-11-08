import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseBooking,walletRoles,bookingJourney,nextBookingStep,settlementMatches,proposalSummary} from '../app/presentation.js';
const assets={camera:{custodian:'custodian.testnet'}};
const booking={id:3,asset_id:'camera',borrower:'borrower.testnet',start:100,end:200,bond:10000,fee:1000,damage:3000};
test('selection prioritizes relevant active borrowing, then active, then latest history',()=>{
 const bookings={1:{...booking,id:1,status:'CheckedOut'},2:{...booking,id:2,borrower:'other.testnet',status:'Reserved'},3:{...booking,status:'Closed'}};
 assert.equal(chooseBooking(bookings,'borrower.testnet',assets),1);
 assert.equal(chooseBooking(bookings,'custodian.testnet',assets),2);
 assert.equal(chooseBooking(bookings,'visitor.testnet',assets),2);
 assert.equal(chooseBooking({3:bookings[3]},'',assets),3);
 assert.equal(chooseBooking({},'',assets),null);
});
test('wallet roles permit custodian and council together without impersonation',()=>{
 const state={assets,members:['borrower.testnet']};
 assert.deepEqual(walletRoles('custodian.testnet',state,['custodian.testnet']),['Custodian','Council voter']);
 assert.deepEqual(walletRoles('borrower.testnet',state,[]),['Member / borrower']);
 assert.deepEqual(walletRoles('visitor.testnet',state,[]),['Visitor']);
 assert.deepEqual(walletRoles('',state,[]),['Not connected']);
});
test('journey distinguishes normal return from dispute and never adds a withdrawal stage',()=>{
 const normal=bookingJourney({...booking,status:'Closed',return_hash:'returned'});
 assert.ok(normal.some(s=>s.label==='Return accepted'));
 assert.equal(normal.at(-1).label,'Settled');
 const disputed=bookingJourney({...booking,status:'Closed',dispute_hash:'decision'});
 assert.ok(disputed.some(s=>s.label==='Council review'));
 assert.ok(!disputed.some(s=>s.label==='Return accepted'||s.label==='Return requested'||s.label==='Withdrawn'));
 assert.equal(disputed.at(-1).state,'current');
 const cancelled=bookingJourney({...booking,status:'Cancelled'});
 assert.equal(cancelled.length,2);
 assert.ok(!cancelled.some(s=>s.label==='Picked up'));
});
test('reserved timing identifies correct next actor and expiry refund',()=>{
 assert.equal(nextBookingStep({...booking,status:'Reserved'},assets.camera,50).title,'Waiting for the pickup window');
 assert.equal(nextBookingStep({...booking,status:'Reserved'},assets.camera,150).title,'Confirm the equipment handover');
 assert.equal(nextBookingStep({...booking,status:'Reserved'},assets.camera,200).actor,'Any connected wallet');
 assert.equal(nextBookingStep({...booking,status:'ReturnPending'},assets.camera,150).actor,'Custodian next');
});
test('two votes without a closed booking demand execution verification, never a third vote',()=>{
 const waiting=nextBookingStep({...booking,status:'Disputed'},assets.camera,150,1);
 assert.match(waiting.body,/other council account/);
 const approved=nextBookingStep({...booking,status:'Disputed'},assets.camera,150,2);
 assert.equal(approved.actor,'Verify execution');
 assert.match(approved.body,/not reflected/);
 const closed=nextBookingStep({...booking,status:'Closed'},assets.camera,150,2);
 assert.match(closed.body,/Withdrawals are separate/);
});
test('approval alone cannot be presented as visible settlement',()=>{
 const args={damage_micro_near:3000,evidence_hash:'decision'},state={...booking,status:'Closed',dispute_hash:'decision'};
 assert.equal(settlementMatches({status:'Approved'},state,args,'library.testnet','library.testnet'),true);
 assert.equal(settlementMatches({status:'Approved'},{...state,status:'Disputed'},args,'library.testnet','library.testnet'),false);
 assert.equal(settlementMatches({status:'Approved'},state,{...args,evidence_hash:'other'},'library.testnet','library.testnet'),false);
 assert.equal(settlementMatches({status:'Approved'},state,args,'other.testnet','library.testnet'),false);
 assert.equal(settlementMatches({status:'InProgress'},state,args,'library.testnet','library.testnet'),false);
});
test('human proposal titles retain the affected booking',()=>{
 assert.deepEqual(proposalSummary('resolve',{id:3}),{title:'Settle booking #3',detail:'Decide how the refundable bond is split.',bookingId:3});
 assert.equal(proposalSummary('withdraw').title,'Withdraw DAO credit');
 assert.equal(proposalSummary('set_member',{admitted:false,member:'member.testnet'}).title,'Revoke membership');
});
