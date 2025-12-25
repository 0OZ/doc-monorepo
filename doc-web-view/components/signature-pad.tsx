"use client";

import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
	onSignatureChange?: (dataUrl: string | null) => void;
	onConfirm?: (dataUrl: string) => void;
	width?: number;
	height?: number;
	/** Compact mode for landscape orientation */
	compact?: boolean;
	/** Fullscreen mode - maximizes canvas, shows only essential buttons */
	fullscreen?: boolean;
}

export function SignaturePad({
	onSignatureChange,
	onConfirm,
	width = 500,
	height = 200,
	compact = false,
	fullscreen = false,
}: SignaturePadProps) {
	const signatureRef = useRef<SignatureCanvas>(null);
	const [isEmpty, setIsEmpty] = useState(true);
	const [history, setHistory] = useState<string[]>([]);

	const handleBegin = useCallback(() => {
		// Save state before drawing starts for undo functionality
		if (signatureRef.current) {
			const dataUrl = signatureRef.current.toDataURL("image/png");
			setHistory((prev) => [...prev, dataUrl]);
		}
	}, []);

	const handleEnd = useCallback(() => {
		if (signatureRef.current) {
			const empty = signatureRef.current.isEmpty();
			setIsEmpty(empty);

			if (!empty && onSignatureChange) {
				const dataUrl = signatureRef.current.toDataURL("image/png");
				onSignatureChange(dataUrl);
			}
		}
	}, [onSignatureChange]);

	const handleClear = useCallback(() => {
		if (signatureRef.current) {
			signatureRef.current.clear();
			setIsEmpty(true);
			setHistory([]);
			onSignatureChange?.(null);
		}
	}, [onSignatureChange]);

	const handleUndo = useCallback(() => {
		if (history.length > 0 && signatureRef.current) {
			const newHistory = [...history];
			const previousState = newHistory.pop();
			setHistory(newHistory);

			if (previousState) {
				const willBeEmpty = newHistory.length === 0;

				signatureRef.current.fromDataURL(previousState, {
					width,
					height,
					ratio: 1,
				});

				setIsEmpty(willBeEmpty);
				onSignatureChange?.(willBeEmpty ? null : previousState);
			} else {
				signatureRef.current.clear();
				setIsEmpty(true);
				onSignatureChange?.(null);
			}
		}
	}, [history, width, height, onSignatureChange]);

	const handleConfirm = useCallback(() => {
		if (signatureRef.current && !isEmpty) {
			const dataUrl = signatureRef.current.toDataURL("image/png");
			onConfirm?.(dataUrl);
		}
	}, [isEmpty, onConfirm]);

	// Fullscreen mode - clean, minimal UI
	if (fullscreen) {
		return (
			<div className="flex h-full w-full flex-col">
				{/* Canvas takes all available space */}
				<div className="relative flex-1 bg-white">
					<SignatureCanvas
						ref={signatureRef}
						canvasProps={{
							width,
							height,
							className: "signature-canvas touch-none absolute inset-0 w-full h-full",
							style: {
								display: "block",
								cursor: "crosshair",
							},
						}}
						penColor="#1a1a1a"
						minWidth={2}
						maxWidth={4}
						velocityFilterWeight={0.7}
						onBegin={handleBegin}
						onEnd={handleEnd}
					/>

					{/* Minimal empty state hint */}
					{isEmpty && (
						<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
							<p className="text-lg text-muted-foreground/40">Hier unterschreiben</p>
						</div>
					)}
				</div>

				{/* Fixed bottom buttons - large touch targets */}
				<div className="flex gap-3 border-t bg-background p-4">
					<Button
						type="button"
						variant="outline"
						size="lg"
						onClick={handleClear}
						disabled={isEmpty}
						className="h-14 flex-1 text-base active:scale-[0.98] transition-transform"
					>
						<svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
						Löschen
					</Button>

					{onConfirm && (
						<Button
							type="button"
							size="lg"
							onClick={handleConfirm}
							disabled={isEmpty}
							className="h-14 flex-[2] text-base font-semibold active:scale-[0.98] transition-transform"
						>
							<svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 13l4 4L19 7"
								/>
							</svg>
							Speichern
						</Button>
					)}
				</div>
			</div>
		);
	}

	// Standard mode
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.98 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.3 }}
			className={`flex flex-col items-center ${compact ? "gap-3" : "gap-4"}`}
		>
			{/* Signature Canvas - constrained to max canvas size on desktop */}
			<div
				className="relative w-full overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/30 bg-white shadow-inner transition-colors focus-within:border-primary"
				style={{ maxWidth: width }}
			>
				<SignatureCanvas
					ref={signatureRef}
					canvasProps={{
						width,
						height,
						className: "signature-canvas touch-none w-full",
						style: {
							display: "block",
							cursor: "crosshair",
						},
					}}
					penColor="#1a1a1a"
					minWidth={1.5}
					maxWidth={3.5}
					velocityFilterWeight={0.7}
					onBegin={handleBegin}
					onEnd={handleEnd}
				/>

				{/* Signature Line */}
				<div className="pointer-events-none absolute bottom-8 left-4 right-4 border-b border-muted-foreground/40 sm:left-6 sm:right-6" />
				<span className="pointer-events-none absolute bottom-2 left-4 text-xs text-muted-foreground sm:left-6">
					Hier unterschreiben
				</span>

				{/* Empty State Hint */}
				{isEmpty && (
					<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
						<div className="flex flex-col items-center gap-2">
							<svg
								className="h-8 w-8 text-muted-foreground/30"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.5}
									d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
								/>
							</svg>
							<p className="text-sm text-muted-foreground/50">Unterschreiben Sie hier</p>
						</div>
					</div>
				)}
			</div>

			{/* Action Buttons */}
			<div className={`flex w-full flex-wrap justify-center ${compact ? "gap-2" : "gap-3"}`}>
				<Button
					type="button"
					variant="outline"
					size={compact ? "default" : "lg"}
					onClick={handleClear}
					disabled={isEmpty}
					className={`${compact ? "min-h-[40px] px-3" : "min-h-[48px] min-w-[100px]"} active:scale-95 transition-transform`}
				>
					<svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
					{!compact && "Löschen"}
				</Button>

				<Button
					type="button"
					variant="outline"
					size={compact ? "default" : "lg"}
					onClick={handleUndo}
					disabled={history.length === 0}
					className={`${compact ? "min-h-[40px] px-3" : "min-h-[48px] min-w-[100px]"} active:scale-95 transition-transform`}
				>
					<svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
						/>
					</svg>
					{!compact && "Rückgängig"}
				</Button>

				{onConfirm && (
					<Button
						type="button"
						size={compact ? "default" : "lg"}
						onClick={handleConfirm}
						disabled={isEmpty}
						className={`${compact ? "min-h-[40px] px-4" : "min-h-[48px] min-w-[140px]"} bg-primary font-semibold active:scale-95 transition-transform`}
					>
						<svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5 13l4 4L19 7"
							/>
						</svg>
						Bestätigen
					</Button>
				)}
			</div>
		</motion.div>
	);
}
