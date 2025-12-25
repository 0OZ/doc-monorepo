import { useEffect, useState } from "react";
import { parseFHIRDocument } from "@/lib/fhir-parser";
import type { ParsedDocument } from "@/types/fhir";

interface DocumentLoaderResult {
	documents: ParsedDocument[];
	loading: boolean;
	error: string | null;
}

export function useDocumentLoader(): DocumentLoaderResult {
	const [documents, setDocuments] = useState<ParsedDocument[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function loadDocuments() {
			try {
				// Try loading from API first (returns raw XML strings)
				const response = await fetch("/api/documents");
				if (response.ok) {
					const data = await response.json();
					if (Array.isArray(data) && data.length > 0) {
						// Check if it's the new format with XML strings
						if (data[0].xml) {
							const parsedDocs = data.map(
								(item: { filename: string; xml: string }) =>
									parseFHIRDocument(item.xml)
							);
							setDocuments(parsedDocs);
							return;
						}
						// Legacy format: already parsed documents
						setDocuments(data);
						return;
					}
				}

				// Fallback: Try single document API
				const singleResponse = await fetch("/api/document");
				if (singleResponse.ok) {
					const data = await singleResponse.json();
					setDocuments([data]);
					return;
				}

				// Fallback: Load sample document from public folder
				const xmlResponse = await fetch("/sample-document.xml");
				if (!xmlResponse.ok) {
					throw new Error("Failed to load document");
				}
				const xmlText = await xmlResponse.text();
				const parsed = parseFHIRDocument(xmlText);

				// For demo: create multiple documents with variations
				const documents = createDemoDocuments(parsed);
				setDocuments(documents);
			} catch (err) {
				// Final fallback: try sample document
				try {
					const xmlResponse = await fetch("/sample-document.xml");
					const xmlText = await xmlResponse.text();
					const parsed = parseFHIRDocument(xmlText);
					const documents = createDemoDocuments(parsed);
					setDocuments(documents);
				} catch {
					setError(
						err instanceof Error ? err.message : "Failed to load documents"
					);
				}
			} finally {
				setLoading(false);
			}
		}

		loadDocuments();
	}, []);

	return { documents, loading, error };
}

// Legacy hook for backward compatibility (single document)
export function useSingleDocumentLoader() {
	const { documents, loading, error } = useDocumentLoader();
	return {
		document: documents[0] ?? null,
		loading,
		error,
	};
}

// Create demo documents with variations for multi-document testing
function createDemoDocuments(baseDocument: ParsedDocument): ParsedDocument[] {
	// If you want to test single document mode, just return [baseDocument]
	// For multi-document demo, we create variations:
	
	const doc1 = {
		...baseDocument,
		composition: {
			...baseDocument.composition,
			id: baseDocument.composition.id + "-1",
			title: "Behandlungsvertrag",
		},
	};

	const doc2: ParsedDocument = {
		...baseDocument,
		composition: {
			...baseDocument.composition,
			id: baseDocument.composition.id + "-2",
			title: "Einwilligung zur Datenverarbeitung",
			type: {
				code: "consent",
				display: "Einwilligungserklärung",
			},
		},
		sections: [
			{
				title: "Datenschutzhinweis",
				code: "privacy",
				text: `<p>Hiermit erkläre ich mich einverstanden, dass meine personenbezogenen Daten 
				zum Zwecke der medizinischen Behandlung und Dokumentation verarbeitet werden.</p>
				<p><strong>Verarbeitete Daten:</strong></p>
				<ul>
					<li>Persönliche Identifikationsdaten</li>
					<li>Medizinische Befunde und Diagnosen</li>
					<li>Behandlungsdokumentation</li>
				</ul>`,
			},
			{
				title: "Widerrufsrecht",
				code: "revocation",
				text: `<p>Sie können diese Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen. 
				Der Widerruf ist schriftlich an die Praxis zu richten.</p>`,
			},
		],
	};

	const doc3: ParsedDocument = {
		...baseDocument,
		composition: {
			...baseDocument.composition,
			id: baseDocument.composition.id + "-3",
			title: "Aufklärungsbogen zur Behandlung",
			type: {
				code: "informed-consent",
				display: "Patientenaufklärung",
			},
		},
		sections: [
			{
				title: "Geplante Maßnahme",
				code: "procedure",
				text: `<p>Ich wurde über die geplante Behandlung und deren Ablauf informiert.</p>`,
			},
			{
				title: "Risiken und Nebenwirkungen",
				code: "risks",
				text: `<p>Mir wurden die möglichen Risiken und Nebenwirkungen erläutert. 
				Ich hatte Gelegenheit, Fragen zu stellen.</p>`,
			},
			{
				title: "Alternativen",
				code: "alternatives",
				text: `<p>Ich wurde über alternative Behandlungsmöglichkeiten informiert.</p>`,
			},
		],
	};

	return [doc1, doc2, doc3];
}
