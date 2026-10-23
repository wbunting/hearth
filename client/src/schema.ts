// P0: handwritten row types. P1 generates these from the Rust #[record]s.

export type Issue = {
  id: string;
  shortId: number;
  title: string;
  open: boolean;
  modified: number;
  created: number;
  creatorId: string;
  assigneeId: string | null;
  visibility: string;
};

export type User = {
  id: string;
  login: string;
  name: string | null;
  avatar: string | null;
};

export type Label = { id: string; name: string };

export type IssueLabel = { id: string; labelId: string; issueId: string };

export type Snapshot = {
  issues: Issue[];
  users: User[];
  labels: Label[];
  issue_labels: IssueLabel[];
};

export type Boot = {
  mode: "ssr" | "local";
  scope: string;
  snapshot?: Snapshot;
};
