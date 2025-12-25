use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set,
};
use uuid::Uuid;

use super::entity::user::{self, Entity as User};
use crate::models::user::{CreateUserRequest, UpdateUserRequest, UserResponse};

pub async fn find_all(db: &DatabaseConnection) -> Result<Vec<UserResponse>, sea_orm::DbErr> {
    let users = User::find().all(db).await?;

    Ok(users
        .into_iter()
        .map(|u| UserResponse {
            id: u.id,
            name: u.name,
            email: u.email,
        })
        .collect())
}

pub async fn find_by_id(
    db: &DatabaseConnection,
    id: Uuid,
) -> Result<Option<UserResponse>, sea_orm::DbErr> {
    let user = User::find()
        .filter(user::Column::Id.eq(id))
        .one(db)
        .await?;

    Ok(user.map(|u| UserResponse {
        id: u.id,
        name: u.name,
        email: u.email,
    }))
}

pub async fn create(
    db: &DatabaseConnection,
    payload: CreateUserRequest,
) -> Result<UserResponse, sea_orm::DbErr> {
    let new_user = user::ActiveModel {
        id: Set(Uuid::new_v4()),
        name: Set(payload.name),
        email: Set(payload.email),
    };

    let user = new_user.insert(db).await?;

    Ok(UserResponse {
        id: user.id,
        name: user.name,
        email: user.email,
    })
}

pub async fn update(
    db: &DatabaseConnection,
    id: Uuid,
    payload: UpdateUserRequest,
) -> Result<Option<UserResponse>, sea_orm::DbErr> {
    let user = User::find()
        .filter(user::Column::Id.eq(id))
        .one(db)
        .await?;

    let Some(user) = user else {
        return Ok(None);
    };

    let mut active_model: user::ActiveModel = user.into();

    if let Some(name) = payload.name {
        active_model.name = Set(name);
    }
    if let Some(email) = payload.email {
        active_model.email = Set(email);
    }

    let updated = active_model.update(db).await?;

    Ok(Some(UserResponse {
        id: updated.id,
        name: updated.name,
        email: updated.email,
    }))
}

pub async fn delete(db: &DatabaseConnection, id: Uuid) -> Result<(), sea_orm::DbErr> {
    User::delete_by_id(id).exec(db).await?;
    Ok(())
}
