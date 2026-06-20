import {
  Document,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer"
import type { ReactNode } from "react"

export const mxn = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(n)

const GREEN = "#2C8B55"
const GOLD = "#E0982A"
const INK = "#1f2937"
const MUTED = "#6b7280"
const LINE = "#e5e7eb"

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: INK, fontFamily: "Helvetica" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 2,
    borderBottomColor: GREEN,
    paddingBottom: 12,
    marginBottom: 14,
  },
  brand: { fontSize: 14, fontFamily: "Helvetica-Bold", color: GREEN },
  titulo: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  sub: { fontSize: 9, color: MUTED },
  headerRight: { marginLeft: "auto", textAlign: "right" },
  filtros: { fontSize: 8, color: MUTED, marginBottom: 12 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    marginTop: 10,
  },
  kpis: { flexDirection: "row", gap: 8, marginBottom: 14 },
  kpi: {
    flex: 1,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 6,
    padding: 8,
  },
  kpiLabel: { fontSize: 8, color: MUTED, marginBottom: 3 },
  kpiValue: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  tHead: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
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
  tTotal: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: INK,
  },
  th: { fontSize: 9, fontFamily: "Helvetica-Bold", color: MUTED },
  cell: { fontSize: 9 },
  right: { textAlign: "right" },
  bold: { fontFamily: "Helvetica-Bold" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: MUTED,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 6,
  },
})

export function Logo() {
  return (
    <Svg width={32} height={32} viewBox="0 0 180 180">
      <Path
        d="M0 40C0 18 18 0 40 0H140C162 0 180 18 180 40V140C180 162 162 180 140 180H40C18 180 0 162 0 140Z"
        fill="#16341F"
      />
      <Path
        d="M90 70C118 70 134 90 134 113C134 139 113 156 90 156C67 156 46 139 46 113C46 90 62 70 90 70Z"
        fill={GOLD}
        stroke="#B9781F"
        strokeWidth={3}
      />
      <Path d="M78 84C58 70 46 62 42 48C58 56 80 66 78 84Z" fill={GREEN} />
      <Path d="M102 84C122 70 134 62 138 48C122 56 100 66 102 84Z" fill={GREEN} />
      <Path d="M90 82C82 56 86 42 90 24C94 42 98 56 90 82Z" fill="#5BC676" />
      <Path d="M84 82C70 60 64 50 64 34C76 46 90 60 84 82Z" fill={GREEN} />
      <Path d="M96 82C110 60 116 50 116 34C104 46 90 60 96 82Z" fill={GREEN} />
    </Svg>
  )
}

export function ReportDocument({
  titulo,
  subtitulo,
  generadoEl,
  filtros,
  children,
}: {
  titulo: string
  subtitulo?: string
  generadoEl: string
  filtros?: string
  children: ReactNode
}) {
  return (
    <Document title={titulo} author="Gestión agrícola">
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <Logo />
          <View>
            <Text style={s.brand}>Gestión agrícola</Text>
            <Text style={s.titulo}>{titulo}</Text>
            {subtitulo ? <Text style={s.sub}>{subtitulo}</Text> : null}
          </View>
          <View style={s.headerRight}>
            <Text style={s.sub}>Generado</Text>
            <Text style={s.bold}>{generadoEl}</Text>
          </View>
        </View>
        {filtros ? <Text style={s.filtros}>{filtros}</Text> : null}
        {children}
        <View style={s.footer} fixed>
          <Text>Gestión agrícola · Sistema de gestión agrícola</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}

export function ReportSection({
  titulo,
  children,
}: {
  titulo: string
  children: ReactNode
}) {
  return (
    <View>
      <Text style={s.sectionTitle}>{titulo}</Text>
      {children}
    </View>
  )
}

export function ReportKpis({
  items,
}: {
  items: { label: string; value: string }[]
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
  )
}

export interface Col {
  key: string
  label: string
  align?: "left" | "right"
  width?: number
}

function colStyles(c: Col, head: boolean) {
  const base = c.width ? { width: c.width } : { flex: 1 }
  const lead = head ? s.th : s.cell
  return c.align === "right" ? [lead, s.right, base] : [lead, base]
}

export function ReportTable({
  columns,
  rows,
  total,
}: {
  columns: Col[]
  rows: Record<string, string | number>[]
  total?: Record<string, string | number>
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
        <View key={i} style={s.tRow} wrap={false}>
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
  )
}
