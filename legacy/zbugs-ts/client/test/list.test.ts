import { createCollection, createLiveQueryCollection, eq, localOnlyCollectionOptions } from "@tanstack/db";
import { expect, test } from "vitest";
import { mountKeyedList } from "../src/list";

type T = { id: string; n: number; open: boolean };

const tick = () => new Promise((r) => setTimeout(r, 0));

test("keyed list adopts SSR rows, reorders, filters and removes by key", async () => {
  const base = createCollection(
    localOnlyCollectionOptions<T>({
      getKey: (t) => t.id,
      initialData: [
        { id: "a", n: 3, open: true },
        { id: "b", n: 2, open: true },
        { id: "c", n: 1, open: false },
      ],
    }),
  );
  const live = createLiveQueryCollection({
    startSync: true,
    query: (q) =>
      q
        .from({ t: base })
        .where(({ t }) => eq(t.open, true))
        .orderBy(({ t }) => t.n, "desc"),
  });
  await live.preload();

  const ul = document.createElement("ul");
  ul.innerHTML = `<li data-key="a">ssr-a</li><li data-key="zzz">stale</li>`;
  const adopted = ul.firstElementChild;

  mountKeyedList<T>(ul, live as any, {
    key: (t) => t.id,
    create: () => document.createElement("li"),
    update: (el, t) => {
      el.textContent = `${t.id}:${t.n}`;
    },
  });
  const text = () => Array.from(ul.children).map((c) => c.textContent);

  expect(text()).toEqual(["a:3", "b:2"]);
  expect(ul.firstElementChild).toBe(adopted); // SSR node reused, not replaced

  base.update("b", (d) => {
    d.n = 10;
  });
  await tick();
  expect(text()).toEqual(["b:10", "a:3"]);

  base.update("c", (d) => {
    d.open = true;
  });
  base.delete("a");
  await tick();
  expect(text()).toEqual(["b:10", "c:1"]);
});
