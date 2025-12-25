//! Error types for Leistungsnachweis parsing and validation.

use thiserror::Error;

/// Errors that can occur when parsing or validating a Leistungsnachweis.
#[derive(Error, Debug)]
pub enum ParseError {
    /// XML deserialization error
    #[error("XML parsing error: {0}")]
    XmlDeserialize(#[from] quick_xml::DeError),

    /// XML serialization error
    #[error("XML serialization error: {0}")]
    XmlSerialize(#[from] quick_xml::SeError),

    /// Schema validation error
    #[error("Validation error: {0}")]
    Validation(String),
}
