//! Value objects for Leistungsnachweis domain.
//!
//! These are immutable domain primitives that have no identity of their own.

use serde::{Deserialize, Serialize};

// ============================================================================
// Leistungen (Services)
// ============================================================================

/// Erbrachte Leistungen - services provided to the patient
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ErbrachteLeistungen {
    #[serde(rename = "IKPflegedienst")]
    pub ik_pflegedienst: String,

    #[serde(rename = "Abrechnungsmonat")]
    pub abrechnungsmonat: String,

    #[serde(rename = "Versichertennummer")]
    pub versichertennummer: String,

    #[serde(rename = "Name")]
    pub name: String,

    #[serde(rename = "Vorname")]
    pub vorname: String,

    #[serde(rename = "Leistungen")]
    pub leistungen: Leistungen,

    #[serde(rename = "BeschaeftigtennummerVerantwortlicheFachkraft")]
    pub beschaeftigtennummer_verantwortliche_fachkraft: String,
}

/// Container for daily services
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Leistungen {
    #[serde(rename = "Tag")]
    pub tage: Vec<Tag>,
}

/// Services for a single day
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Tag {
    #[serde(rename = "Datum")]
    pub datum: String,

    #[serde(rename = "Einsatz")]
    pub einsaetze: Vec<Einsatz>,
}

/// Single deployment/visit
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Einsatz {
    #[serde(rename = "LaufendeNummer")]
    pub laufende_nummer: u8,

    #[serde(rename = "UhrzeitBeginn")]
    pub uhrzeit_beginn: String,

    #[serde(rename = "Einzelleistung")]
    pub einzelleistungen: Vec<Einzelleistung>,
}

/// Individual service item
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Einzelleistung {
    #[serde(rename = "Leistungsziffer")]
    pub leistungsziffer: String,

    #[serde(rename = "BezeichnungDerLeistung")]
    pub bezeichnung: String,

    #[serde(rename = "Anzahl", skip_serializing_if = "Option::is_none")]
    pub anzahl: Option<String>,

    #[serde(rename = "TatsaechlicheDauer", skip_serializing_if = "Option::is_none")]
    pub tatsaechliche_dauer: Option<u16>,

    #[serde(rename = "Beschaeftigtennummer")]
    pub beschaeftigtennummern: Vec<String>,
}

// ============================================================================
// Unterschrift (Signature)
// ============================================================================

/// Patient signature on the document
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct UnterschriftVersicherter {
    #[serde(rename = "ArtDerUnterschrift")]
    pub art: ArtDerUnterschrift,

    #[serde(
        rename = "DatumUndUhrzeitDerUnterschrift",
        skip_serializing_if = "Option::is_none"
    )]
    pub datum_uhrzeit: Option<String>,

    #[serde(rename = "Unterschrift", skip_serializing_if = "Option::is_none")]
    pub unterschrift: Option<Unterschrift>,

    #[serde(
        rename = "FehlendeUnterschrift",
        skip_serializing_if = "Option::is_none"
    )]
    pub fehlende_unterschrift: Option<FehlendeUnterschrift>,
}

/// Type of signature (per key directory 3.2)
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum ArtDerUnterschrift {
    #[serde(rename = "1")]
    HandschriftlichDigital,
    #[serde(rename = "2")]
    HandschriftlichPapier,
    #[serde(rename = "3")]
    BestaetigungFoto,
    #[serde(rename = "4")]
    AlternativeBestätigung,
    #[serde(rename = "5")]
    Fehlend,
}

/// Signature file data
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Unterschrift {
    #[serde(rename = "Datei")]
    pub datei: String,

    #[serde(rename = "Dateityp")]
    pub dateityp: Dateityp,
}

/// File type (per key directory 3.6)
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum Dateityp {
    #[serde(rename = "1")]
    Pdf,
    #[serde(rename = "2")]
    Jpeg,
    #[serde(rename = "3")]
    Png,
    #[serde(rename = "4")]
    Gif,
    #[serde(rename = "5")]
    Tiff,
}

/// Missing signature information
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FehlendeUnterschrift {
    #[serde(rename = "KennzeichenGrund")]
    pub grund: GrundFehlendeUnterschrift,

    #[serde(
        rename = "ErlaeuterungSonstiges",
        skip_serializing_if = "Option::is_none"
    )]
    pub erlaeuterung: Option<String>,
}

/// Reason for missing signature (per key directory 3.3)
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum GrundFehlendeUnterschrift {
    #[serde(rename = "1")]
    NichtUnterschriftsfaehig,
    #[serde(rename = "2")]
    Verweigert,
    #[serde(rename = "3")]
    NichtAnwesend,
    #[serde(rename = "4")]
    Sonstiges,
}
