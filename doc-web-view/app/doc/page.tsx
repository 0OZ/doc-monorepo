"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { DocumentSigningPage } from "@/components/document-signing-page";
import { ErrorState } from "@/components/document-page/error-state";
import { LoadingState } from "@/components/document-page/loading-state";
import { useDocumentLoader } from "@/hooks/use-document-loader";

function DocumentContent() {
    const searchParams = useSearchParams();
    const clientId = searchParams.get("clientId");

    const { documents: loadedDocuments, loading, error } = useDocumentLoader(clientId || undefined);

    if (!clientId) {
        return <ErrorState error="Kein Klient angegeben. Bitte clientId Parameter verwenden." />;
    }

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState error={error} />;
    }

    if (loadedDocuments.length === 0) {
        return <ErrorState error="Keine Dokumente gefunden" />;
    }

    return <DocumentSigningPage initialDocuments={loadedDocuments} />;
}

export default function DocPage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <DocumentContent />
        </Suspense>
    );
}
