// API client for doc-proxy backend
// Supports both localStorage token auth and httpOnly cookie auth (device auto-auth)

import type {
    LeistungsnachweisDetail,
    LeistungsnachweisListItem,
    PageResult,
    SignedDocumentResponse,
    SignLeistungsnachweisRequest,
} from "@/types/leistungsnachweis";
import { getAuthHeader, logout } from "./auth";

// API base URL - configurable via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class ApiError extends Error {
	constructor(
		message: string,
		public status: number,
		public statusText: string,
	) {
		super(message);
		this.name = "ApiError";
	}
}

async function handleResponse<T>(response: Response): Promise<T> {
	if (response.status === 401) {
		// Unauthorized - clear auth and redirect to login
		logout();
		if (typeof window !== "undefined") {
			window.location.href = "/login";
		}
		throw new ApiError("Unauthorized", 401, "Unauthorized");
	}

	if (!response.ok) {
		const errorText = await response.text().catch(() => "Unknown error");
		throw new ApiError(errorText, response.status, response.statusText);
	}
	return response.json();
}

/**
 * Get headers with auth token (for localStorage-based auth)
 */
function getHeaders(additionalHeaders?: Record<string, string>): HeadersInit {
	return {
		Accept: "application/json",
		...getAuthHeader(),
		...additionalHeaders,
	};
}

/**
 * Get fetch options with credentials for cookie-based auth
 */
function getFetchOptions(options: RequestInit = {}): RequestInit {
	// Always include credentials to send httpOnly cookies
	return {
		...options,
		credentials: "include" as RequestCredentials,
	};
}

/**
 * Fetch list of Leistungsnachweise for a client
 */
export async function fetchLeistungsnachweise(
	clientId: string,
	page = 0,
	size = 20,
): Promise<PageResult<LeistungsnachweisListItem>> {
	const url = `${API_BASE_URL}/leistungsnachweise?clientId=${encodeURIComponent(clientId)}&page=${page}&size=${size}`;

	const response = await fetch(
		url,
		getFetchOptions({
			headers: getHeaders(),
		}),
	);

	return handleResponse(response);
}

/**
 * Fetch a single Leistungsnachweis by ID
 */
export async function fetchLeistungsnachweis(
	id: string,
): Promise<LeistungsnachweisDetail> {
	const url = `${API_BASE_URL}/leistungsnachweise/${encodeURIComponent(id)}`;

	const response = await fetch(
		url,
		getFetchOptions({
			headers: getHeaders(),
		}),
	);

	return handleResponse(response);
}

/**
 * Sign a Leistungsnachweis
 *
 * @param id - Document ID
 * @param request - Signature request with type and data
 * @param generateXml - If true, generates XSD-compliant XML locally
 */
export async function signLeistungsnachweis(
	id: string,
	request: SignLeistungsnachweisRequest,
	generateXml = false,
): Promise<SignedDocumentResponse> {
	const url = `${API_BASE_URL}/leistungsnachweise/${encodeURIComponent(id)}/sign?generateXml=${generateXml}`;

	const response = await fetch(
		url,
		getFetchOptions({
			method: "POST",
			headers: getHeaders({ "Content-Type": "application/json" }),
			body: JSON.stringify(request),
		}),
	);

	return handleResponse(response);
}

/**
 * Check backend health
 */
export async function checkHealth(): Promise<{ status: string }> {
	const response = await fetch(`${API_BASE_URL}/health`);
	return handleResponse(response);
}

/**
 * Convert base64 data URL to raw base64 and format
 */
export function parseSignatureDataUrl(dataUrl: string): {
	data: string;
	format: "png" | "jpeg";
} {
	const match = dataUrl.match(/^data:image\/(png|jpeg);base64,(.+)$/);
	if (!match) {
		throw new Error("Invalid signature data URL format");
	}
	return {
		format: match[1] as "png" | "jpeg",
		data: match[2],
	};
}

/**
 * Create a sign request from a signature canvas data URL
 */
export function createSignRequest(
	signatureDataUrl: string,
): SignLeistungsnachweisRequest {
	const { data, format } = parseSignatureDataUrl(signatureDataUrl);

	return {
		signatureType: "handwritten_digital",
		signature: {
			data,
			format,
		},
	};
}

export { ApiError };
