//! Device management handlers (admin only).

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::config::auth::{AuthUser, UserRole};
use crate::repositories::device_repository::{
    self, CreateDeviceRequest, DeviceCreatedResponse, DeviceResponse,
};
use crate::AppState;

/// Error response for device operations
#[derive(Debug, serde::Serialize)]
pub struct DeviceErrorResponse {
    pub error: String,
}

/// List all devices (admin only)
pub async fn list_devices(
    State(state): State<AppState>,
    AuthUser(claims): AuthUser,
) -> Result<Json<Vec<DeviceResponse>>, (StatusCode, Json<DeviceErrorResponse>)> {
    // Check admin role
    if claims.role != UserRole::Admin {
        return Err((
            StatusCode::FORBIDDEN,
            Json(DeviceErrorResponse {
                error: "Admin access required".to_string(),
            }),
        ));
    }

    let devices = device_repository::find_all(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(DeviceErrorResponse {
                    error: e.to_string(),
                }),
            )
        })?;

    Ok(Json(devices))
}

/// Get device by ID (admin only)
pub async fn get_device(
    State(state): State<AppState>,
    AuthUser(claims): AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<DeviceResponse>, (StatusCode, Json<DeviceErrorResponse>)> {
    if claims.role != UserRole::Admin {
        return Err((
            StatusCode::FORBIDDEN,
            Json(DeviceErrorResponse {
                error: "Admin access required".to_string(),
            }),
        ));
    }

    let device = device_repository::find_by_id(&state.db, id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(DeviceErrorResponse {
                    error: e.to_string(),
                }),
            )
        })?
        .ok_or_else(|| {
            (
                StatusCode::NOT_FOUND,
                Json(DeviceErrorResponse {
                    error: "Device not found".to_string(),
                }),
            )
        })?;

    Ok(Json(device))
}

/// Request to register a new device
#[derive(Debug, Deserialize)]
pub struct RegisterDeviceRequest {
    pub mac_address: String,
    pub name: String,
    pub role: Option<String>,
    pub user_id: Option<Uuid>,
}

/// Register a new device (admin only) - returns API key once!
pub async fn register_device(
    State(state): State<AppState>,
    AuthUser(claims): AuthUser,
    Json(request): Json<RegisterDeviceRequest>,
) -> Result<(StatusCode, Json<DeviceCreatedResponse>), (StatusCode, Json<DeviceErrorResponse>)> {
    if claims.role != UserRole::Admin {
        return Err((
            StatusCode::FORBIDDEN,
            Json(DeviceErrorResponse {
                error: "Admin access required".to_string(),
            }),
        ));
    }

    // Validate MAC address format (basic check)
    let mac = request.mac_address.to_uppercase();
    if !is_valid_mac(&mac) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(DeviceErrorResponse {
                error: "Invalid MAC address format. Use AA:BB:CC:DD:EE:FF".to_string(),
            }),
        ));
    }

    // Check if device with this MAC already exists
    if device_repository::find_by_mac(&state.db, &mac)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(DeviceErrorResponse {
                    error: e.to_string(),
                }),
            )
        })?
        .is_some()
    {
        return Err((
            StatusCode::CONFLICT,
            Json(DeviceErrorResponse {
                error: "Device with this MAC address already exists".to_string(),
            }),
        ));
    }

    let device = device_repository::create(
        &state.db,
        CreateDeviceRequest {
            mac_address: mac,
            name: request.name,
            role: request.role,
            user_id: request.user_id,
        },
    )
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(DeviceErrorResponse {
                error: e.to_string(),
            }),
        )
    })?;

    Ok((StatusCode::CREATED, Json(device)))
}

/// Deactivate a device (admin only)
pub async fn deactivate_device(
    State(state): State<AppState>,
    AuthUser(claims): AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<DeviceResponse>, (StatusCode, Json<DeviceErrorResponse>)> {
    if claims.role != UserRole::Admin {
        return Err((
            StatusCode::FORBIDDEN,
            Json(DeviceErrorResponse {
                error: "Admin access required".to_string(),
            }),
        ));
    }

    let device = device_repository::deactivate(&state.db, id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(DeviceErrorResponse {
                    error: e.to_string(),
                }),
            )
        })?
        .ok_or_else(|| {
            (
                StatusCode::NOT_FOUND,
                Json(DeviceErrorResponse {
                    error: "Device not found".to_string(),
                }),
            )
        })?;

    Ok(Json(device))
}

/// Activate a device (admin only)
pub async fn activate_device(
    State(state): State<AppState>,
    AuthUser(claims): AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<DeviceResponse>, (StatusCode, Json<DeviceErrorResponse>)> {
    if claims.role != UserRole::Admin {
        return Err((
            StatusCode::FORBIDDEN,
            Json(DeviceErrorResponse {
                error: "Admin access required".to_string(),
            }),
        ));
    }

    let device = device_repository::activate(&state.db, id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(DeviceErrorResponse {
                    error: e.to_string(),
                }),
            )
        })?
        .ok_or_else(|| {
            (
                StatusCode::NOT_FOUND,
                Json(DeviceErrorResponse {
                    error: "Device not found".to_string(),
                }),
            )
        })?;

    Ok(Json(device))
}

/// Regenerate API key for a device (admin only)
pub async fn regenerate_device_key(
    State(state): State<AppState>,
    AuthUser(claims): AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<DeviceCreatedResponse>, (StatusCode, Json<DeviceErrorResponse>)> {
    if claims.role != UserRole::Admin {
        return Err((
            StatusCode::FORBIDDEN,
            Json(DeviceErrorResponse {
                error: "Admin access required".to_string(),
            }),
        ));
    }

    let device = device_repository::regenerate_api_key(&state.db, id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(DeviceErrorResponse {
                    error: e.to_string(),
                }),
            )
        })?
        .ok_or_else(|| {
            (
                StatusCode::NOT_FOUND,
                Json(DeviceErrorResponse {
                    error: "Device not found".to_string(),
                }),
            )
        })?;

    Ok(Json(device))
}

/// Delete a device (admin only)
pub async fn delete_device(
    State(state): State<AppState>,
    AuthUser(claims): AuthUser,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, Json<DeviceErrorResponse>)> {
    if claims.role != UserRole::Admin {
        return Err((
            StatusCode::FORBIDDEN,
            Json(DeviceErrorResponse {
                error: "Admin access required".to_string(),
            }),
        ));
    }

    // Check if device exists
    if device_repository::find_by_id(&state.db, id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(DeviceErrorResponse {
                    error: e.to_string(),
                }),
            )
        })?
        .is_none()
    {
        return Err((
            StatusCode::NOT_FOUND,
            Json(DeviceErrorResponse {
                error: "Device not found".to_string(),
            }),
        ));
    }

    device_repository::delete(&state.db, id).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(DeviceErrorResponse {
                error: e.to_string(),
            }),
        )
    })?;

    Ok(StatusCode::NO_CONTENT)
}

/// Validate MAC address format (AA:BB:CC:DD:EE:FF)
fn is_valid_mac(mac: &str) -> bool {
    let parts: Vec<&str> = mac.split(':').collect();
    if parts.len() != 6 {
        return false;
    }
    parts.iter().all(|part| {
        part.len() == 2 && part.chars().all(|c| c.is_ascii_hexdigit())
    })
}
