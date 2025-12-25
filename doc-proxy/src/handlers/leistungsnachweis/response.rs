//! Response DTOs for Leistungsnachweis API.

use serde::{Deserialize, Serialize};

use super::request::{ImageFormat, MissingSignatureReason, SignatureType};

/// Summary response for list view
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LeistungsnachweisListItem {
    pub id: String,
    pub client_id: String,
    pub client_name: String,
    pub billing_month: String,
    pub provider_ik: String,
    pub total_services: usize,
    pub has_signature: bool,
    pub status: DocumentStatus,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DocumentStatus {
    Draft,
    PendingSignature,
    Signed,
    Finalized,
}

/// Detailed response for single document view
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LeistungsnachweisDetail {
    pub id: String,
    /// Client information
    pub client: ClientInfo,
    /// Provider information
    pub provider: ProviderInfo,
    /// Billing month (YYYYMM format)
    pub billing_month: String,
    /// All service days with their services
    pub service_days: Vec<ServiceDayResponse>,
    /// Signature information (if present)
    pub signature: Option<SignatureInfo>,
    /// Document status
    pub status: DocumentStatus,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientInfo {
    pub versichertennummer: String,
    pub name: String,
    pub vorname: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderInfo {
    pub ik: String,
    pub responsible_staff_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceDayResponse {
    /// Date in YYYYMMDD format
    pub date: String,
    /// Formatted date for display (e.g., "2024-01-15")
    pub display_date: String,
    /// All deployments on this day
    pub deployments: Vec<DeploymentResponse>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeploymentResponse {
    pub sequence_number: u8,
    /// Start time in HHMM format
    pub start_time: String,
    /// Formatted start time (e.g., "08:30")
    pub display_start_time: String,
    /// Individual services in this deployment
    pub services: Vec<ServiceResponse>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceResponse {
    pub code: String,
    pub description: String,
    pub quantity: Option<String>,
    pub duration_minutes: Option<u16>,
    pub staff_ids: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SignatureInfo {
    pub signature_type: SignatureType,
    pub timestamp: Option<String>,
    pub has_file: bool,
    pub file_type: Option<ImageFormat>,
    pub missing_reason: Option<MissingSignatureReason>,
    pub missing_explanation: Option<String>,
}

/// Response after local XML generation
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SignedLeistungsnachweisResponse {
    pub id: String,
    pub status: DocumentStatus,
    /// The final XML document as a string
    pub xml_content: String,
    /// Base64-encoded XML for download
    pub xml_base64: String,
}

/// Response from core server after signing
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SignedDocumentResponse {
    pub id: String,
    pub status: DocumentStatus,
    /// Timestamp when the signature was applied
    pub signed_at: Option<String>,
    /// URL to download the signed document (if available)
    pub document_url: Option<String>,
    /// Message from the server
    pub message: Option<String>,
}

// ============================================================================
// CRUD Response Types
// ============================================================================

/// Response after creating a new Leistungsnachweis
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateResponse {
    /// ID of the created document
    pub id: String,
    /// Initial status of the document
    pub status: DocumentStatus,
}

// ============================================================================
// Status Management Response Types
// ============================================================================

/// Response after a status change operation
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StatusChangeResponse {
    /// Document ID
    pub id: String,
    /// Previous status before the change
    pub previous_status: DocumentStatus,
    /// New status after the change
    pub new_status: DocumentStatus,
    /// Timestamp when the status was changed
    pub changed_at: String,
}

// ============================================================================
// Batch Operations Response Types
// ============================================================================

/// Response from batch sign operation
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchSignResponse {
    /// Results for each document
    pub results: Vec<BatchSignResult>,
    /// Number of successfully signed documents
    pub success_count: usize,
    /// Number of failed signing attempts
    pub failure_count: usize,
}

/// Result for a single document in batch sign
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchSignResult {
    /// Document ID
    pub id: String,
    /// Whether the signing was successful
    pub success: bool,
    /// Error message if signing failed
    pub error: Option<String>,
}

// ============================================================================
// Export Response Types
// ============================================================================

/// Response from batch export operation
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchExportResponse {
    /// URL to download the exported files
    pub download_url: String,
    /// When the download URL expires
    pub expires_at: String,
    /// Number of files included in the export
    pub file_count: usize,
}
