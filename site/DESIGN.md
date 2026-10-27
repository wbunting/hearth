# Hearth website

## Identity

Use the existing keyed arch and outlined wordmark from docs/hearth/brand. Ivory #F5F0E6 is the page ground, charcoal #2D2B26 is the main ink, and terracotta #BF512D belongs to actions and the closing section. This is a daylight reading surface for developers, not a dark editor imitation.

Use self-hosted Manrope for body and display type. Its open geometric forms echo the arch without replacing the outlined wordmark. Code uses the platform monospace stack. Display headings use weight 550-650 and fluid sizes, with a maximum of 6rem. Text remains readable without font loading.

## Layout

A broad, left-aligned headline leads into a single connected workbench: live Rust code alongside a working issue list. The workbench is the main proof, not an ornamental mockup. Below it, a sparse horizontal architecture explanation gives way to an asymmetric feature index and a solid terracotta getting-started section. Avoid repeated feature cards, fake statistics and testimonials.

## Interaction

Filtering and toggling demo rows use real Hearth queries and mutations. Filtering stays in the browser. Rows are scoped to a random HttpOnly bearer cookie on the server. The cookie is not a signed account identity. The code tabs show explicitly labeled, simplified excerpts from the demo. On small screens, the demo precedes its code, and all navigation remains available without a hamburger menu. Use visible keyboard focus, labeled inputs, honest empty states and reduced-motion support.
