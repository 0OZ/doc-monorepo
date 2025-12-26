// Authentication utilities
// Supports both localStorage (manual login) and cookies (device auto-auth)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export interface User {
	id: string;
	name: string;
	role: "admin" | "staff" | "client";
}

export interface LoginResponse {
	token: string;
	user: User;
	expiresIn: number;
}

export interface AuthState {
	isAuthenticated: boolean;
	user: User | null;
	token: string | null;
}

/**
 * Get a cookie value by name
 */
function getCookie(name: string): string | null {
	if (typeof document === "undefined") return null;
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) {
		return parts.pop()?.split(";").shift() ?? null;
	}
	return null;
}

/**
 * Delete a cookie by name
 */
function deleteCookie(name: string): void {
	if (typeof document === "undefined") return;
	document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

/**
 * Check if we have auth via cookie (device auth)
 */
function hasAuthCookie(): boolean {
	return getCookie(USER_KEY) !== null;
}

/**
 * Get user from cookie
 */
function getUserFromCookie(): User | null {
	const userJson = getCookie(USER_KEY);
	if (!userJson) return null;
	try {
		return JSON.parse(decodeURIComponent(userJson));
	} catch {
		return null;
	}
}

/**
 * Login with username and password
 */
export async function login(
	username: string,
	password: string
): Promise<LoginResponse> {
	const response = await fetch(`${API_BASE_URL}/auth/login`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ username, password }),
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.error || "Login failed");
	}

	const data = await response.json();

	// Store in localStorage
	if (typeof window !== "undefined") {
		localStorage.setItem(TOKEN_KEY, data.token);
		localStorage.setItem(USER_KEY, JSON.stringify(data.user));
	}

	return {
		token: data.token,
		user: data.user,
		expiresIn: data.expires_in,
	};
}

/**
 * Logout - clear stored credentials (both localStorage and cookies)
 */
export function logout(): void {
	if (typeof window !== "undefined") {
		// Clear localStorage
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(USER_KEY);
		// Clear cookies
		deleteCookie(TOKEN_KEY);
		deleteCookie(USER_KEY);
	}
}

/**
 * Get stored auth token
 * Checks localStorage first, then falls back to cookie check
 * Note: Cookie token is httpOnly, so we can only detect its presence via auth_user cookie
 */
export function getToken(): string | null {
	if (typeof window === "undefined") return null;
	// First check localStorage
	const localToken = localStorage.getItem(TOKEN_KEY);
	if (localToken) return localToken;
	// If cookie auth exists, return a placeholder (actual token is in httpOnly cookie)
	// The browser will automatically send the cookie with requests
	if (hasAuthCookie()) return "cookie-auth";
	return null;
}

/**
 * Get stored user
 * Checks localStorage first, then falls back to cookie
 */
export function getUser(): User | null {
	if (typeof window === "undefined") return null;
	// First check localStorage
	const localUserJson = localStorage.getItem(USER_KEY);
	if (localUserJson) {
		try {
			return JSON.parse(localUserJson);
		} catch {
			// Fall through to cookie check
		}
	}
	// Check cookie
	return getUserFromCookie();
}

/**
 * Check if user is authenticated (via localStorage or cookie)
 */
export function isAuthenticated(): boolean {
	if (typeof window === "undefined") return false;
	return !!localStorage.getItem(TOKEN_KEY) || hasAuthCookie();
}

/**
 * Check if auth is from device cookie (vs manual login)
 */
export function isDeviceAuth(): boolean {
	if (typeof window === "undefined") return false;
	return !localStorage.getItem(TOKEN_KEY) && hasAuthCookie();
}

/**
 * Get current auth state
 */
export function getAuthState(): AuthState {
	const token = getToken();
	const user = getUser();
	return {
		isAuthenticated: !!token,
		user,
		token,
	};
}

/**
 * Refresh the auth token
 */
export async function refreshToken(): Promise<LoginResponse | null> {
	const token = getToken();
	if (!token) return null;

	try {
		const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			logout();
			return null;
		}

		const data = await response.json();

		if (typeof window !== "undefined") {
			localStorage.setItem(TOKEN_KEY, data.token);
			localStorage.setItem(USER_KEY, JSON.stringify(data.user));
		}

		return {
			token: data.token,
			user: data.user,
			expiresIn: data.expires_in,
		};
	} catch {
		logout();
		return null;
	}
}

/**
 * Get authorization header for API requests
 */
export function getAuthHeader(): Record<string, string> {
	const token = getToken();
	if (!token) return {};
	return { Authorization: `Bearer ${token}` };
}
