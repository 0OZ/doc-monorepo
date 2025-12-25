import { useCallback, useState } from "react";
import {
	createSignaturePayload,
	isValidSignatureData,
	submitSignature,
} from "@/lib/signature-service";
import type { ParsedDocument } from "@/types/fhir";

export function useSignatureHandler(document: ParsedDocument | null) {
	const [signatureModalOpen, setSignatureModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [signatureSubmitted, setSignatureSubmitted] = useState(false);

	const handleSignatureSubmit = useCallback(
		async (signatureDataUrl: string) => {
			if (!document || !isValidSignatureData(signatureDataUrl)) {
				throw new Error("Invalid signature");
			}

			setIsSubmitting(true);

			try {
				const payload = createSignaturePayload(
					document.composition.id,
					signatureDataUrl,
					document.patient.name,
					"patient"
				);

				const response = await submitSignature(payload);

				if (!response.success) {
					throw new Error(response.error || "Failed to submit signature");
				}

				setSignatureSubmitted(true);
				setSignatureModalOpen(false);
			} finally {
				setIsSubmitting(false);
			}
		},
		[document]
	);

	return {
		signatureModalOpen,
		setSignatureModalOpen,
		isSubmitting,
		signatureSubmitted,
		handleSignatureSubmit,
	};
}
