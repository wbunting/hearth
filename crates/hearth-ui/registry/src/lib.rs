#![cfg_attr(docsrs, feature(doc_cfg))]
//! The default Hearth UI component registry.
//!
//! Enable Hearth's `ui` feature to make this registry available to `hearth ui`.
//! Its command-line name is `hearth`.
//!
//! The manifest describes the themes and components to copy into projects.
//! Component sources also compile as test modules so changes can be checked
//! before installation.

#[cfg(all(test, feature = "stage-icons"))]
pub mod components;
