use borsh::{BorshDeserialize, BorshSerialize};
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};

pub type Result<T> = std::result::Result<T, String>;
pub const MAX_AMOUNT: u64 = 1_000_000_000;
pub const MAX_BOOKINGS: usize = 256;
pub const DAY: u64 = 86_400;

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize, BorshSerialize, BorshDeserialize)]
pub enum Status {
    Reserved,
    CheckedOut,
    ReturnPending,
    Disputed,
    Closed,
    Cancelled,
}
impl Status {
    pub fn active(&self) -> bool {
        !matches!(self, Self::Closed | Self::Cancelled)
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, BorshSerialize, BorshDeserialize)]
pub struct Asset {
    pub id: String,
    pub name: String,
    pub custodian: String,
    pub fee: u64,
    pub bond: u64,
    pub enabled: bool,
}
#[derive(Clone, Debug, Serialize, Deserialize, BorshSerialize, BorshDeserialize)]
pub struct Booking {
    pub id: u64,
    pub asset_id: String,
    pub borrower: String,
    pub start: u64,
    pub end: u64,
    pub fee: u64,
    pub bond: u64,
    pub status: Status,
    pub pickup_hash: Option<String>,
    pub return_hash: Option<String>,
    pub dispute_hash: Option<String>,
    pub damage: u64,
}
#[derive(Clone, Debug, Serialize, Deserialize, BorshSerialize, BorshDeserialize)]
pub struct Withdrawal {
    pub nonce: u64,
    pub account: String,
    pub amount: u64,
}
#[derive(Clone, Debug, Serialize, Deserialize, BorshSerialize, BorshDeserialize)]
pub struct Ledger {
    pub deposited: u64,
    pub escrow: u64,
    pub credits: u64,
    pub pending: u64,
    pub withdrawn: u64,
    pub balanced: bool,
}
#[derive(Clone, Debug, Serialize, Deserialize, BorshSerialize, BorshDeserialize)]
pub struct Model {
    pub dao: String,
    pub members: BTreeSet<String>,
    pub assets: BTreeMap<String, Asset>,
    pub bookings: BTreeMap<u64, Booking>,
    pub credits: BTreeMap<String, u64>,
    pub reputation: BTreeMap<String, u32>,
    pub pending: BTreeMap<u64, Withdrawal>,
    pub total_deposited: u64,
    pub total_withdrawn: u64,
    pub next_booking: u64,
    pub next_nonce: u64,
}
fn ensure(ok: bool, message: &str) -> Result<()> {
    if ok { Ok(()) } else { Err(message.into()) }
}
fn hash_ok(hash: &str) -> Result<()> {
    ensure(
        hash.len() == 64
            && hash
                .bytes()
                .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b)),
        "Evidence must be a lowercase SHA-256 hash",
    )
}
fn name_ok(s: &str) -> bool {
    !s.is_empty()
        && s.len() <= 64
        && s.bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b"._-".contains(&b))
}
impl Model {
    pub fn new(dao: String) -> Result<Self> {
        ensure(name_ok(&dao), "Invalid DAO account")?;
        Ok(Self {
            dao,
            members: BTreeSet::new(),
            assets: BTreeMap::new(),
            bookings: BTreeMap::new(),
            credits: BTreeMap::new(),
            reputation: BTreeMap::new(),
            pending: BTreeMap::new(),
            total_deposited: 0,
            total_withdrawn: 0,
            next_booking: 1,
            next_nonce: 1,
        })
    }
    fn only_dao(&self, actor: &str) -> Result<()> {
        ensure(actor == self.dao, "DAO authorization required")
    }
    pub fn set_member(&mut self, actor: &str, member: String, admitted: bool) -> Result<()> {
        self.only_dao(actor)?;
        ensure(name_ok(&member), "Invalid member account")?;
        ensure(
            !admitted || self.members.contains(&member) || self.members.len() < 64,
            "Member limit reached",
        )?;
        if admitted {
            self.members.insert(member);
        } else {
            self.members.remove(&member);
        }
        Ok(())
    }
    pub fn add_asset(&mut self, actor: &str, asset: Asset) -> Result<()> {
        self.only_dao(actor)?;
        ensure(self.assets.len() < 32, "Asset limit reached")?;
        ensure(
            name_ok(&asset.id) && name_ok(&asset.custodian),
            "Invalid asset or custodian",
        )?;
        ensure(
            !asset.name.is_empty() && asset.name.len() <= 100,
            "Invalid asset name",
        )?;
        ensure(!self.assets.contains_key(&asset.id), "Asset already exists")?;
        ensure(
            asset.fee <= MAX_AMOUNT && asset.bond > 0 && asset.bond <= MAX_AMOUNT,
            "Invalid fee or bond",
        )?;
        self.assets.insert(asset.id.clone(), asset);
        Ok(())
    }
    pub fn handover(&mut self, actor: &str, asset_id: &str, custodian: String) -> Result<()> {
        self.only_dao(actor)?;
        ensure(name_ok(&custodian), "Invalid custodian")?;
        ensure(
            !self
                .bookings
                .values()
                .any(|b| b.asset_id == asset_id && b.status.active()),
            "Active bookings prevent handover",
        )?;
        let a = self.assets.get_mut(asset_id).ok_or("Unknown asset")?;
        a.custodian = custodian;
        Ok(())
    }
    pub fn reserve(
        &mut self,
        actor: &str,
        asset_id: &str,
        start: u64,
        end: u64,
        deposit: u64,
        now: u64,
    ) -> Result<u64> {
        ensure(self.members.contains(actor), "Membership required")?;
        ensure(self.bookings.len() < MAX_BOOKINGS, "Booking limit reached")?;
        let a = self.assets.get(asset_id).ok_or("Unknown asset")?;
        ensure(a.enabled, "Asset unavailable")?;
        ensure(
            actor != a.custodian,
            "Custodian cannot borrow their own asset",
        )?;
        ensure(
            start >= now
                && end > start
                && end - start <= 7 * DAY
                && end.saturating_sub(now) <= 90 * DAY,
            "Invalid booking interval",
        )?;
        ensure(
            deposit == a.fee + a.bond,
            "Deposit must equal fee plus refundable bond",
        )?;
        ensure(
            !self.bookings.values().any(|b| {
                b.asset_id == asset_id && b.status.active() && start < b.end && end > b.start
            }),
            "This equipment is already reserved for that time",
        )?;
        let total = self
            .total_deposited
            .checked_add(deposit)
            .ok_or("Amount overflow")?;
        let id = self.next_booking;
        let b = Booking {
            id,
            asset_id: asset_id.into(),
            borrower: actor.into(),
            start,
            end,
            fee: a.fee,
            bond: a.bond,
            status: Status::Reserved,
            pickup_hash: None,
            return_hash: None,
            dispute_hash: None,
            damage: 0,
        };
        self.bookings.insert(id, b);
        self.next_booking += 1;
        self.total_deposited = total;
        Ok(id)
    }
    pub fn cancel(&mut self, actor: &str, id: u64, now: u64) -> Result<()> {
        let b = self.booking(id)?;
        ensure(b.borrower == actor, "Borrower only")?;
        ensure(
            b.status == Status::Reserved && now < b.start,
            "Cancellation closes at pickup time",
        )?;
        self.refund(id)
    }
    pub fn expire(&mut self, id: u64, now: u64) -> Result<()> {
        let b = self.booking(id)?;
        ensure(
            b.status == Status::Reserved && now >= b.end,
            "Reservation has not expired",
        )?;
        self.refund(id)
    }
    fn refund(&mut self, id: u64) -> Result<()> {
        let b = self.bookings.get_mut(&id).ok_or("Unknown booking")?;
        let (who, amount) = (b.borrower.clone(), b.fee + b.bond);
        b.status = Status::Cancelled;
        self.credit(&who, amount);
        Ok(())
    }
    pub fn pickup(&mut self, actor: &str, id: u64, hash: String, now: u64) -> Result<()> {
        hash_ok(&hash)?;
        let b = self.booking(id)?;
        self.only_custodian(actor, b)?;
        ensure(
            b.status == Status::Reserved && now >= b.start && now < b.end,
            "Outside pickup window",
        )?;
        // An overdue checkout blocks the next booking even when its scheduled interval ended.
        ensure(
            !self.bookings.values().any(|other| {
                other.id != id
                    && other.asset_id == b.asset_id
                    && matches!(
                        other.status,
                        Status::CheckedOut | Status::ReturnPending | Status::Disputed
                    )
            }),
            "Equipment has not been returned",
        )?;
        let b = self.bookings.get_mut(&id).unwrap();
        b.pickup_hash = Some(hash);
        b.status = Status::CheckedOut;
        Ok(())
    }
    pub fn request_return(&mut self, actor: &str, id: u64, hash: String) -> Result<()> {
        hash_ok(&hash)?;
        let b = self.bookings.get_mut(&id).ok_or("Unknown booking")?;
        ensure(b.borrower == actor, "Borrower only")?;
        ensure(
            b.status == Status::CheckedOut,
            "Equipment is not checked out",
        )?;
        b.return_hash = Some(hash);
        b.status = Status::ReturnPending;
        Ok(())
    }
    pub fn accept_return(&mut self, actor: &str, id: u64, expected_hash: &str) -> Result<()> {
        let b = self.booking(id)?;
        self.only_custodian(actor, b)?;
        ensure(
            b.status == Status::ReturnPending,
            "Return has not been requested",
        )?;
        ensure(
            b.return_hash.as_deref() == Some(expected_hash),
            "Return evidence changed",
        )?;
        self.settle(id, 0, true)
    }
    pub fn dispute(&mut self, actor: &str, id: u64, hash: String) -> Result<()> {
        hash_ok(&hash)?;
        let b = self.booking(id)?;
        self.only_custodian(actor, b)?;
        ensure(
            matches!(b.status, Status::CheckedOut | Status::ReturnPending),
            "Cannot dispute this booking",
        )?;
        let b = self.bookings.get_mut(&id).unwrap();
        b.status = Status::Disputed;
        b.dispute_hash = Some(hash);
        Ok(())
    }
    pub fn escalate(&mut self, id: u64, now: u64) -> Result<()> {
        let b = self.bookings.get_mut(&id).ok_or("Unknown booking")?;
        ensure(
            matches!(b.status, Status::CheckedOut | Status::ReturnPending)
                && now >= b.end.saturating_add(DAY),
            "Escalation is not due",
        )?;
        b.status = Status::Disputed;
        Ok(())
    }
    pub fn resolve(&mut self, actor: &str, id: u64, damage: u64, evidence: String) -> Result<()> {
        self.only_dao(actor)?;
        hash_ok(&evidence)?;
        let b = self.booking(id)?;
        ensure(b.status == Status::Disputed, "Booking is not disputed")?;
        ensure(damage <= b.bond, "Damages exceed the bond")?;
        self.bookings.get_mut(&id).unwrap().dispute_hash = Some(evidence);
        self.settle(id, damage, false)
    }
    fn settle(&mut self, id: u64, damage: u64, earned_trust: bool) -> Result<()> {
        let b = self.bookings.get_mut(&id).ok_or("Unknown booking")?;
        let (borrower, refund, dao_amount) = (b.borrower.clone(), b.bond - damage, b.fee + damage);
        b.damage = damage;
        b.status = Status::Closed;
        self.credit(&borrower, refund);
        self.credit(&self.dao.clone(), dao_amount);
        if earned_trust {
            *self.reputation.entry(borrower).or_default() += 1;
        }
        Ok(())
    }
    pub fn withdraw(&mut self, actor: &str) -> Result<Withdrawal> {
        ensure(
            !self.pending.values().any(|w| w.account == actor),
            "A withdrawal is already pending",
        )?;
        let amount = *self.credits.get(actor).unwrap_or(&0);
        ensure(amount > 0, "No available credit")?;
        let w = Withdrawal {
            nonce: self.next_nonce,
            account: actor.into(),
            amount,
        };
        self.next_nonce += 1;
        self.credits.insert(actor.into(), 0);
        self.pending.insert(w.nonce, w.clone());
        Ok(w)
    }
    // Called only by the private NEAR callback, or the explicitly labelled local simulator.
    pub fn finish_withdrawal(&mut self, nonce: u64, success: bool) -> bool {
        let Some(w) = self.pending.remove(&nonce) else {
            return false;
        };
        if success {
            self.total_withdrawn += w.amount;
        } else {
            self.credit(&w.account, w.amount);
        }
        true
    }
    pub fn ledger(&self) -> Ledger {
        let escrow = self
            .bookings
            .values()
            .filter(|b| b.status.active())
            .map(|b| b.fee + b.bond)
            .sum::<u64>();
        let credits = self.credits.values().sum::<u64>();
        let pending = self.pending.values().map(|w| w.amount).sum::<u64>();
        Ledger {
            deposited: self.total_deposited,
            escrow,
            credits,
            pending,
            withdrawn: self.total_withdrawn,
            balanced: self.total_deposited == escrow + credits + pending + self.total_withdrawn,
        }
    }
    fn credit(&mut self, account: &str, amount: u64) {
        *self.credits.entry(account.into()).or_default() += amount;
    }
    fn booking(&self, id: u64) -> Result<&Booking> {
        self.bookings.get(&id).ok_or("Unknown booking".into())
    }
    fn only_custodian(&self, actor: &str, b: &Booking) -> Result<()> {
        ensure(
            self.assets
                .get(&b.asset_id)
                .is_some_and(|a| a.custodian == actor),
            "Current custodian only",
        )
    }
}
