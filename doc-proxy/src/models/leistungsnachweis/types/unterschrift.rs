//! Signature-related structures: UnterschriftVersicherter, Unterschrift, FehlendeUnterschrift.

use serde::{Deserialize, Serialize};

/// Unterschrift des Versicherten (Zeile 23)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct UnterschriftVersicherter {
    /// Art der Unterschrift 1-5 (Zeile 24)
    #[serde(rename = "ArtDerUnterschrift")]
    pub art: ArtDerUnterschrift,

    /// Datum und Uhrzeit im Format JJJJMMTThhmmss (Zeile 25)
    /// Optional bei Art = 3
    #[serde(
        rename = "DatumUndUhrzeitDerUnterschrift",
        skip_serializing_if = "Option::is_none"
    )]
    pub datum_uhrzeit: Option<String>,

    /// Unterschrift-Daten, bei Art 1-4 (Zeile 26)
    #[serde(rename = "Unterschrift", skip_serializing_if = "Option::is_none")]
    pub unterschrift: Option<Unterschrift>,

    /// Fehlende Unterschrift, bei Art = 5 (Zeile 29)
    #[serde(
        rename = "FehlendeUnterschrift",
        skip_serializing_if = "Option::is_none"
    )]
    pub fehlende_unterschrift: Option<FehlendeUnterschrift>,
}

/// Art der Unterschrift gemäß Schlüsselverzeichnis 3.2
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum ArtDerUnterschrift {
    /// 1 = Handschriftliche Unterschrift digital erfasst
    #[serde(rename = "1")]
    HandschriftlichDigital,
    /// 2 = Handschriftliche Unterschrift auf Papier
    #[serde(rename = "2")]
    HandschriftlichPapier,
    /// 3 = Bestätigung durch Foto
    #[serde(rename = "3")]
    BestaetigungFoto,
    /// 4 = Alternative Bestätigung (nur nach bilateraler Abstimmung)
    #[serde(rename = "4")]
    AlternativeBestätigung,
    /// 5 = Unterschrift fehlt
    #[serde(rename = "5")]
    Fehlend,
}

/// Unterschrift-Daten (Zeile 26)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Unterschrift {
    /// Base64-kodierte Datei (Zeile 27)
    #[serde(rename = "Datei")]
    pub datei: String,

    /// MIME-Type 1-5 gemäß Schlüsselverzeichnis 3.6 (Zeile 28)
    #[serde(rename = "Dateityp")]
    pub dateityp: Dateityp,
}

/// Dateityp gemäß Schlüsselverzeichnis 3.6
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

/// Fehlende Unterschrift (Zeile 29)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FehlendeUnterschrift {
    /// Grund 1-4 gemäß Schlüsselverzeichnis 3.3 (Zeile 30)
    #[serde(rename = "KennzeichenGrund")]
    pub grund: GrundFehlendeUnterschrift,

    /// Erläuterung bei Grund = 4, max 150 chars (Zeile 31)
    #[serde(
        rename = "ErlaeuterungSonstiges",
        skip_serializing_if = "Option::is_none"
    )]
    pub erlaeuterung: Option<String>,
}

/// Grund für fehlende Unterschrift gemäß Schlüsselverzeichnis 3.3
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum GrundFehlendeUnterschrift {
    /// 1 = Versicherter nicht unterschriftsfähig
    #[serde(rename = "1")]
    NichtUnterschriftsfaehig,
    /// 2 = Versicherter verweigert Unterschrift
    #[serde(rename = "2")]
    Verweigert,
    /// 3 = Versicherter nicht anwesend
    #[serde(rename = "3")]
    NichtAnwesend,
    /// 4 = Sonstiger Grund
    #[serde(rename = "4")]
    Sonstiges,
}
