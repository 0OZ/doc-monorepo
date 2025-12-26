//! JWT authentication configuration and middleware.

use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::sync::LazyLock;

/// JWT secret key - in production, use a proper secret management solution
static JWT_SECRET: LazyLock<String> = LazyLock::new(|| {
    std::env::var("JWT_SECRET").unwrap_or_else(|_| "dev-jwt-secret-change-in-production".to_string())
});

/// JWT token expiry in hours
static JWT_EXPIRY_HOURS: LazyLock<i64> = LazyLock::new(|| {
    std::env::var("JWT_EXPIRY_HOURS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(24)
});

/// Claims stored in the JWT token
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    /// Subject (user ID)
    pub sub: String,
    /// User's name
    pub name: String,
    /// User's role
    pub role: UserRole,
    /// Expiration time (Unix timestamp)
    pub exp: i64,
    /// Issued at (Unix timestamp)
    pub iat: i64,
}

/// User roles for authorization
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum UserRole {
    Admin,
    Staff,
    Client,
}

impl Claims {
    /// Create new claims for a user
    pub fn new(user_id: String, name: String, role: UserRole) -> Self {
        let now = chrono::Utc::now().timestamp();
        let exp = now + (*JWT_EXPIRY_HOURS * 3600);

        Self {
            sub: user_id,
            name,
            role,
            exp,
            iat: now,
        }
    }

    /// Generate a JWT token from these claims
    pub fn to_token(&self) -> Result<String, AuthError> {
        encode(
            &Header::default(),
            self,
            &EncodingKey::from_secret(JWT_SECRET.as_bytes()),
        )
        .map_err(|_| AuthError::TokenCreation)
    }

    /// Decode and validate a JWT token
    pub fn from_token(token: &str) -> Result<Self, AuthError> {
        decode::<Claims>(
            token,
            &DecodingKey::from_secret(JWT_SECRET.as_bytes()),
            &Validation::default(),
        )
        .map(|data| data.claims)
        .map_err(|e| match e.kind() {
            jsonwebtoken::errors::ErrorKind::ExpiredSignature => AuthError::TokenExpired,
            _ => AuthError::InvalidToken,
        })
    }
}

/// Authentication errors
#[derive(Debug)]
pub enum AuthError {
    MissingToken,
    InvalidToken,
    TokenExpired,
    TokenCreation,
    InvalidCredentials,
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AuthError::MissingToken => (StatusCode::UNAUTHORIZED, "Missing authorization token"),
            AuthError::InvalidToken => (StatusCode::UNAUTHORIZED, "Invalid token"),
            AuthError::TokenExpired => (StatusCode::UNAUTHORIZED, "Token expired"),
            AuthError::TokenCreation => (StatusCode::INTERNAL_SERVER_ERROR, "Failed to create token"),
            AuthError::InvalidCredentials => (StatusCode::UNAUTHORIZED, "Invalid credentials"),
        };

        (status, Json(serde_json::json!({ "error": message }))).into_response()
    }
}

/// Extractor for authenticated user from JWT
#[derive(Debug, Clone)]
pub struct AuthUser(pub Claims);

impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = AuthError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        // Get Authorization header
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .ok_or(AuthError::MissingToken)?;

        // Extract Bearer token
        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or(AuthError::InvalidToken)?;

        // Decode and validate
        let claims = Claims::from_token(token)?;

        Ok(AuthUser(claims))
    }
}

/// Optional auth extractor - doesn't fail if no token present
#[derive(Debug, Clone)]
pub struct OptionalAuthUser(pub Option<Claims>);

impl<S> FromRequestParts<S> for OptionalAuthUser
where
    S: Send + Sync,
{
    type Rejection = std::convert::Infallible;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let claims = parts
            .headers
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .and_then(|h| h.strip_prefix("Bearer "))
            .and_then(|t| Claims::from_token(t).ok());

        Ok(OptionalAuthUser(claims))
    }
}
