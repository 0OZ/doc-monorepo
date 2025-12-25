//! Request DTOs for Leistungsnachweis API.

use serde::{Deserialize, Serialize};

/// Query parameters for listing Leistungsnachweise
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListLeistungsnachweiseQuery {
    /// Client ID (Versichertennummer) - required
    pub client_id: String,
    /// Page number (0-indexed), defaults to 0
    #[serde(default)]
    pub page: u64,
    /// Page size, defaults to 20
    #[serde(default = "default_page_size")]
    pub size: u64,
}

fn default_page_size() -> u64 {
    20
}

/// Query parameters for signing endpoint
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SignQueryParams {
    /// If true, generate XSD-compliant XML locally and return it
    /// If false, forward signature to core server
    /// Default: false (proxy to core)
    #[serde(default)]
    pub generate_xml: bool,
}

/// Request body for signing a Leistungsnachweis
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SignLeistungsnachweisRequest {
    /// Art der Unterschrift (1-5)
    pub signature_type: SignatureType,

    /// Signature image data (required for types 1-4)
    pub signature: Option<SignatureData>,

    /// Reason for missing signature (required for type 5)
    pub missing_reason: Option<MissingSignatureReason>,

    /// Explanation for missing signature (required when reason is "other")
    pub missing_explanation: Option<String>,
}

/// Signature image data from canvas or file upload
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SignatureData {
    /// Base64-encoded image data (without data:image/xxx;base64, prefix)
    pub data: String,

    /// Image format
    pub format: ImageFormat,

    /// Optional: width in pixels (for canvas signatures)
    pub width: Option<u32>,

    /// Optional: height in pixels (for canvas signatures)
    pub height: Option<u32>,
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SignatureType {
    /// 1 = Handwritten signature, digitally captured (canvas/tablet)
    HandwrittenDigital,
    /// 2 = Handwritten signature on paper (scanned/photo)
    HandwrittenPaper,
    /// 3 = Photo confirmation
    PhotoConfirmation,
    /// 4 = Alternative confirmation
    AlternativeConfirmation,
    /// 5 = Signature missing
    Missing,
}

/// Supported image formats for signature
#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ImageFormat {
    /// PNG - recommended for canvas signatures (lossless, supports transparency)
    Png,
    /// JPEG - for photos or scanned documents
    Jpeg,
    /// SVG - vector format for high-quality signatures
    Svg,
    /// GIF - legacy support
    Gif,
    /// TIFF - for high-quality scans
    Tiff,
    /// PDF - for scanned documents
    Pdf,
}

impl ImageFormat {
    /// Convert to XSD Dateityp code (1-5)
    pub fn to_dateityp_code(&self) -> u8 {
        match self {
            ImageFormat::Pdf => 1,
            ImageFormat::Jpeg => 2,
            ImageFormat::Png => 3,
            ImageFormat::Gif => 4,
            ImageFormat::Tiff => 5,
            // SVG gets converted to PNG before XML generation
            ImageFormat::Svg => 3,
        }
    }

    /// MIME type for the format
    pub fn mime_type(&self) -> &'static str {
        match self {
            ImageFormat::Png => "image/png",
            ImageFormat::Jpeg => "image/jpeg",
            ImageFormat::Svg => "image/svg+xml",
            ImageFormat::Gif => "image/gif",
            ImageFormat::Tiff => "image/tiff",
            ImageFormat::Pdf => "application/pdf",
        }
    }
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MissingSignatureReason {
    /// Insured person is unable to sign
    UnableToSign,
    /// Insured person refuses to sign
    Refused,
    /// Insured person is not present
    NotPresent,
    /// Other reason (requires explanation)
    Other,
}

// Legacy type alias for backwards compatibility
pub type FileType = ImageFormat;

// ============================================================================
// CRUD Request Types
// ============================================================================

/// Request body for creating a new Leistungsnachweis
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateLeistungsnachweisRequest {
    /// Client ID (Versichertennummer)
    pub client_id: String,
    /// Billing month in YYYY-MM format
    pub billing_month: String,
    /// Service days with services
    #[serde(default)]
    pub service_days: Vec<ServiceDayInput>,
}

/// Request body for updating a Leistungsnachweis
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateLeistungsnachweisRequest {
    /// Billing month in YYYY-MM format (optional)
    pub billing_month: Option<String>,
    /// Service days with services (optional)
    pub service_days: Option<Vec<ServiceDayInput>>,
}

/// Input for a service day
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceDayInput {
    /// Date in ISO format (YYYY-MM-DD)
    pub date: String,
    /// Services provided on this day
    pub services: Vec<ServiceInput>,
}

/// Input for a single service
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceInput {
    /// Service code/identifier
    pub code: String,
    /// Duration in minutes
    pub duration_minutes: Option<u32>,
    /// Notes or description
    pub notes: Option<String>,
}

// ============================================================================
// Status Management Request Types
// ============================================================================

/// Request body for rejecting a Leistungsnachweis
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RejectRequest {
    /// Reason for rejection (required)
    pub reason: String,
}

/// Request body for canceling a Leistungsnachweis
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CancelRequest {
    /// Reason for cancellation (optional)
    pub reason: Option<String>,
}

// ============================================================================
// Batch Operations Request Types
// ============================================================================

/// Request body for batch signing multiple Leistungsnachweise
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchSignRequest {
    /// Documents to sign
    pub documents: Vec<BatchSignItem>,
}

/// Single item in a batch sign request
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchSignItem {
    /// Document ID
    pub id: String,
    /// Signature type
    pub signature_type: SignatureType,
    /// Signature data (required for types 1-4)
    pub signature: Option<SignatureData>,
    /// Reason for missing signature (required for type 5)
    pub missing_reason: Option<MissingSignatureReason>,
    /// Explanation for missing signature
    pub missing_explanation: Option<String>,
}

// ============================================================================
// Export Request Types
// ============================================================================

/// Request body for batch export
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchExportRequest {
    /// Document IDs to export
    pub ids: Vec<String>,
    /// Export format
    pub format: ExportFormat,
}

/// Supported export formats
#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ExportFormat {
    /// PDF format
    Pdf,
    /// XML format
    Xml,
    /// ZIP archive containing all documents
    Zip,
}
