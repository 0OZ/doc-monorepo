import { type NextRequest, NextResponse } from "next/server";
import type { SignaturePayload, SignatureResponse } from "@/types/fhir";

export async function POST(request: NextRequest): Promise<NextResponse<SignatureResponse>> {
	try {
		const payload: SignaturePayload = await request.json();

		// Validate required fields
		if (!payload.documentId) {
			return NextResponse.json(
				{ success: false, error: "Document ID is required" },
				{ status: 400 }
			);
		}

		if (!payload.signatureImage) {
			return NextResponse.json(
				{ success: false, error: "Signature image is required" },
				{ status: 400 }
			);
		}

		// Validate signature image format
		if (!payload.signatureImage.startsWith("data:image/png;base64,")) {
			return NextResponse.json(
				{ success: false, error: "Invalid signature image format" },
				{ status: 400 }
			);
		}

		// Placeholder: In production, this would:
		// 1. Store the signature in a database
		// 2. Associate it with the document
		// 3. Create an audit trail
		// 4. Potentially trigger downstream workflows

		console.log("Signature received:", {
			documentId: payload.documentId,
			timestamp: payload.timestamp,
			signerName: payload.signerName,
			signerRole: payload.signerRole,
			signatureSize: payload.signatureImage.length,
		});

		// Generate a mock signature ID
		const signatureId = `sig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		return NextResponse.json({
			success: true,
			signatureId,
			message: "Signature submitted successfully",
		});
	} catch (error) {
		console.error("Signature API error:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Internal server error",
			},
			{ status: 500 }
		);
	}
}

// Health check
export async function GET(): Promise<NextResponse> {
	return NextResponse.json({
		status: "ok",
		endpoint: "/api/signature",
		methods: ["POST"],
	});
}
