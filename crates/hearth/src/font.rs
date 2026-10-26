#![doc = include_str!("../docs/font.md")]

pub use hearth_font::*;
pub use hearth_font_macro::{font, font_face};

#[cfg(feature = "font-fontsource")]
pub mod fontsource {
    pub use hearth_font::fontsource::*;
    pub use hearth_font_macro::{fontsource_font, fontsource_font_face};
}
