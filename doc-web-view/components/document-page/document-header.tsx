"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ExportMenu } from "@/components/export-menu";

interface DocumentHeaderProps {
	signatureSubmitted: boolean;
	onSignClick: () => void;
	/** For multi-document: current document number (1-based) */
	currentDocument?: number;
	/** For multi-document: total documents */
	totalDocuments?: number;
	/** For multi-document: number of signed documents */
	signedCount?: number;
	/** Current document ID for export */
	documentId?: string;
	/** Current document title for export filename */
	documentTitle?: string;
	/** All document IDs for batch export */
	allDocumentIds?: string[];
	/** Callback for batch sign button */
	onBatchSignClick?: () => void;
	/** Number of unsigned documents remaining */
	unsignedCount?: number;
}

export function DocumentHeader({
	signatureSubmitted,
	onSignClick,
	currentDocument,
	totalDocuments,
	signedCount,
	documentId,
	documentTitle,
	allDocumentIds,
	onBatchSignClick,
	unsignedCount,
}: DocumentHeaderProps) {
	const isMultiDoc = totalDocuments !== undefined && totalDocuments > 1;
	const allSigned = isMultiDoc && signedCount === totalDocuments;
	const showSignButton = !signatureSubmitted && !allSigned;
	const showBatchSign = isMultiDoc && (unsignedCount ?? 0) > 1 && onBatchSignClick;

	return (
		<motion.header
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
		>
			<div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:h-16 sm:px-6">
				{/* Logo & Brand */}
				<div className="flex items-center gap-2 sm:gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground sm:h-9 sm:w-9">
						<svg
							className="h-4 w-4 sm:h-5 sm:w-5"
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
					<div className="flex flex-col">
						<span className="text-sm font-semibold text-foreground sm:text-base">DocSign</span>
						{isMultiDoc && (
							<span className="text-[10px] text-muted-foreground sm:text-xs">
								{signedCount} von {totalDocuments} unterschrieben
							</span>
						)}
					</div>
				</div>

				{/* Progress indicator for multi-doc (mobile) */}
				{isMultiDoc && (
					<div className="hidden items-center gap-1.5 sm:flex">
						{Array.from({ length: totalDocuments }).map((_, i) => (
							<div
								key={i}
								className={`h-1.5 w-6 rounded-full transition-colors ${
									i < (signedCount ?? 0)
										? "bg-emerald-500"
										: i === (currentDocument ?? 1) - 1
											? "bg-primary"
											: "bg-muted"
								}`}
							/>
						))}
					</div>
				)}

				{/* Action Buttons */}
				<div className="flex items-center gap-2">
					{/* Export Menu */}
					{documentId && (
						<ExportMenu
							documentId={documentId}
							documentTitle={documentTitle}
							allDocumentIds={allDocumentIds}
							showBatchExport={isMultiDoc}
						/>
					)}

					{/* Batch Sign Button */}
					{showBatchSign && (
						<Button
							onClick={onBatchSignClick}
							variant="outline"
							size="lg"
							className="hidden h-10 gap-1.5 px-3 text-sm font-semibold sm:flex sm:h-11 sm:gap-2 sm:px-4"
						>
							<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
								/>
							</svg>
							Alle ({unsignedCount})
						</Button>
					)}

					{/* Single Sign Button */}
					{showSignButton && (
						<Button
							onClick={onSignClick}
							size="lg"
							className="h-10 gap-1.5 px-3 text-sm font-semibold sm:h-11 sm:gap-2 sm:px-4"
						>
							<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
								/>
							</svg>
							<span className="hidden sm:inline">Unterschreiben</span>
							<span className="sm:hidden">Signieren</span>
						</Button>
					)}

					{/* All signed indicator */}
					{allSigned && (
						<div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700">
							<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 13l4 4L19 7"
								/>
							</svg>
							<span className="hidden sm:inline">Alle unterschrieben</span>
							<span className="sm:hidden">Fertig</span>
						</div>
					)}
				</div>
			</div>
		</motion.header>
	);
}
