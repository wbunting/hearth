#![doc = include_str!("../docs/icon.md")]

pub use hearth_icon::*;

#[cfg(feature = "icon-iconify")]
pub mod iconify {
    pub use hearth_icon::iconify::*;
    pub use hearth_icon_macro::{iconify_icon, include};
}
