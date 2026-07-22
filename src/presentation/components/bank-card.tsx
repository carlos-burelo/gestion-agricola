"use client";

import {
	Banknote,
	Building2,
	Check,
	Copy,
	CreditCard as CreditCardIcon,
	Eye,
	EyeOff,
	Landmark,
	MoreVertical,
	Pencil,
	Trash2,
	User,
	Users,
	Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect as SelectNative } from "@/components/ui/native-select";
import type { Cuenta } from "@/core/domain/entities";
import {
	deleteRecord,
	updateRecord,
} from "@/presentation/actions/crud-actions";

export interface BankCardProps {
	cuenta: Cuenta;
	saldoCalculado?: number;
	readOnly?: boolean;
	isSelected?: boolean;
	onSelect?: (cuenta: Cuenta) => void;
	onUpdate?: () => void;
	href?: string;
	className?: string;
}

/**
 * Reusable metallic account card component representing Bank/Cash accounts
 * belonging to Proveedores, Clientes, Trabajadores, Familiares or Negocio.
 */
export function BankCard({
	cuenta,
	saldoCalculado,
	readOnly = false,
	isSelected = false,
	onSelect,
	onUpdate,
	href,
	className = "",
}: BankCardProps) {
	const [showBalance, setShowBalance] = useState(true);
	const [copied, setCopied] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Form State for Editable Mode
	const [nombre, setNombre] = useState(cuenta.nombre);
	const [titularTipo, setTitularTipo] = useState(
		cuenta.titularTipo ?? "negocio",
	);
	const [titularNombre, setTitularNombre] = useState(
		cuenta.titularNombre ?? "",
	);
	const [bancoNombre, setBancoNombre] = useState(cuenta.bancoNombre ?? "");
	const [numeroCuenta, setNumeroCuenta] = useState(cuenta.numeroCuenta ?? "");
	const [tipo, setTipo] = useState(cuenta.tipo);
	const [moneda, setMoneda] = useState(cuenta.moneda);
	const [saldoInicial, setSaldoInicial] = useState(String(cuenta.saldoInicial));
	const [estado, setEstado] = useState(cuenta.estado);

	const balance = saldoCalculado ?? cuenta.saldoInicial;
	const isActivo = cuenta.estado === "activo";

	// Visual Theme mapping by Bank / Account Type
	const getTheme = () => {
		const nameUpper = (cuenta.bancoNombre || cuenta.nombre).toUpperCase();
		if (cuenta.tipo === "banco") {
			if (nameUpper.includes("BBVA")) {
				return {
					gradient:
						"bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-blue-100 border-blue-800/40 shadow-xs",
					chip: "from-amber-300 via-yellow-400 to-amber-500",
					badge: "bg-blue-500/20 text-blue-300 border-blue-400/30",
					Icon: Landmark,
					brand: "BBVA BANCOMER",
				};
			}
			if (nameUpper.includes("BANAMEX") || nameUpper.includes("CITI")) {
				return {
					gradient:
						"bg-gradient-to-br from-slate-950 via-rose-950 to-blue-950 text-rose-100 border-rose-800/40 shadow-xs",
					chip: "from-slate-300 via-neutral-200 to-slate-400",
					badge: "bg-rose-500/20 text-rose-300 border-rose-400/30",
					Icon: Building2,
					brand: "CITIBANAMEX",
				};
			}
			return {
				gradient:
					"bg-gradient-to-br from-zinc-950 via-slate-900 to-teal-950 text-teal-100 border-teal-800/40 shadow-xs",
				chip: "from-amber-200 via-yellow-400 to-amber-500",
				badge: "bg-teal-500/20 text-teal-300 border-teal-400/30",
				Icon: CreditCardIcon,
				brand: cuenta.bancoNombre || "INSTITUCIÓN BANCARIA",
			};
		}
		if (cuenta.tipo === "efectivo") {
			return {
				gradient:
					"bg-gradient-to-br from-amber-950 via-neutral-950 to-stone-900 text-amber-100 border-amber-800/40 shadow-xs",
				chip: "from-amber-300 via-yellow-400 to-amber-600",
				badge: "bg-amber-500/20 text-amber-300 border-amber-400/30",
				Icon: Banknote,
				brand: "EFECTIVO / CAJA",
			};
		}
		return {
			gradient:
				"bg-gradient-to-br from-neutral-950 via-slate-900 to-zinc-950 text-zinc-100 border-zinc-700/40 shadow-xs",
			chip: "from-slate-300 via-zinc-200 to-slate-400",
			badge: "bg-zinc-500/20 text-zinc-300 border-zinc-400/30",
			Icon: Wallet,
			brand: cuenta.tipo.toUpperCase(),
		};
	};

	// Owner Badge Styling
	const getOwnerBadgeStyle = (tipoOwner?: string) => {
		switch (tipoOwner) {
			case "proveedor":
				return "bg-amber-500/20 text-amber-300 border-amber-500/40";
			case "cliente":
				return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
			case "trabajador":
				return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
			case "familiar":
				return "bg-purple-500/20 text-purple-300 border-purple-500/40";
			case "negocio":
			default:
				return "bg-slate-500/20 text-slate-300 border-slate-500/40";
		}
	};

	const theme = getTheme();

	// Format account display number (e.g. •••• •••• •••• 4501)
	const getMaskedNumber = () => {
		const rawNum = cuenta.numeroCuenta || cuenta.nombre;
		const digits = rawNum.replace(/\D/g, "");
		if (digits.length >= 4) {
			return `•••• •••• •••• ${digits.slice(-4)}`;
		}
		return `•••• •••• •••• ${cuenta.id.slice(-4).toUpperCase()}`;
	};

	const handleCopy = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const textToCopy = `${cuenta.nombre} ${cuenta.numeroCuenta ? `(${cuenta.numeroCuenta})` : ""}`;
		navigator.clipboard.writeText(textToCopy);
		setCopied(true);
		toast.success("Datos de la cuenta copiados al portapapeles");
		setTimeout(() => setCopied(false), 2000);
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		try {
			const res = await updateRecord("cuentas", cuenta.id, {
				nombre,
				titularTipo,
				titularNombre,
				bancoNombre,
				numeroCuenta,
				tipo,
				moneda,
				saldoInicial,
				estado,
			});
			if (res.ok) {
				toast.success("Cuenta bancaria actualizada correctamente");
				setIsEditOpen(false);
				onUpdate?.();
			} else {
				toast.error(res.error || "Error al actualizar la cuenta");
			}
		} catch {
			toast.error("Error inesperado al guardar");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!confirm(`¿Eliminar la cuenta "${cuenta.nombre}"?`)) return;
		setIsDeleting(true);
		try {
			const res = await deleteRecord("cuentas", cuenta.id);
			if (res.ok) {
				toast.success("Cuenta eliminada correctamente");
				onUpdate?.();
			} else {
				toast.error(res.error || "Error al eliminar la cuenta");
			}
		} catch {
			toast.error("Error inesperado al eliminar");
		} finally {
			setIsDeleting(false);
		}
	};

	const ownerLabel = cuenta.titularTipo
		? cuenta.titularTipo.toUpperCase()
		: "NEGOCIO";
	const ownerName = cuenta.titularNombre || cuenta.nombre;

	const cardContent = (
		<div
			className={`group relative overflow-hidden rounded-2xl border p-5 shadow-xs transition-all duration-300 hover:scale-[1.01] ${
				theme.gradient
			} ${
				isSelected
					? "ring-2 ring-primary ring-offset-2 ring-offset-background"
					: ""
			} ${className}`}
			onClick={() => onSelect?.(cuenta)}
		>
			{/* Background Metallic Shader Glow */}
			<div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/5 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-white/10" />
			<div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-black/20 blur-xl" />

			{/* Top Bar: Bank Icon, Owner Badge & Actions */}
			<div className="relative z-10 flex items-start justify-between gap-2">
				<div className="flex flex-col gap-0.5">
					<div className="flex items-center gap-1.5">
						<theme.Icon className="h-4 w-4 opacity-90" />
						<span className="text-[11px] font-extrabold tracking-widest uppercase opacity-90">
							{theme.brand}
						</span>
					</div>
				</div>

				<div className="flex items-center gap-1.5">
					{/* Owner Entity Badge */}
					<Badge
						variant="outline"
						className={`text-[9px] font-bold uppercase tracking-wider backdrop-blur-md ${getOwnerBadgeStyle(
							cuenta.titularTipo,
						)}`}
					>
						{ownerLabel}
					</Badge>

					{!readOnly && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 rounded-full text-inherit hover:bg-white/10"
									onClick={(e) => e.stopPropagation()}
								>
									<MoreVertical className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-40">
								<DropdownMenuItem
									onClick={(e) => {
										e.stopPropagation();
										setIsEditOpen(true);
									}}
								>
									<Pencil className="mr-2 h-3.5 w-3.5" />
									Editar cuenta
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="text-destructive focus:text-destructive"
									disabled={isDeleting}
									onClick={(e) => {
										e.stopPropagation();
										handleDelete();
									}}
								>
									<Trash2 className="mr-2 h-3.5 w-3.5" />
									Eliminar
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</div>

			{/* Center Section: EMV Chip + Contactless Signal */}
			<div className="relative z-10 my-3 flex items-center justify-between">
				<div className="h-8 w-11 rounded-md bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 p-0.5 shadow-xs">
					<div className="h-full w-full rounded-[4px] border border-amber-900/30 bg-black/10 grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5">
						<div className="border-r border-b border-amber-900/30" />
						<div className="border-b border-amber-900/30" />
						<div className="border-r border-amber-900/30" />
						<div />
					</div>
				</div>

				<svg
					className="h-5 w-5 opacity-60"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
				>
					<path d="M8.5 14.5A4 4 0 0 0 8.5 9.5" />
					<path d="M12 17A7.5 7.5 0 0 0 12 7" />
					<path d="M15.5 19.5A11 11 0 0 0 15.5 4.5" />
				</svg>
			</div>

			{/* Account Number & Copy Trigger */}
			<div className="relative z-10 flex items-center justify-between gap-2">
				<p className="font-mono text-sm tracking-wider opacity-90">
					{getMaskedNumber()}
				</p>

				<button
					type="button"
					onClick={handleCopy}
					title="Copiar datos de cuenta"
					className="rounded p-1 text-inherit opacity-70 transition hover:bg-white/10 hover:opacity-100"
				>
					{copied ? (
						<Check className="h-3.5 w-3.5 text-emerald-400" />
					) : (
						<Copy className="h-3.5 w-3.5" />
					)}
				</button>
			</div>

			{/* Card Owner Name & Alias */}
			<div className="relative z-10 mt-1">
				<p className="truncate text-xs font-bold uppercase tracking-wide text-white">
					{ownerName}
				</p>
				{cuenta.nombre !== ownerName && (
					<p className="truncate text-[10px] text-white/70">{cuenta.nombre}</p>
				)}
			</div>

			{/* Bottom Section: Balance & Currency */}
			<div className="relative z-10 mt-3 flex items-end justify-between border-t border-white/10 pt-2.5">
				<div>
					<span className="text-[9px] font-semibold uppercase tracking-wider opacity-70">
						Saldo Registrado
					</span>
					<div className="flex items-center gap-2">
						<p className="text-lg font-extrabold tracking-tight">
							{showBalance
								? balance.toLocaleString("es-MX", {
										style: "currency",
										currency: cuenta.moneda,
									})
								: "••••••••••"}
						</p>
						<button
							type="button"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								setShowBalance(!showBalance);
							}}
							className="text-inherit opacity-60 hover:opacity-100"
						>
							{showBalance ? (
								<EyeOff className="h-3.5 w-3.5" />
							) : (
								<Eye className="h-3.5 w-3.5" />
							)}
						</button>
					</div>
				</div>

				<div className="text-right">
					<span className="rounded bg-black/30 px-2 py-0.5 font-mono text-[10px] font-semibold text-white/90">
						{cuenta.moneda}
					</span>
				</div>
			</div>
		</div>
	);

	return (
		<>
			{href ? (
				<Link href={href} className="block">
					{cardContent}
				</Link>
			) : (
				cardContent
			)}

			{/* Edit Account Modal */}
			{!readOnly && (
				<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<Pencil className="h-4 w-4 text-primary" />
								Editar Cuenta de Entidad
							</DialogTitle>
							<DialogDescription>
								Modifica el propietario (Proveedor, Cliente, Familiar,
								Trabajador), banco y saldo.
							</DialogDescription>
						</DialogHeader>

						<form onSubmit={handleSave} className="space-y-4 py-2">
							<div className="space-y-1.5">
								<Label htmlFor="edit-nombre">
									Nombre Identificador de la Cuenta
								</Label>
								<Input
									id="edit-nombre"
									value={nombre}
									onChange={(e) => setNombre(e.target.value)}
									placeholder="Ej. Cuenta BBVA Banamex Don Carlos"
									required
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label htmlFor="edit-titularTipo">
										Propietario / Titular
									</Label>
									<SelectNative
										id="edit-titularTipo"
										value={titularTipo}
										onChange={(e) => setTitularTipo(e.target.value as any)}
									>
										<option value="cliente">Cliente</option>
										<option value="proveedor">Proveedor</option>
										<option value="trabajador">Trabajador</option>
										<option value="familiar">Familiar</option>
										<option value="negocio">Negocio / Empresa</option>
									</SelectNative>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="edit-titularNombre">
										Nombre del Propietario
									</Label>
									<Input
										id="edit-titularNombre"
										value={titularNombre}
										onChange={(e) => setTitularNombre(e.target.value)}
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label htmlFor="edit-bancoNombre">Banco / Institución</Label>
									<Input
										id="edit-bancoNombre"
										value={bancoNombre}
										onChange={(e) => setBancoNombre(e.target.value)}
										placeholder="Ej. BBVA / Banamex"
									/>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="edit-numeroCuenta">Núm. Cuenta / CLABE</Label>
									<Input
										id="edit-numeroCuenta"
										value={numeroCuenta}
										onChange={(e) => setNumeroCuenta(e.target.value)}
										placeholder="1234567890"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label htmlFor="edit-saldo">Saldo Inicial ($)</Label>
									<Input
										id="edit-saldo"
										type="number"
										step="0.01"
										value={saldoInicial}
										onChange={(e) => setSaldoInicial(e.target.value)}
										required
									/>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="edit-estado">Estado</Label>
									<SelectNative
										id="edit-estado"
										value={estado}
										onChange={(e) =>
											setEstado(e.target.value as Cuenta["estado"])
										}
									>
										<option value="activo">Activo</option>
										<option value="inactivo">Inactivo</option>
									</SelectNative>
								</div>
							</div>

							<DialogFooter className="pt-4">
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsEditOpen(false)}
								>
									Cancelar
								</Button>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? "Guardando..." : "Guardar cambios"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			)}
		</>
	);
}
