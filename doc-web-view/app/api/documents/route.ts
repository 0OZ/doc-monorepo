import { NextResponse } from "next/server";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export async function GET() {
	try {
		const dataDir = path.join(process.cwd(), "data");
		const files = await readdir(dataDir);

		// Filter for XML files only (exclude XSD schema files)
		const xmlFiles = files.filter(
			(file) => file.endsWith(".xml") && !file.endsWith(".xsd")
		);

		const documents: { filename: string; xml: string }[] = [];

		for (const file of xmlFiles) {
			const filePath = path.join(dataDir, file);
			const xml = await readFile(filePath, "utf-8");
			documents.push({ filename: file, xml });
		}

		return NextResponse.json(documents);
	} catch (error) {
		console.error("Error loading documents:", error);
		return NextResponse.json(
			{ error: "Failed to load documents" },
			{ status: 500 }
		);
	}
}
