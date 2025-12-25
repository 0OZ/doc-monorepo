"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { SignaturePad } from "@/components/signature-pad";
import { Button } from "@/components/ui/button";

interface SignatureModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSignatureSubmit: (signatureDataUrl: string) => Promise<void>;
	documentTitle?: string;
	isSubmitting?: boolean;
	/** For multi-document: current document index (1-based) */
	currentIndex?: number;
	/** For multi-document: total number of documents */
	totalDocuments?: number;
}

export function SignatureModal({
	open,
	onOpenChange,
	onSignatureSubmit,
	documentTitle = "Dokument",
	isSubmitting = false,
	currentIndex,
	totalDocuments,
}: SignatureModalProps) {
	const [_signatureData, setSignatureData] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [dimensions, setDimensions] = useState({ width: 500, height: 200 });
	const [isMobile, setIsMobile] = useState(false);

	// Calculate optimal signature pad dimensions based on viewport
	useEffect(() => {
		const updateDimensions = () => {
			const vw = window.innerWidth;
			const vh = window.innerHeight;
			const mobile = vw < 640;
			setIsMobile(mobile);

			if (mobile) {
				// Fullscreen on mobile - use full viewport
				setDimensions({ width: vw, height: vh - 80 }); // Leave room for bottom buttons
			} else {
				// Desktop/tablet
				setDimensions({ width: 500, height: 200 });
			}
		};

		updateDimensions();
		window.addEventListener("resize", updateDimensions);
		window.addEventListener("orientationchange", updateDimensions);
		return () => {
			window.removeEventListener("resize", updateDimensions);
			window.removeEventListener("orientationchange", updateDimensions);
		};
	}, []);

	const handleSignatureChange = useCallback((dataUrl: string | null) => {
		setSignatureData(dataUrl);
		setError(null);
	}, []);

	const handleConfirm = useCallback(
		async (dataUrl: string) => {
			try {
				setError(null);
				await onSignatureSubmit(dataUrl);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Unterschrift konnte nicht übermittelt werden"
				);
			}
		},
		[onSignatureSubmit]
	);

	const handleClose = useCallback(() => {
		if (!isSubmitting) {
			setSignatureData(null);
			setError(null);
			onOpenChange(false);
		}
	}, [isSubmitting, onOpenChange]);

	// Prevent body scroll when modal is open on mobile
	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);

	if (!open) return null;

	const showMultiDocIndicator =
		currentIndex !== undefined && totalDocuments !== undefined && totalDocuments > 1;

	// Mobile: Clean fullscreen signature view
	if (isMobile) {
		return (
			<AnimatePresence>
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-50 flex flex-col bg-background pt-safe"
				>
					{/* Close button - top right corner (respects safe area) */}
					<button
						type="button"
						onClick={handleClose}
						disabled={isSubmitting}
						className="absolute right-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/10 text-foreground backdrop-blur-sm transition-colors active:scale-95 disabled:opacity-50"
						aria-label="Schließen"
					>
						<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>

					{/* Document indicator - top left (respects safe area) */}
					{showMultiDocIndicator && (
						<div className="absolute left-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-10 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
							{currentIndex} / {totalDocuments}
						</div>
					)}

					{/* Fullscreen Signature Pad */}
					<SignaturePad
						width={dimensions.width}
						height={dimensions.height}
						onSignatureChange={handleSignatureChange}
						onConfirm={handleConfirm}
						fullscreen
					/>

					{/* Error Message */}
					<AnimatePresence>
						{error && (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 20 }}
								className="absolute bottom-24 left-4 right-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-center text-sm text-destructive"
							>
								{error}
							</motion.div>
						)}
					</AnimatePresence>

					{/* Loading Overlay */}
					<AnimatePresence>
						{isSubmitting && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm"
							>
								<div className="flex flex-col items-center gap-4">
									<div className="relative h-12 w-12">
										<div className="absolute inset-0 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
									</div>
									<p className="text-base font-medium text-muted-foreground">
										Unterschrift wird übermittelt...
									</p>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>
			</AnimatePresence>
		);
	}

	// Desktop: Centered dialog with full UI
	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
				onClick={(e) => {
					if (e.target === e.currentTarget && !isSubmitting) {
						handleClose();
					}
				}}
			>
				<motion.div
					initial={{ opacity: 0, y: 20, scale: 0.98 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: 20, scale: 0.98 }}
					transition={{ type: "spring", damping: 25, stiffness: 300 }}
					className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border bg-background shadow-2xl"
				>
					{/* Header */}
					<div className="flex items-start justify-between border-b p-6">
						<div className="flex-1 pr-8">
							<div className="flex items-center gap-3">
								<h2 className="text-xl font-semibold text-foreground">Dokument unterschreiben</h2>
								{showMultiDocIndicator && (
									<span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
										{currentIndex} von {totalDocuments}
									</span>
								)}
							</div>
							<p className="mt-1 text-sm text-muted-foreground line-clamp-2">
								Bitte unterschreiben Sie unten, um Ihre Kenntnisnahme von &bdquo;{documentTitle}
								&ldquo; zu bestätigen
							</p>
						</div>

						{/* Close Button */}
						<button
							type="button"
							onClick={handleClose}
							disabled={isSubmitting}
							className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 disabled:opacity-50"
							aria-label="Schließen"
						>
							<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					{/* Content */}
					<div className="flex-1 overflow-y-auto p-6">
						<div className="flex flex-col items-center gap-4">
							<SignaturePad
								width={dimensions.width}
								height={dimensions.height}
								onSignatureChange={handleSignatureChange}
								onConfirm={handleConfirm}
							/>
						</div>

						{/* Error Message */}
						<AnimatePresence>
							{error && (
								<motion.div
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-center text-sm text-destructive"
								>
									{error}
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					{/* Footer */}
					<div className="border-t bg-muted/30 p-6">
						{/* Legal Notice */}
						<p className="mb-4 text-center text-xs text-muted-foreground">
							Mit Ihrer Unterschrift bestätigen Sie, dass Ihre elektronische Signatur rechtlich
							bindend ist und einer handschriftlichen Unterschrift entspricht.
						</p>

						{/* Cancel Button */}
						<div className="flex justify-center">
							<Button
								type="button"
								variant="ghost"
								onClick={handleClose}
								disabled={isSubmitting}
								className="min-h-[48px] min-w-[120px] text-base"
							>
								Abbrechen
							</Button>
						</div>
					</div>

					{/* Loading Overlay */}
					<AnimatePresence>
						{isSubmitting && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/90 backdrop-blur-sm"
							>
								<div className="flex flex-col items-center gap-4">
									<div className="relative h-12 w-12">
										<div className="absolute inset-0 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
									</div>
									<p className="text-base font-medium text-muted-foreground">
										Unterschrift wird übermittelt...
									</p>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}
