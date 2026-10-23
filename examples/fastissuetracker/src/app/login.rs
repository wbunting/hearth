//! Demo login: pick a seeded user. A real Topcoat session gates every table.

use serde::Deserialize;
use topcoat::{
    Result,
    context::Cx,
    router::{
        content::Form,
        error::{SeeOther, see_other},
        page, route,
    },
    view::{View, view},
};

use crate::{auth, model::User};

#[page]
pub async fn page(cx: &Cx) -> Result<impl View> {
    let mut users = User::all().exec(&mut fastcoat::db(cx)).await?;
    users.sort_by(|a, b| (b.role == "crew").cmp(&(a.role == "crew")).then(a.login.cmp(&b.login)));
    Ok(view! {
        <main class="mx-auto mt-[10vh] max-w-sm px-4">
            <h1 class="text-2xl font-semibold tracking-tight">"fastissuetracker"</h1>
            <p class="mt-1 text-zinc-500">"Sign in as a seeded user. Crew can see internal issues and edit anything."</p>
            <form method="post" action="/login/submit" class="mt-6">
                <ul class="grid gap-1.5">
                    for user in users {
                        <li>
                            <button name="user_id" value=(&user.id)
                                class="flex w-full items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-left hover:border-indigo-400 hover:bg-indigo-50 dark:border-zinc-800 dark:hover:bg-indigo-950">
                                (&user.login)
                                if user.role == "crew" { <span class="rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">"crew"</span> }
                            </button>
                        </li>
                    }
                </ul>
            </form>
        </main>
    })
}

#[derive(Deserialize)]
struct LoginForm {
    user_id: String,
}

#[route(POST "/login/submit")]
async fn submit(cx: &Cx, Form(form): Form<LoginForm>) -> Result<SeeOther> {
    auth::sign_in(cx, &form.user_id).await?;
    Ok(see_other("/issues"))
}

#[route(POST "/logout")]
async fn logout(cx: &Cx) -> Result<SeeOther> {
    auth::sign_out(cx).await?;
    Ok(see_other("/login"))
}
