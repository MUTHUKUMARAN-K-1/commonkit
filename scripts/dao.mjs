// Builds an existing Sputnik DAO proposal. Does not vote, sign, or submit it.
const account=s=>{if(typeof s!=='string'||s.length<2||s.length>64||!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(s))throw Error('Invalid NEAR account');return s;};
export function daoProposal({contract,method,args,description}){
 account(contract);
 if(!['set_member','register_asset','handover','resolve','withdraw'].includes(method))throw Error('Unsupported governance action');
 if(typeof description!=='string'||!description.trim()||description.length>500)throw Error('Description required, max 500 characters');
 if(!args||typeof args!=='object'||Array.isArray(args))throw Error('Arguments must be an object');
 return {proposal:{description,kind:{FunctionCall:{receiver_id:contract,actions:[{method_name:method,args:Buffer.from(JSON.stringify(args)).toString('base64'),deposit:'0',gas:'100000000000000'}]}}}};
}
export async function readDaoPolicy(dao,rpc='https://test.rpc.fastnear.com'){
 account(dao);if(!['https://test.rpc.fastnear.com','https://rpc.testnet.near.org'].includes(rpc))throw Error('Testnet RPC required');
 const response=await fetch(rpc,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:'commonkit-read',method:'query',params:{request_type:'call_function',account_id:dao,method_name:'get_policy',args_base64:'e30=',finality:'final'}})});
 if(!response.ok)throw Error('DAO policy RPC failed: '+response.status);const data=await response.json();if(data.error)throw Error(JSON.stringify(data.error));
 const policy=JSON.parse(Buffer.from(data.result.result).toString());
 if(typeof policy.proposal_bond!=='string')throw Error('DAO policy has no proposal bond');
 return {policy,proposalBondYocto:policy.proposal_bond,blockHash:data.result.block_hash};
}
