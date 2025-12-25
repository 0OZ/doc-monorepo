import type { SignaturePayload, SignatureResponse } from "@/types/fhir";

// Configurable backend URL - defaults to local API
const SIGNATURE_API_URL = process.env.NEXT_PUBLIC_SIGNATURE_API_URL || "/api/signature";

/**
 * Submit a signature to the backend
 */
export async function submitSignature(payload: SignaturePayload): Promise<SignatureResponse> {
	try {
		const response = await fetch(SIGNATURE_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				success: false,
				error: errorData.error || `Server error: ${response.status}`,
			};
		}

		const data = await response.json();
		return {
			success: true,
			signatureId: data.signatureId,
			message: data.message || "Signature submitted successfully",
		};
	} catch (error) {
		console.error("Signature submission error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to submit signature",
		};
	}
}

/**
 * Create a signature payload from canvas data
 */
export function createSignaturePayload(
	documentId: string,
	signatureDataUrl: string,
	signerName?: string,
	signerRole?: SignaturePayload["signerRole"]
): SignaturePayload {
	return {
		documentId,
		signatureImage: signatureDataUrl,
		timestamp: new Date().toISOString(),
		signerName,
		signerRole,
	};
}

/**
 * Validate signature image data
 */
export function isValidSignatureData(dataUrl: string): boolean {
	if (!dataUrl) return false;

	// Check if it's a valid base64 PNG data URL
	const pngPrefix = "data:image/png;base64,";
	if (!dataUrl.startsWith(pngPrefix)) return false;

	// Check if base64 portion has reasonable length (not empty canvas)
	const base64Data = dataUrl.slice(pngPrefix.length);
	// An empty canvas typically produces ~1KB of data, signed canvas should be larger
	return base64Data.length > 2000;
}

/**
 * Convert canvas signature to optimized format
 */
export function optimizeSignatureImage(dataUrl: string, maxWidth: number = 800): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");

			if (!ctx) {
				reject(new Error("Failed to get canvas context"));
				return;
			}

			// Calculate new dimensions
			let { width, height } = img;
			if (width > maxWidth) {
				height = (height * maxWidth) / width;
				width = maxWidth;
			}

			canvas.width = width;
			canvas.height = height;

			// Draw with white background for better compression
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, width, height);
			ctx.drawImage(img, 0, 0, width, height);

			resolve(canvas.toDataURL("image/png"));
		};
		img.onerror = () => reject(new Error("Failed to load signature image"));
		img.src = dataUrl;
	});
}
