//! Validation logic for Leistungsnachweis according to PFL_LNW_2.1.0.xsd.

use super::{
    error::ParseError,
    types::{ArtDerUnterschrift, Einsatz, GrundFehlendeUnterschrift, Leistungsnachweis, Tag},
};

/// Validate the Leistungsnachweis structure according to the spec.
pub fn validate(lnw: &Leistungsnachweis) -> Result<(), ParseError> {
    validate_id(lnw)?;
    validate_erbrachte_leistungen(lnw)?;
    validate_unterschrift(lnw)?;
    Ok(())
}

/// Validate LeistungsnachweisID (UUID, 36 chars).
fn validate_id(lnw: &Leistungsnachweis) -> Result<(), ParseError> {
    if lnw.id.len() != 36 {
        return Err(ParseError::Validation(format!(
            "LeistungsnachweisID must be 36 chars, got {}",
            lnw.id.len()
        )));
    }
    Ok(())
}

/// Validate ErbrachteLeistungen and its children.
fn validate_erbrachte_leistungen(lnw: &Leistungsnachweis) -> Result<(), ParseError> {
    let el = &lnw.erbrachte_leistungen;

    // IK Pflegedienst must be 9 digits
    if el.ik_pflegedienst.len() != 9 || !el.ik_pflegedienst.chars().all(|c| c.is_ascii_digit()) {
        return Err(ParseError::Validation(
            "IKPflegedienst must be exactly 9 digits".into(),
        ));
    }

    // Abrechnungsmonat format JJJJMM
    if el.abrechnungsmonat.len() != 6 || !el.abrechnungsmonat.chars().all(|c| c.is_ascii_digit()) {
        return Err(ParseError::Validation(
            "Abrechnungsmonat must be 6 digits (JJJJMM)".into(),
        ));
    }

    validate_tage(lnw)?;
    Ok(())
}

/// Validate Tage and nested structures.
fn validate_tage(lnw: &Leistungsnachweis) -> Result<(), ParseError> {
    let tage = &lnw.erbrachte_leistungen.leistungen.tage;

    // Tage: 1-31
    if tage.is_empty() || tage.len() > 31 {
        return Err(ParseError::Validation("Tag must occur 1-31 times".into()));
    }

    for tag in tage {
        // Datum format JJJJMMTT
        if tag.datum.len() != 8 || !tag.datum.chars().all(|c| c.is_ascii_digit()) {
            return Err(ParseError::Validation(
                "Datum must be 8 digits (JJJJMMTT)".into(),
            ));
        }

        validate_einsaetze(tag)?;
    }

    Ok(())
}

/// Validate Einsätze for a Tag.
fn validate_einsaetze(tag: &Tag) -> Result<(), ParseError> {
    // Einsätze: 1-99
    if tag.einsaetze.is_empty() || tag.einsaetze.len() > 99 {
        return Err(ParseError::Validation(
            "Einsatz must occur 1-99 times per Tag".into(),
        ));
    }

    for einsatz in &tag.einsaetze {
        // Laufende Nummer 1-99
        if einsatz.laufende_nummer < 1 || einsatz.laufende_nummer > 99 {
            return Err(ParseError::Validation("LaufendeNummer must be 1-99".into()));
        }

        // Uhrzeit format hhmm
        if einsatz.uhrzeit_beginn.len() != 4
            || !einsatz.uhrzeit_beginn.chars().all(|c| c.is_ascii_digit())
        {
            return Err(ParseError::Validation(
                "UhrzeitBeginn must be 4 digits (hhmm)".into(),
            ));
        }

        validate_einzelleistungen(einsatz)?;
    }

    Ok(())
}

/// Validate Einzelleistungen for an Einsatz.
fn validate_einzelleistungen(einsatz: &Einsatz) -> Result<(), ParseError> {
    // Einzelleistungen: 1-99
    if einsatz.einzelleistungen.is_empty() || einsatz.einzelleistungen.len() > 99 {
        return Err(ParseError::Validation(
            "Einzelleistung must occur 1-99 times per Einsatz".into(),
        ));
    }

    for el in &einsatz.einzelleistungen {
        // Beschäftigtennummern: 1-3
        if el.beschaeftigtennummern.is_empty() || el.beschaeftigtennummern.len() > 3 {
            return Err(ParseError::Validation(
                "Beschaeftigtennummer must occur 1-3 times".into(),
            ));
        }
    }

    Ok(())
}

/// Validate UnterschriftVersicherter according to Art.
fn validate_unterschrift(lnw: &Leistungsnachweis) -> Result<(), ParseError> {
    let u = &lnw.unterschrift_versicherter;

    match u.art {
        ArtDerUnterschrift::Fehlend => {
            if u.unterschrift.is_some() {
                return Err(ParseError::Validation(
                    "Unterschrift must not be present when Art=5".into(),
                ));
            }
            if u.fehlende_unterschrift.is_none() {
                return Err(ParseError::Validation(
                    "FehlendeUnterschrift required when Art=5".into(),
                ));
            }
        }
        _ => {
            if u.fehlende_unterschrift.is_some() {
                return Err(ParseError::Validation(
                    "FehlendeUnterschrift must not be present when Art!=5".into(),
                ));
            }
            if u.unterschrift.is_none() {
                return Err(ParseError::Validation(
                    "Unterschrift required when Art=1-4".into(),
                ));
            }
        }
    }

    // FehlendeUnterschrift: Erläuterung required when Grund=4
    if let Some(ref fe) = u.fehlende_unterschrift {
        if fe.grund == GrundFehlendeUnterschrift::Sonstiges && fe.erlaeuterung.is_none() {
            return Err(ParseError::Validation(
                "ErlaeuterungSonstiges required when Grund=4".into(),
            ));
        }
    }

    Ok(())
}
