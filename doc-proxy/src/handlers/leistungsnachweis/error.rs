//! Error types for Leistungsnachweis API.

use axum::http::StatusCode;
use thiserror::Error;

use crate::services::CoreClientError;

/// Domain errors for Leistungsnachweis operations.
#[derive(Error, Debug)]
pub enum LeistungsnachweisError {
    #[error("Resource not found: {0}")]
    NotFound(String),

    #[error("Invalid request: {0}")]
    BadRequest(String),

    #[error("Upstream service error: {0}")]
    Upstream(String),

    #[error("Internal error: {0}")]
    Internal(String),

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Invalid status transition from {from} to {to}")]
    InvalidStatusTransition { from: String, to: String },

    #[error("Export failed: {0}")]
    ExportFailed(String),

    #[error("Batch limit exceeded: max {max}, requested {requested}")]
    BatchLimitExceeded { max: usize, requested: usize },

    #[error("Conflict: {0}")]
    Conflict(String),
}

impl From<CoreClientError> for LeistungsnachweisError {
    fn from(err: CoreClientError) -> Self {
        match err {
            CoreClientError::NotFound => Self::NotFound("Resource not found in core".into()),
            CoreClientError::Unauthorized => Self::Unauthorized,
            CoreClientError::Request(e) => Self::Upstream(e.to_string()),
            CoreClientError::ServerError { status } => {
                Self::Upstream(format!("Core server returned {}", status))
            }
        }
    }
}

impl From<LeistungsnachweisError> for StatusCode {
    fn from(err: LeistungsnachweisError) -> Self {
        match err {
            LeistungsnachweisError::NotFound(_) => StatusCode::NOT_FOUND,
            LeistungsnachweisError::BadRequest(_) => StatusCode::BAD_REQUEST,
            LeistungsnachweisError::Upstream(_) => StatusCode::BAD_GATEWAY,
            LeistungsnachweisError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
            LeistungsnachweisError::Unauthorized => StatusCode::UNAUTHORIZED,
            LeistungsnachweisError::InvalidStatusTransition { .. } => StatusCode::CONFLICT,
            LeistungsnachweisError::ExportFailed(_) => StatusCode::INTERNAL_SERVER_ERROR,
            LeistungsnachweisError::BatchLimitExceeded { .. } => StatusCode::BAD_REQUEST,
            LeistungsnachweisError::Conflict(_) => StatusCode::CONFLICT,
        }
    }
}

/// Result type alias for Leistungsnachweis operations.
pub type Result<T> = std::result::Result<T, LeistungsnachweisError>;
