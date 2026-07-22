import {
	Document,
	Image,
	Page,
	StyleSheet,
	Text,
	View,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";

export const mxn = (n: number) =>
	new Intl.NumberFormat("es-MX", {
		style: "currency",
		currency: "MXN",
		maximumFractionDigits: 2,
	}).format(n);

// ─── Paleta ────────────────────────────────────────────────────────────────
const GREEN = "#2C8B55";
const GREEN_DARK = "#1a5c38";
const GREEN_SOFT = "#eaf4ee";
const GOLD = "#E0982A";
const INK = "#1f2937";
const MUTED = "#6b7280";
const LINE = "#d1d5db";
const WHITE = "#ffffff";

// ─── Generador de folio ────────────────────────────────────────────────────
export function generarFolio(prefijo = "RPT"): string {
	const now = new Date();
	const yy = now.getFullYear().toString().slice(-2);
	const mm = String(now.getMonth() + 1).padStart(2, "0");
	const dd = String(now.getDate()).padStart(2, "0");
	const seq = Math.floor(Math.random() * 9000 + 1000); // 4 dígitos
	return `${prefijo}-${yy}${mm}${dd}-${seq}`;
}

// ─── Estilos ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
	page: {
		paddingTop: 0,
		paddingBottom: 52,
		paddingHorizontal: 36,
		fontSize: 10,
		color: INK,
		fontFamily: "Helvetica",
	},

	// Encabezado con banda verde superior
	headerBand: {
		backgroundColor: GREEN_DARK,
		marginHorizontal: -36,
		paddingHorizontal: 36,
		paddingVertical: 10,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 0,
	},
	brandName: {
		fontSize: 13,
		fontFamily: "Helvetica-Bold",
		color: WHITE,
	},
	headerSep: {
		width: 1,
		height: 28,
		backgroundColor: "rgba(255,255,255,0.3)",
		marginHorizontal: 6,
	},
	headerTitles: {
		flex: 1,
	},
	headerDocTitle: {
		fontSize: 11,
		fontFamily: "Helvetica-Bold",
		color: WHITE,
	},
	headerDocSub: {
		fontSize: 8,
		color: "rgba(255,255,255,0.75)",
		marginTop: 1,
	},
	headerRight: {
		alignItems: "flex-end",
		gap: 2,
	},
	headerFolio: {
		fontSize: 8,
		fontFamily: "Helvetica-Bold",
		color: GOLD,
		letterSpacing: 0.5,
	},
	headerDate: {
		fontSize: 8,
		color: "rgba(255,255,255,0.7)",
	},

	// Franja decorativa delgada bajo el header
	headerAccent: {
		backgroundColor: GOLD,
		height: 3,
		marginHorizontal: -36,
		marginBottom: 14,
	},

	filtros: {
		fontSize: 8,
		color: MUTED,
		marginBottom: 12,
		paddingHorizontal: 4,
		paddingVertical: 3,
		backgroundColor: "#f9fafb",
		borderLeftWidth: 2,
		borderLeftColor: GREEN,
	},

	sectionTitle: {
		fontSize: 10,
		fontFamily: "Helvetica-Bold",
		marginBottom: 5,
		marginTop: 12,
		color: GREEN_DARK,
		textTransform: "uppercase",
		letterSpacing: 0.8,
	},

	// KPIs
	kpis: { flexDirection: "row", gap: 8, marginBottom: 14 },
	kpi: {
		flex: 1,
		borderWidth: 1,
		borderColor: GREEN,
		borderRadius: 5,
		padding: 8,
		backgroundColor: GREEN_SOFT,
	},
	kpiLabel: { fontSize: 7.5, color: GREEN_DARK, marginBottom: 4 },
	kpiValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: GREEN_DARK },

	// Tabla
	tHead: {
		flexDirection: "row",
		backgroundColor: GREEN_DARK,
		paddingVertical: 5,
		paddingHorizontal: 6,
	},
	tRow: {
		flexDirection: "row",
		paddingVertical: 4,
		paddingHorizontal: 6,
		borderBottomWidth: 1,
		borderBottomColor: LINE,
	},
	tRowAlt: {
		flexDirection: "row",
		paddingVertical: 4,
		paddingHorizontal: 6,
		backgroundColor: "#f9fafb",
		borderBottomWidth: 1,
		borderBottomColor: LINE,
	},
	tTotal: {
		flexDirection: "row",
		paddingVertical: 6,
		paddingHorizontal: 6,
		backgroundColor: GREEN_SOFT,
		borderTopWidth: 1.5,
		borderTopColor: GREEN,
	},
	th: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: WHITE },
	cell: { fontSize: 8.5 },
	right: { textAlign: "right" },
	bold: { fontFamily: "Helvetica-Bold" },

	// Pie de página
	footer: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: GREEN_DARK,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 36,
		paddingVertical: 7,
	},
	footerLeft: {
		fontSize: 7.5,
		color: "rgba(255,255,255,0.65)",
	},
	footerFolio: {
		fontSize: 7.5,
		color: GOLD,
		fontFamily: "Helvetica-Bold",
	},
	footerPage: {
		fontSize: 9,
		fontFamily: "Helvetica-Bold",
		color: WHITE,
	},

	// Marca de agua
	watermarkWrap: {
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "rotate(-45deg)",
		alignItems: "center",
		justifyContent: "center",
		width: 500,
		marginLeft: -250,
		marginTop: -50,
	},
	watermarkText: {
		fontSize: 48,
		fontFamily: "Helvetica-Bold",
		color: GREEN,
		opacity: 0.06,
		textTransform: "uppercase",
		letterSpacing: 8,
		textAlign: "center",
	},
	watermarkSub: {
		fontSize: 14,
		fontFamily: "Helvetica",
		color: GREEN,
		opacity: 0.06,
		textAlign: "center",
		letterSpacing: 4,
		marginTop: 4,
	},
});

// ─── Logo ──────────────────────────────────────────────────────────────────
export function Logo() {
	return <Image src="/icon.svg" style={{ width: 30, height: 30 }} />;
}

// ─── Documento principal ───────────────────────────────────────────────────
export function ReportDocument({
	titulo,
	subtitulo,
	generadoEl,
	filtros,
	folio,
	children,
}: {
	titulo: string;
	subtitulo?: string;
	generadoEl: string;
	filtros?: string;
	folio: string;
	children: ReactNode;
}) {
	return (
		<Document title={titulo} author="MGZ, S. de P.R. de R.L.">
			<Page size="A4" style={s.page}>
				{/* Marca de agua */}
				<View style={s.watermarkWrap} fixed>
					<Text style={s.watermarkText}>MGZ</Text>
					<Text style={s.watermarkSub}>S. de P.R. de R.L.</Text>
				</View>

				{/* Encabezado con banda verde */}
				<View style={s.headerBand} fixed>
					<Logo />
					<View style={s.headerSep} />
					<View style={s.headerTitles}>
						<Text style={s.brandName}>MGZ, S. de P.R. de R.L.</Text>
						<Text style={s.headerDocTitle}>{titulo}</Text>
						{subtitulo ? <Text style={s.headerDocSub}>{subtitulo}</Text> : null}
					</View>
					<View style={s.headerRight}>
						<Text style={s.headerFolio}>{folio}</Text>
						<Text style={s.headerDate}>Generado: {generadoEl}</Text>
					</View>
				</View>

				{/* Franja dorada decorativa */}
				<View style={s.headerAccent} fixed />

				{filtros ? <Text style={s.filtros}>{filtros}</Text> : null}

				{children}

				{/* Pie de página con folio + hoja */}
				<View style={s.footer} fixed>
					<Text style={s.footerLeft}>MGZ, S. de P.R. de R.L. · Sistema de Gestión Agrícola</Text>
					<Text style={s.footerFolio}>{folio}</Text>
					<Text
						style={s.footerPage}
						render={({ pageNumber, totalPages }) =>
							`Hoja ${pageNumber} / ${totalPages}`
						}
					/>
				</View>
			</Page>
		</Document>
	);
}

// ─── Sección ───────────────────────────────────────────────────────────────
export function ReportSection({
	titulo,
	children,
}: {
	titulo: string;
	children: ReactNode;
}) {
	return (
		<View>
			<Text style={s.sectionTitle}>{titulo}</Text>
			{children}
		</View>
	);
}

// ─── KPIs ──────────────────────────────────────────────────────────────────
export function ReportKpis({
	items,
}: {
	items: { label: string; value: string }[];
}) {
	return (
		<View style={s.kpis}>
			{items.map((it, i) => (
				<View key={i} style={s.kpi}>
					<Text style={s.kpiLabel}>{it.label}</Text>
					<Text style={s.kpiValue}>{it.value}</Text>
				</View>
			))}
		</View>
	);
}

// ─── Tabla ─────────────────────────────────────────────────────────────────
export interface Col {
	key: string;
	label: string;
	align?: "left" | "right";
	width?: number;
}

function colStyles(c: Col, head: boolean) {
	const base = c.width ? { width: c.width } : { flex: 1 };
	const lead = head ? s.th : s.cell;
	return c.align === "right" ? [lead, s.right, base] : [lead, base];
}

export function ReportTable({
	columns,
	rows,
	total,
}: {
	columns: Col[];
	rows: Record<string, string | number>[];
	total?: Record<string, string | number>;
}) {
	return (
		<View>
			<View style={s.tHead}>
				{columns.map((c) => (
					<Text key={c.key} style={colStyles(c, true)}>
						{c.label}
					</Text>
				))}
			</View>
			{rows.map((r, i) => (
				<View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt} wrap={false}>
					{columns.map((c) => (
						<Text key={c.key} style={colStyles(c, false)}>
							{r[c.key] ?? ""}
						</Text>
					))}
				</View>
			))}
			{total ? (
				<View style={s.tTotal}>
					{columns.map((c) => (
						<Text key={c.key} style={[...colStyles(c, false), s.bold]}>
							{total[c.key] ?? ""}
						</Text>
					))}
				</View>
			) : null}
		</View>
	);
}
