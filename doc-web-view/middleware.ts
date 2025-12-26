import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function middleware(request: NextRequest) {
	// Get device key from header
	const deviceKey = request.headers.get("X-Device-Key");

	// Check if already authenticated via cookie
	const existingToken = request.cookies.get("auth_token");

	// Skip if already authenticated or no device key provided
	if (existingToken?.value || !deviceKey) {
		return NextResponse.next();
	}

	try {
		// Exchange device key for JWT token
		const response = await fetch(`${API_BASE_URL}/auth/device`, {
			method: "POST",
			headers: {
				"X-Device-Key": deviceKey,
				"Content-Type": "application/json",
			},
		});

		if (response.ok) {
			const data = await response.json();
			const { token, device, expires_in } = data;

			// Create response and set cookies
			const res = NextResponse.next();

			// Set auth token cookie (httpOnly for security)
			res.cookies.set("auth_token", token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				maxAge: expires_in,
				path: "/",
			});

			// Set user info cookie (readable by client JS)
			res.cookies.set(
				"auth_user",
				JSON.stringify({
					id: device.id,
					name: device.name,
					role: device.role,
				}),
				{
					httpOnly: false,
					secure: process.env.NODE_ENV === "production",
					sameSite: "lax",
					maxAge: expires_in,
					path: "/",
				}
			);

			return res;
		}

		// If device auth failed, continue without authentication
		// The page will redirect to login
		return NextResponse.next();
	} catch (error) {
		// On error, continue without authentication
		console.error("Device auth middleware error:", error);
		return NextResponse.next();
	}
}

export const config = {
	// Match all paths except static files, API routes, and Next.js internals
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
