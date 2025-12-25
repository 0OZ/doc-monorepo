//! XML parsing and serialization for Leistungsnachweis.

use super::{error::ParseError, types::Leistungsnachweis, validator};

impl Leistungsnachweis {
    /// Parse XML string into Leistungsnachweis.
    ///
    /// This method parses the XML and validates the result according to the schema.
    pub fn from_xml(xml: &str) -> Result<Self, ParseError> {
        let result: Self = quick_xml::de::from_str(xml)?;
        validator::validate(&result)?;
        Ok(result)
    }

    /// Parse XML bytes into Leistungsnachweis.
    ///
    /// This method parses the XML and validates the result according to the schema.
    pub fn from_xml_bytes(xml: &[u8]) -> Result<Self, ParseError> {
        let result: Self = quick_xml::de::from_reader(xml)?;
        validator::validate(&result)?;
        Ok(result)
    }

    /// Serialize to XML string.
    ///
    /// Returns a valid XML document with the XML declaration.
    pub fn to_xml(&self) -> Result<String, ParseError> {
        let mut xml = String::from(r#"<?xml version="1.0" encoding="UTF-8"?>"#);
        xml.push('\n');
        xml.push_str(&quick_xml::se::to_string(self)?);
        Ok(xml)
    }
}
