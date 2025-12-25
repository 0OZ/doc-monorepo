import type { Metadata, Viewport } from "next";
import { Libre_Baskerville, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const sourceSans = Source_Sans_3({
	variable: "--font-sans",
	subsets: ["latin"],
	display: "swap",
});

const libreBaskerville = Libre_Baskerville({
	variable: "--font-serif",
	subsets: ["latin"],
	weight: ["400", "700"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "DocSign - Digitale Dokumentenunterschrift",
	description: "Sichere Ansicht und elektronische Unterschrift von Gesundheitsdokumenten",
	keywords: ["Gesundheitswesen", "Dokumentenunterschrift", "FHIR", "elektronische Signatur"],
	authors: [{ name: "FamCare" }],
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	viewportFit: "cover",
	themeColor: "#ffffff",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="de" suppressHydrationWarning>
			<body className={`${sourceSans.variable} ${libreBaskerville.variable} font-sans antialiased`}>
				{children}
			</body>
		</html>
	);
}
