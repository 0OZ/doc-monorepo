import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorStateProps {
	error: string | null;
}

export function ErrorState({ error }: ErrorStateProps) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
				<Card className="max-w-md border-destructive/50">
					<CardContent className="flex flex-col items-center gap-4 py-8 text-center">
						<div className="rounded-full bg-destructive/10 p-3">
							<svg
								className="h-6 w-6 text-destructive"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
						</div>
						<div>
							<h2 className="text-lg font-semibold text-foreground">
								Dokument konnte nicht geladen werden
							</h2>
							<p className="mt-1 text-sm text-muted-foreground">
								{error ||
									"Das Dokument konnte nicht geladen werden. Bitte versuchen Sie es erneut."}
							</p>
						</div>
						<Button onClick={() => window.location.reload()}>Erneut versuchen</Button>
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
}
