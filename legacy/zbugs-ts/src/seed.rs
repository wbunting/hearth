//! Seeds the database from the vendored zbugs GitHub CSVs (Apache-2.0,
//! see seed/github/LICENSE-zbugs), optionally adding synthetic issues
//! for scale tests: `cargo run -- seed --synthetic 50000`.

use std::path::Path;

use rand::{Rng, SeedableRng, rngs::StdRng, seq::IndexedRandom};
use serde::Deserialize;
use toasty::Db;

use crate::features::model::*;

const SEED_DIR: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/seed/github");
const BATCH: usize = 500;

#[derive(Deserialize)]
struct UserRow {
    id: String,
    login: String,
    name: Option<String>,
    avatar: Option<String>,
    role: String,
}

#[derive(Deserialize)]
struct IssueRow {
    id: String,
    title: String,
    open: bool,
    modified: f64,
    created: f64,
    #[serde(rename = "creatorID")]
    creator_id: String,
    #[serde(rename = "assigneeID")]
    assignee_id: Option<String>,
    description: Option<String>,
    visibility: String,
    #[serde(rename = "projectID")]
    project_id: String,
}

#[derive(Deserialize)]
struct CommentRow {
    id: String,
    #[serde(rename = "issueID")]
    issue_id: String,
    created: f64,
    body: String,
    #[serde(rename = "creatorID")]
    creator_id: String,
}

#[derive(Deserialize)]
struct LabelRow {
    id: String,
    name: String,
    #[serde(rename = "projectID")]
    project_id: String,
}

#[derive(Deserialize)]
struct IssueLabelRow {
    #[serde(rename = "labelID")]
    label_id: String,
    #[serde(rename = "issueID")]
    issue_id: String,
}

fn read<T: for<'de> Deserialize<'de>>(file: &str) -> Vec<T> {
    let mut reader = csv::Reader::from_path(Path::new(SEED_DIR).join(file)).unwrap();
    reader.deserialize().map(|r| r.unwrap()).collect()
}

fn blank(s: Option<String>) -> Option<String> {
    s.map(|s| s.trim().to_owned()).filter(|s| !s.is_empty())
}

/// Inserts rows in batches through the generated create builders.
macro_rules! insert_all {
    ($db:expr, $model:ty, $rows:expr, |$c:ident, $r:ident| $set:expr) => {{
        let rows: Vec<$model> = $rows;
        let n = rows.len();
        for chunk in rows.chunks(BATCH) {
            let mut many = <$model>::create_many();
            for $r in chunk {
                let $r = $r.clone();
                many = many.with_item(|$c| $set);
            }
            many.exec($db).await?;
        }
        n
    }};
}

pub async fn seed(db: &mut Db, synthetic: usize) -> toasty::Result<()> {
    db.push_schema().await?;

    let users: Vec<User> = read::<UserRow>("user.csv")
        .into_iter()
        .map(|u| User {
            id: u.id,
            login: u.login,
            name: blank(u.name),
            avatar: blank(u.avatar),
            role: u.role,
        })
        .collect();
    let user_ids: Vec<String> = users.iter().map(|u| u.id.clone()).collect();
    let n_users = insert_all!(db, User, users, |c, r| {
        let c = c.id(r.id).login(r.login).role(r.role);
        let c = match r.name { Some(v) => c.name(v), None => c };
        match r.avatar { Some(v) => c.avatar(v), None => c }
    });

    let labels: Vec<Label> = read::<LabelRow>("label.csv")
        .into_iter()
        .map(|l| Label { id: l.id, name: l.name, project_id: l.project_id })
        .collect();
    let project_id = labels
        .first()
        .map(|l| l.project_id.clone())
        .unwrap_or_else(|| "iCNlS2qEpzYWEes1RTf-D".to_owned());
    let label_ids: Vec<String> = labels.iter().map(|l| l.id.clone()).collect();
    insert_all!(db, Project, vec![Project { id: project_id.clone(), name: "Zero".to_owned() }], |c, r| c.id(r.id).name(r.name));
    let n_labels = insert_all!(db, Label, labels, |c, r| c.id(r.id).name(r.name).project_id(r.project_id));

    let mut issues: Vec<Issue> = read::<IssueRow>("issue.csv")
        .into_iter()
        .enumerate()
        .map(|(i, r)| Issue {
            id: r.id,
            short_id: 3000 + i as i64,
            title: r.title.chars().take(128).collect(),
            open: r.open,
            modified: r.modified as i64,
            created: r.created as i64,
            project_id: r.project_id,
            creator_id: r.creator_id,
            assignee_id: blank(r.assignee_id),
            description: r.description.unwrap_or_default(),
            visibility: r.visibility,
        })
        .collect();

    let mut issue_labels: Vec<IssueLabel> = read::<IssueLabelRow>("issueLabel.csv")
        .into_iter()
        .map(|r| IssueLabel { label_id: r.label_id, issue_id: r.issue_id })
        .collect();

    // Synthetic issues are clones of real titles with random people, labels and times.
    let mut rng = StdRng::seed_from_u64(42);
    let real_titles: Vec<String> = issues.iter().map(|i| i.title.clone()).collect();
    let base = issues.len();
    let now = crate::db::now_ms();
    for n in 0..synthetic {
        let created = now - rng.random_range(0..(3 * 365 * 24 * 3600 * 1000i64));
        let id = format!("syn-{n:08}");
        issues.push(Issue {
            id: id.clone(),
            short_id: 3000 + (base + n) as i64,
            title: real_titles.choose(&mut rng).unwrap().clone(),
            open: rng.random_bool(0.3),
            modified: created + rng.random_range(0..(30 * 24 * 3600 * 1000i64)),
            created,
            project_id: project_id.clone(),
            creator_id: user_ids.choose(&mut rng).unwrap().clone(),
            assignee_id: rng.random_bool(0.6).then(|| user_ids.choose(&mut rng).unwrap().clone()),
            description: String::new(),
            visibility: if rng.random_bool(0.05) { "internal" } else { "public" }.to_owned(),
        });
        let k = rng.random_range(0..3);
        let chosen: Vec<&String> = label_ids.choose_multiple(&mut rng, k).collect();
        for label_id in chosen {
            issue_labels.push(IssueLabel { label_id: label_id.clone(), issue_id: id.clone() });
        }
    }

    let issue_ids: std::collections::HashSet<String> = issues.iter().map(|i| i.id.clone()).collect();
    let n_issues = insert_all!(db, Issue, issues, |c, r| {
        let c = c
            .id(r.id)
            .short_id(r.short_id)
            .title(r.title)
            .open(r.open)
            .modified(r.modified)
            .created(r.created)
            .project_id(r.project_id)
            .creator_id(r.creator_id)
            .description(r.description)
            .visibility(r.visibility);
        match r.assignee_id { Some(v) => c.assignee_id(v), None => c }
    });
    issue_labels.retain(|il| issue_ids.contains(&il.issue_id));
    issue_labels.sort_by(|a, b| (&a.label_id, &a.issue_id).cmp(&(&b.label_id, &b.issue_id)));
    issue_labels.dedup_by(|a, b| a.label_id == b.label_id && a.issue_id == b.issue_id);
    let n_issue_labels = insert_all!(db, IssueLabel, issue_labels, |c, r| c.label_id(r.label_id).issue_id(r.issue_id));

    let comments: Vec<Comment> = read::<CommentRow>("comment.csv")
        .into_iter()
        .filter(|c| issue_ids.contains(&c.issue_id))
        .map(|c| Comment {
            id: c.id,
            issue_id: c.issue_id,
            created: c.created as i64,
            body: c.body,
            creator_id: c.creator_id,
        })
        .collect();
    let n_comments = insert_all!(db, Comment, comments, |c, r| c
        .id(r.id)
        .issue_id(r.issue_id)
        .created(r.created)
        .body(r.body)
        .creator_id(r.creator_id));

    println!(
        "seeded {n_users} users, {n_labels} labels, {n_issues} issues ({synthetic} synthetic), \
         {n_issue_labels} issue labels, {n_comments} comments"
    );
    Ok(())
}
