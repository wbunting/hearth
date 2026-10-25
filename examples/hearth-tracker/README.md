# Hearth tracker UI

The tracker uses copied Hearth UI components. `components.toml` records the registry versions. See [the UI guide](../../docs/ui.md) before updating them. The local copies are deliberately smaller than the registry defaults. Overwriting them will replace these changes.

- Buttons and cards use compact spacing. Unused variants and sections are omitted.
- Selects keep native options and the platform picker. Events and runtime bindings go through `attrs`.
- The neutral theme uses system fonts, CSS `light-dark()`, and a shared focus outline. It follows the system appearance. An ancestor with `.dark` or `.light` overrides it.
- The label menu is the registry's native details disclosure. It uses Tab navigation, not ARIA menu arrow keys, and stays open until its summary is toggled.
- The header composes buttons and a badge. The registry has no header component.
- The dense issue-row status button stays native because its reactive `:class` replaces the full class list. Label removal buttons use `badge_variants` so they remain buttons. Navigation anchors retain `data-hearth-link` and reactive `:href`.

`styles.css` is the tracker stylesheet. `src/app.css` builds a separate benchmark stylesheet, so the Hearth UI theme does not change either benchmark page. Their markup is unchanged and their classes intentionally differ from the tracker.

For runtime attributes inside component props, give event closures an explicit `Event` parameter. Clone captured signals and table handles inside client region/list bodies before constructing `attributes!`. Keep runtime option lists and conditional regions inside component children.

Nested client-list templates must keep their own JavaScript expressions. `hearth::dedupe` skips template contents when rewriting an enclosing row's expression references. This is covered by a regression test and matters when adding labels, reactions, or comments after hydration.
