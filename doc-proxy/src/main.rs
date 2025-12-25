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

#[tokio::main]
async fn main() {
    init_logger();

    let pool = init_db_pool().await;
    let core_client = CoreClient::from_env();
    let state = AppState { db: pool, core_client };

    let app = init_routes(state).layer(CorsLayer::permissive());

    let port = std::env::var("PORT").unwrap_or_else(|_| "3212".to_string());
    let address = format!("127.0.0.1:{}", port);

    let listener = tokio::net::TcpListener::bind(&address)
        .await
        .expect("Failed to bind to address");

    info!("Server running on http://{}", &address);

    axum::serve(listener, app)
        .await
        .expect("Server failed to start");
}
