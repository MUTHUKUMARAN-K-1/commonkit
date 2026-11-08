use commonkit_core::*;
fn h() -> String {
    "a".repeat(64)
}
fn setup() -> Model {
    let mut m = Model::new("dao.testnet".into()).unwrap();
    for a in ["alice.testnet", "bob.testnet"] {
        m.set_member("dao.testnet", a.into(), true).unwrap();
    }
    m.add_asset(
        "dao.testnet",
        Asset {
            id: "camera".into(),
            name: "Camera".into(),
            custodian: "steward.testnet".into(),
            fee: 20,
            bond: 500,
            enabled: true,
        },
    )
    .unwrap();
    m
}
fn booked() -> (Model, u64) {
    let mut m = setup();
    let id = m
        .reserve("alice.testnet", "camera", 100, 200, 520, 90)
        .unwrap();
    (m, id)
}
fn returned() -> (Model, u64) {
    let (mut m, id) = booked();
    m.pickup("steward.testnet", id, h(), 100).unwrap();
    m.request_return("alice.testnet", id, h()).unwrap();
    (m, id)
}
#[test]
fn completed_borrow_returns_bond_and_pays_dao() {
    let (mut m, id) = returned();
    m.accept_return("steward.testnet", id, &h()).unwrap();
    assert_eq!(m.credits["alice.testnet"], 500);
    assert_eq!(m.credits["dao.testnet"], 20);
    assert_eq!(m.reputation["alice.testnet"], 1);
    assert!(m.ledger().balanced);
}
#[test]
fn outsider_and_wrong_deposit_rejected() {
    let mut m = setup();
    assert!(
        m.reserve("mallory.testnet", "camera", 100, 200, 520, 90)
            .is_err()
    );
    assert!(
        m.reserve("alice.testnet", "camera", 100, 200, 519, 90)
            .is_err()
    );
    assert_eq!(m.total_deposited, 0);
}
#[test]
fn overlapping_booking_rejected_but_adjacent_allowed() {
    let (mut m, _) = booked();
    assert!(
        m.reserve("bob.testnet", "camera", 150, 210, 520, 90)
            .is_err()
    );
    assert!(
        m.reserve("bob.testnet", "camera", 200, 300, 520, 90)
            .is_ok()
    );
    assert!(m.ledger().balanced);
}
#[test]
fn pickup_requires_current_custodian_and_time() {
    let (mut m, id) = booked();
    assert!(m.pickup("alice.testnet", id, h(), 100).is_err());
    assert!(m.pickup("steward.testnet", id, h(), 99).is_err());
    assert!(m.pickup("steward.testnet", id, h(), 200).is_err());
}
#[test]
fn borrower_cannot_approve_own_return() {
    let (mut m, id) = returned();
    assert!(m.accept_return("alice.testnet", id, &h()).is_err());
    assert!(
        m.accept_return("steward.testnet", id, &"b".repeat(64))
            .is_err()
    );
    assert_eq!(m.ledger().escrow, 520);
}
#[test]
fn late_equipment_cannot_be_checked_out_twice() {
    let (mut m, id) = booked();
    let next = m
        .reserve("bob.testnet", "camera", 200, 300, 520, 90)
        .unwrap();
    m.pickup("steward.testnet", id, h(), 100).unwrap();
    assert!(m.pickup("steward.testnet", next, h(), 200).is_err());
}
#[test]
fn cancellation_and_no_show_refund_all_principal() {
    let (mut m, id) = booked();
    m.cancel("alice.testnet", id, 99).unwrap();
    assert_eq!(m.credits["alice.testnet"], 520);
    assert!(m.expire(id, 201).is_err());
    let (mut n, id) = booked();
    n.expire(id, 200).unwrap();
    assert_eq!(n.credits["alice.testnet"], 520);
    assert!(n.ledger().balanced);
}
#[test]
fn handover_blocked_until_obligations_end() {
    let (mut m, id) = returned();
    assert!(
        m.handover("dao.testnet", "camera", "new.testnet".into())
            .is_err()
    );
    m.accept_return("steward.testnet", id, &h()).unwrap();
    m.handover("dao.testnet", "camera", "new.testnet".into())
        .unwrap();
    let next = m
        .reserve("alice.testnet", "camera", 300, 400, 520, 250)
        .unwrap();
    assert!(m.pickup("steward.testnet", next, h(), 300).is_err());
    m.pickup("new.testnet", next, h(), 300).unwrap();
}
#[test]
fn only_dao_resolves_bounded_damage() {
    let (mut m, id) = returned();
    m.dispute("steward.testnet", id, h()).unwrap();
    assert!(m.resolve("steward.testnet", id, 100, h()).is_err());
    assert!(m.resolve("dao.testnet", id, 501, h()).is_err());
    m.resolve("dao.testnet", id, 100, h()).unwrap();
    assert_eq!(m.credits["alice.testnet"], 400);
    assert_eq!(m.credits["dao.testnet"], 120);
    assert!(!m.reputation.contains_key("alice.testnet"));
    assert!(m.ledger().balanced);
}
#[test]
fn duplicate_settlement_cannot_mint_credit() {
    let (mut m, id) = returned();
    m.accept_return("steward.testnet", id, &h()).unwrap();
    assert!(m.accept_return("steward.testnet", id, &h()).is_err());
    assert!(m.resolve("dao.testnet", id, 0, h()).is_err());
    assert_eq!(m.ledger().credits, 520);
}
#[test]
fn failed_transfer_restores_credit_and_replay_is_noop() {
    let (mut m, id) = returned();
    m.accept_return("steward.testnet", id, &h()).unwrap();
    let w = m.withdraw("alice.testnet").unwrap();
    assert!(m.withdraw("alice.testnet").is_err());
    assert!(m.ledger().balanced);
    assert!(m.finish_withdrawal(w.nonce, false));
    assert!(!m.finish_withdrawal(w.nonce, true));
    assert_eq!(m.credits["alice.testnet"], 500);
    let w = m.withdraw("alice.testnet").unwrap();
    m.finish_withdrawal(w.nonce, true);
    assert_eq!(m.total_withdrawn, 500);
    assert!(m.ledger().balanced);
}
#[test]
fn anyone_can_escalate_but_cannot_take_bond() {
    let (mut m, id) = returned();
    assert!(m.escalate(id, 200 + DAY - 1).is_err());
    m.escalate(id, 200 + DAY).unwrap();
    assert_eq!(m.bookings[&id].status, Status::Disputed);
    assert_eq!(m.ledger().escrow, 520);
}
#[test]
fn membership_revocation_does_not_confiscate_existing_bond() {
    let (mut m, id) = returned();
    m.set_member("dao.testnet", "alice.testnet".into(), false)
        .unwrap();
    m.accept_return("steward.testnet", id, &h()).unwrap();
    assert!(m.withdraw("alice.testnet").is_ok());
    assert!(
        m.reserve("alice.testnet", "camera", 300, 400, 520, 250)
            .is_err()
    );
}
#[test]
fn repeated_mixed_lifecycles_conserve_every_unit() {
    let mut m = setup();
    for i in 0..100u64 {
        let start = 100 + i * 100;
        let id = m
            .reserve("alice.testnet", "camera", start, start + 50, 520, start - 1)
            .unwrap();
        if i % 3 == 0 {
            m.expire(id, start + 50).unwrap();
        } else {
            m.pickup("steward.testnet", id, h(), start).unwrap();
            m.request_return("alice.testnet", id, h()).unwrap();
            if i % 3 == 1 {
                m.accept_return("steward.testnet", id, &h()).unwrap();
            } else {
                m.dispute("steward.testnet", id, h()).unwrap();
                m.resolve("dao.testnet", id, i, h()).unwrap();
            }
        }
        let w = m.withdraw("alice.testnet").unwrap();
        m.finish_withdrawal(w.nonce, i % 4 != 0);
        assert!(m.ledger().balanced);
    }
    assert_eq!(m.total_deposited, 52_000);
}
