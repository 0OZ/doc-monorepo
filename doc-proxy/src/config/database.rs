use sea_orm::{Database, DatabaseConnection};
use tracing::info;

pub async fn init_db_pool() -> DatabaseConnection {
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:password@localhost:5432/doc_proxy".to_string());

    info!("Connecting to database...");

    Database::connect(&database_url)
        .await
        .expect("Failed to connect to database")
}
