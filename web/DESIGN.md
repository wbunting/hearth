# Static Hearth site and guides

The landing page inherits the layout, palette, typography and logo from site/DESIGN.md. Keep the broad left-aligned headline and connected code/proof area. Replace the embedded live controls with an explicit link to the real demo, never a nonfunctional imitation. All navigation works without JavaScript.

Guide pages use a readable central column, grouped sidebar navigation, a visible current-page link and a secondary table of contents on wide displays. On mobile, navigation moves above the article and code scrolls within its own block. Default browser anchors preserve copying and no-JavaScript operation. No search box is shown without a real search implementation.

Canonical and social URLs come from the deployment configuration. Assets and internal links remain same-origin on preview hosts. Self-host the existing Manrope font with its license. Static content ships with a strict no-script CSP.
