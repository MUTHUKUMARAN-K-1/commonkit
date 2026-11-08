use commonkit_core::{Asset, Ledger, Model};
use near_sdk::{AccountId, Gas, NearToken, PanicOnDefault, Promise, env, near};

const UNIT: u128 = 1_000_000_000_000_000_000; // microNEAR
const STORAGE_CHARGE: u64 = 100_000; // 0.1 NEAR, separately disclosed, retained for state

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct CommonKit {
    model: Model,
}

fn must<T>(r: commonkit_core::Result<T>) -> T {
    r.unwrap_or_else(|e| env::panic_str(&e))
}
fn actor() -> String {
    env::predecessor_account_id().to_string()
}
fn now() -> u64 {
    env::block_timestamp() / 1_000_000_000
}

#[near]
impl CommonKit {
    #[init]
    pub fn new(dao: AccountId) -> Self {
        Self {
            model: must(Model::new(dao.to_string())),
        }
    }
    pub fn set_member(&mut self, member: AccountId, admitted: bool) {
        must(
            self.model
                .set_member(&actor(), member.to_string(), admitted),
        );
    }
    pub fn register_asset(
        &mut self,
        id: String,
        name: String,
        custodian: AccountId,
        fee_micro_near: u64,
        bond_micro_near: u64,
    ) {
        must(self.model.add_asset(
            &actor(),
            Asset {
                id,
                name,
                custodian: custodian.to_string(),
                fee: fee_micro_near,
                bond: bond_micro_near,
                enabled: true,
            },
        ));
    }
    pub fn handover(&mut self, asset_id: String, custodian: AccountId) {
        must(
            self.model
                .handover(&actor(), &asset_id, custodian.to_string()),
        );
    }
    #[payable]
    pub fn reserve(&mut self, asset_id: String, start: u64, end: u64) -> u64 {
        let amount = env::attached_deposit().as_yoctonear();
        assert_eq!(amount % UNIT, 0, "Deposit must be whole microNEAR units");
        let units = u64::try_from(amount / UNIT).expect("Deposit too large");
        let principal = units
            .checked_sub(STORAGE_CHARGE)
            .expect("Missing storage charge");
        let id = must(
            self.model
                .reserve(&actor(), &asset_id, start, end, principal, now()),
        );
        env::log_str(&format!(
            "COMMONKIT reservation {id}; network receipt required; storage charge {STORAGE_CHARGE} microNEAR"
        ));
        id
    }
    pub fn cancel(&mut self, id: u64) {
        must(self.model.cancel(&actor(), id, now()));
    }
    pub fn expire(&mut self, id: u64) {
        must(self.model.expire(id, now()));
    }
    pub fn pickup(&mut self, id: u64, evidence_hash: String) {
        must(self.model.pickup(&actor(), id, evidence_hash, now()));
    }
    pub fn request_return(&mut self, id: u64, evidence_hash: String) {
        must(self.model.request_return(&actor(), id, evidence_hash));
    }
    pub fn accept_return(&mut self, id: u64, expected_hash: String) {
        must(self.model.accept_return(&actor(), id, &expected_hash));
    }
    pub fn dispute(&mut self, id: u64, evidence_hash: String) {
        must(self.model.dispute(&actor(), id, evidence_hash));
    }
    pub fn escalate(&mut self, id: u64) {
        must(self.model.escalate(id, now()));
    }
    pub fn resolve(&mut self, id: u64, damage_micro_near: u64, evidence_hash: String) {
        must(
            self.model
                .resolve(&actor(), id, damage_micro_near, evidence_hash),
        );
    }
    pub fn withdraw(&mut self) -> Promise {
        assert!(
            env::prepaid_gas() >= Gas::from_tgas(50),
            "Attach at least 50 TGas"
        );
        let w = must(self.model.withdraw(&actor()));
        let amount = u128::from(w.amount) * UNIT;
        let storage = u128::from(env::storage_usage()) * env::storage_byte_cost().as_yoctonear();
        assert!(
            env::account_balance()
                .as_yoctonear()
                .saturating_sub(storage)
                >= amount,
            "Insufficient liquid balance after storage reserve"
        );
        Promise::new(w.account.parse().expect("Invalid account"))
            .transfer(NearToken::from_yoctonear(amount))
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(Gas::from_tgas(20))
                    .on_withdrawal(w.nonce),
            )
    }
    #[private]
    pub fn on_withdrawal(&mut self, nonce: u64) -> bool {
        assert_eq!(
            env::promise_results_count(),
            1,
            "Expected one transfer receipt"
        );
        let success = env::promise_result_checked(0, 0).is_ok();
        self.model.finish_withdrawal(nonce, success)
    }
    pub fn get_state(&self) -> Model {
        self.model.clone()
    }
    pub fn get_ledger(&self) -> Ledger {
        self.model.ledger()
    }
    pub fn storage_charge_micro_near(&self) -> u64 {
        STORAGE_CHARGE
    }
}
