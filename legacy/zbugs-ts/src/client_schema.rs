//! Client schema descriptor. Rust is the source of truth: collection names,
//! keys, endpoints, which columns the browser indexes, and the scope
//! fingerprint all come from here. The generic TS runtime
//! (client/src/runtime.ts) builds TanStack DB collections + indexes from it.
//!
//! P1 turns `ClientCollection` registrations into a `collection!` macro;
//! the descriptor format stays.

use serde::Serialize;
use toasty::Db;
use toasty::schema::Model;

#[derive(Debug, Clone, Serialize)]
pub struct CollectionDesc {
    /// TanStack collection id, e.g. `issues`.
    pub name: &'static str,
    /// Client field used as the TanStack key.
    pub key: &'static str,
    /// GET endpoint returning the scoped rows.
    pub load: &'static str,
    /// POST endpoint for row patches (absent = read-only).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub update: Option<&'static str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub insert: Option<&'static str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub delete: Option<&'static str>,
    /// Client field names to build BTree indexes on.
    pub indexes: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ClientSchema {
    pub version: String,
    pub collections: Vec<CollectionDesc>,
}

/// One synced collection backed by a Toasty model `M`.
pub struct ClientCollection {
    pub desc: CollectionDesc,
}

impl ClientCollection {
    /// Indexes come from the model's Toasty schema: every non-primary
    /// `#[index]`/`#[unique]` field, plus the primary key fields (join
    /// targets). Field names are converted to the camelCase the JSON uses.
    pub fn from_model<M: Model>(db: &Db, desc: CollectionDesc, extra: &[&str]) -> Self {
        let schema = &db.schema().app;
        let model = schema
            .models()
            .find(|m| m.id() == M::id())
            .and_then(|m| m.as_root())
            .expect("model registered with the Db");
        let mut indexes: Vec<String> = Vec::new();
        let mut push = |name: &str| {
            let camel = camel_case(name);
            if !indexes.contains(&camel) {
                indexes.push(camel);
            }
        };
        for index in &model.indices {
            // Only the leading field of an index helps a single-column
            // client index; composite indexes contribute their first field.
            if let Some(first) = index.fields.first() {
                push(schema.field(first.field).name().app_unwrap());
            }
        }
        for name in extra {
            push(name);
        }
        Self { desc: CollectionDesc { indexes, ..desc } }
    }
}

fn camel_case(snake: &str) -> String {
    let mut out = String::with_capacity(snake.len());
    let mut upper = false;
    for c in snake.chars() {
        if c == '_' {
            upper = true;
        } else if upper {
            out.extend(c.to_uppercase());
            upper = false;
        } else {
            out.push(c);
        }
    }
    out
}

pub fn build(db: &Db) -> ClientSchema {
    use crate::features::model::*;
    let none = CollectionDesc {
        name: "",
        key: "id",
        load: "",
        update: None,
        insert: None,
        delete: None,
        indexes: vec![],
    };
    let collections = vec![
        // `modified`/`created` sort the list; not indexed in SQL here, but the
        // client needs them for orderBy+limit, so they're listed explicitly.
        ClientCollection::from_model::<Issue>(
            db,
            CollectionDesc { name: "issues", load: "/api/issues", update: Some("/api/issues/update"), ..none.clone() },
            &["created", "open"],
        ),
        ClientCollection::from_model::<User>(db, CollectionDesc { name: "users", load: "/api/users", ..none.clone() }, &[]),
        ClientCollection::from_model::<Label>(db, CollectionDesc { name: "labels", load: "/api/labels", ..none.clone() }, &[]),
        ClientCollection::from_model::<IssueLabel>(
            db,
            CollectionDesc {
                name: "issueLabels",
                load: "/api/issue-labels",
                insert: Some("/api/issue-labels/insert"),
                delete: Some("/api/issue-labels/delete"),
                ..none.clone()
            },
            &[],
        ),
        ClientCollection::from_model::<Comment>(
            db,
            CollectionDesc { name: "comments", load: "/api/comments", insert: Some("/api/comments/insert"), ..none.clone() },
            &["created"],
        ),
        ClientCollection::from_model::<Emoji>(
            db,
            CollectionDesc {
                name: "emojis",
                load: "/api/emojis",
                insert: Some("/api/emojis/insert"),
                delete: Some("/api/emojis/delete"),
                ..none.clone()
            },
            &[],
        ),
    ]
    .into_iter()
    .map(|c| c.desc)
    .collect();

    let version = format!("{:016x}", fxhash(&serde_json::to_string(&collections).unwrap()));
    ClientSchema { version, collections }
}

fn fxhash(s: &str) -> u64 {
    s.bytes().fold(0xcbf29ce484222325u64, |h, b| (h ^ b as u64).wrapping_mul(0x100000001b3))
}
