import type {
	FHIRComposition,
	FHIRPatient,
	FHIRPractitioner,
	FHIRSection,
	ParsedDocument,
} from "@/types/fhir";

/**
 * Parse FHIR Composition XML document
 */
export function parseFHIRDocument(xmlString: string): ParsedDocument {
	const parser = new DOMParser();
	const doc = parser.parseFromString(xmlString, "application/xml");

	// Check for parsing errors
	const parseError = doc.querySelector("parsererror");
	if (parseError) {
		throw new Error("Invalid XML document");
	}

	const composition = parseComposition(doc);
	const patient = parsePatient(doc);
	const practitioner = parsePractitioner(doc);
	const sections = parseSections(doc);
	const encounter = parseEncounter(doc);

	return {
		composition,
		patient,
		practitioner,
		sections,
		encounter,
	};
}

function parseComposition(doc: Document): FHIRComposition {
	const composition = doc.querySelector("Composition");

	return {
		id: getElementValue(composition, "id", "value") || generateId(),
		status: (getElementValue(composition, "status", "value") ||
			"preliminary") as FHIRComposition["status"],
		type: {
			code: getNestedValue(composition, "type > coding > code", "value") || "unknown",
			display:
				getNestedValue(composition, "type > coding > display", "value") || "Clinical Document",
		},
		title: getElementValue(composition, "title", "value") || "Untitled Document",
		date: getElementValue(composition, "date", "value") || new Date().toISOString(),
		confidentiality: getElementValue(composition, "confidentiality", "value"),
	};
}

function parsePatient(doc: Document): FHIRPatient {
	const patient = doc.querySelector("Patient");

	// Get human name
	const givenName = getElementValue(patient, "name > given", "value") || "";
	const familyName = getElementValue(patient, "name > family", "value") || "";
	const fullName = `${givenName} ${familyName}`.trim() || "Unknown Patient";

	// Get address
	const addressLine = getElementValue(patient, "address > line", "value") || "";
	const city = getElementValue(patient, "address > city", "value") || "";
	const state = getElementValue(patient, "address > state", "value") || "";
	const postalCode = getElementValue(patient, "address > postalCode", "value") || "";
	const address = [addressLine, city, state, postalCode].filter(Boolean).join(", ");

	return {
		id: getElementValue(patient, "id", "value") || generateId(),
		name: fullName,
		birthDate: getElementValue(patient, "birthDate", "value") || "",
		gender: getElementValue(patient, "gender", "value") || "unknown",
		identifier: getNestedValue(patient, "identifier > value", "value"),
		address: address || undefined,
		phone: getNestedValue(patient, "telecom > value", "value"),
	};
}

function parsePractitioner(doc: Document): FHIRPractitioner {
	const practitioner = doc.querySelector("Practitioner");

	// Get human name
	const prefix = getElementValue(practitioner, "name > prefix", "value") || "";
	const givenName = getElementValue(practitioner, "name > given", "value") || "";
	const familyName = getElementValue(practitioner, "name > family", "value") || "";
	const suffix = getElementValue(practitioner, "name > suffix", "value") || "";
	const fullName =
		[prefix, givenName, familyName, suffix].filter(Boolean).join(" ") || "Unknown Practitioner";

	return {
		id: getElementValue(practitioner, "id", "value") || generateId(),
		name: fullName,
		role: getNestedValue(
			doc.documentElement,
			"PractitionerRole > code > coding > display",
			"value"
		),
		specialty: getNestedValue(
			doc.documentElement,
			"PractitionerRole > specialty > coding > display",
			"value"
		),
		organization: getNestedValue(doc.documentElement, "Organization > name", "value"),
	};
}

function parseSections(doc: Document): FHIRSection[] {
	const sectionElements = doc.querySelectorAll("Composition > section");
	const sections: FHIRSection[] = [];

	sectionElements.forEach((section) => {
		const title = getElementValue(section, "title", "value") || "Untitled Section";
		const code = getNestedValue(section, "code > coding > code", "value") || "";

		// Get narrative text - handle XHTML div content
		const textDiv = section.querySelector("text > div");
		let text = "";

		if (textDiv) {
			// Get innerHTML and clean it up
			text = textDiv.innerHTML || textDiv.textContent || "";
		} else {
			// Fallback to text element
			const textEl = section.querySelector("text");
			text = textEl?.textContent || "";
		}

		sections.push({
			title,
			code,
			text: text.trim(),
		});
	});

	return sections;
}

function parseEncounter(doc: Document): ParsedDocument["encounter"] {
	const encounter = doc.querySelector("Encounter");
	if (!encounter) return undefined;

	return {
		date: getNestedValue(encounter, "period > start", "value") || "",
		location: getNestedValue(doc.documentElement, "Location > name", "value"),
		reason: getNestedValue(encounter, "reasonCode > coding > display", "value"),
	};
}

// Helper functions
function getElementValue(
	parent: Element | null,
	selector: string,
	attr: string
): string | undefined {
	if (!parent) return undefined;
	const el = parent.querySelector(selector);
	return el?.getAttribute(attr) || undefined;
}

function getNestedValue(
	parent: Element | null,
	selector: string,
	attr: string
): string | undefined {
	if (!parent) return undefined;
	const el = parent.querySelector(selector);
	return el?.getAttribute(attr) || undefined;
}

function generateId(): string {
	return `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format date for display (German locale)
 */
export function formatDate(dateString: string): string {
	if (!dateString) return "";

	try {
		const date = new Date(dateString);
		return date.toLocaleDateString("de-DE", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	} catch {
		return dateString;
	}
}

/**
 * Format date with time (German locale)
 */
export function formatDateTime(dateString: string): string {
	if (!dateString) return "";

	try {
		const date = new Date(dateString);
		return date.toLocaleString("de-DE", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return dateString;
	}
}
