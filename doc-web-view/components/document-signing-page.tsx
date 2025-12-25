"use client";

import { useCallback } from "react";
import { DocumentHeader } from "@/components/document-page/document-header";
import { DocumentNavigation } from "@/components/document-page/document-navigation";
import { FloatingSignButton } from "@/components/document-page/floating-sign-button";
import { SuccessBanner } from "@/components/document-page/success-banner";
import { LeistungsnachweisViewer } from "@/components/leistungsnachweis-viewer";
import { SignatureModal } from "@/components/signature-modal";
import { BatchSignModal } from "@/components/batch-sign-modal";
import { useMultiDocumentHandler } from "@/hooks/use-multi-document-handler";
import { useBatchSign } from "@/hooks/use-batch-sign";
import type { LeistungsnachweisDetail } from "@/types/leistungsnachweis";

interface DocumentSigningPageProps {
	initialDocuments: LeistungsnachweisDetail[];
}

export function DocumentSigningPage({ initialDocuments }: DocumentSigningPageProps) {
	const {
		documents,
		currentDocument,
		currentIndex,
		totalCount,
		signedCount,
		allSigned,
		signatureModalOpen,
		setSignatureModalOpen,
		isSubmitting,
		handleSignatureSubmit,
		goToDocument,
	} = useMultiDocumentHandler(initialDocuments);

	// Callback for batch sign to navigate and open modal
	const handleBatchSignDocument = useCallback(
		(index: number) => {
			goToDocument(index);
			setSignatureModalOpen(true);
		},
		[goToDocument, setSignatureModalOpen],
	);

	const batchSign = useBatchSign(documents, handleBatchSignDocument);

	const currentDocSigned = documents[currentIndex]?.signed ?? false;
	const remainingCount = totalCount - signedCount;

	// Get all document IDs for export
	const allDocumentIds = documents.map((d) => d.document.id);

	// Helper to create document title from Leistungsnachweis
	const getDocumentTitle = (doc: LeistungsnachweisDetail | null) => {
		if (!doc) return undefined;
		const month = doc.billingMonth;
		const year = month.slice(0, 4);
		const monthNum = month.slice(4, 6);
		return `Leistungsnachweis ${monthNum}/${year}`;
	};

	// Handle signature submission with batch mode support
	const handleSignatureSubmitWithBatch = useCallback(
		async (signatureDataUrl: string) => {
			await handleSignatureSubmit(signatureDataUrl);

			// If in batch mode, advance to next document
			if (batchSign.isBatchMode) {
				// Small delay for UX
				setTimeout(() => {
					batchSign.advanceBatch();
				}, 500);
			}
		},
		[handleSignatureSubmit, batchSign],
	);

	const documentTitle = getDocumentTitle(currentDocument);

	return (
		<div className="min-h-screen bg-background pb-[calc(6rem+env(safe-area-inset-bottom))] sm:pb-8">
			<DocumentHeader
				signatureSubmitted={currentDocSigned}
				onSignClick={() => setSignatureModalOpen(true)}
				currentDocument={currentIndex + 1}
				totalDocuments={totalCount}
				signedCount={signedCount}
				documentId={currentDocument?.id}
				documentTitle={documentTitle}
				allDocumentIds={allDocumentIds}
				onBatchSignClick={batchSign.openBatchModal}
				unsignedCount={batchSign.unsignedCount}
			/>

			<main className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
				{/* Success Banner - show when all docs signed or partial progress */}
				<SuccessBanner
					show={signedCount > 0}
					isPartial={!allSigned}
					signedCount={signedCount}
					totalCount={totalCount}
				/>

				{/* Document Navigation for multiple documents */}
				<DocumentNavigation
					documents={documents}
					currentIndex={currentIndex}
					onNavigate={goToDocument}
				/>

				{/* Current Document Viewer */}
				{currentDocument && (
					<LeistungsnachweisViewer document={currentDocument} />
				)}

				{/* Floating Sign Button (mobile only, when not all signed) */}
				{!allSigned && !currentDocSigned && (
					<FloatingSignButton
						onSignClick={() => setSignatureModalOpen(true)}
						remainingCount={remainingCount}
					/>
				)}
			</main>

			{/* Signature Modal */}
			<SignatureModal
				open={signatureModalOpen}
				onOpenChange={setSignatureModalOpen}
				onSignatureSubmit={handleSignatureSubmitWithBatch}
				documentTitle={documentTitle}
				isSubmitting={isSubmitting}
				currentIndex={
					batchSign.isBatchMode && batchSign.batchProgress
						? batchSign.batchProgress.current
						: currentIndex + 1
				}
				totalDocuments={
					batchSign.isBatchMode && batchSign.batchProgress
						? batchSign.batchProgress.total
						: totalCount
				}
			/>

			{/* Batch Sign Modal */}
			<BatchSignModal
				documents={documents}
				selectedIndices={batchSign.selectedIndices}
				open={batchSign.batchModalOpen}
				onOpenChange={batchSign.setBatchModalOpen}
				onToggleSelection={batchSign.toggleSelection}
				onSelectAll={batchSign.selectAll}
				onDeselectAll={batchSign.deselectAll}
				onStartBatch={batchSign.startBatchSigning}
			/>
		</div>
	);
}
