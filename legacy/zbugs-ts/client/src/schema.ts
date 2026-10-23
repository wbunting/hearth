// P0/P1: handwritten row types mirroring the Rust serde structs. P1 emits
// these as .d.ts from the #[record]s.
import type { ClientSchema } from "./runtime";

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
export type User = { id: string; login: string; name: string | null; avatar: string | null };
export type Label = { id: string; name: string };
export type IssueLabel = { id: string; labelId: string; issueId: string };
export type Comment = { id: string; issueId: string; created: number; body: string; creatorId: string };
export type Emoji = { id: string; value: string; subjectId: string; creatorId: string; created: number };

export type Boot = {
  mode: "ssr" | "local";
  scope: string;
  user: { id: string; login: string; crew: boolean };
  schema: ClientSchema;
  snapshot: Record<string, Record<string, unknown>[]>;
  descriptions: Record<string, string>;
};
