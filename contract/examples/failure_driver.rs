//! Sandbox-only receipt fault injector; not part of commonkit_contract.wasm.
use near_sdk::{
    AccountId, Gas, NearToken, Promise, env, json_types::Base64VecU8, serde::Deserialize,
};

#[derive(Deserialize)]
#[serde(crate = "near_sdk::serde")]
struct DeleteArgs {
    library: AccountId,
    beneficiary: AccountId,
}

// Delete the credit owner BEFORE it calls withdraw. The call still carries this
// account as predecessor, but the subsequent transfer has no existing receiver.
#[unsafe(no_mangle)]
pub extern "C" fn withdraw_after_delete() {
    env::setup_panic_hook();
    let args: DeleteArgs = near_sdk::serde_json::from_slice(&env::input().unwrap()).unwrap();
    let _ = Promise::new(env::current_account_id())
        .delete_account(args.beneficiary)
        .then(Promise::new(args.library).function_call(
            "withdraw",
            b"{}".to_vec(),
            NearToken::from_yoctonear(0),
            Gas::from_tgas(100),
        ))
        .as_return();
}

#[derive(Deserialize)]
#[serde(crate = "near_sdk::serde")]
struct ReplayArgs {
    original_code: Base64VecU8,
    nonce: u64,
    failed: bool,
}

// Temporarily installed on the sandbox library AFTER a withdrawal completed.
// Restore the unmodified production Wasm before calling its private callback,
// with one real dependency receipt and the correct self predecessor.
#[unsafe(no_mangle)]
pub extern "C" fn replay_callback() {
    env::setup_panic_hook();
    let args: ReplayArgs = near_sdk::serde_json::from_slice(&env::input().unwrap()).unwrap();
    let account = env::current_account_id();
    let restore = Promise::new(account.clone()).deploy_contract(args.original_code.0);
    let dependency = if args.failed {
        // Separate receipt: the deliberate failure must not roll back deploy.
        restore.then(Promise::new(account.clone()).function_call(
            "intentionally_missing_method",
            b"{}".to_vec(),
            NearToken::from_yoctonear(0),
            Gas::from_tgas(10),
        ))
    } else {
        restore.then(Promise::new(account.clone()).transfer(NearToken::from_yoctonear(0)))
    };
    let _ = dependency
        .then(
            Promise::new(account).function_call(
                "on_withdrawal",
                near_sdk::serde_json::to_vec(&near_sdk::serde_json::json!({"nonce": args.nonce}))
                    .unwrap(),
                NearToken::from_yoctonear(0),
                Gas::from_tgas(20),
            ),
        )
        .as_return();
}
