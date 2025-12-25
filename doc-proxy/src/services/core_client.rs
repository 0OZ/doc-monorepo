//! HTTP client for the core server API.

use reqwest::{Client, StatusCode};
use serde::{de::DeserializeOwned, Serialize};
use thiserror::Error;

use crate::handlers::leistungsnachweis::{
    request::SignLeistungsnachweisRequest,
    response::{LeistungsnachweisDetail, LeistungsnachweisListItem, SignedDocumentResponse},
};
use crate::models::pagination::PageResult;

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
#[derive(Clone)]
pub struct CoreClient {
    client: Client,
    base_url: String,
    api_token: String,
}

impl CoreClient {
    /// Creates a new CoreClient from environment variables.
    ///
    /// Required env vars:
    /// - `CORE_API_URL`: Base URL of the core server (e.g., "http://localhost:8081")
    /// - `CORE_API_TOKEN`: Service token for authentication
    pub fn from_env() -> Self {
        let base_url = std::env::var("CORE_API_URL")
            .unwrap_or_else(|_| "http://localhost:8081".to_string());
        let api_token =
            std::env::var("CORE_API_TOKEN").unwrap_or_else(|_| "dev-service-token".to_string());

        Self::new(base_url, api_token)
    }

    /// Creates a new CoreClient with explicit configuration.
    pub fn new(base_url: String, api_token: String) -> Self {
        let client = Client::new();
        Self {
            client,
            base_url: base_url.trim_end_matches('/').to_string(),
            api_token,
        }
    }

    /// Fetches a paginated list of Leistungsnachweise for a client.
    pub async fn list_leistungsnachweise(
        &self,
        client_id: &str,
        page: u64,
        size: u64,
    ) -> Result<PageResult<LeistungsnachweisListItem>, CoreClientError> {
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
        let url = format!("{}/api/leistungsnachweise/{}", self.base_url, id);

        self.get(&url).await
    }

    /// Submits a signature to the core server for a Leistungsnachweis.
    /// The core server will store the signature and may generate the final document.
    pub async fn sign_leistungsnachweis(
        &self,
        id: &str,
        request: &SignLeistungsnachweisRequest,
    ) -> Result<SignedDocumentResponse, CoreClientError> {
        let url = format!("{}/api/leistungsnachweise/{}/sign", self.base_url, id);

        self.post(&url, request).await
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
