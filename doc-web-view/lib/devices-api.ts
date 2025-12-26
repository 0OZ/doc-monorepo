// Device management API client

import { getAuthHeader } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface Device {
	id: string;
	mac_address: string;
	name: string;
	user_id: string | null;
	role: string;
	is_active: boolean;
	last_seen: string | null;
	created_at: string;
}

export interface DeviceCreated extends Device {
	api_key: string; // Only returned on creation!
}

export interface CreateDeviceRequest {
	mac_address: string;
	name: string;
	role?: string;
	user_id?: string;
}

class DeviceApiError extends Error {
	constructor(
		message: string,
		public status: number
	) {
		super(message);
		this.name = "DeviceApiError";
	}
}

async function handleResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: "Unknown error" }));
		throw new DeviceApiError(error.error || response.statusText, response.status);
	}
	return response.json();
}

function getHeaders(): HeadersInit {
	return {
		"Content-Type": "application/json",
		...getAuthHeader(),
	};
}

/**
 * List all devices (admin only)
 */
export async function listDevices(): Promise<Device[]> {
	const response = await fetch(`${API_BASE_URL}/devices`, {
		headers: getHeaders(),
		credentials: "include",
	});
	return handleResponse(response);
}

/**
 * Get device by ID (admin only)
 */
export async function getDevice(id: string): Promise<Device> {
	const response = await fetch(`${API_BASE_URL}/devices/${id}`, {
		headers: getHeaders(),
		credentials: "include",
	});
	return handleResponse(response);
}

/**
 * Register a new device (admin only)
 * Returns the API key - shown only once!
 */
export async function registerDevice(request: CreateDeviceRequest): Promise<DeviceCreated> {
	const response = await fetch(`${API_BASE_URL}/devices`, {
		method: "POST",
		headers: getHeaders(),
		credentials: "include",
		body: JSON.stringify(request),
	});
	return handleResponse(response);
}

/**
 * Deactivate a device (admin only)
 */
export async function deactivateDevice(id: string): Promise<Device> {
	const response = await fetch(`${API_BASE_URL}/devices/${id}/deactivate`, {
		method: "POST",
		headers: getHeaders(),
		credentials: "include",
	});
	return handleResponse(response);
}

/**
 * Activate a device (admin only)
 */
export async function activateDevice(id: string): Promise<Device> {
	const response = await fetch(`${API_BASE_URL}/devices/${id}/activate`, {
		method: "POST",
		headers: getHeaders(),
		credentials: "include",
	});
	return handleResponse(response);
}

/**
 * Regenerate API key for a device (admin only)
 * Returns the new API key - shown only once!
 */
export async function regenerateDeviceKey(id: string): Promise<DeviceCreated> {
	const response = await fetch(`${API_BASE_URL}/devices/${id}/regenerate-key`, {
		method: "POST",
		headers: getHeaders(),
		credentials: "include",
	});
	return handleResponse(response);
}

/**
 * Delete a device (admin only)
 */
export async function deleteDevice(id: string): Promise<void> {
	const response = await fetch(`${API_BASE_URL}/devices/${id}`, {
		method: "DELETE",
		headers: getHeaders(),
		credentials: "include",
	});
	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: "Unknown error" }));
		throw new DeviceApiError(error.error || response.statusText, response.status);
	}
}

/**
 * Format MAC address to uppercase with colons
 */
export function formatMacAddress(mac: string): string {
	// Remove any existing separators and convert to uppercase
	const clean = mac.replace(/[:-]/g, "").toUpperCase();
	// Insert colons every 2 characters
	return clean.match(/.{1,2}/g)?.join(":") || mac;
}

/**
 * Validate MAC address format
 */
export function isValidMacAddress(mac: string): boolean {
	const formatted = formatMacAddress(mac);
	return /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(formatted);
}

export { DeviceApiError };
