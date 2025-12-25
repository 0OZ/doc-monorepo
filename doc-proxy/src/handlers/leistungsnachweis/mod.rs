//! Leistungsnachweis domain module.
//!
//! Structure:
//! - `api` - HTTP handlers (thin, orchestration only)
//! - `service` - Business logic
//! - `request` - Request DTOs
//! - `response` - Response DTOs
//! - `error` - Domain error types

mod api;
mod error;
pub mod request;
pub mod response;
mod service;

pub use api::{get_leistungsnachweis, list_leistungsnachweise, sign_leistungsnachweis};
