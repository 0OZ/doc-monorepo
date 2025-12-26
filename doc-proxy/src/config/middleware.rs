use axum::{
    body::Body,
    extract::Request,
    http::{header::AUTHORIZATION, StatusCode},
    middleware::Next,
    response::Response,
};

use super::auth::Claims;

/// JWT authentication middleware.
/// Validates the Bearer token in the Authorization header.
/// In development mode (AUTH_DISABLED=true), allows all requests.
pub async fn auth_middleware(request: Request<Body>, next: Next) -> Result<Response, StatusCode> {
    // Check if auth is disabled (for development)
    let auth_disabled = std::env::var("AUTH_DISABLED")
        .map(|v| v.to_lowercase() == "true" || v == "1")
        .unwrap_or(false);

    if auth_disabled {
        return Ok(next.run(request).await);
    }

    let auth_header = request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|h| h.to_str().ok());

    match auth_header {
        Some(header) if validate_jwt(header) => Ok(next.run(request).await),
        _ => Err(StatusCode::UNAUTHORIZED),
    }
}

/// Validate JWT token from Authorization header
fn validate_jwt(header: &str) -> bool {
    let token = match header.strip_prefix("Bearer ") {
        Some(t) => t,
        None => return false,
    };

    Claims::from_token(token).is_ok()
}
