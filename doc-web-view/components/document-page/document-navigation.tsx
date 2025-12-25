"use client";

import { motion } from "motion/react";
import type { LeistungsnachweisWithStatus } from "@/types/leistungsnachweis";

// Helper to create document title from billing month
function getDocumentTitle(billingMonth: string): string {
	const year = billingMonth.slice(0, 4);
	const month = billingMonth.slice(4, 6);
	return `Leistungsnachweis ${month}/${year}`;
}

interface DocumentNavigationProps {
	documents: LeistungsnachweisWithStatus[];
	currentIndex: number;
	onNavigate: (index: number) => void;
}

export function DocumentNavigation({
	documents,
	currentIndex,
	onNavigate,
}: DocumentNavigationProps) {
	if (documents.length <= 1) return null;

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			className="mb-4 overflow-hidden rounded-xl border bg-card shadow-sm"
		>
			{/* Header */}
			<div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
				<div className="flex items-center gap-2">
					<svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					<span className="text-sm font-medium text-foreground">
						Leistungsnachweise zur Unterschrift
					</span>
				</div>
				<span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
					{documents.filter(d => d.signed).length} / {documents.length} unterschrieben
				</span>
			</div>

			{/* Document List */}
			<div className="divide-y">
				{documents.map((doc, index) => {
					const isActive = index === currentIndex;
					const isSigned = doc.signed;
					const title = getDocumentTitle(doc.document.billingMonth);
					const clientName = `${doc.document.client.vorname} ${doc.document.client.name}`;

					return (
						<button
							key={doc.document.id}
							type="button"
							onClick={() => onNavigate(index)}
							className={`
								flex w-full items-center gap-3 px-4 py-3 text-left transition-colors
								${isActive ? 'bg-primary/5' : 'hover:bg-muted/50'}
								active:scale-[0.99] transition-transform
							`}
						>
							{/* Status Icon */}
							<div className={`
								flex h-8 w-8 shrink-0 items-center justify-center rounded-full
								${isSigned
									? 'bg-emerald-100 text-emerald-600'
									: isActive
										? 'bg-primary/10 text-primary'
										: 'bg-muted text-muted-foreground'
								}
							`}>
								{isSigned ? (
									<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
									</svg>
								) : (
									<span className="text-sm font-medium">{index + 1}</span>
								)}
							</div>

							{/* Document Info */}
							<div className="min-w-0 flex-1">
								<p className={`truncate text-sm font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
									{title}
								</p>
								<p className="truncate text-xs text-muted-foreground">
									{clientName}
								</p>
							</div>

							{/* Arrow for active */}
							{isActive && !isSigned && (
								<svg className="h-4 w-4 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
								</svg>
							)}

							{/* Signed badge */}
							{isSigned && (
								<span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
									Unterschrieben
								</span>
							)}
						</button>
					);
				})}
			</div>
		</motion.div>
	);
}

