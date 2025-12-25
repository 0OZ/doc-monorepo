use axum::{middleware, routing::get, routing::post, Router};

use crate::{
    config::middleware::auth_middleware,
    handlers::{health, leistungsnachweis},
    AppState,
};

pub fn init_routes(state: AppState) -> Router {
    // Protected routes - require authorization
    let protected_routes = Router::new()
        .route(
            "/leistungsnachweise",
            get(leistungsnachweis::list_leistungsnachweise),
        )
        .route(
            "/leistungsnachweise/{id}",
            get(leistungsnachweis::get_leistungsnachweis),
        )
        .route(
            "/leistungsnachweise/{id}/sign",
            post(leistungsnachweis::sign_leistungsnachweis),
        )
        .layer(middleware::from_fn(auth_middleware));

    // Public routes - no authorization required
    Router::new()
        .route("/health", get(health::get_health))
        .merge(protected_routes)
        .with_state(state)
}
