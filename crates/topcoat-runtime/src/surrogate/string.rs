use ref_cast::RefCast;
use serde::{Deserialize, Serialize};

use crate::{StrSurrogate, impl_surrogate, impl_surrogate_mut, impl_surrogate_ref};

#[derive(Debug, Clone, RefCast, Serialize, Deserialize)]
#[repr(transparent)]
#[serde(transparent)]
pub struct StringSurrogate(String);

impl StringSurrogate {
    #[inline]
    pub(crate) const fn new(v: String) -> Self {
        Self(v)
    }
}

impl_surrogate!(String, StringSurrogate);
impl_surrogate_ref!(String, StringSurrogate);
impl_surrogate_mut!(String, StringSurrogate);

impl std::fmt::Display for StringSurrogate {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.0.fmt(f)
    }
}

impl std::ops::Deref for StringSurrogate {
    type Target = StrSurrogate;

    #[inline]
    fn deref(&self) -> &StrSurrogate {
        StrSurrogate::ref_cast(self.0.as_str())
    }
}

/// [fastcoat] `String + &str`, as in Rust.
impl<'a> std::ops::Add<&'a crate::StrSurrogate> for StringSurrogate {
    type Output = StringSurrogate;
    fn add(mut self, rhs: &'a crate::StrSurrogate) -> StringSurrogate {
        self.0.push_str(&rhs.0);
        self
    }
}

/// `String + String` is not Rust, but `$()` has no `&` operator, so accept the
/// owned form too (lowered identically in JS).
impl std::ops::Add<StringSurrogate> for StringSurrogate {
    type Output = StringSurrogate;
    fn add(mut self, rhs: StringSurrogate) -> StringSurrogate {
        self.0.push_str(&rhs.0);
        self
    }
}

impl<'a> std::ops::Add<&'a StringSurrogate> for StringSurrogate {
    type Output = StringSurrogate;
    fn add(mut self, rhs: &'a StringSurrogate) -> StringSurrogate {
        self.0.push_str(&rhs.0);
        self
    }
}
