"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import {
    exportDocument,
    exportBatch,
    triggerDownload,
    generateFilename,
    type ExportFormat,
} from "@/lib/export-service";

interface ExportMenuProps {
    documentId: string;
    documentTitle?: string;
    /** For batch export - all document IDs */
    allDocumentIds?: string[];
    /** Show batch export option */
    showBatchExport?: boolean;
}

export function ExportMenu({
    documentId,
    documentTitle = "Dokument",
    allDocumentIds,
    showBatchExport = false,
}: ExportMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () =>
                document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen]);

    const handleExport = async (format: ExportFormat) => {
        setIsExporting(true);
        setError(null);

        const result = await exportDocument(documentId, format);

        if (result.success && result.downloadUrl) {
            const filename = generateFilename(
                documentTitle.replace(/\s+/g, "_"),
                format,
            );
            triggerDownload(result.downloadUrl, filename);
        } else {
            setError(result.error || "Export fehlgeschlagen");
        }

        setIsExporting(false);
        setIsOpen(false);
    };

    const handleBatchExport = async (format: ExportFormat) => {
        if (!allDocumentIds || allDocumentIds.length === 0) return;

        setIsExporting(true);
        setError(null);

        const result = await exportBatch(allDocumentIds, format);

        if (result.success && result.downloadUrl) {
            const filename = generateFilename("Dokumente", format);
            triggerDownload(result.downloadUrl, filename);
        } else {
            setError(result.error || "Batch-Export fehlgeschlagen");
        }

        setIsExporting(false);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border bg-card shadow-lg"
                    >
                        {/* Header */}
                        <div className="border-b bg-muted/30 px-4 py-2">
                            <span className="text-sm font-medium text-foreground">
                                Exportieren
                            </span>
                        </div>

                        {/* Single Document Options */}
                        <div className="p-1">
                            <button
                                type="button"
                                onClick={() => handleExport("pdf")}
                                disabled={isExporting}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted active:scale-[0.98] disabled:opacity-50"
                            >
                                <svg
                                    className="h-5 w-5 text-red-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    />
                                </svg>
                                <span>Als PDF herunterladen</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleExport("xml")}
                                disabled={isExporting}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted active:scale-[0.98] disabled:opacity-50"
                            >
                                <svg
                                    className="h-5 w-5 text-blue-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                                    />
                                </svg>
                                <span>Als XML herunterladen</span>
                            </button>
                        </div>

                        {/* Batch Export Options */}
                        {showBatchExport && allDocumentIds && allDocumentIds.length > 1 && (
                            <>
                                <div className="border-t" />
                                <div className="p-1">
                                    <button
                                        type="button"
                                        onClick={() => handleBatchExport("pdf")}
                                        disabled={isExporting}
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted active:scale-[0.98] disabled:opacity-50"
                                    >
                                        <svg
                                            className="h-5 w-5 text-purple-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                            />
                                        </svg>
                                        <span>Alle als ZIP ({allDocumentIds.length})</span>
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="border-t bg-destructive/10 px-4 py-2">
                                <p className="text-xs text-destructive">{error}</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
