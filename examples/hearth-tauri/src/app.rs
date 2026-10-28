//! The planner UI. One page; lists and tasks are client-side live queries
//! over the browser store, written optimistically and validated by the
//! table functions in `tables.rs`.

use hearth::{
    Result,
    asset::{Asset, asset},
    context::Cx,
    json_script, live_query,
    router::page,
    runtime::{Event, signal},
    table_handle,
    view::{View, view},
};

use crate::{
    auth::{VIEWER_SCOPE, owner},
    tables::{ListRow, TaskRow, client_schema},
};

const STYLES: Asset = asset!("./app.css");
const DIAG: Asset = asset!("./diag.js");

#[hearth::row]
pub struct ListItem {
    pub id: String,
    pub name: String,
}

#[hearth::row]
pub struct TaskItem {
    pub id: String,
    pub title: String,
    pub done: bool,
}

#[page("/")]
async fn home(cx: &Cx) -> Result<impl View> {
    owner(cx)?;
    // The first list is the default selection. SSR reads it from SQLite.
    let first = crate::model::List::all()
        .order_by(crate::model::List::fields().created().asc())
        .first()
        .exec(&mut hearth::db(cx))
        .await?
        .map(|l| l.id)
        .unwrap_or_default();

    let selected = signal(cx, || first);
    let show_done = signal(cx, || true);
    let draft = signal(cx, String::new);
    let new_list = signal(cx, String::new);

    let lists = live_query! {
        ListItem from l in ListRow
        order by l.created
        select { id: l.id, name: l.name }
    };
    let tasks = live_query! {
        TaskItem from t in TaskRow
        where t.list_id == $(selected.get())
            && if $(!show_done.get()) { t.done == false }
        order by t.created
        select { id: t.id, title: t.title, done: t.done }
    };
    let lists_t = table_handle::<ListRow>();
    let tasks_t = table_handle::<TaskRow>();
    let boot = serde_json::json!({
        "schema": client_schema(VIEWER_SCOPE.to_owned())
            .on_unauthorized(hearth::OnUnauthorized::Error),
        "snapshot": {},
    });

    Ok(view! {
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>"hearth planner"</title>
                <link rel="stylesheet" href=(STYLES)>
                <script src=(DIAG)></script>
                hearth::runtime::script()
            </head>
            <body>
                <div class="app">
                    <nav class="sidebar" aria-label="Lists">
                        <h1>"Planner"</h1>
                        <ul class="lists">
                            for l in $(lists) {
                                <li>
                                    <button
                                        :class=$(
                                            if selected.get() == l.id { "list active" } else { "list" }
                                        )
                                        @click=$(|_e: Event| selected.set(l.id.clone()))
                                    >
                                        $(l.name.clone())
                                    </button>
                                </li>
                            }
                        </ul>
                        <form
                            class="new-list"
                            @submit=$(
                                |e: Event| {
                                    e.prevent_default();
                                    if !new_list.get().trim().is_empty() {
                                        lists_t.insert1("name", new_list.get());
                                        new_list.set("".to_owned());
                                    }
                                }
                            )
                        >
                            <input
                                aria-label="New list"
                                placeholder="New list"
                                :value=$(new_list.get())
                                @input=$(|e: Event| new_list.set(e.target.value))
                            >
                        </form>
                        <p class="footnote">"Local SQLite. No server."</p>
                    </nav>
                    <main class="main">
                        <header class="toolbar">
                            <span class="count">"Tasks"</span>
                            <label class="toggle">
                                <input
                                    type="checkbox"
                                    checked=""
                                    @change=$(|e: Event| show_done.set(e.target.checked))
                                >
                                "Show done"
                            </label>
                        </header>
                        <form
                            class="composer"
                            @submit=$(
                                |e: Event| {
                                    e.prevent_default();
                                    // Runtime expressions have no `&&`; nest the checks.
                                    if !draft.get().trim().is_empty() {
                                        if !selected.get().is_empty() {
                                            tasks_t.insert2(
                                                "listId",
                                                selected.get(),
                                                "title",
                                                draft.get(),
                                            );
                                            draft.set("".to_owned());
                                        }
                                    }
                                }
                            )
                        >
                            <input
                                aria-label="New task"
                                placeholder="Add a task and press Enter"
                                :value=$(draft.get())
                                @input=$(|e: Event| draft.set(e.target.value))
                            >
                        </form>
                        <ul class="tasks" aria-label="Tasks">
                            for t in $(tasks) {
                                <li :class=$(if t.done { "task done" } else { "task" })>
                                    <button
                                        class="check"
                                        :aria-pressed=$(t.done)
                                        :aria-label=$(t.title.clone())
                                        @click=$(
                                            |_e: Event| tasks_t.set(t.id.clone(), "done", !t.done)
                                        )
                                    ></button>
                                    <span class="title">$(t.title.clone())</span>
                                    <button
                                        class="remove"
                                        title="Delete task"
                                        aria-label="Delete task"
                                        @click=$(|_e: Event| tasks_t.remove(t.id.clone()))
                                    >
                                        "x"
                                    </button>
                                </li>
                            }
                        </ul>
                        <p class="empty">"Nothing here yet."</p>
                    </main>
                </div>
                (json_script("hearth-boot", &boot))
            </body>
        </html>
    })
}
