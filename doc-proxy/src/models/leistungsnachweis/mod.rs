//! Parser for Elektronischer Leistungsnachweis (SGB XI § 105 Abs. 2)
//!
//! Schema: PFL_LNW_2.1.0.xsd
//!
//! # Example
//!
//! ```rust,ignore
//! use crate::models::leistungsnachweis::Leistungsnachweis;
//!
//! let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
//! <Leistungsnachweis>
//!     <!-- ... -->
//! </Leistungsnachweis>"#;
//!
//! let lnw = Leistungsnachweis::from_xml(xml)?;
//! println!("ID: {}", lnw.id);
//! ```

pub mod error;
mod parser;
pub mod types;
pub mod validator;

// Re-export main types for convenience
pub use error::ParseError;
pub use types::{
    ArtDerUnterschrift, Dateityp, Einsatz, Einzelleistung, ErbrachteLeistungen,
    FehlendeUnterschrift, GrundFehlendeUnterschrift, Leistungen, Leistungsnachweis, Tag,
    Unterschrift, UnterschriftVersicherter,
};

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_leistungsnachweis() -> Leistungsnachweis {
        Leistungsnachweis {
            id: "550e8400-e29b-41d4-a716-446655440000".into(),
            erbrachte_leistungen: ErbrachteLeistungen {
                ik_pflegedienst: "123456789".into(),
                abrechnungsmonat: "202411".into(),
                versichertennummer: "A123456789".into(),
                name: "Müller".into(),
                vorname: "Hans".into(),
                leistungen: Leistungen {
                    tage: vec![Tag {
                        datum: "20241115".into(),
                        einsaetze: vec![Einsatz {
                            laufende_nummer: 1,
                            uhrzeit_beginn: "0800".into(),
                            einzelleistungen: vec![Einzelleistung {
                                leistungsziffer: "01001".into(),
                                bezeichnung: "Grundpflege".into(),
                                anzahl: Some("1.00".into()),
                                tatsaechliche_dauer: None,
                                beschaeftigtennummern: vec!["987654321".into()],
                            }],
                        }],
                    }],
                },
                beschaeftigtennummer_verantwortliche_fachkraft: "111222333".into(),
            },
            unterschrift_versicherter: UnterschriftVersicherter {
                art: ArtDerUnterschrift::HandschriftlichDigital,
                datum_uhrzeit: Some("20241115083000".into()),
                unterschrift: Some(Unterschrift {
                    datei: "iVBORw0KGgo=".into(),
                    dateityp: Dateityp::Png,
                }),
                fehlende_unterschrift: None,
            },
        }
    }

    #[test]
    fn test_roundtrip() {
        let original = sample_leistungsnachweis();
        let xml = original.to_xml().unwrap();
        println!("Generated XML:\n{}", xml);

        let parsed = Leistungsnachweis::from_xml(&xml).unwrap();
        assert_eq!(original, parsed);
    }

    #[test]
    fn test_parse_sample_xml() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<Leistungsnachweis>
    <LeistungsnachweisID>550e8400-e29b-41d4-a716-446655440000</LeistungsnachweisID>
    <ErbrachteLeistungen>
        <IKPflegedienst>123456789</IKPflegedienst>
        <Abrechnungsmonat>202411</Abrechnungsmonat>
        <Versichertennummer>A123456789</Versichertennummer>
        <Name>Müller</Name>
        <Vorname>Hans</Vorname>
        <Leistungen>
            <Tag>
                <Datum>20241115</Datum>
                <Einsatz>
                    <LaufendeNummer>1</LaufendeNummer>
                    <UhrzeitBeginn>0800</UhrzeitBeginn>
                    <Einzelleistung>
                        <Leistungsziffer>01001</Leistungsziffer>
                        <BezeichnungDerLeistung>Grundpflege</BezeichnungDerLeistung>
                        <Anzahl>1.00</Anzahl>
                        <Beschaeftigtennummer>987654321</Beschaeftigtennummer>
                    </Einzelleistung>
                </Einsatz>
            </Tag>
        </Leistungen>
        <BeschaeftigtennummerVerantwortlicheFachkraft>111222333</BeschaeftigtennummerVerantwortlicheFachkraft>
    </ErbrachteLeistungen>
    <UnterschriftVersicherter>
        <ArtDerUnterschrift>1</ArtDerUnterschrift>
        <DatumUndUhrzeitDerUnterschrift>20241115083000</DatumUndUhrzeitDerUnterschrift>
        <Unterschrift>
            <Datei>iVBORw0KGgo=</Datei>
            <Dateityp>3</Dateityp>
        </Unterschrift>
    </UnterschriftVersicherter>
</Leistungsnachweis>"#;

        let parsed = Leistungsnachweis::from_xml(xml).unwrap();
        assert_eq!(parsed.id, "550e8400-e29b-41d4-a716-446655440000");
        assert_eq!(parsed.erbrachte_leistungen.name, "Müller");
    }

    #[test]
    fn test_fehlende_unterschrift() {
        let mut lnw = sample_leistungsnachweis();
        lnw.unterschrift_versicherter = UnterschriftVersicherter {
            art: ArtDerUnterschrift::Fehlend,
            datum_uhrzeit: None,
            unterschrift: None,
            fehlende_unterschrift: Some(FehlendeUnterschrift {
                grund: GrundFehlendeUnterschrift::Sonstiges,
                erlaeuterung: Some("Versicherter im Krankenhaus".into()),
            }),
        };

        let xml = lnw.to_xml().unwrap();
        let parsed = Leistungsnachweis::from_xml(&xml).unwrap();

        assert_eq!(
            parsed.unterschrift_versicherter.art,
            ArtDerUnterschrift::Fehlend
        );
        assert!(
            parsed
                .unterschrift_versicherter
                .fehlende_unterschrift
                .is_some()
        );
    }
}
