import { motion } from "motion/react";

export function LoadingState() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="flex flex-col items-center gap-4"
			>
				<div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				<p className="text-sm text-muted-foreground">Dokument wird geladen...</p>
			</motion.div>
		</div>
	);
}
