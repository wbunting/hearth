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
    view::{View, attributes, view},
};

use crate::{
    auth,
    components::{
        badge::badge,
        button::{ButtonVariant, button},
    },
    model::User,
};

#[page]
pub async fn page(cx: &Cx) -> Result<impl View> {
    let mut users = User::all().exec(&mut hearth::db(cx)).await?;
    users.sort_by(|a, b| {
        (b.role == "crew")
            .cmp(&(a.role == "crew"))
            .then(a.login.cmp(&b.login))
    });
    Ok(view! {
        <main class="mx-auto mt-[10vh] max-w-sm px-4">
            <h1 class="text-2xl font-semibold tracking-tight">"hearth tracker"</h1>
            <p class="mt-1 text-muted-foreground">
                "Sign in as a seeded user. Crew can see internal issues and edit anything."
            </p>
            <form method="post" action="/login/submit" class="mt-6">
                <ul class="grid gap-1.5">
                    for user in users {
                        <li>
                            button(
                                variant: ButtonVariant::Outline,
                                attrs: attributes! {
                                    name="user_id"
                                    value=(&user.id)
                                    type="submit"
                                    class="w-full justify-between!"
                                },
                                (&user.login)
                                if user.role == "crew" {
                                    badge("crew")
                                }
                            )
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
