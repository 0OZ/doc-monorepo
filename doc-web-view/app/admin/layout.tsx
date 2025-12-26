"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, isAuthenticated } from "@/lib/auth";
import Link from "next/link";

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const [authorized, setAuthorized] = useState(false);

	useEffect(() => {
		if (!isAuthenticated()) {
			router.push("/login");
			return;
		}

		const user = getUser();
		if (user?.role !== "admin") {
			router.push("/");
			return;
		}

		setAuthorized(true);
	}, [router]);

	if (!authorized) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Admin Header */}
			<header className="border-b bg-card">
				<div className="container mx-auto px-4 py-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-6">
							<h1 className="text-lg font-semibold">Admin</h1>
							<nav className="flex gap-4">
								<Link
									href="/admin/devices"
									className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									Geräte
								</Link>
							</nav>
						</div>
						<Link
							href="/"
							className="text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							Zurück zur App
						</Link>
					</div>
				</div>
			</header>

			{/* Content */}
			<main className="container mx-auto px-4 py-6">{children}</main>
		</div>
	);
}
