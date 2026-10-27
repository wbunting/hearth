# Hearth website

## Identity

Use the existing keyed arch and outlined wordmark from docs/hearth/brand. Ivory #F5F0E6 is the page ground, charcoal #2D2B26 is the main ink, and terracotta #BF512D belongs to actions and the closing section. This is a daylight reading surface for developers, not a dark editor imitation.

Use self-hosted Manrope for body and display type. Its open geometric forms echo the arch without replacing the outlined wordmark. Code uses the platform monospace stack. Display headings use weight 550-650 and fluid sizes, with a maximum of 6rem. Text remains readable without font loading.

## Layout

The demo is a single page: the shared site header, a short left-aligned intro, then the connected workbench of live Rust code alongside a working issue list. The workbench is the proof, not an ornamental mockup. It does not repeat the landing page; usehearth.dev (web/) owns the marketing sections and guides, and the header links there. The landing page frames /embed, which renders only the workbench. The landing page and the demo share site.css, so palette, type and header stay identical.

## Interaction

Filtering and toggling demo rows use real Hearth queries and mutations. Filtering stays in the browser. Rows are scoped to a random HttpOnly bearer cookie on the server. The cookie is not a signed account identity. The code tabs show explicitly labeled, simplified excerpts from the demo. On small screens, the demo precedes its code, and all navigation remains available without a hamburger menu. Use visible keyboard focus, labeled inputs, honest empty states and reduced-motion support.
