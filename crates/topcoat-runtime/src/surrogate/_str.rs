use ref_cast::RefCast;

use crate::{
    BoolSurrogate, StringSurrogate, UsizeSurrogate, impl_surrogate_mut, impl_surrogate_ref,
    serialize_tagged,
};

#[derive(Debug, RefCast)]
#[repr(transparent)]
pub struct StrSurrogate(pub(super) str);

impl_surrogate_ref!(str, StrSurrogate);
impl_surrogate_mut!(str, StrSurrogate);

impl serde::Serialize for StrSurrogate {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serialize_tagged(serializer, "str", &self.0)
    }
}

impl std::fmt::Display for StrSurrogate {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.0.fmt(f)
    }
}

macro_rules! impl_cmp_op {
    ($method:ident, $op:tt) => {
        impl StrSurrogate {
            #[inline]
            pub fn $method(&self, rhs: &StrSurrogate) -> BoolSurrogate {
                BoolSurrogate::new(self.0 $op rhs.0)
            }
        }
    };
}

impl_cmp_op!(eq, ==);
impl_cmp_op!(ne, !=);
impl_cmp_op!(gt, >);
impl_cmp_op!(lt, <);
impl_cmp_op!(ge, >=);
impl_cmp_op!(le, <=);

impl StrSurrogate {
    /// [hearth] `str::parse::<i64>().ok()`, for route params and form input.
    #[inline]
    #[must_use]
    pub fn parse_i64(&self) -> crate::OptionSurrogate<i64> {
        crate::OptionSurrogate::new(self.0.parse::<i64>().ok())
    }

    #[inline]
    #[must_use]
    pub fn to_owned(&self) -> StringSurrogate {
        StringSurrogate::new(self.0.to_owned())
    }

    #[inline]
    #[must_use]
    pub fn is_empty(&self) -> BoolSurrogate {
        BoolSurrogate::new(self.0.is_empty())
    }

    #[inline]
    #[must_use]
    pub fn len(&self) -> UsizeSurrogate {
        UsizeSurrogate::new(self.0.len())
    }

    #[inline]
    #[must_use]
    pub fn trim(&self) -> &StrSurrogate {
        StrSurrogate::ref_cast(self.0.trim())
    }

    #[inline]
    #[must_use]
    pub fn trim_start(&self) -> &StrSurrogate {
        StrSurrogate::ref_cast(self.0.trim_start())
    }

    #[inline]
    #[must_use]
    pub fn trim_end(&self) -> &StrSurrogate {
        StrSurrogate::ref_cast(self.0.trim_end())
    }

    #[inline]
    #[must_use]
    pub fn starts_with(&self, other: &StrSurrogate) -> BoolSurrogate {
        BoolSurrogate::new(self.0.starts_with(&other.0))
    }

    #[inline]
    #[must_use]
    pub fn ends_with(&self, other: &StrSurrogate) -> BoolSurrogate {
        BoolSurrogate::new(self.0.ends_with(&other.0))
    }

    #[inline]
    #[must_use]
    pub fn contains(&self, other: &StrSurrogate) -> BoolSurrogate {
        BoolSurrogate::new(self.0.contains(&other.0))
    }
}

#[cfg(test)]
mod hearth_tests {
    use crate::Surrogated;

    #[test]
    fn concat_and_unwrap_or() {
        let a = String::from("/issue/").into_surrogate();
        let b = "42".into_surrogate();
        assert_eq!(crate::Surrogate::into_real(a + b), "/issue/42");
        let none: Option<String> = None;
        let d = none.into_surrogate().unwrap_or(String::from("?").into_surrogate());
        assert_eq!(crate::Surrogate::into_real(d), "?");
    }

    #[test]
    fn parse_i64_matches_std() {
        for s in ["42", "-7", "+3", "", "4 2", "1.5", "9223372036854775807", "9223372036854775808", "abc"] {
            let got = s.into_surrogate().parse_i64();
            assert_eq!(crate::Surrogate::into_real(got), s.parse::<i64>().ok(), "{s}");
        }
    }
}
