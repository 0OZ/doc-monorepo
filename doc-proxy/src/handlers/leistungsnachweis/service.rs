//! Business logic for Leistungsnachweis operations.

use crate::models::leistungsnachweis::types::{
    ArtDerUnterschrift, Dateityp, Einsatz, Einzelleistung, ErbrachteLeistungen,
    FehlendeUnterschrift, GrundFehlendeUnterschrift, Leistungen, Leistungsnachweis, Tag,
    Unterschrift, UnterschriftVersicherter,
};

use super::{
    error::{LeistungsnachweisError, Result},
    request::{ImageFormat, MissingSignatureReason, SignLeistungsnachweisRequest, SignatureType},
    response::{LeistungsnachweisDetail, SignedLeistungsnachweisResponse, DocumentStatus},
};

/// Validates a signature request.
pub fn validate_signature_request(req: &SignLeistungsnachweisRequest) -> Result<()> {
    match req.signature_type {
        SignatureType::HandwrittenDigital
        | SignatureType::HandwrittenPaper
        | SignatureType::PhotoConfirmation
        | SignatureType::AlternativeConfirmation => {
            if req.signature.is_none() {
                return Err(LeistungsnachweisError::BadRequest(
                    "Signature data required for this signature type".into(),
                ));
            }
        }
        SignatureType::Missing => {
            if req.missing_reason.is_none() {
                return Err(LeistungsnachweisError::BadRequest(
                    "Missing reason required when signature type is 'missing'".into(),
                ));
            }
            if req.missing_reason == Some(MissingSignatureReason::Other)
                && req.missing_explanation.is_none()
            {
                return Err(LeistungsnachweisError::BadRequest(
                    "Explanation required when missing reason is 'other'".into(),
                ));
            }
        }
    }
    Ok(())
}

/// Signs a Leistungsnachweis and generates XSD-compliant XML.
pub fn sign_and_generate_xml(
    detail: &LeistungsnachweisDetail,
    request: &SignLeistungsnachweisRequest,
) -> Result<SignedLeistungsnachweisResponse> {
    let mut leistungsnachweis = convert_to_xml_model(detail);
    leistungsnachweis.unterschrift_versicherter = build_unterschrift(request)?;

    let xml_content = leistungsnachweis
        .to_xml()
        .map_err(|e| LeistungsnachweisError::Internal(format!("XML generation failed: {}", e)))?;

    let xml_base64 = base64::Engine::encode(
        &base64::engine::general_purpose::STANDARD,
        xml_content.as_bytes(),
    );

    Ok(SignedLeistungsnachweisResponse {
        id: detail.id.clone(),
        status: DocumentStatus::Finalized,
        xml_content,
        xml_base64,
    })
}

/// Converts API response to XML model structure.
fn convert_to_xml_model(detail: &LeistungsnachweisDetail) -> Leistungsnachweis {
    Leistungsnachweis {
        id: detail.id.clone(),
        erbrachte_leistungen: ErbrachteLeistungen {
            ik_pflegedienst: detail.provider.ik.clone(),
            abrechnungsmonat: detail.billing_month.clone(),
            versichertennummer: detail.client.versichertennummer.clone(),
            name: detail.client.name.clone(),
            vorname: detail.client.vorname.clone(),
            leistungen: convert_leistungen(&detail.service_days),
            beschaeftigtennummer_verantwortliche_fachkraft: detail
                .provider
                .responsible_staff_id
                .clone(),
        },
        unterschrift_versicherter: placeholder_unterschrift(),
    }
}

fn convert_leistungen(
    service_days: &[super::response::ServiceDayResponse],
) -> Leistungen {
    Leistungen {
        tage: service_days
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

/// Builds UnterschriftVersicherter from request.
fn build_unterschrift(req: &SignLeistungsnachweisRequest) -> Result<UnterschriftVersicherter> {
    let art = map_signature_type(req.signature_type);
    let datum_uhrzeit = Some(chrono::Local::now().format("%Y%m%d%H%M%S").to_string());

    let unterschrift = build_unterschrift_data(req)?;
    let fehlende_unterschrift = build_fehlende_unterschrift(req)?;

    Ok(UnterschriftVersicherter {
        art,
        datum_uhrzeit,
        unterschrift,
        fehlende_unterschrift,
    })
}

fn map_signature_type(sig_type: SignatureType) -> ArtDerUnterschrift {
    match sig_type {
        SignatureType::HandwrittenDigital => ArtDerUnterschrift::HandschriftlichDigital,
        SignatureType::HandwrittenPaper => ArtDerUnterschrift::HandschriftlichPapier,
        SignatureType::PhotoConfirmation => ArtDerUnterschrift::BestaetigungFoto,
        SignatureType::AlternativeConfirmation => ArtDerUnterschrift::AlternativeBestätigung,
        SignatureType::Missing => ArtDerUnterschrift::Fehlend,
    }
}

fn build_unterschrift_data(req: &SignLeistungsnachweisRequest) -> Result<Option<Unterschrift>> {
    if req.signature_type == SignatureType::Missing {
        return Ok(None);
    }

    let sig_data = req.signature.as_ref().ok_or_else(|| {
        LeistungsnachweisError::BadRequest("Signature data required".into())
    })?;

    Ok(Some(Unterschrift {
        datei: sig_data.data.clone(),
        dateityp: map_format_to_dateityp(&sig_data.format),
    }))
}

fn build_fehlende_unterschrift(
    req: &SignLeistungsnachweisRequest,
) -> Result<Option<FehlendeUnterschrift>> {
    if req.signature_type != SignatureType::Missing {
        return Ok(None);
    }

    let grund = req.missing_reason.ok_or_else(|| {
        LeistungsnachweisError::BadRequest("Missing reason required".into())
    })?;

    Ok(Some(FehlendeUnterschrift {
        grund: map_missing_reason(grund),
        erlaeuterung: req.missing_explanation.clone(),
    }))
}

fn map_missing_reason(reason: MissingSignatureReason) -> GrundFehlendeUnterschrift {
    match reason {
        MissingSignatureReason::UnableToSign => GrundFehlendeUnterschrift::NichtUnterschriftsfaehig,
        MissingSignatureReason::Refused => GrundFehlendeUnterschrift::Verweigert,
        MissingSignatureReason::NotPresent => GrundFehlendeUnterschrift::NichtAnwesend,
        MissingSignatureReason::Other => GrundFehlendeUnterschrift::Sonstiges,
    }
}

fn map_format_to_dateityp(format: &ImageFormat) -> Dateityp {
    match format {
        ImageFormat::Pdf => Dateityp::Pdf,
        ImageFormat::Jpeg => Dateityp::Jpeg,
        ImageFormat::Png | ImageFormat::Svg => Dateityp::Png, // SVG → PNG for XSD
        ImageFormat::Gif => Dateityp::Gif,
        ImageFormat::Tiff => Dateityp::Tiff,
    }
}
