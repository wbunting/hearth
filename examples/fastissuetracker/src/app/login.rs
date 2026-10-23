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
        <main class="login">
            <h1>"fastissuetracker"</h1>
            <p class="muted">"Sign in as a seeded user. Crew can see internal issues and edit anything."</p>
            <form method="post" action="/login/submit">
                <ul class="users">
                    for user in users {
                        <li>
                            <button name="user_id" value=(&user.id)>
                                (&user.login)
                                if user.role == "crew" { <span class="badge">"crew"</span> }
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
