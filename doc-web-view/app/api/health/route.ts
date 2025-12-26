import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/api";

export async function GET() {
	const status: {
		status: string;
		timestamp: string;
		services: {
			frontend: string;
			backend?: string;
			backendError?: string;
		};
	} = {
		status: "ok",
		timestamp: new Date().toISOString(),
		services: {
			frontend: "ok",
		},
	};

	// Check backend connectivity
	try {
		await checkHealth();
		status.services.backend = "ok";
	} catch (error) {
		status.services.backend = "error";
		status.services.backendError =
			error instanceof Error ? error.message : "Unknown error";
		status.status = "degraded";
	}

	return NextResponse.json(status, {
		status: status.status === "ok" ? 200 : 503,
	});
}
