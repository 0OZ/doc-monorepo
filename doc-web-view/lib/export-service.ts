/**
 * Export service - sends export requests to backend API
 */

const EXPORT_API_URL =
	process.env.NEXT_PUBLIC_EXPORT_API_URL || "/api/export";

export type ExportFormat = "pdf" | "xml";

export interface ExportRequest {
	documentId: string;
	format: ExportFormat;
}

export interface BatchExportRequest {
	documentIds: string[];
	format: ExportFormat;
}

export interface ExportResponse {
	success: boolean;
	downloadUrl?: string;
	expiresAt?: string;
	error?: string;
}

/**
 * Export a single document to PDF or XML via backend
 */
export async function exportDocument(
	documentId: string,
	format: ExportFormat,
): Promise<ExportResponse> {
	try {
		const response = await fetch(`${EXPORT_API_URL}/${documentId}/${format}`, {
			method: "GET",
			headers: {
				Accept: format === "pdf" ? "application/pdf" : "application/xml",
			},
		});

		if (!response.ok) {
			return {
				success: false,
				error: `Export fehlgeschlagen: ${response.statusText}`,
			};
		}

		// If the backend returns a download URL
		const contentType = response.headers.get("content-type");
		if (contentType?.includes("application/json")) {
			const data = await response.json();
			return {
				success: true,
				downloadUrl: data.downloadUrl,
				expiresAt: data.expiresAt,
			};
		}

		// If the backend returns the file directly, create a blob URL
		const blob = await response.blob();
		const downloadUrl = URL.createObjectURL(blob);

		return {
			success: true,
			downloadUrl,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Export konnte nicht durchgeführt werden",
		};
	}
}

/**
 * Export multiple documents as a batch via backend
 */
export async function exportBatch(
	documentIds: string[],
	format: ExportFormat,
): Promise<ExportResponse> {
	try {
		const response = await fetch(`${EXPORT_API_URL}/batch`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				ids: documentIds,
				format,
			} satisfies { ids: string[]; format: ExportFormat }),
		});

		if (!response.ok) {
			return {
				success: false,
				error: `Batch-Export fehlgeschlagen: ${response.statusText}`,
			};
		}

		const data = await response.json();
		return {
			success: true,
			downloadUrl: data.downloadUrl,
			expiresAt: data.expiresAt,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Batch-Export konnte nicht durchgeführt werden",
		};
	}
}

/**
 * Trigger a file download from a URL
 */
export function triggerDownload(url: string, filename: string): void {
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

/**
 * Generate a filename with timestamp
 */
export function generateFilename(
	baseName: string,
	format: ExportFormat,
): string {
	const timestamp = new Date().toISOString().slice(0, 10);
	return `${baseName}_${timestamp}.${format}`;
}
