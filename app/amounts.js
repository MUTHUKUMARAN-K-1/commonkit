export const micro=n=>{if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid amount from contract');return BigInt(n);};
export const money=n=>{const v=micro(n),f=(v%1000000n).toString().padStart(6,'0').replace(/0+$/,'');return `${v/1000000n}${f?'.'+f:''} NEAR`;};
export const yoctoMoney=n=>{const v=BigInt(n),f=(v%10n**24n).toString().padStart(24,'0').replace(/0+$/,'');return `${v/10n**24n}${f?'.'+f:''} NEAR`;};
export const toMicro=value=>{if(!/^\d+(\.\d{1,6})?$/.test(value))throw Error('Enter an amount with at most six decimals');const [w,f='']=value.split('.');const n=BigInt(w)*1000000n+BigInt(f.padEnd(6,'0'));if(n>1000000000n)throw Error('Maximum amount is 1,000 NEAR');return Number(n);};
export const validAccount=s=>typeof s==='string'&&s.length>=2&&s.length<=64&&/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(s);
export const attachedDeposit=(fee,bond,storage)=>((micro(fee)+micro(bond)+micro(storage))*10n**18n).toString();
