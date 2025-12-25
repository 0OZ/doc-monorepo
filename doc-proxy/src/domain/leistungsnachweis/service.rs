//! Domain service for Leistungsnachweis operations.

use super::{
    entity::Leistungsnachweis,
    error::{LeistungsnachweisError, Result},
    value_objects::{
        ArtDerUnterschrift, Dateityp, Einsatz, Einzelleistung, ErbrachteLeistungen,
        FehlendeUnterschrift, GrundFehlendeUnterschrift, Leistungen, Tag, Unterschrift,
        UnterschriftVersicherter,
    },
};

// ============================================================================
// Signing
// ============================================================================

/// Input for signing a Leistungsnachweis.
pub struct SigningInput {
    pub signature_type: SignatureTypeInput,
    pub signature_data: Option<SignatureDataInput>,
    pub missing_reason: Option<MissingReasonInput>,
    pub missing_explanation: Option<String>,
}

pub enum SignatureTypeInput {
    HandwrittenDigital,
    HandwrittenPaper,
    PhotoConfirmation,
    AlternativeConfirmation,
    Missing,
}

pub struct SignatureDataInput {
    pub data: String,
    pub format: ImageFormatInput,
}

pub enum ImageFormatInput {
    Png,
    Jpeg,
    Svg,
    Gif,
    Tiff,
    Pdf,
}

pub enum MissingReasonInput {
    UnableToSign,
    Refused,
    NotPresent,
    Other,
}

/// Validates signing input.
pub fn validate_signing_input(input: &SigningInput) -> Result<()> {
    match input.signature_type {
        SignatureTypeInput::Missing => {
            if input.missing_reason.is_none() {
                return Err(LeistungsnachweisError::Invalid(
                    "Missing reason required".into(),
                ));
            }
            if matches!(input.missing_reason, Some(MissingReasonInput::Other))
                && input.missing_explanation.is_none()
            {
                return Err(LeistungsnachweisError::Invalid(
                    "Explanation required for 'other' reason".into(),
                ));
            }
        }
        _ => {
            if input.signature_data.is_none() {
                return Err(LeistungsnachweisError::Invalid(
                    "Signature data required".into(),
                ));
            }
        }
    }
    Ok(())
}

/// Applies signature to a Leistungsnachweis.
pub fn apply_signature(
    leistungsnachweis: &mut Leistungsnachweis,
    input: &SigningInput,
) -> Result<()> {
    leistungsnachweis.unterschrift_versicherter = build_unterschrift(input)?;
    Ok(())
}

fn build_unterschrift(input: &SigningInput) -> Result<UnterschriftVersicherter> {
    let art = map_signature_type(&input.signature_type);
    let datum_uhrzeit = Some(chrono::Local::now().format("%Y%m%d%H%M%S").to_string());
    let unterschrift = build_unterschrift_data(input)?;
    let fehlende_unterschrift = build_fehlende_unterschrift(input)?;

    Ok(UnterschriftVersicherter {
        art,
        datum_uhrzeit,
        unterschrift,
        fehlende_unterschrift,
    })
}

fn map_signature_type(sig_type: &SignatureTypeInput) -> ArtDerUnterschrift {
    match sig_type {
        SignatureTypeInput::HandwrittenDigital => ArtDerUnterschrift::HandschriftlichDigital,
        SignatureTypeInput::HandwrittenPaper => ArtDerUnterschrift::HandschriftlichPapier,
        SignatureTypeInput::PhotoConfirmation => ArtDerUnterschrift::BestaetigungFoto,
        SignatureTypeInput::AlternativeConfirmation => ArtDerUnterschrift::AlternativeBestätigung,
        SignatureTypeInput::Missing => ArtDerUnterschrift::Fehlend,
    }
}

fn build_unterschrift_data(input: &SigningInput) -> Result<Option<Unterschrift>> {
    if matches!(input.signature_type, SignatureTypeInput::Missing) {
        return Ok(None);
    }

    let sig = input.signature_data.as_ref().ok_or_else(|| {
        LeistungsnachweisError::Invalid("Signature data required".into())
    })?;

    Ok(Some(Unterschrift {
        datei: sig.data.clone(),
        dateityp: map_format(&sig.format),
    }))
}

fn map_format(format: &ImageFormatInput) -> Dateityp {
    match format {
        ImageFormatInput::Pdf => Dateityp::Pdf,
        ImageFormatInput::Jpeg => Dateityp::Jpeg,
        ImageFormatInput::Png | ImageFormatInput::Svg => Dateityp::Png,
        ImageFormatInput::Gif => Dateityp::Gif,
        ImageFormatInput::Tiff => Dateityp::Tiff,
    }
}

fn build_fehlende_unterschrift(input: &SigningInput) -> Result<Option<FehlendeUnterschrift>> {
    if !matches!(input.signature_type, SignatureTypeInput::Missing) {
        return Ok(None);
    }

    let grund = input.missing_reason.as_ref().ok_or_else(|| {
        LeistungsnachweisError::Invalid("Missing reason required".into())
    })?;

    Ok(Some(FehlendeUnterschrift {
        grund: map_missing_reason(grund),
        erlaeuterung: input.missing_explanation.clone(),
    }))
}

fn map_missing_reason(reason: &MissingReasonInput) -> GrundFehlendeUnterschrift {
    match reason {
        MissingReasonInput::UnableToSign => GrundFehlendeUnterschrift::NichtUnterschriftsfaehig,
        MissingReasonInput::Refused => GrundFehlendeUnterschrift::Verweigert,
        MissingReasonInput::NotPresent => GrundFehlendeUnterschrift::NichtAnwesend,
        MissingReasonInput::Other => GrundFehlendeUnterschrift::Sonstiges,
    }
}

// ============================================================================
// Builder
// ============================================================================

/// Builds a Leistungsnachweis from component parts.
pub struct LeistungsnachweisBuilder {
    pub id: String,
    pub provider_ik: String,
    pub billing_month: String,
    pub client_id: String,
    pub client_name: String,
    pub client_vorname: String,
    pub responsible_staff_id: String,
    pub service_days: Vec<ServiceDayInput>,
}

pub struct ServiceDayInput {
    pub date: String,
    pub deployments: Vec<DeploymentInput>,
}

pub struct DeploymentInput {
    pub sequence_number: u8,
    pub start_time: String,
    pub services: Vec<ServiceInput>,
}

pub struct ServiceInput {
    pub code: String,
    pub description: String,
    pub quantity: Option<String>,
    pub duration_minutes: Option<u16>,
    pub staff_ids: Vec<String>,
}

impl LeistungsnachweisBuilder {
    pub fn build(self) -> Leistungsnachweis {
        Leistungsnachweis {
            id: self.id,
            erbrachte_leistungen: ErbrachteLeistungen {
                ik_pflegedienst: self.provider_ik,
                abrechnungsmonat: self.billing_month,
                versichertennummer: self.client_id,
                name: self.client_name,
                vorname: self.client_vorname,
                leistungen: self.build_leistungen(),
                beschaeftigtennummer_verantwortliche_fachkraft: self.responsible_staff_id,
            },
            unterschrift_versicherter: placeholder_unterschrift(),
        }
    }

    fn build_leistungen(&self) -> Leistungen {
        Leistungen {
            tage: self
                .service_days
                .iter()
                .map(|day| Tag {
                    datum: day.date.clone(),
                    einsaetze: day
                        .deployments
                        .iter()
                        .map(|d| Einsatz {
                            laufende_nummer: d.sequence_number,
                            uhrzeit_beginn: d.start_time.clone(),
                            einzelleistungen: d
                                .services
                                .iter()
                                .map(|s| Einzelleistung {
                                    leistungsziffer: s.code.clone(),
                                    bezeichnung: s.description.clone(),
                                    anzahl: s.quantity.clone(),
                                    tatsaechliche_dauer: s.duration_minutes,
                                    beschaeftigtennummern: s.staff_ids.clone(),
                                })
                                .collect(),
                        })
                        .collect(),
                })
                .collect(),
        }
    }
}

fn placeholder_unterschrift() -> UnterschriftVersicherter {
    UnterschriftVersicherter {
        art: ArtDerUnterschrift::Fehlend,
        datum_uhrzeit: None,
        unterschrift: None,
        fehlende_unterschrift: Some(FehlendeUnterschrift {
            grund: GrundFehlendeUnterschrift::NichtAnwesend,
            erlaeuterung: None,
        }),
    }
}
