import { useEffect, useState } from "react";
import { fetchLeistungsnachweise, fetchLeistungsnachweis } from "@/lib/api";
import type { LeistungsnachweisDetail } from "@/types/leistungsnachweis";

// Default client ID for development - in production this would come from auth/session
const DEFAULT_CLIENT_ID = "A123456789";

interface DocumentLoaderResult {
	documents: LeistungsnachweisDetail[];
	loading: boolean;
	error: string | null;
}

export function useDocumentLoader(clientId?: string): DocumentLoaderResult {
	const [documents, setDocuments] = useState<LeistungsnachweisDetail[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function loadDocuments() {
			try {
				// Fetch list of documents for the client
				const listResult = await fetchLeistungsnachweise(
					clientId || DEFAULT_CLIENT_ID
				);

				if (listResult.content.length === 0) {
					setDocuments([]);
					return;
				}

				// Fetch full details for each document
				const detailPromises = listResult.content.map((item) =>
					fetchLeistungsnachweis(item.id)
				);
				const details = await Promise.all(detailPromises);

				setDocuments(details);
			} catch (err) {
				console.error("Failed to load documents:", err);
				setError(
					err instanceof Error ? err.message : "Failed to load documents"
				);
			} finally {
				setLoading(false);
			}
		}

		loadDocuments();
	}, [clientId]);

	return { documents, loading, error };
}

// Legacy hook for backward compatibility (single document)
export function useSingleDocumentLoader(documentId?: string) {
	const [document, setDocument] = useState<LeistungsnachweisDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!documentId) {
			setLoading(false);
			return;
		}

		const id = documentId; // Capture for closure

		async function loadDocument() {
			try {
				const detail = await fetchLeistungsnachweis(id);
				setDocument(detail);
			} catch (err) {
				console.error("Failed to load document:", err);
				setError(
					err instanceof Error ? err.message : "Failed to load document"
				);
			} finally {
				setLoading(false);
			}
		}

		loadDocument();
	}, [documentId]);

	return { document, loading, error };
}
