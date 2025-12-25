"use client";

import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import type { DocumentWithStatus } from "@/types/fhir";

interface BatchSignModalProps {
	documents: DocumentWithStatus[];
	selectedIndices: number[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onToggleSelection: (index: number) => void;
	onSelectAll: () => void;
	onDeselectAll: () => void;
	onStartBatch: () => void;
}

export function BatchSignModal({
	documents,
	selectedIndices,
	open,
	onOpenChange,
	onToggleSelection,
	onSelectAll,
	onDeselectAll,
	onStartBatch,
}: BatchSignModalProps) {
	if (!open) return null;

	const unsignedDocs = documents
		.map((d, i) => ({ ...d, originalIndex: i }))
		.filter((d) => !d.signed);

	const allSelected = unsignedDocs.every((d) =>
		selectedIndices.includes(d.originalIndex),
	);

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
				onClick={(e) => {
					if (e.target === e.currentTarget) {
						onOpenChange(false);
					}
				}}
			>
				<motion.div
					initial={{ opacity: 0, y: 100, scale: 0.95 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: 100, scale: 0.95 }}
					transition={{ type: "spring", damping: 25, stiffness: 300 }}
					className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl border bg-background shadow-2xl sm:max-w-lg sm:rounded-2xl"
				>
					{/* Header */}
					<div className="flex items-center justify-between border-b px-4 py-4 sm:px-6">
						<div>
							<h2 className="text-lg font-semibold text-foreground">
								Mehrere Dokumente unterschreiben
							</h2>
							<p className="mt-0.5 text-sm text-muted-foreground">
								{unsignedDocs.length} Dokumente ausstehend
							</p>
						</div>
						<button
							type="button"
							onClick={() => onOpenChange(false)}
							className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
							aria-label="Schließen"
						>
							<svg
								className="h-5 w-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					{/* Selection Controls */}
					<div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2 sm:px-6">
						<span className="text-sm text-muted-foreground">
							{selectedIndices.length} von {unsignedDocs.length} ausgewählt
						</span>
						<button
							type="button"
							onClick={allSelected ? onDeselectAll : onSelectAll}
							className="text-sm font-medium text-primary hover:underline"
						>
							{allSelected ? "Auswahl aufheben" : "Alle auswählen"}
						</button>
					</div>

					{/* Document List */}
					<div className="flex-1 overflow-y-auto">
						<div className="divide-y">
							{unsignedDocs.map((doc) => {
								const isSelected = selectedIndices.includes(doc.originalIndex);
								return (
									<button
										key={doc.document.composition.id}
										type="button"
										onClick={() => onToggleSelection(doc.originalIndex)}
										className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors sm:px-6 ${
											isSelected ? "bg-primary/5" : "hover:bg-muted/50"
										} active:scale-[0.99]`}
									>
										{/* Checkbox */}
										<div
											className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
												isSelected
													? "border-primary bg-primary text-primary-foreground"
													: "border-muted-foreground/30 bg-background"
											}`}
										>
											{isSelected && (
												<motion.svg
													initial={{ scale: 0 }}
													animate={{ scale: 1 }}
													className="h-4 w-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={3}
														d="M5 13l4 4L19 7"
													/>
												</motion.svg>
											)}
										</div>

										{/* Document Info */}
										<div className="min-w-0 flex-1">
											<p
												className={`truncate text-sm font-medium ${
													isSelected ? "text-primary" : "text-foreground"
												}`}
											>
												{doc.document.composition.title}
											</p>
											<p className="truncate text-xs text-muted-foreground">
												{doc.document.composition.type.display}
											</p>
										</div>

										{/* Document Icon */}
										<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
											<svg
												className="h-4 w-4"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
										</div>
									</button>
								);
							})}
						</div>
					</div>

					{/* Footer */}
					<div className="flex items-center justify-between border-t bg-muted/30 px-4 py-4 sm:px-6">
						<Button variant="ghost" onClick={() => onOpenChange(false)}>
							Abbrechen
						</Button>
						<Button
							onClick={onStartBatch}
							disabled={selectedIndices.length === 0}
							className="gap-2"
						>
							<svg
								className="h-4 w-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
								/>
							</svg>
							{selectedIndices.length} unterschreiben
						</Button>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}
