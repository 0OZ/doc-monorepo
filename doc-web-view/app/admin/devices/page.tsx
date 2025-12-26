"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Device,
	DeviceCreated,
	listDevices,
	registerDevice,
	activateDevice,
	deactivateDevice,
	deleteDevice,
	regenerateDeviceKey,
	formatMacAddress,
	isValidMacAddress,
} from "@/lib/devices-api";

export default function DevicesPage() {
	const [devices, setDevices] = useState<Device[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Create device form
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [newDevice, setNewDevice] = useState({
		mac_address: "",
		name: "",
		role: "client",
	});
	const [creating, setCreating] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);

	// API key display
	const [showApiKey, setShowApiKey] = useState<DeviceCreated | null>(null);
	const [copied, setCopied] = useState(false);

	// Load devices
	const loadDevices = async () => {
		try {
			setLoading(true);
			const data = await listDevices();
			setDevices(data);
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Fehler beim Laden");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadDevices();
	}, []);

	// Create device
	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		setCreateError(null);

		const formattedMac = formatMacAddress(newDevice.mac_address);
		if (!isValidMacAddress(formattedMac)) {
			setCreateError("Ungültige MAC-Adresse. Format: AA:BB:CC:DD:EE:FF");
			return;
		}

		try {
			setCreating(true);
			const created = await registerDevice({
				mac_address: formattedMac,
				name: newDevice.name,
				role: newDevice.role,
			});
			setShowApiKey(created);
			setShowCreateForm(false);
			setNewDevice({ mac_address: "", name: "", role: "client" });
			await loadDevices();
		} catch (err) {
			setCreateError(err instanceof Error ? err.message : "Fehler beim Erstellen");
		} finally {
			setCreating(false);
		}
	};

	// Toggle device active state
	const handleToggleActive = async (device: Device) => {
		try {
			if (device.is_active) {
				await deactivateDevice(device.id);
			} else {
				await activateDevice(device.id);
			}
			await loadDevices();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Fehler");
		}
	};

	// Regenerate API key
	const handleRegenerateKey = async (device: Device) => {
		if (!confirm(`API-Key für "${device.name}" neu generieren? Der alte Key wird ungültig.`)) {
			return;
		}
		try {
			const updated = await regenerateDeviceKey(device.id);
			setShowApiKey(updated);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Fehler");
		}
	};

	// Delete device
	const handleDelete = async (device: Device) => {
		if (!confirm(`Gerät "${device.name}" wirklich löschen?`)) {
			return;
		}
		try {
			await deleteDevice(device.id);
			await loadDevices();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Fehler beim Löschen");
		}
	};

	// Copy to clipboard
	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			setError("Kopieren fehlgeschlagen");
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">Geräte verwalten</h2>
					<p className="text-sm text-muted-foreground mt-1">
						Registrierte Geräte für automatische Anmeldung via API-Key
					</p>
				</div>
				<Button onClick={() => setShowCreateForm(true)}>
					Neues Gerät registrieren
				</Button>
			</div>

			{error && (
				<div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{error}
				</div>
			)}

			{/* API Key Modal */}
			{showApiKey && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-card rounded-xl border shadow-xl p-6 max-w-lg w-full mx-4">
						<h3 className="text-lg font-semibold mb-2">API-Key erstellt</h3>
						<p className="text-sm text-muted-foreground mb-4">
							Speichern Sie diesen Key jetzt! Er wird nur einmal angezeigt.
						</p>

						<div className="space-y-3">
							<div>
								<label className="text-xs text-muted-foreground">Gerät</label>
								<p className="font-medium">{showApiKey.name}</p>
							</div>
							<div>
								<label className="text-xs text-muted-foreground">MAC-Adresse</label>
								<p className="font-mono text-sm">{showApiKey.mac_address}</p>
							</div>
							<div>
								<label className="text-xs text-muted-foreground">API-Key</label>
								<div className="flex gap-2 mt-1">
									<code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono break-all">
										{showApiKey.api_key}
									</code>
									<Button
										variant={copied ? "default" : "outline"}
										onClick={() => copyToClipboard(showApiKey.api_key)}
									>
										{copied ? "Kopiert!" : "Kopieren"}
									</Button>
								</div>
							</div>
						</div>

						<div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
							<p className="text-sm text-amber-600 dark:text-amber-400">
								<strong>Konfiguration:</strong> Das Gerät muss den Header{" "}
								<code className="bg-muted px-1 rounded">X-Device-Key: {showApiKey.api_key}</code>{" "}
								bei jeder Anfrage senden.
							</p>
						</div>

						<div className="flex justify-end mt-6">
							<Button onClick={() => { setShowApiKey(null); setCopied(false); }}>Schließen</Button>
						</div>
					</div>
				</div>
			)}

			{/* Create Form Modal */}
			{showCreateForm && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-card rounded-xl border shadow-xl p-6 max-w-md w-full mx-4">
						<h3 className="text-lg font-semibold mb-4">Neues Gerät registrieren</h3>

						<form onSubmit={handleCreate} className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-1.5">
									MAC-Adresse
								</label>
								<input
									type="text"
									value={newDevice.mac_address}
									onChange={(e) =>
										setNewDevice({ ...newDevice, mac_address: e.target.value })
									}
									placeholder="AA:BB:CC:DD:EE:FF"
									className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono"
									required
								/>
								<p className="text-xs text-muted-foreground mt-1">
									Format: AA:BB:CC:DD:EE:FF oder AABBCCDDEEFF
								</p>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1.5">
									Gerätename
								</label>
								<input
									type="text"
									value={newDevice.name}
									onChange={(e) =>
										setNewDevice({ ...newDevice, name: e.target.value })
									}
									placeholder="z.B. Tablet Zimmer 101"
									className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1.5">Rolle</label>
								<select
									value={newDevice.role}
									onChange={(e) =>
										setNewDevice({ ...newDevice, role: e.target.value })
									}
									className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
								>
									<option value="client">Klient</option>
									<option value="staff">Pflegekraft</option>
									<option value="admin">Admin</option>
								</select>
							</div>

							{createError && (
								<div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
									{createError}
								</div>
							)}

							<div className="flex gap-3 justify-end pt-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setShowCreateForm(false);
										setCreateError(null);
									}}
								>
									Abbrechen
								</Button>
								<Button type="submit" disabled={creating}>
									{creating ? "Erstellen..." : "Gerät registrieren"}
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Devices Table */}
			{loading ? (
				<div className="flex justify-center py-12">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
				</div>
			) : devices.length === 0 ? (
				<div className="text-center py-12 text-muted-foreground">
					Keine Geräte registriert
				</div>
			) : (
				<div className="rounded-xl border overflow-hidden">
					<table className="w-full">
						<thead className="bg-muted/50">
							<tr>
								<th className="text-left px-4 py-3 text-sm font-medium">Name</th>
								<th className="text-left px-4 py-3 text-sm font-medium">MAC-Adresse</th>
								<th className="text-left px-4 py-3 text-sm font-medium">Rolle</th>
								<th className="text-left px-4 py-3 text-sm font-medium">Status</th>
								<th className="text-left px-4 py-3 text-sm font-medium">Zuletzt aktiv</th>
								<th className="text-right px-4 py-3 text-sm font-medium">Aktionen</th>
							</tr>
						</thead>
						<tbody className="divide-y">
							{devices.map((device) => (
								<tr key={device.id} className="hover:bg-muted/30">
									<td className="px-4 py-3">
										<span className="font-medium">{device.name}</span>
									</td>
									<td className="px-4 py-3">
										<code className="text-sm font-mono">{device.mac_address}</code>
									</td>
									<td className="px-4 py-3">
										<span
											className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
												device.role === "admin"
													? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
													: device.role === "staff"
													? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
													: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
											}`}
										>
											{device.role === "admin"
												? "Admin"
												: device.role === "staff"
												? "Pflegekraft"
												: "Klient"}
										</span>
									</td>
									<td className="px-4 py-3">
										<span
											className={`inline-flex items-center gap-1.5 text-sm ${
												device.is_active
													? "text-green-600 dark:text-green-400"
													: "text-red-600 dark:text-red-400"
											}`}
										>
											<span
												className={`w-2 h-2 rounded-full ${
													device.is_active ? "bg-green-500" : "bg-red-500"
												}`}
											></span>
											{device.is_active ? "Aktiv" : "Inaktiv"}
										</span>
									</td>
									<td className="px-4 py-3 text-sm text-muted-foreground">
										{device.last_seen
											? new Date(device.last_seen).toLocaleString("de-DE")
											: "Nie"}
									</td>
									<td className="px-4 py-3">
										<div className="flex justify-end gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleToggleActive(device)}
											>
												{device.is_active ? "Deaktivieren" : "Aktivieren"}
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleRegenerateKey(device)}
											>
												Neuer Key
											</Button>
											<Button
												variant="destructive"
												size="sm"
												onClick={() => handleDelete(device)}
											>
												Löschen
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
