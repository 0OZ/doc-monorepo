"use client";

import { AnimatePresence, motion } from "motion/react";

interface SuccessBannerProps {
	show: boolean;
	/** For multi-document: show partial success */
	isPartial?: boolean;
	/** For multi-document: number of signed documents */
	signedCount?: number;
	/** For multi-document: total documents */
	totalCount?: number;
}

export function SuccessBanner({ show, isPartial, signedCount, totalCount }: SuccessBannerProps) {
	const isMultiDoc = signedCount !== undefined && totalCount !== undefined && totalCount > 1;
	const allComplete = !isPartial || (isMultiDoc && signedCount === totalCount);

	return (
		<AnimatePresence>
			{show && (
				<motion.div
					initial={{ opacity: 0, y: -20, scale: 0.95 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: -20, scale: 0.95 }}
					transition={{ type: "spring", stiffness: 300, damping: 25 }}
					className={`
						mb-6 overflow-hidden rounded-xl border shadow-sm
						${
							allComplete
								? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-50/50"
								: "border-amber-200 bg-gradient-to-r from-amber-50 to-amber-50/50"
						}
					`}
				>
					<div className="flex items-start gap-3 p-4 sm:items-center sm:gap-4 sm:p-5">
						{/* Icon */}
						<div
							className={`
							flex h-10 w-10 shrink-0 items-center justify-center rounded-full
							${allComplete ? "bg-emerald-100" : "bg-amber-100"}
						`}
						>
							{allComplete ? (
								<motion.svg
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
									className="h-5 w-5 text-emerald-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2.5}
										d="M5 13l4 4L19 7"
									/>
								</motion.svg>
							) : (
								<svg
									className="h-5 w-5 text-amber-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							)}
						</div>

						{/* Text */}
						<div className="flex-1">
							<h3
								className={`font-semibold ${allComplete ? "text-emerald-800" : "text-amber-800"}`}
							>
								{allComplete
									? isMultiDoc
										? "Alle Dokumente unterschrieben!"
										: "Unterschrift erfolgreich!"
									: `${signedCount} von ${totalCount} unterschrieben`}
							</h3>
							<p
								className={`mt-0.5 text-sm ${allComplete ? "text-emerald-700" : "text-amber-700"}`}
							>
								{allComplete
									? isMultiDoc
										? `${totalCount} Dokumente wurden erfolgreich signiert und übermittelt.`
										: "Ihre Unterschrift wurde erfolgreich gespeichert und das Dokument wurde übermittelt."
									: "Bitte unterschreiben Sie die verbleibenden Dokumente."}
							</p>
						</div>

						{/* Progress indicator for multi-doc */}
						{isMultiDoc && !allComplete && (
							<div className="hidden shrink-0 sm:block">
								<div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-amber-200 bg-amber-50">
									<span className="text-sm font-bold text-amber-700">
										{signedCount}/{totalCount}
									</span>
								</div>
							</div>
						)}
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
