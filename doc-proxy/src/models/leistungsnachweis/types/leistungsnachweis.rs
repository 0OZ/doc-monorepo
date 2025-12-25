//! Root element: Leistungsnachweis.

use serde::{Deserialize, Serialize};

use super::{ErbrachteLeistungen, UnterschriftVersicherter};

/// Root element: Leistungsnachweis (Zeile 1)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename = "Leistungsnachweis")]
pub struct Leistungsnachweis {
    /// UUID, 36 chars (Zeile 2)
    #[serde(rename = "LeistungsnachweisID")]
    pub id: String,

    /// Erbrachte Leistungen (Zeile 3)
    #[serde(rename = "ErbrachteLeistungen")]
    pub erbrachte_leistungen: ErbrachteLeistungen,

    /// Unterschrift des Versicherten (Zeile 23)
    #[serde(rename = "UnterschriftVersicherter")]
    pub unterschrift_versicherter: UnterschriftVersicherter,
}
