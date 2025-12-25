"use client";

import { motion } from "motion/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/fhir-parser";
import type { ParsedDocument } from "@/types/fhir";

interface DocumentViewerProps {
	document: ParsedDocument;
}

// German translations for status
const statusLabels: Record<string, string> = {
	preliminary: "Vorläufig",
	final: "Final",
	amended: "Geändert",
	"entered-in-error": "Fehlerhaft",
};

// German translations for gender
const genderLabels: Record<string, string> = {
	male: "Männlich",
	female: "Weiblich",
	other: "Divers",
	unknown: "Unbekannt",
};

export function DocumentViewer({ document }: DocumentViewerProps) {
	const { composition, patient, practitioner, sections, encounter } = document;

	return (
		<div className="document-viewer space-y-4 sm:space-y-6">
			{/* Document Header */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
					<CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
							<h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl md:text-2xl">
								{composition.title}
							</h1>
							<span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
								{statusLabels[composition.status] || composition.status}
							</span>
						</div>
						<p className="text-xs text-muted-foreground sm:text-sm">
							{composition.type.display} • {formatDateTime(composition.date)}
						</p>
					</CardHeader>
				</Card>
			</motion.div>

			{/* Patient & Practitioner Info */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.1 }}
				className="grid gap-3 sm:gap-4 sm:grid-cols-2"
			>
				{/* Patient Card */}
				<Card className="overflow-hidden">
					<CardHeader className="bg-muted/30 p-3 pb-2 sm:p-4 sm:pb-2">
						<h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Patient
						</h2>
					</CardHeader>
					<CardContent className="p-3 pt-2 sm:p-4 sm:pt-3">
						<p className="text-base font-semibold text-foreground sm:text-lg">{patient.name}</p>
						<div className="mt-2 space-y-1 text-xs text-muted-foreground sm:text-sm">
							{patient.birthDate && <p>Geburtsdatum: {formatDate(patient.birthDate)}</p>}
							{patient.gender && (
								<p>Geschlecht: {genderLabels[patient.gender] || patient.gender}</p>
							)}
							{patient.identifier && <p>Patientennummer: {patient.identifier}</p>}
							{patient.phone && <p>Telefon: {patient.phone}</p>}
						</div>
					</CardContent>
				</Card>

				{/* Practitioner Card */}
				<Card className="overflow-hidden">
					<CardHeader className="bg-muted/30 p-3 pb-2 sm:p-4 sm:pb-2">
						<h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Behandelnder Arzt
						</h2>
					</CardHeader>
					<CardContent className="p-3 pt-2 sm:p-4 sm:pt-3">
						<p className="text-base font-semibold text-foreground sm:text-lg">
							{practitioner.name}
						</p>
						<div className="mt-2 space-y-1 text-xs text-muted-foreground sm:text-sm">
							{practitioner.role && <p>{practitioner.role}</p>}
							{practitioner.specialty && <p>{practitioner.specialty}</p>}
							{practitioner.organization && <p>{practitioner.organization}</p>}
						</div>
					</CardContent>
				</Card>
			</motion.div>

			{/* Encounter Info */}
			{encounter && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
				>
					<Card className="bg-muted/30">
						<CardContent className="flex flex-wrap gap-x-4 gap-y-1.5 p-3 text-xs sm:gap-x-6 sm:gap-y-2 sm:p-4 sm:text-sm">
							{encounter.date && (
								<div>
									<span className="font-medium text-muted-foreground">Besuchsdatum: </span>
									<span className="text-foreground">{formatDateTime(encounter.date)}</span>
								</div>
							)}
							{encounter.location && (
								<div>
									<span className="font-medium text-muted-foreground">Ort: </span>
									<span className="text-foreground">{encounter.location}</span>
								</div>
							)}
							{encounter.reason && (
								<div>
									<span className="font-medium text-muted-foreground">Anlass: </span>
									<span className="text-foreground">{encounter.reason}</span>
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>
			)}

			{/* Document Sections */}
			<div className="space-y-3 sm:space-y-4">
				{sections.map((section, index) => (
					<motion.div
						key={`${section.code}-${index}`}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
					>
						<Card className="overflow-hidden">
							<CardHeader className="border-b bg-muted/30 p-3 py-2.5 sm:p-4 sm:py-3">
								<h3 className="text-sm font-semibold text-foreground sm:text-base">
									{section.title}
								</h3>
							</CardHeader>
							<CardContent className="prose prose-sm prose-neutral dark:prose-invert max-w-none p-3 sm:p-4">
								<div
									className="fhir-narrative text-sm sm:text-base"
									dangerouslySetInnerHTML={{ __html: section.text }}
								/>
							</CardContent>
						</Card>
					</motion.div>
				))}
			</div>
		</div>
	);
}
