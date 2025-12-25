//! Leistungsnachweis entity - the aggregate root.

use serde::{Deserialize, Serialize};

use super::value_objects::{ErbrachteLeistungen, UnterschriftVersicherter};

/// Leistungsnachweis - Electronic proof of service delivery (SGB XI § 105 Abs. 2)
///
/// This is the aggregate root for the Leistungsnachweis domain.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename = "Leistungsnachweis")]
pub struct Leistungsnachweis {
    #[serde(rename = "LeistungsnachweisID")]
    pub id: String,

    #[serde(rename = "ErbrachteLeistungen")]
    pub erbrachte_leistungen: ErbrachteLeistungen,

    #[serde(rename = "UnterschriftVersicherter")]
    pub unterschrift_versicherter: UnterschriftVersicherter,
}
