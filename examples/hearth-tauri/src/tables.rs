//! Synced tables. The browser keeps these rows in its in-memory store and
//! writes them optimistically; the functions below validate every write
//! before it reaches the on-device database.

use hearth::{
    Result, Table,
    context::Cx,
    router::error::{bad_request, not_found},
};
use serde::{Deserialize, Serialize};
use toasty::stmt::Expr;

use crate::{
    auth::owner,
    changes,
    model::{List, Task},
    now_ms,
};

#[derive(Table, Clone, Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[table(name = "lists", model = List, scope = local_owner, writable(name), update = rename_list, insert = add_list)]
pub struct ListRow {
    #[key]
    pub id: String,
    pub name: String,
    #[index]
    pub created: i64,
}

impl From<List> for ListRow {
    fn from(l: List) -> Self {
        Self {
            id: l.id,
            name: l.name,
            created: l.created,
        }
    }
}

#[derive(Table, Clone, Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[table(
    name = "tasks",
    model = Task,
    scope = local_owner,
    writable(title, done),
    update = update_task,
    insert = add_task,
    delete = remove_task
)]
pub struct TaskRow {
    #[key]
    pub id: String,
    #[index]
    pub list_id: String,
    pub title: String,
    #[index]
    pub done: bool,
    #[index]
    pub created: i64,
}

impl From<Task> for TaskRow {
    fn from(t: Task) -> Self {
        Self {
            id: t.id,
            list_id: t.list_id,
            title: t.title,
            done: t.done,
            created: t.created,
        }
    }
}

/// The app has one local user. Reads still require the launch token, so a
/// page or process that cannot present it gets nothing.
#[allow(
    clippy::unused_async,
    reason = "Table scope callbacks share an async interface"
)]
async fn local_owner(cx: &Cx) -> Result<Option<Expr<bool>>> {
    owner(cx)?;
    Ok(None)
}

fn valid_id(id: &str) -> Result<()> {
    let ok = !id.is_empty()
        && id.len() <= 64
        && id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_');
    if ok {
        Ok(())
    } else {
        Err(bad_request("invalid id").into())
    }
}

fn clean_text(text: &str, what: &str, max: usize) -> Result<String> {
    let t = text.trim();
    if t.is_empty() || t.chars().count() > max {
        return Err(bad_request(format!("{what} must be 1-{max} characters")).into());
    }
    Ok(t.to_owned())
}

async fn add_list(cx: &Cx, row: ListRow) -> Result<ListRow> {
    owner(cx)?;
    valid_id(&row.id)?;
    let saved = ListRow {
        name: clean_text(&row.name, "list name", 60)?,
        created: now_ms(),
        id: row.id,
    };
    let mut db = hearth::db(cx);
    let mut tx = db.transaction().await?;
    toasty::create!(List {
        id: saved.id.clone(),
        name: saved.name.clone(),
        created: saved.created
    })
    .exec(&mut tx)
    .await?;
    changes::record(&mut tx, "lists", &saved.id, Some(&saved)).await?;
    tx.commit().await?;
    Ok(saved)
}

async fn rename_list(cx: &Cx, id: String, patch: ListRowPatch) -> Result<ListRow> {
    owner(cx)?;
    let mut db = hearth::db(cx);
    let mut tx = db.transaction().await?;
    let mut list = List::filter_by_id(id)
        .first()
        .exec(&mut tx)
        .await?
        .ok_or_else(not_found)?;
    if let Some(name) = patch.name {
        list.update()
            .name(clean_text(&name, "list name", 60)?)
            .exec(&mut tx)
            .await?;
    }
    let row = ListRow::from(list);
    changes::record(&mut tx, "lists", &row.id, Some(&row)).await?;
    tx.commit().await?;
    Ok(row)
}

async fn add_task(cx: &Cx, row: TaskRow) -> Result<TaskRow> {
    owner(cx)?;
    valid_id(&row.id)?;
    let now = now_ms();
    let mut db = hearth::db(cx);
    let mut tx = db.transaction().await?;
    List::filter_by_id(row.list_id.clone())
        .first()
        .exec(&mut tx)
        .await?
        .ok_or_else(|| bad_request("no such list"))?;
    let saved = TaskRow {
        title: clean_text(&row.title, "task", 200)?,
        done: false,
        created: now,
        ..row
    };
    toasty::create!(Task {
        id: saved.id.clone(),
        list_id: saved.list_id.clone(),
        title: saved.title.clone(),
        done: false,
        created: now,
        modified: now
    })
    .exec(&mut tx)
    .await?;
    changes::record(&mut tx, "tasks", &saved.id, Some(&saved)).await?;
    tx.commit().await?;
    Ok(saved)
}

async fn update_task(cx: &Cx, id: String, patch: TaskRowPatch) -> Result<TaskRow> {
    owner(cx)?;
    let mut db = hearth::db(cx);
    let mut tx = db.transaction().await?;
    let mut task = Task::filter_by_id(id)
        .first()
        .exec(&mut tx)
        .await?
        .ok_or_else(not_found)?;
    let mut update = task.update().modified(now_ms());
    if let Some(title) = patch.title {
        update = update.title(clean_text(&title, "task", 200)?);
    }
    if let Some(done) = patch.done {
        update = update.done(done);
    }
    update.exec(&mut tx).await?;
    let row = TaskRow::from(task);
    changes::record(&mut tx, "tasks", &row.id, Some(&row)).await?;
    tx.commit().await?;
    Ok(row)
}

async fn remove_task(cx: &Cx, id: String) -> Result<()> {
    owner(cx)?;
    let mut db = hearth::db(cx);
    let mut tx = db.transaction().await?;
    Task::filter_by_id(id.clone())
        .delete()
        .exec(&mut tx)
        .await?;
    changes::record::<TaskRow>(&mut tx, "tasks", &id, None).await?;
    tx.commit().await?;
    Ok(())
}

hearth::routes!(lists: ListRow, tasks: TaskRow);
