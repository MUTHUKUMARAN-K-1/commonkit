use commonkit_core::{Asset, Model, Result};
use serde_json::{Value, json};
use std::io::{self, Read};
fn string(v: &Value, key: &str) -> Result<String> {
    v[key]
        .as_str()
        .map(str::to_owned)
        .ok_or(format!("Missing {key}"))
}
fn number(v: &Value, key: &str) -> Result<u64> {
    v[key].as_u64().ok_or(format!("Invalid {key}"))
}
fn demo() -> Model {
    let mut m = Model::new("makers.sputnikv2.testnet".into()).unwrap();
    let dao = m.dao.clone();
    for who in ["muthu.testnet", "robotics.testnet", "filmclub.testnet"] {
        m.set_member(&dao, who.into(), true).unwrap();
    }
    for (id, name, fee, bond) in [
        ("camera", "Sony a6400 creator kit", 20_000, 500_000),
        ("projector", "Epson workshop projector", 10_000, 300_000),
        ("printer", "Bambu Lab printer session", 15_000, 200_000),
    ] {
        m.add_asset(
            &dao,
            Asset {
                id: id.into(),
                name: name.into(),
                custodian: "steward.testnet".into(),
                fee,
                bond,
                enabled: true,
            },
        )
        .unwrap();
    }
    m
}
fn dispatch(m: &mut Model, input: &Value) -> Result<Value> {
    let action = string(input, "action")?;
    let actor = input["actor"].as_str().unwrap_or("");
    let a = &input["args"];
    let now = number(input, "now")?;
    match action.as_str() {
        "state" => Ok(Value::Null),
        "reserve" => Ok(
            json!({"booking_id":m.reserve(actor,&string(a,"asset_id")?,number(a,"start")?,number(a,"end")?,number(a,"deposit")?,now)?}),
        ),
        "cancel" => {
            m.cancel(actor, number(a, "id")?, now)?;
            Ok(Value::Null)
        }
        "expire" => {
            m.expire(number(a, "id")?, now)?;
            Ok(Value::Null)
        }
        "pickup" => {
            m.pickup(actor, number(a, "id")?, string(a, "hash")?, now)?;
            Ok(Value::Null)
        }
        "request_return" => {
            m.request_return(actor, number(a, "id")?, string(a, "hash")?)?;
            Ok(Value::Null)
        }
        "accept_return" => {
            m.accept_return(actor, number(a, "id")?, &string(a, "hash")?)?;
            Ok(Value::Null)
        }
        "dispute" => {
            m.dispute(actor, number(a, "id")?, string(a, "hash")?)?;
            Ok(Value::Null)
        }
        "escalate" => {
            m.escalate(number(a, "id")?, now)?;
            Ok(Value::Null)
        }
        "resolve" => {
            m.resolve(
                actor,
                number(a, "id")?,
                number(a, "damage")?,
                string(a, "hash")?,
            )?;
            Ok(Value::Null)
        }
        "handover" => {
            m.handover(actor, &string(a, "asset_id")?, string(a, "custodian")?)?;
            Ok(Value::Null)
        }
        "withdraw" => Ok(json!(m.withdraw(actor)?)),
        "callback" => {
            if actor != "local-simulator" {
                return Err("Local simulator only".into());
            }
            let ok = a["success"].as_bool().ok_or("Missing result")?;
            Ok(json!({"applied":m.finish_withdrawal(number(a,"nonce")?,ok)}))
        }
        _ => Err("Unknown action".into()),
    }
}
fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let output = (|| -> Result<Value> {
        let input: Value = serde_json::from_str(&input).map_err(|e| e.to_string())?;
        let mut model = if input["model"].is_null() {
            demo()
        } else {
            serde_json::from_value::<Model>(input["model"].clone()).map_err(|e| e.to_string())?
        };
        let original = model.clone();
        match dispatch(&mut model, &input) {
            Ok(result) => {
                Ok(json!({"ok":true,"model":model,"ledger":model.ledger(),"result":result}))
            }
            Err(error) => {
                Ok(json!({"ok":false,"error":error,"model":original,"ledger":original.ledger()}))
            }
        }
    })()
    .unwrap_or_else(|e| json!({"ok":false,"error":e}));
    println!("{}", output);
}
