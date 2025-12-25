//! Service-related structures: ErbrachteLeistungen, Leistungen, Tag, Einsatz, Einzelleistung.

use serde::{Deserialize, Serialize};

/// Erbrachte Leistungen (Zeile 3)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ErbrachteLeistungen {
    /// IK des Pflegedienstes, 9 digits (Zeile 4)
    #[serde(rename = "IKPflegedienst")]
    pub ik_pflegedienst: String,

    /// Abrechnungsmonat im Format JJJJMM (Zeile 5)
    #[serde(rename = "Abrechnungsmonat")]
    pub abrechnungsmonat: String,

    /// Versichertennummer, 10-12 chars (Zeile 6)
    #[serde(rename = "Versichertennummer")]
    pub versichertennummer: String,

    /// Nachname, max 45 chars (Zeile 7)
    #[serde(rename = "Name")]
    pub name: String,

    /// Vorname, max 45 chars (Zeile 8)
    #[serde(rename = "Vorname")]
    pub vorname: String,

    /// Container für Leistungen (Zeile 9)
    #[serde(rename = "Leistungen")]
    pub leistungen: Leistungen,

    /// Beschäftigtennummer verantwortliche Fachkraft, 9 digits (Zeile 22)
    #[serde(rename = "BeschaeftigtennummerVerantwortlicheFachkraft")]
    pub beschaeftigtennummer_verantwortliche_fachkraft: String,
}

/// Container für Tages-Leistungen (Zeile 9)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Leistungen {
    /// 1-31 Tage (Zeile 11)
    #[serde(rename = "Tag")]
    pub tage: Vec<Tag>,
}

/// Leistungen eines Tages (Zeile 11)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Tag {
    /// Datum im Format JJJJMMTT (Zeile 12)
    #[serde(rename = "Datum")]
    pub datum: String,

    /// 1-99 Einsätze pro Tag (Zeile 13)
    #[serde(rename = "Einsatz")]
    pub einsaetze: Vec<Einsatz>,
}

/// Einzelner Einsatz (Zeile 13)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Einsatz {
    /// Laufende Nummer 1-99 (Zeile 14)
    #[serde(rename = "LaufendeNummer")]
    pub laufende_nummer: u8,

    /// Uhrzeit Beginn im Format hhmm (Zeile 15)
    #[serde(rename = "UhrzeitBeginn")]
    pub uhrzeit_beginn: String,

    /// 1-99 Einzelleistungen pro Einsatz (Zeile 16)
    #[serde(rename = "Einzelleistung")]
    pub einzelleistungen: Vec<Einzelleistung>,
}

/// Einzelleistung (Zeile 16)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Einzelleistung {
    /// Leistungsziffer, 6-15 chars (Zeile 17)
    #[serde(rename = "Leistungsziffer")]
    pub leistungsziffer: String,

    /// Bezeichnung, 1-150 chars Freitext (Zeile 18)
    #[serde(rename = "BezeichnungDerLeistung")]
    pub bezeichnung: String,

    /// Anzahl im Format 9999.99, optional (Zeile 19)
    /// Füllen bei Vergütungsart = 01, 06, ggf. 07, 99
    #[serde(rename = "Anzahl", skip_serializing_if = "Option::is_none")]
    pub anzahl: Option<String>,

    /// Tatsächliche Dauer in Minuten, optional (Zeile 20)
    /// Füllen bei Vergütungsart = 02, ggf. 07, 99
    #[serde(rename = "TatsaechlicheDauer", skip_serializing_if = "Option::is_none")]
    pub tatsaechliche_dauer: Option<u16>,

    /// 1-3 Beschäftigtennummern (Zeile 21)
    #[serde(rename = "Beschaeftigtennummer")]
    pub beschaeftigtennummern: Vec<String>,
}
