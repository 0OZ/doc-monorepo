//! XML parsing and serialization for Leistungsnachweis.

use super::{entity::Leistungsnachweis, error::Result};

impl Leistungsnachweis {
    /// Parse from XML string.
    pub fn from_xml(xml: &str) -> Result<Self> {
        Ok(quick_xml::de::from_str(xml)?)
    }

    /// Parse from XML bytes.
    pub fn from_xml_bytes(xml: &[u8]) -> Result<Self> {
        Ok(quick_xml::de::from_reader(xml)?)
    }

    /// Serialize to XML string with declaration.
    pub fn to_xml(&self) -> Result<String> {
        let mut xml = String::from(r#"<?xml version="1.0" encoding="UTF-8"?>"#);
        xml.push('\n');
        xml.push_str(&quick_xml::se::to_string(self)?);
        Ok(xml)
    }
}
