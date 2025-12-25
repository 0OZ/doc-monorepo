"use client";

import type { LeistungsnachweisDetail } from "@/types/leistungsnachweis";

interface LeistungsnachweisViewerProps {
	document: LeistungsnachweisDetail;
}

export function LeistungsnachweisViewer({
	document,
}: LeistungsnachweisViewerProps) {
	const formatMonth = (billingMonth: string) => {
		const year = billingMonth.slice(0, 4);
		const month = billingMonth.slice(4, 6);
		const monthNames = [
			"Januar",
			"Februar",
			"März",
			"April",
			"Mai",
			"Juni",
			"Juli",
			"August",
			"September",
			"Oktober",
			"November",
			"Dezember",
		];
		const monthName = monthNames[Number.parseInt(month, 10) - 1] || month;
		return `${monthName} ${year}`;
	};

	return (
		<div className="rounded-lg border bg-card p-4 sm:p-6">
			{/* Header */}
			<div className="mb-6 border-b pb-4">
				<h2 className="text-xl font-semibold text-foreground">
					Leistungsnachweis
				</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Abrechnungsmonat: {formatMonth(document.billingMonth)}
				</p>
			</div>

			{/* Client Info */}
			<section className="mb-6">
				<h3 className="mb-2 text-sm font-medium text-muted-foreground">
					Versicherter
				</h3>
				<div className="rounded-md bg-muted/50 p-3">
					<p className="font-medium">
						{document.client.vorname} {document.client.name}
					</p>
					<p className="text-sm text-muted-foreground">
						Versichertennummer: {document.client.versichertennummer}
					</p>
				</div>
			</section>

			{/* Provider Info */}
			<section className="mb-6">
				<h3 className="mb-2 text-sm font-medium text-muted-foreground">
					Leistungserbringer
				</h3>
				<div className="rounded-md bg-muted/50 p-3">
					<p className="text-sm">IK: {document.provider.ik}</p>
					<p className="text-sm text-muted-foreground">
						Verantwortliche Fachkraft: {document.provider.responsibleStaffId}
					</p>
				</div>
			</section>

			{/* Service Days */}
			<section>
				<h3 className="mb-3 text-sm font-medium text-muted-foreground">
					Erbrachte Leistungen
				</h3>
				<div className="space-y-4">
					{document.serviceDays.map((day) => (
						<div key={day.date} className="rounded-md border p-3">
							<div className="mb-2 flex items-center justify-between">
								<span className="font-medium">{day.displayDate}</span>
								<span className="text-xs text-muted-foreground">
									{day.deployments.length} Einsatz
									{day.deployments.length !== 1 ? "e" : ""}
								</span>
							</div>
							<div className="space-y-2">
								{day.deployments.map((deployment) => (
									<div
										key={`${day.date}-${deployment.sequenceNumber}`}
										className="rounded bg-muted/30 p-2"
									>
										<div className="mb-1 flex items-center gap-2 text-sm">
											<span className="font-medium">
												Einsatz {deployment.sequenceNumber}
											</span>
											<span className="text-muted-foreground">
												{deployment.displayStartTime} Uhr
											</span>
										</div>
										<ul className="ml-4 space-y-1">
											{deployment.services.map((service, idx) => (
												<li
													key={`${deployment.sequenceNumber}-${service.code}-${idx}`}
													className="flex items-start gap-2 text-sm"
												>
													<span className="font-mono text-xs text-muted-foreground">
														{service.code}
													</span>
													<span>{service.description}</span>
													{service.durationMinutes && (
														<span className="text-muted-foreground">
															({service.durationMinutes} Min.)
														</span>
													)}
												</li>
											))}
										</ul>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Status */}
			<div className="mt-6 flex items-center justify-between border-t pt-4">
				<span className="text-sm text-muted-foreground">Status</span>
				<StatusBadge status={document.status} />
			</div>
		</div>
	);
}

function StatusBadge({ status }: { status: string }) {
	const statusConfig: Record<
		string,
		{ label: string; className: string }
	> = {
		draft: {
			label: "Entwurf",
			className: "bg-gray-100 text-gray-800",
		},
		pending_signature: {
			label: "Unterschrift ausstehend",
			className: "bg-yellow-100 text-yellow-800",
		},
		signed: {
			label: "Unterschrieben",
			className: "bg-green-100 text-green-800",
		},
		finalized: {
			label: "Abgeschlossen",
			className: "bg-blue-100 text-blue-800",
		},
	};

	const config = statusConfig[status] || {
		label: status,
		className: "bg-gray-100 text-gray-800",
	};

	return (
		<span
			className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
		>
			{config.label}
		</span>
	);
}
