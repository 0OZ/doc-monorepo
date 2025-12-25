import { useCallback, useState } from "react";
import { signLeistungsnachweis, createSignRequest } from "@/lib/api";
import type {
	LeistungsnachweisDetail,
	LeistungsnachweisWithStatus,
} from "@/types/leistungsnachweis";

/**
 * Validates that signature data is non-empty and correctly formatted
 */
function isValidSignatureData(dataUrl: string): boolean {
	if (!dataUrl) return false;
	const pngPrefix = "data:image/png;base64,";
	if (!dataUrl.startsWith(pngPrefix)) return false;
	const base64Data = dataUrl.slice(pngPrefix.length);
	return base64Data.length > 2000; // Non-empty canvas check
}

export function useMultiDocumentHandler(
	initialDocuments: LeistungsnachweisDetail[]
) {
	const [documents, setDocuments] = useState<LeistungsnachweisWithStatus[]>(
		initialDocuments.map((doc) => ({
			document: doc,
			signed: doc.status === "signed" || doc.status === "finalized",
		}))
	);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [signatureModalOpen, setSignatureModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const currentDocument = documents[currentIndex]?.document ?? null;
	const currentDocumentStatus = documents[currentIndex] ?? null;
	const allSigned = documents.length > 0 && documents.every((d) => d.signed);
	const signedCount = documents.filter((d) => d.signed).length;
	const totalCount = documents.length;

	const handleSignatureSubmit = useCallback(
		async (signatureDataUrl: string) => {
			if (!currentDocument || !isValidSignatureData(signatureDataUrl)) {
				throw new Error("Invalid signature");
			}

			setIsSubmitting(true);

			try {
				// Create sign request matching backend format
				const request = createSignRequest(signatureDataUrl);

				// Submit to backend
				const response = await signLeistungsnachweis(
					currentDocument.id,
					request
				);

				// Mark current document as signed
				setDocuments((prev) =>
					prev.map((d, i) =>
						i === currentIndex
							? {
									...d,
									signed: true,
									signatureId: response.id,
									signedAt: response.signedAt || new Date().toISOString(),
								}
							: d
					)
				);

				setSignatureModalOpen(false);

				// Auto-advance to next unsigned document if available
				const nextUnsignedIndex = documents.findIndex(
					(d, i) => i > currentIndex && !d.signed
				);
				if (nextUnsignedIndex !== -1) {
					// Small delay for animation
					setTimeout(() => {
						setCurrentIndex(nextUnsignedIndex);
					}, 300);
				}
			} finally {
				setIsSubmitting(false);
			}
		},
		[currentDocument, currentIndex, documents]
	);

	const goToDocument = useCallback(
		(index: number) => {
			if (index >= 0 && index < documents.length) {
				setCurrentIndex(index);
			}
		},
		[documents.length]
	);

	const goToNextUnsigned = useCallback(() => {
		const nextUnsignedIndex = documents.findIndex(
			(d, i) => i > currentIndex && !d.signed
		);
		if (nextUnsignedIndex !== -1) {
			setCurrentIndex(nextUnsignedIndex);
		} else {
			// Wrap around to find first unsigned
			const firstUnsignedIndex = documents.findIndex((d) => !d.signed);
			if (firstUnsignedIndex !== -1) {
				setCurrentIndex(firstUnsignedIndex);
			}
		}
	}, [documents, currentIndex]);

	const goToPrevious = useCallback(() => {
		if (currentIndex > 0) {
			setCurrentIndex(currentIndex - 1);
		}
	}, [currentIndex]);

	const goToNext = useCallback(() => {
		if (currentIndex < documents.length - 1) {
			setCurrentIndex(currentIndex + 1);
		}
	}, [currentIndex, documents.length]);

	return {
		documents,
		currentDocument,
		currentDocumentStatus,
		currentIndex,
		totalCount,
		signedCount,
		allSigned,
		signatureModalOpen,
		setSignatureModalOpen,
		isSubmitting,
		handleSignatureSubmit,
		goToDocument,
		goToNextUnsigned,
		goToPrevious,
		goToNext,
	};
}
