﻿import type { AgingReporte } from "@/lib/accounting";
import { mxn, ReportDocument, ReportKpis, ReportTable } from "./report-shell";

export function AgingDoc({
	generadoEl,
	folio,
	filtros,
	data,
}: {
	generadoEl: string;
	folio: string;
	filtros?: string;
	data: AgingReporte;
}) {
	const t = data.totales;
	return (
		<ReportDocument
			titulo="Antigüedad de saldos (cuentas por pagar)"
			subtitulo="Saldos no pagados por días de vencimiento"
			generadoEl={generadoEl}
			folio={folio}
			filtros={filtros}
		>
			<ReportKpis
				items={[
					{ label: "Saldo total", value: mxn(t.total) },
					{ label: "Por vencer", value: mxn(t.porVencer) },
					{ label: "Vencido +90 días", value: mxn(t.d90) },
				]}
			/>
			<ReportTable
				columns={[
					{ key: "proveedor", label: "Proveedor" },
					{ key: "porVencer", label: "Por vencer", align: "right", width: 66 },
					{ key: "d1_30", label: "1-30", align: "right", width: 56 },
					{ key: "d31_60", label: "31-60", align: "right", width: 56 },
					{ key: "d61_90", label: "61-90", align: "right", width: 56 },
					{ key: "d90", label: "+90", align: "right", width: 56 },
					{ key: "total", label: "Total", align: "right", width: 70 },
				]}
				rows={data.filas.map((f) => ({
					proveedor: f.proveedor,
					porVencer: mxn(f.porVencer),
					d1_30: mxn(f.d1_30),
					d31_60: mxn(f.d31_60),
					d61_90: mxn(f.d61_90),
					d90: mxn(f.d90),
					total: mxn(f.total),
				}))}
				total={{
					proveedor: "Total",
					porVencer: mxn(t.porVencer),
					d1_30: mxn(t.d1_30),
					d31_60: mxn(t.d31_60),
					d61_90: mxn(t.d61_90),
					d90: mxn(t.d90),
					total: mxn(t.total),
				}}
			/>
		</ReportDocument>
	);
}
