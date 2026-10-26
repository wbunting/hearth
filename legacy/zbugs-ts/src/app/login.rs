//! Demo login: pick a seeded user. Real auth (OAuth) is out of scope; the
//! point is that a real Hearth session gates every data endpoint.

use serde::Deserialize;
use hearth::{
    Result,
    context::Cx,
    router::{
        content::Form,
        error::{SeeOther, see_other},
        page, route,
    },
    view::{View, view},
};

use crate::{
    db::db,
    features::{auth, model::User},
};

#[page]
pub async fn page(cx: &Cx) -> Result<impl View> {
    let mut users = User::all().exec(&mut db(cx)).await?;
    users.sort_by(|a, b| b.is_crew().cmp(&a.is_crew()).then(a.login.cmp(&b.login)));
    Ok(view! {
        <main class="login">
            <h1>"Sign in to zbugs"</h1>
            <p class="muted">"Crew can see internal issues; users cannot."</p>
            <form method="post" action="/login/submit">
                <ul class="users">
                    for user in users {
                        <li>
                            <button name="user_id" value=(&user.id)>
                                (&user.login)
                                if user.is_crew() { <span class="badge">"crew"</span> }
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
