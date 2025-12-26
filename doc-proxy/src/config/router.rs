use axum::{middleware, routing::delete, routing::get, routing::post, Router};

use crate::{
    config::middleware::auth_middleware,
    handlers::{auth, device, health, leistungsnachweis},
    AppState,
};

pub fn init_routes(state: AppState) -> Router {
    // Auth routes - public
    let auth_routes = Router::new()
        .route("/auth/login", post(auth::login))
        .route("/auth/refresh", post(auth::refresh))
        .route("/auth/logout", post(auth::logout))
        .route("/auth/device", post(auth::device_auth));

    // Protected auth routes
    let protected_auth_routes = Router::new()
        .route("/auth/me", get(auth::me))
        .layer(middleware::from_fn(auth_middleware));

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

    // Device management routes - require admin authorization
    let device_routes = Router::new()
        .route("/devices", get(device::list_devices))
        .route("/devices", post(device::register_device))
        .route("/devices/{id}", get(device::get_device))
        .route("/devices/{id}", delete(device::delete_device))
        .route("/devices/{id}/deactivate", post(device::deactivate_device))
        .route("/devices/{id}/activate", post(device::activate_device))
        .route(
            "/devices/{id}/regenerate-key",
            post(device::regenerate_device_key),
        )
        .layer(middleware::from_fn(auth_middleware));

    // Public routes - no authorization required
    Router::new()
        .route("/health", get(health::get_health))
        .merge(auth_routes)
        .merge(protected_auth_routes)
        .merge(protected_routes)
        .merge(device_routes)
        .with_state(state)
}
