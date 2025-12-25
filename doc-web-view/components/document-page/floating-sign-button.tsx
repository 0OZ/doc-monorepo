"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

interface FloatingSignButtonProps {
	onSignClick: () => void;
	/** For multi-document: remaining documents to sign */
	remainingCount?: number;
}

export function FloatingSignButton({ onSignClick, remainingCount }: FloatingSignButtonProps) {
	const hasMultiple = remainingCount !== undefined && remainingCount > 1;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.8, type: "spring", stiffness: 300, damping: 25 }}
			className="fixed bottom-0 left-0 right-0 z-30 pb-safe sm:hidden"
		>
			{/* Gradient fade effect */}
			<div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-background to-transparent" />

			<div className="border-t bg-background/95 px-4 py-3 backdrop-blur">
				<Button
					onClick={onSignClick}
					size="lg"
					className="h-14 w-full gap-2 text-base font-semibold shadow-lg active:scale-[0.98] transition-transform"
				>
					<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
						/>
					</svg>
					{hasMultiple ? (
						<span>Unterschreiben ({remainingCount} Dokumente)</span>
					) : (
						<span>Jetzt unterschreiben</span>
					)}
				</Button>
			</div>
		</motion.div>
	);
}
