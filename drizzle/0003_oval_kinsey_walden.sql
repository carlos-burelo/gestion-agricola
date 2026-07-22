CREATE TYPE "public"."estado_anticipo" AS ENUM('pendiente', 'aplicado');--> statement-breakpoint
CREATE TYPE "public"."estado_prestamo" AS ENUM('activo', 'liquidado');--> statement-breakpoint
CREATE TYPE "public"."estado_venta" AS ENUM('pagada', 'pendiente', 'parcial');--> statement-breakpoint
CREATE TYPE "public"."tipo_gasto_externo" AS ENUM('operativo', 'administrativo', 'familiar');--> statement-breakpoint
CREATE TYPE "public"."tipo_pago_venta" AS ENUM('contado', 'cxc');--> statement-breakpoint
CREATE TYPE "public"."tipo_prestamo" AS ENUM('bancario', 'externo');--> statement-breakpoint
CREATE TABLE "abonos_clientes" (
	"id" text PRIMARY KEY NOT NULL,
	"cliente_id" text NOT NULL,
	"venta_id" text NOT NULL,
	"banco_cuenta_id" text NOT NULL,
	"monto" double precision NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"folio" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "abonos_prestamos" (
	"id" text PRIMARY KEY NOT NULL,
	"tipo_prestamo" "tipo_prestamo" NOT NULL,
	"prestamo_id" text NOT NULL,
	"banco_cuenta_id" text NOT NULL,
	"monto" double precision NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"folio" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anticipos_clientes" (
	"id" text PRIMARY KEY NOT NULL,
	"cliente_id" text NOT NULL,
	"banco_cuenta_id" text NOT NULL,
	"monto" double precision NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"forma_pago" text NOT NULL,
	"folio" text NOT NULL,
	"estado" "estado_anticipo" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cargos_comisiones" (
	"id" text PRIMARY KEY NOT NULL,
	"banco_cuenta_id" text NOT NULL,
	"cat_gasto_financiero_id" text NOT NULL,
	"monto" double precision NOT NULL,
	"folio" text NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"observaciones" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cat_gastos_administrativos" (
	"id" text PRIMARY KEY NOT NULL,
	"concepto" text NOT NULL,
	"descripcion" text NOT NULL,
	"estado" "estado_activo" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cat_gastos_familia" (
	"id" text PRIMARY KEY NOT NULL,
	"concepto" text NOT NULL,
	"descripcion" text NOT NULL,
	"estado" "estado_activo" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cat_gastos_financieros" (
	"id" text PRIMARY KEY NOT NULL,
	"concepto" text NOT NULL,
	"descripcion" text NOT NULL,
	"estado" "estado_activo" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cat_gastos_operativos" (
	"id" text PRIMARY KEY NOT NULL,
	"concepto" text NOT NULL,
	"descripcion" text NOT NULL,
	"estado" "estado_activo" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre_razon_social" text NOT NULL,
	"rfc" text NOT NULL,
	"telefono" text NOT NULL,
	"email" text NOT NULL,
	"direccion" text NOT NULL,
	"estado" "estado_activo" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "familiares" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"parentesco" text NOT NULL,
	"telefono" text NOT NULL,
	"estado" "estado_activo" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gastos_externos" (
	"id" text PRIMARY KEY NOT NULL,
	"tipo_gasto" "tipo_gasto_externo" NOT NULL,
	"cat_gasto_id" text NOT NULL,
	"familiar_id" text,
	"banco_cuenta_id" text NOT NULL,
	"monto" double precision NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"folio_factura" text NOT NULL,
	"observaciones" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prestamos_bancarios" (
	"id" text PRIMARY KEY NOT NULL,
	"banco_cuenta_id" text NOT NULL,
	"banco_nombre" text NOT NULL,
	"folio" text NOT NULL,
	"monto_total" double precision NOT NULL,
	"tasa_interes" double precision NOT NULL,
	"fecha_concesion" timestamp with time zone NOT NULL,
	"saldo_pendiente" double precision NOT NULL,
	"estado" "estado_prestamo" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prestamos_externos" (
	"id" text PRIMARY KEY NOT NULL,
	"prestamista_nombre" text NOT NULL,
	"banco_cuenta_id" text NOT NULL,
	"folio" text NOT NULL,
	"monto_total" double precision NOT NULL,
	"fecha_concesion" timestamp with time zone NOT NULL,
	"saldo_pendiente" double precision NOT NULL,
	"estado" "estado_prestamo" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trabajadores" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"puesto" text NOT NULL,
	"salario_base" double precision NOT NULL,
	"telefono" text NOT NULL,
	"estado" "estado_activo" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transferencias_hijuelos" (
	"id" text PRIMARY KEY NOT NULL,
	"cuenta_origen_id" text NOT NULL,
	"cuenta_destino_id" text NOT NULL,
	"monto" double precision NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"folio_fiscal" text NOT NULL,
	"concepto_fiscal" text NOT NULL,
	"observaciones" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ventas_ganado" (
	"id" text PRIMARY KEY NOT NULL,
	"cliente_id" text NOT NULL,
	"cabezas_o_kg" double precision NOT NULL,
	"precio_unitario" double precision NOT NULL,
	"monto_total" double precision NOT NULL,
	"tipo_pago" "tipo_pago_venta" NOT NULL,
	"banco_cuenta_id" text NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"estado" "estado_venta" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ventas_pina" (
	"id" text PRIMARY KEY NOT NULL,
	"cliente_id" text NOT NULL,
	"folio_lote_produccion" text NOT NULL,
	"kilos_enviados" double precision NOT NULL,
	"precio_por_kg" double precision NOT NULL,
	"monto_total" double precision NOT NULL,
	"tipo_pago" "tipo_pago_venta" NOT NULL,
	"banco_cuenta_id" text NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"estado" "estado_venta" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proveedores" ADD COLUMN "estado" "estado_activo" NOT NULL;--> statement-breakpoint
ALTER TABLE "registros_actividad" ADD COLUMN "trabajador_id" text;--> statement-breakpoint
ALTER TABLE "abonos_clientes" ADD CONSTRAINT "abonos_clientes_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anticipos_clientes" ADD CONSTRAINT "anticipos_clientes_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ventas_ganado" ADD CONSTRAINT "ventas_ganado_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ventas_pina" ADD CONSTRAINT "ventas_pina_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registros_actividad" ADD CONSTRAINT "registros_actividad_trabajador_id_trabajadores_id_fk" FOREIGN KEY ("trabajador_id") REFERENCES "public"."trabajadores"("id") ON DELETE no action ON UPDATE no action;