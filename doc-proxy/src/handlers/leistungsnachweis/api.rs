//! HTTP handlers for Leistungsnachweis API.
//!
//! Handlers are thin - they only handle HTTP concerns (extracting params, returning responses).
//! Business logic lives in the service module.

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use tracing::{error, info};

use crate::{models::pagination::PageResult, AppState};

use super::{
    error::LeistungsnachweisError,
    request::{ListLeistungsnachweiseQuery, SignQueryParams, SignLeistungsnachweisRequest},
    response::{LeistungsnachweisDetail, LeistungsnachweisListItem},
    service,
};

// ============================================================================
// Handlers
// ============================================================================

/// GET /leistungsnachweise?clientId=xxx&page=0&size=20
pub async fn list_leistungsnachweise(
    State(state): State<AppState>,
    Query(query): Query<ListLeistungsnachweiseQuery>,
) -> Result<Json<PageResult<LeistungsnachweisListItem>>, StatusCode> {
    info!(client_id = %query.client_id, page = query.page, "Listing leistungsnachweise");

    state
        .core_client
        .list_leistungsnachweise(&query.client_id, query.page, query.size)
        .await
        .map(Json)
        .map_err(|e| {
            error!(error = %e, "Failed to list leistungsnachweise");
            LeistungsnachweisError::from(e).into()
        })
}

/// GET /leistungsnachweise/{id}
pub async fn get_leistungsnachweis(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<LeistungsnachweisDetail>, StatusCode> {
    info!(id = %id, "Getting leistungsnachweis");

    state
        .core_client
        .get_leistungsnachweis(&id)
        .await
        .map(Json)
        .map_err(|e| {
            error!(error = %e, id = %id, "Failed to get leistungsnachweis");
            LeistungsnachweisError::from(e).into()
        })
}

/// POST /leistungsnachweise/{id}/sign?generateXml=true|false
pub async fn sign_leistungsnachweis(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Query(params): Query<SignQueryParams>,
    Json(payload): Json<SignLeistungsnachweisRequest>,
) -> Result<Response, StatusCode> {
    info!(id = %id, generate_xml = params.generate_xml, "Signing leistungsnachweis");

    service::validate_signature_request(&payload).map_err(|e| {
        error!(error = %e, "Validation failed");
        StatusCode::from(e)
    })?;

    if params.generate_xml {
        generate_xml_locally(&state, &id, &payload).await
    } else {
        forward_to_core(&state, &id, &payload).await
    }
}

// ============================================================================
// Private handler helpers
// ============================================================================

async fn forward_to_core(
    state: &AppState,
    id: &str,
    payload: &SignLeistungsnachweisRequest,
) -> Result<Response, StatusCode> {
    info!(id = %id, "Forwarding to core");

    state
        .core_client
        .sign_leistungsnachweis(id, payload)
        .await
        .map(|r| Json(r).into_response())
        .map_err(|e| {
            error!(error = %e, "Core signing failed");
            LeistungsnachweisError::from(e).into()
        })
}

async fn generate_xml_locally(
    state: &AppState,
    id: &str,
    payload: &SignLeistungsnachweisRequest,
) -> Result<Response, StatusCode> {
    info!(id = %id, "Generating XML locally");

    let detail = state
        .core_client
        .get_leistungsnachweis(id)
        .await
        .map_err(|e| {
            error!(error = %e, "Failed to fetch for signing");
            StatusCode::from(LeistungsnachweisError::from(e))
        })?;

    let response = service::sign_and_generate_xml(&detail, payload).map_err(|e| {
        error!(error = %e, "XML generation failed");
        StatusCode::from(e)
    })?;

    info!(id = %id, "XML generated successfully");
    Ok(Json(response).into_response())
}
