"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentSigningPage } from "@/components/document-signing-page";
import { ErrorState } from "@/components/document-page/error-state";
import { LoadingState } from "@/components/document-page/loading-state";
import { useDocumentLoader } from "@/hooks/use-document-loader";
import { isAuthenticated, getUser } from "@/lib/auth";

export default function Home() {
    const router = useRouter();
    const [authChecked, setAuthChecked] = useState(false);
    const [clientId, setClientId] = useState<string | undefined>(undefined);

    // Check authentication on mount
    useEffect(() => {
        if (!isAuthenticated()) {
            router.push("/login");
        } else {
            const user = getUser();
            // Use user id as client id for client role, or undefined for staff/admin
            if (user?.role === "client") {
                setClientId(user.id);
            }
            setAuthChecked(true);
        }
    }, [router]);

    const { documents: loadedDocuments, loading, error } = useDocumentLoader(clientId);

    // Show loading while checking auth
    if (!authChecked) {
        return <LoadingState />;
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
