"use client";

import { DocumentSigningPage } from "@/components/document-signing-page";
import { ErrorState } from "@/components/document-page/error-state";
import { LoadingState } from "@/components/document-page/loading-state";
import { useDocumentLoader } from "@/hooks/use-document-loader";

export default function Home() {
	const { documents: loadedDocuments, loading, error } = useDocumentLoader();

	if (loading) {
		return <LoadingState />;
	}

	if (error || loadedDocuments.length === 0) {
		return <ErrorState error={error} />;
	}

	return <DocumentSigningPage initialDocuments={loadedDocuments} />;
}
