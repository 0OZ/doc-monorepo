//! Authentication handlers.

use axum::{
    Json,
    extract::State,
    http::{HeaderMap, StatusCode},
};
use serde::{Deserialize, Serialize};

use crate::AppState;
use crate::config::auth::{AuthError, AuthUser, Claims, UserRole};
use crate::repositories::device_repository;

/// Login request body
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

/// Login response with JWT token
#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserInfo,
    pub expires_in: i64,
}

/// User info returned after login
#[derive(Debug, Serialize)]
pub struct UserInfo {
    pub id: String,
    pub name: String,
    pub role: UserRole,
}

/// Current user response
#[derive(Debug, Serialize)]
pub struct MeResponse {
    pub id: String,
    pub name: String,
    pub role: UserRole,
}

/// Login endpoint - validates credentials and returns JWT
pub async fn login(
    State(_state): State<AppState>,
    Json(request): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, AuthError> {
    // In development/mock mode, accept test credentials
    // In production, this would validate against a database
    let (user_id, name, role) = validate_credentials(&request.username, &request.password)?;

    let claims = Claims::new(user_id.clone(), name.clone(), role.clone());
    let token = claims.to_token()?;

    let expires_in = std::env::var("JWT_EXPIRY_HOURS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(24i64)
        * 3600;

    Ok(Json(LoginResponse {
        token,
        user: UserInfo {
            id: user_id,
            name,
            role,
        },
        expires_in,
    }))
}

/// Get current authenticated user
pub async fn me(AuthUser(claims): AuthUser) -> Json<MeResponse> {
    Json(MeResponse {
        id: claims.sub,
        name: claims.name,
        role: claims.role,
    })
}

/// Validate user credentials
/// In mock mode, accepts predefined test users
/// In production, would check against database with hashed passwords
fn validate_credentials(
    username: &str,
    password: &str,
) -> Result<(String, String, UserRole), AuthError> {
    // Mock users for development
    // In production, this would query the database and verify password hash
    let mock_users = [
        (
            "admin",
            "admin123",
            "user-1",
            "Administrator",
            UserRole::Admin,
        ),
        (
            "staff",
            "staff123",
            "user-2",
            "Pflegekraft",
            UserRole::Staff,
        ),
        (
            "client",
            "client123",
            "user-3",
            "Hans Müller",
            UserRole::Client,
        ),
    ];

    for (u, p, id, name, role) in mock_users {
        if username == u && password == p {
            return Ok((id.to_string(), name.to_string(), role));
        }
    }

    Err(AuthError::InvalidCredentials)
}

/// Refresh token endpoint
pub async fn refresh(AuthUser(claims): AuthUser) -> Result<Json<LoginResponse>, AuthError> {
    // Create new claims with refreshed expiry
    let new_claims = Claims::new(claims.sub.clone(), claims.name.clone(), claims.role.clone());
    let token = new_claims.to_token()?;

    let expires_in = std::env::var("JWT_EXPIRY_HOURS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(24i64)
        * 3600;

    Ok(Json(LoginResponse {
        token,
        user: UserInfo {
            id: claims.sub,
            name: claims.name,
            role: claims.role,
        },
        expires_in,
    }))
}

/// Logout endpoint - client should discard token
/// Server-side we could add token to blacklist if needed
pub async fn logout() -> StatusCode {
    // In a more complete implementation, we'd add the token to a blacklist
    // For now, the client just discards the token
    StatusCode::NO_CONTENT
}

/// Device authentication response
#[derive(Debug, Serialize)]
pub struct DeviceAuthResponse {
    pub token: String,
    pub device: DeviceInfo,
    pub expires_in: i64,
}

/// Device info returned after device auth
#[derive(Debug, Serialize)]
pub struct DeviceInfo {
    pub id: String,
    pub name: String,
    pub mac_address: String,
    pub role: UserRole,
}

/// Device authentication endpoint - exchange API key for JWT
/// Reads X-Device-Key header
pub async fn device_auth(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<DeviceAuthResponse>, AuthError> {
    // Get API key from header
    let api_key = headers
        .get("X-Device-Key")
        .and_then(|v| v.to_str().ok())
        .ok_or(AuthError::MissingToken)?;

    // Look up device by API key
    let device = device_repository::find_by_api_key(&state.db, api_key)
        .await
        .map_err(|_| AuthError::InvalidToken)?
        .ok_or(AuthError::InvalidToken)?;

    // Check if device is active
    if !device.is_active {
        return Err(AuthError::InvalidToken);
    }

    // Update last_seen
    let _ = device_repository::update_last_seen(&state.db, device.id).await;

    // Convert role string to UserRole
    let role = match device.role.as_str() {
        "admin" => UserRole::Admin,
        "staff" => UserRole::Staff,
        _ => UserRole::Client,
    };

    // Create JWT for device
    let claims = Claims::new(
        format!("device-{}", device.id),
        device.name.clone(),
        role.clone(),
    );
    let token = claims.to_token()?;

    let expires_in = std::env::var("JWT_EXPIRY_HOURS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(24i64)
        * 3600;

    Ok(Json(DeviceAuthResponse {
        token,
        device: DeviceInfo {
            id: device.id.to_string(),
            name: device.name,
            mac_address: device.mac_address,
            role,
        },
        expires_in,
    }))
}
