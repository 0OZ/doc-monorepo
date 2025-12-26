use axum::http::{header, HeaderValue, Method};
use sea_orm::DatabaseConnection;
use tower_http::cors::CorsLayer;
use tracing::info;

use crate::config::{database::init_db_pool, logger::init_logger, router::init_routes};
use crate::services::CoreClient;

mod config;
mod handlers;
mod models;
mod repositories;
mod services;
mod utils;

#[derive(Clone)]
pub struct AppState {
    pub db: DatabaseConnection,
    pub core_client: CoreClient,
}

/// Build CORS layer based on environment.
/// Supports credentialed requests (cookies) with specific origins.
fn build_cors_layer() -> CorsLayer {
    let allowed_origins = std::env::var("CORS_ALLOWED_ORIGINS").unwrap_or_else(|_| {
        // Default origins for development
        "http://localhost:3000,http://localhost:31001,https://emd.famcare.evest.io".to_string()
    });

    let origins: Vec<HeaderValue> = allowed_origins
        .split(',')
        .filter_map(|s| s.trim().parse().ok())
        .collect();

    info!("CORS: Allowed origins: {:?}", origins);

    CorsLayer::new()
        .allow_origin(origins)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([
            header::AUTHORIZATION,
            header::CONTENT_TYPE,
            header::ACCEPT,
            header::ORIGIN,
            header::HeaderName::from_static("x-device-key"),
        ])
        .allow_credentials(true)
        .max_age(std::time::Duration::from_secs(3600))
}

#[tokio::main]
async fn main() {
    init_logger();

    let pool = init_db_pool().await;
    let core_client = CoreClient::from_env();
    let state = AppState { db: pool, core_client };

    let cors = build_cors_layer();
    let app = init_routes(state).layer(cors);

    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let host = std::env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let address = format!("{}:{}", host, port);

    let listener = tokio::net::TcpListener::bind(&address)
        .await
        .expect("Failed to bind to address");

    info!("Server running on http://{}", &address);

    axum::serve(listener, app)
        .await
        .expect("Server failed to start");
}
