//! Domain errors for Leistungsnachweis.

use axum::http::StatusCode;
use thiserror::Error;

/// Domain errors for Leistungsnachweis operations.
#[derive(Error, Debug)]
pub enum LeistungsnachweisError {
    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Invalid: {0}")]
    Invalid(String),

    #[error("XML error: {0}")]
    Xml(String),

    #[error("Upstream error: {0}")]
    Upstream(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

impl From<quick_xml::DeError> for LeistungsnachweisError {
    fn from(err: quick_xml::DeError) -> Self {
        Self::Xml(format!("Parse error: {}", err))
    }
}

impl From<quick_xml::SeError> for LeistungsnachweisError {
    fn from(err: quick_xml::SeError) -> Self {
        Self::Xml(format!("Serialize error: {}", err))
    }
}

impl From<LeistungsnachweisError> for StatusCode {
    fn from(err: LeistungsnachweisError) -> Self {
        match err {
            LeistungsnachweisError::NotFound(_) => StatusCode::NOT_FOUND,
            LeistungsnachweisError::Invalid(_) => StatusCode::BAD_REQUEST,
            LeistungsnachweisError::Xml(_) => StatusCode::INTERNAL_SERVER_ERROR,
            LeistungsnachweisError::Upstream(_) => StatusCode::BAD_GATEWAY,
            LeistungsnachweisError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

pub type Result<T> = std::result::Result<T, LeistungsnachweisError>;
