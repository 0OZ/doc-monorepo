"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export default function DeviceAuthPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const mac = searchParams.get("mac");
		const key = searchParams.get("key");

		if (!mac || !key) {
			setStatus("error");
			setError("Missing mac or key parameter. Use ?mac=AA:BB:CC:DD:EE:FF&key=YOUR_API_KEY");
			return;
		}

		// Authenticate with the device key
		async function authenticate() {
			try {
				const response = await fetch(`${API_BASE_URL}/auth/device`, {
					method: "POST",
					headers: {
						"X-Device-Key": key!,
						"Content-Type": "application/json",
					},
				});

				if (!response.ok) {
					const data = await response.json().catch(() => ({}));
					throw new Error(data.error || `Authentication failed (${response.status})`);
				}

				const data = await response.json();

				// Save to localStorage
				localStorage.setItem(TOKEN_KEY, data.token);
				localStorage.setItem(USER_KEY, JSON.stringify({
					id: data.device.id,
					name: data.device.name,
					role: data.device.role,
				}));

				setStatus("success");

				// Redirect to home after short delay
				setTimeout(() => {
					router.push("/");
				}, 1500);
			} catch (err) {
				setStatus("error");
				setError(err instanceof Error ? err.message : "Authentication failed");
			}
		}

		authenticate();
	}, [searchParams, router]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<div className="max-w-md w-full mx-4 p-6 rounded-xl border bg-card shadow-lg">
				{status === "loading" && (
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
						<h2 className="text-lg font-semibold">Gerät wird authentifiziert...</h2>
						<p className="text-sm text-muted-foreground mt-2">
							Bitte warten...
						</p>
					</div>
				)}

				{status === "success" && (
					<div className="text-center">
						<div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
							<svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<h2 className="text-lg font-semibold text-green-600 dark:text-green-400">
							Erfolgreich angemeldet!
						</h2>
						<p className="text-sm text-muted-foreground mt-2">
							Weiterleitung...
						</p>
					</div>
				)}

				{status === "error" && (
					<div className="text-center">
						<div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
							<svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</div>
						<h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
							Authentifizierung fehlgeschlagen
						</h2>
						<p className="text-sm text-muted-foreground mt-2">
							{error}
						</p>
						<button
							onClick={() => router.push("/login")}
							className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
						>
							Zur Anmeldung
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
