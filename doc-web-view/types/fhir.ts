// FHIR Composition resource types for document signing

export interface FHIRComposition {
	id: string;
	status: "preliminary" | "final" | "amended" | "entered-in-error";
	type: {
		code: string;
		display: string;
	};
	title: string;
	date: string;
	confidentiality?: string;
}

export interface FHIRPatient {
	id: string;
	name: string;
	birthDate: string;
	gender: string;
	identifier?: string;
	address?: string;
	phone?: string;
}

export interface FHIRPractitioner {
	id: string;
	name: string;
	role?: string;
	specialty?: string;
	organization?: string;
}

export interface FHIRSection {
	title: string;
	code: string;
	text: string;
}

export interface ParsedDocument {
	composition: FHIRComposition;
	patient: FHIRPatient;
	practitioner: FHIRPractitioner;
	sections: FHIRSection[];
	encounter?: {
		date: string;
		location?: string;
		reason?: string;
	};
}

export interface SignaturePayload {
	documentId: string;
	signatureImage: string; // base64 PNG data URL
	timestamp: string;
	signerName?: string;
	signerRole?: "patient" | "guardian" | "witness" | "provider";
}

export interface SignatureResponse {
	success: boolean;
	message?: string;
	signatureId?: string;
	error?: string;
}

// Multi-document support types
export interface DocumentWithStatus {
	document: ParsedDocument;
	signed: boolean;
	signatureId?: string;
	signedAt?: string;
}

export interface MultiDocumentState {
	documents: DocumentWithStatus[];
	currentIndex: number;
	allSigned: boolean;
}
