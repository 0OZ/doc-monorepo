import { useCallback, useState } from "react";
import type { DocumentWithStatus } from "@/types/fhir";

export interface BatchSignProgress {
	current: number;
	total: number;
	currentDocumentTitle: string;
}

export function useBatchSign(
	documents: DocumentWithStatus[],
	onSignDocument: (index: number) => void,
) {
	const [batchModalOpen, setBatchModalOpen] = useState(false);
	const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
	const [batchProgress, setBatchProgress] = useState<BatchSignProgress | null>(
		null,
	);
	const [isBatchMode, setIsBatchMode] = useState(false);

	// Get indices of unsigned documents
	const unsignedIndices = documents
		.map((d, i) => (!d.signed ? i : -1))
		.filter((i) => i !== -1);

	const unsignedCount = unsignedIndices.length;

	// Select all unsigned documents
	const selectAll = useCallback(() => {
		setSelectedIndices(unsignedIndices);
	}, [unsignedIndices]);

	// Deselect all
	const deselectAll = useCallback(() => {
		setSelectedIndices([]);
	}, []);

	// Toggle selection of a single document
	const toggleSelection = useCallback((index: number) => {
		setSelectedIndices((prev) =>
			prev.includes(index)
				? prev.filter((i) => i !== index)
				: [...prev, index].sort((a, b) => a - b),
		);
	}, []);

	// Start batch signing - opens signature modal for first selected doc
	const startBatchSigning = useCallback(() => {
		if (selectedIndices.length === 0) return;

		setIsBatchMode(true);
		setBatchProgress({
			current: 1,
			total: selectedIndices.length,
			currentDocumentTitle:
				documents[selectedIndices[0]]?.document.composition.title || "",
		});
		setBatchModalOpen(false);

		// Navigate to first selected document and open signature modal
		onSignDocument(selectedIndices[0]);
	}, [selectedIndices, documents, onSignDocument]);

	// Called after each signature in batch mode - advances to next or completes
	const advanceBatch = useCallback(() => {
		if (!isBatchMode || !batchProgress) return false;

		const currentBatchIndex = batchProgress.current - 1;
		const nextBatchIndex = currentBatchIndex + 1;

		if (nextBatchIndex >= selectedIndices.length) {
			// Batch complete
			setIsBatchMode(false);
			setBatchProgress(null);
			setSelectedIndices([]);
			return false;
		}

		// Move to next document
		const nextDocIndex = selectedIndices[nextBatchIndex];
		setBatchProgress({
			current: nextBatchIndex + 1,
			total: selectedIndices.length,
			currentDocumentTitle:
				documents[nextDocIndex]?.document.composition.title || "",
		});

		// Navigate to next document
		onSignDocument(nextDocIndex);
		return true;
	}, [isBatchMode, batchProgress, selectedIndices, documents, onSignDocument]);

	// Cancel batch signing
	const cancelBatch = useCallback(() => {
		setIsBatchMode(false);
		setBatchProgress(null);
	}, []);

	// Open batch modal with all unsigned pre-selected
	const openBatchModal = useCallback(() => {
		setSelectedIndices(unsignedIndices);
		setBatchModalOpen(true);
	}, [unsignedIndices]);

	return {
		// Modal state
		batchModalOpen,
		setBatchModalOpen,

		// Selection state
		selectedIndices,
		setSelectedIndices,
		selectAll,
		deselectAll,
		toggleSelection,

		// Batch progress
		batchProgress,
		isBatchMode,

		// Actions
		startBatchSigning,
		advanceBatch,
		cancelBatch,
		openBatchModal,

		// Computed
		unsignedIndices,
		unsignedCount,
		hasSelection: selectedIndices.length > 0,
		selectionCount: selectedIndices.length,
	};
}
