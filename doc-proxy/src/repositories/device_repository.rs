use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use uuid::Uuid;

use super::entity::device::{self, Entity as Device};

/// Device response for API
#[derive(Debug, Clone, serde::Serialize)]
pub struct DeviceResponse {
    pub id: Uuid,
    pub mac_address: String,
    pub name: String,
    pub user_id: Option<Uuid>,
    pub role: String,
    pub is_active: bool,
    pub last_seen: Option<chrono::DateTime<Utc>>,
    pub created_at: chrono::DateTime<Utc>,
}

/// Response when creating a device (includes plaintext API key)
#[derive(Debug, Clone, serde::Serialize)]
pub struct DeviceCreatedResponse {
    pub id: Uuid,
    pub mac_address: String,
    pub name: String,
    pub role: String,
    pub api_key: String, // Plaintext - only shown once!
    pub created_at: chrono::DateTime<Utc>,
}

/// Request to create a device
#[derive(Debug, Clone, serde::Deserialize)]
pub struct CreateDeviceRequest {
    pub mac_address: String,
    pub name: String,
    pub role: Option<String>,
    pub user_id: Option<Uuid>,
}

impl From<device::Model> for DeviceResponse {
    fn from(d: device::Model) -> Self {
        Self {
            id: d.id,
            mac_address: d.mac_address,
            name: d.name,
            user_id: d.user_id,
            role: d.role,
            is_active: d.is_active,
            last_seen: d.last_seen,
            created_at: d.created_at,
        }
    }
}

/// Generate a new API key in format: dk_{short_uuid}_{random}
fn generate_api_key() -> String {
    let uuid_part = Uuid::new_v4().to_string()[..8].to_string();
    let random_part: String = (0..8)
        .map(|_| {
            let idx = rand::random::<usize>() % 36;
            if idx < 10 {
                (b'0' + idx as u8) as char
            } else {
                (b'a' + (idx - 10) as u8) as char
            }
        })
        .collect();
    format!("dk_{}_{}", uuid_part, random_part)
}

/// Hash an API key using Argon2
fn hash_api_key(api_key: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hash = argon2.hash_password(api_key.as_bytes(), &salt)?;
    Ok(hash.to_string())
}

/// Verify an API key against a hash
fn verify_api_key(api_key: &str, hash: &str) -> bool {
    let Ok(parsed_hash) = PasswordHash::new(hash) else {
        return false;
    };
    Argon2::default()
        .verify_password(api_key.as_bytes(), &parsed_hash)
        .is_ok()
}

/// Find all devices
pub async fn find_all(db: &DatabaseConnection) -> Result<Vec<DeviceResponse>, sea_orm::DbErr> {
    let devices = Device::find().all(db).await?;
    Ok(devices.into_iter().map(DeviceResponse::from).collect())
}

/// Find device by ID
pub async fn find_by_id(
    db: &DatabaseConnection,
    id: Uuid,
) -> Result<Option<DeviceResponse>, sea_orm::DbErr> {
    let device = Device::find()
        .filter(device::Column::Id.eq(id))
        .one(db)
        .await?;
    Ok(device.map(DeviceResponse::from))
}

/// Find device by MAC address
pub async fn find_by_mac(
    db: &DatabaseConnection,
    mac_address: &str,
) -> Result<Option<DeviceResponse>, sea_orm::DbErr> {
    let device = Device::find()
        .filter(device::Column::MacAddress.eq(mac_address.to_uppercase()))
        .one(db)
        .await?;
    Ok(device.map(DeviceResponse::from))
}

/// Validate API key and return device if valid
pub async fn find_by_api_key(
    db: &DatabaseConnection,
    api_key: &str,
) -> Result<Option<DeviceResponse>, sea_orm::DbErr> {
    // We need to check all active devices since we can't query by hash directly
    let devices = Device::find()
        .filter(device::Column::IsActive.eq(true))
        .all(db)
        .await?;

    for device in devices {
        if verify_api_key(api_key, &device.api_key_hash) {
            return Ok(Some(DeviceResponse::from(device)));
        }
    }

    Ok(None)
}

/// Create a new device - returns the plaintext API key (only shown once!)
pub async fn create(
    db: &DatabaseConnection,
    payload: CreateDeviceRequest,
) -> Result<DeviceCreatedResponse, DeviceError> {
    let api_key = generate_api_key();
    let api_key_hash = hash_api_key(&api_key).map_err(|_| DeviceError::HashingFailed)?;

    let new_device = device::ActiveModel {
        id: Set(Uuid::new_v4()),
        mac_address: Set(payload.mac_address.to_uppercase()),
        api_key_hash: Set(api_key_hash),
        name: Set(payload.name),
        user_id: Set(payload.user_id),
        role: Set(payload.role.unwrap_or_else(|| "client".to_string())),
        is_active: Set(true),
        last_seen: Set(None),
        created_at: Set(Utc::now()),
    };

    let device = new_device
        .insert(db)
        .await
        .map_err(DeviceError::Database)?;

    Ok(DeviceCreatedResponse {
        id: device.id,
        mac_address: device.mac_address,
        name: device.name,
        role: device.role,
        api_key, // Return plaintext key
        created_at: device.created_at,
    })
}

/// Update last_seen timestamp
pub async fn update_last_seen(
    db: &DatabaseConnection,
    id: Uuid,
) -> Result<(), sea_orm::DbErr> {
    let device = Device::find()
        .filter(device::Column::Id.eq(id))
        .one(db)
        .await?;

    if let Some(device) = device {
        let mut active_model: device::ActiveModel = device.into();
        active_model.last_seen = Set(Some(Utc::now()));
        active_model.update(db).await?;
    }

    Ok(())
}

/// Deactivate a device
pub async fn deactivate(
    db: &DatabaseConnection,
    id: Uuid,
) -> Result<Option<DeviceResponse>, sea_orm::DbErr> {
    let device = Device::find()
        .filter(device::Column::Id.eq(id))
        .one(db)
        .await?;

    let Some(device) = device else {
        return Ok(None);
    };

    let mut active_model: device::ActiveModel = device.into();
    active_model.is_active = Set(false);
    let updated = active_model.update(db).await?;

    Ok(Some(DeviceResponse::from(updated)))
}

/// Reactivate a device
pub async fn activate(
    db: &DatabaseConnection,
    id: Uuid,
) -> Result<Option<DeviceResponse>, sea_orm::DbErr> {
    let device = Device::find()
        .filter(device::Column::Id.eq(id))
        .one(db)
        .await?;

    let Some(device) = device else {
        return Ok(None);
    };

    let mut active_model: device::ActiveModel = device.into();
    active_model.is_active = Set(true);
    let updated = active_model.update(db).await?;

    Ok(Some(DeviceResponse::from(updated)))
}

/// Regenerate API key for a device
pub async fn regenerate_api_key(
    db: &DatabaseConnection,
    id: Uuid,
) -> Result<Option<DeviceCreatedResponse>, DeviceError> {
    let device = Device::find()
        .filter(device::Column::Id.eq(id))
        .one(db)
        .await
        .map_err(DeviceError::Database)?;

    let Some(device) = device else {
        return Ok(None);
    };

    let api_key = generate_api_key();
    let api_key_hash = hash_api_key(&api_key).map_err(|_| DeviceError::HashingFailed)?;

    let mut active_model: device::ActiveModel = device.into();
    active_model.api_key_hash = Set(api_key_hash);
    let updated = active_model
        .update(db)
        .await
        .map_err(DeviceError::Database)?;

    Ok(Some(DeviceCreatedResponse {
        id: updated.id,
        mac_address: updated.mac_address,
        name: updated.name,
        role: updated.role,
        api_key,
        created_at: updated.created_at,
    }))
}

/// Delete a device
pub async fn delete(db: &DatabaseConnection, id: Uuid) -> Result<(), sea_orm::DbErr> {
    Device::delete_by_id(id).exec(db).await?;
    Ok(())
}

#[derive(Debug, thiserror::Error)]
pub enum DeviceError {
    #[error("Database error: {0}")]
    Database(#[from] sea_orm::DbErr),
    #[error("Failed to hash API key")]
    HashingFailed,
}
