//! HTTP client for the core server API.

use reqwest::{Client, StatusCode};
use serde::{de::DeserializeOwned, Serialize};
use thiserror::Error;
use tracing::info;

use crate::handlers::leistungsnachweis::{
    request::SignLeistungsnachweisRequest,
    response::{LeistungsnachweisDetail, LeistungsnachweisListItem, SignedDocumentResponse},
};
use crate::models::pagination::PageResult;
use super::mock_data;

#[derive(Error, Debug)]
pub enum CoreClientError {
    #[error("Request failed: {0}")]
    Request(#[from] reqwest::Error),

    #[error("Resource not found")]
    NotFound,

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Core server error: {status}")]
    ServerError { status: StatusCode },
}

/// Client for communicating with the core server.
/// Supports mock mode for development without a real backend.
#[derive(Clone)]
pub struct CoreClient {
    client: Client,
    base_url: String,
    api_token: String,
    mock_mode: bool,
}

impl CoreClient {
    /// Creates a new CoreClient from environment variables.
    ///
    /// Env vars:
    /// - `MOCK_MODE`: Set to "true" to enable mock data (default: true for development)
    /// - `CORE_API_URL`: Base URL of the core server (e.g., "http://localhost:8081")
    /// - `CORE_API_TOKEN`: Service token for authentication
    pub fn from_env() -> Self {
        let mock_mode = std::env::var("MOCK_MODE")
            .map(|v| v.to_lowercase() == "true" || v == "1")
            .unwrap_or(true); // Default to mock mode

        if mock_mode {
            info!("CoreClient running in MOCK MODE - using sample data");
        }

        let base_url = std::env::var("CORE_API_URL")
            .unwrap_or_else(|_| "http://localhost:8081".to_string());
        let api_token =
            std::env::var("CORE_API_TOKEN").unwrap_or_else(|_| "dev-service-token".to_string());

        Self::new(base_url, api_token, mock_mode)
    }

    /// Creates a new CoreClient with explicit configuration.
    pub fn new(base_url: String, api_token: String, mock_mode: bool) -> Self {
        let client = Client::new();
        Self {
            client,
            base_url: base_url.trim_end_matches('/').to_string(),
            api_token,
            mock_mode,
        }
    }

    /// Returns true if running in mock mode.
    pub fn is_mock(&self) -> bool {
        self.mock_mode
    }

    /// Fetches a paginated list of Leistungsnachweise for a client.
    pub async fn list_leistungsnachweise(
        &self,
        client_id: &str,
        page: u64,
        size: u64,
    ) -> Result<PageResult<LeistungsnachweisListItem>, CoreClientError> {
        if self.mock_mode {
            return Ok(mock_data::mock_list(client_id, page, size));
        }

        let url = format!(
            "{}/api/leistungsnachweise?clientId={}&page={}&size={}",
            self.base_url, client_id, page, size
        );

        self.get(&url).await
    }

    /// Fetches a single Leistungsnachweis by ID.
    pub async fn get_leistungsnachweis(
        &self,
        id: &str,
    ) -> Result<LeistungsnachweisDetail, CoreClientError> {
        if self.mock_mode {
            return mock_data::mock_detail(id).ok_or(CoreClientError::NotFound);
        }

        let url = format!("{}/api/leistungsnachweise/{}", self.base_url, id);

        self.get(&url).await
    }

    /// Submits a signature to the core server for a Leistungsnachweis.
    /// The core server will store the signature and may generate the final document.
    pub async fn sign_leistungsnachweis(
        &self,
        id: &str,
        _request: &SignLeistungsnachweisRequest,
    ) -> Result<SignedDocumentResponse, CoreClientError> {
        if self.mock_mode {
            // In mock mode, just return success
            return Ok(mock_data::mock_sign_response(id));
        }

        let url = format!("{}/api/leistungsnachweise/{}/sign", self.base_url, id);

        self.post(&url, _request).await
    }

    /// Generic GET request with authentication.
    async fn get<T: DeserializeOwned>(&self, url: &str) -> Result<T, CoreClientError> {
        let response = self
            .client
            .get(url)
            .header("Authorization", format!("Bearer {}", self.api_token))
            .header("Accept", "application/json")
            .send()
            .await?;

        self.handle_response(response).await
    }

    /// Generic POST request with authentication.
    async fn post<T: DeserializeOwned, B: Serialize>(
        &self,
        url: &str,
        body: &B,
    ) -> Result<T, CoreClientError> {
        let response = self
            .client
            .post(url)
            .header("Authorization", format!("Bearer {}", self.api_token))
            .header("Accept", "application/json")
            .json(body)
            .send()
            .await?;

        self.handle_response(response).await
    }

    /// Handle response status codes.
    async fn handle_response<T: DeserializeOwned>(
        &self,
        response: reqwest::Response,
    ) -> Result<T, CoreClientError> {
        match response.status() {
            StatusCode::OK | StatusCode::CREATED => Ok(response.json().await?),
            StatusCode::NOT_FOUND => Err(CoreClientError::NotFound),
            StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN => Err(CoreClientError::Unauthorized),
            status => Err(CoreClientError::ServerError { status }),
        }
    }
}
