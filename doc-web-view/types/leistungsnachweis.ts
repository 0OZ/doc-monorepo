// Types matching doc-proxy backend API responses

// ============================================================================
// List Response Types
// ============================================================================

export type DocumentStatus = "draft" | "pending_signature" | "signed" | "finalized";

export interface LeistungsnachweisListItem {
  id: string;
  clientId: string;
  clientName: string;
  billingMonth: string;
  providerIk: string;
  totalServices: number;
  hasSignature: boolean;
  status: DocumentStatus;
}

// ============================================================================
// Detail Response Types
// ============================================================================

export interface ClientInfo {
  versichertennummer: string;
  name: string;
  vorname: string;
}

export interface ProviderInfo {
  ik: string;
  responsibleStaffId: string;
}

export interface ServiceResponse {
  code: string;
  description: string;
  quantity?: string;
  durationMinutes?: number;
  staffIds: string[];
}

export interface DeploymentResponse {
  sequenceNumber: number;
  startTime: string;
  displayStartTime: string;
  services: ServiceResponse[];
}

export interface ServiceDayResponse {
  date: string;
  displayDate: string;
  deployments: DeploymentResponse[];
}

export interface SignatureInfo {
  signatureType: SignatureType;
  timestamp?: string;
  hasFile: boolean;
  fileType?: ImageFormat;
  missingReason?: MissingSignatureReason;
  missingExplanation?: string;
}

export interface LeistungsnachweisDetail {
  id: string;
  client: ClientInfo;
  provider: ProviderInfo;
  billingMonth: string;
  serviceDays: ServiceDayResponse[];
  signature?: SignatureInfo;
  status: DocumentStatus;
}

// ============================================================================
// Signature Request Types
// ============================================================================

export type SignatureType =
  | "handwritten_digital"
  | "handwritten_paper"
  | "photo_confirmation"
  | "alternative_confirmation"
  | "missing";

export type ImageFormat = "png" | "jpeg" | "svg" | "gif" | "tiff" | "pdf";

export type MissingSignatureReason =
  | "unable_to_sign"
  | "refused"
  | "not_present"
  | "other";

export interface SignatureData {
  data: string; // base64 without prefix
  format: ImageFormat;
  width?: number;
  height?: number;
}

export interface SignLeistungsnachweisRequest {
  signatureType: SignatureType;
  signature?: SignatureData;
  missingReason?: MissingSignatureReason;
  missingExplanation?: string;
}

export interface SignedDocumentResponse {
  id: string;
  status: DocumentStatus;
  signedAt?: string;
  documentUrl?: string;
  message?: string;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PageResult<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ============================================================================
// Frontend State Types
// ============================================================================

export interface LeistungsnachweisWithStatus {
  document: LeistungsnachweisDetail;
  signed: boolean;
  signatureId?: string;
  signedAt?: string;
}

export interface MultiLeistungsnachweisState {
  documents: LeistungsnachweisWithStatus[];
  currentIndex: number;
  allSigned: boolean;
}
