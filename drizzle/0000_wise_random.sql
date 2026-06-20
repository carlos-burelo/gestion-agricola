CREATE TYPE "public"."estado_activo" AS ENUM('activo', 'inactivo');--> statement-breakpoint
CREATE TYPE "public"."estado_ciclo" AS ENUM('planeado', 'activo', 'cosechado', 'cerrado');--> statement-breakpoint
CREATE TYPE "public"."estado_cotizacion" AS ENUM('pendiente', 'cotizada', 'comprada');--> statement-breakpoint
CREATE TYPE "public"."estado_cuenta_por_pagar" AS ENUM('pendiente', 'pagada', 'vencida');--> statement-breakpoint
CREATE TYPE "public"."estado_orden_compra" AS ENUM('borrador', 'autorizada', 'parcial', 'surtida', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."tipo_movimiento" AS ENUM('entrada', 'salida');--> statement-breakpoint
CREATE TABLE "actividades" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ciclos" (
	"id" text PRIMARY KEY NOT NULL,
	"parcela_id" text NOT NULL,
	"fecha_inicio" timestamp with time zone NOT NULL,
	"fecha_cosecha_estimada" timestamp with time zone NOT NULL,
	"estado" "estado_ciclo" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cotizaciones" (
	"id" text PRIMARY KEY NOT NULL,
	"requerimiento_id" text NOT NULL,
	"proveedor_id" text NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"estado" "estado_cotizacion" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cuentas_por_pagar" (
	"id" text PRIMARY KEY NOT NULL,
	"proveedor_id" text NOT NULL,
	"factura" text NOT NULL,
	"importe" double precision NOT NULL,
	"fecha_vencimiento" timestamp with time zone NOT NULL,
	"estado" "estado_cuenta_por_pagar" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "detalle_cotizacion" (
	"id" serial PRIMARY KEY NOT NULL,
	"cotizacion_id" text NOT NULL,
	"producto_id" text NOT NULL,
	"cantidad" double precision NOT NULL,
	"precio_unitario" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "detalle_orden_compra" (
	"id" serial PRIMARY KEY NOT NULL,
	"orden_compra_id" text NOT NULL,
	"producto_id" text NOT NULL,
	"cantidad" double precision NOT NULL,
	"precio_unitario" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "detalle_recepcion" (
	"id" serial PRIMARY KEY NOT NULL,
	"recepcion_id" text NOT NULL,
	"producto_id" text NOT NULL,
	"cantidad" double precision NOT NULL,
	"costo_unitario" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "detalle_requerimiento" (
	"id" serial PRIMARY KEY NOT NULL,
	"requerimiento_id" text NOT NULL,
	"producto_id" text NOT NULL,
	"cantidad" double precision NOT NULL,
	"unidad_medida" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "detalle_vale" (
	"id" serial PRIMARY KEY NOT NULL,
	"vale_salida_id" text NOT NULL,
	"producto_id" text NOT NULL,
	"cantidad" double precision NOT NULL,
	"costo_unitario" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movimientos_inventario" (
	"id" text PRIMARY KEY NOT NULL,
	"producto_id" text NOT NULL,
	"tipo" "tipo_movimiento" NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"cantidad" double precision NOT NULL,
	"costo_unitario" double precision NOT NULL,
	"proveedor_id" text NOT NULL,
	"factura" text NOT NULL,
	"destino" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ordenes_compra" (
	"id" text PRIMARY KEY NOT NULL,
	"folio" text NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"proveedor_id" text NOT NULL,
	"estado" "estado_orden_compra" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parcelas" (
	"id" text PRIMARY KEY NOT NULL,
	"rancho_id" text NOT NULL,
	"identificador" text NOT NULL,
	"superficie_m2" double precision NOT NULL,
	"estado" "estado_activo" NOT NULL,
	"es_semillero" boolean NOT NULL,
	"geometria" jsonb,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plantillas" (
	"id" text PRIMARY KEY NOT NULL,
	"parcela_id" text NOT NULL,
	"numero" text NOT NULL,
	"superficie_m2" double precision NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productos" (
	"id" text PRIMARY KEY NOT NULL,
	"ingrediente_activo" text NOT NULL,
	"nombre_comercial" text NOT NULL,
	"presentacion" text NOT NULL,
	"unidad_medida" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proveedores" (
	"id" text PRIMARY KEY NOT NULL,
	"razon_social" text NOT NULL,
	"contacto" text NOT NULL,
	"telefono_principal" text NOT NULL,
	"telefono_secundario" text NOT NULL,
	"whatsapp" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ranchos" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"estado" "estado_activo" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recepciones" (
	"id" text PRIMARY KEY NOT NULL,
	"orden_compra_id" text NOT NULL,
	"factura" text NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registros_actividad" (
	"id" text PRIMARY KEY NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"actividad_id" text NOT NULL,
	"rancho_id" text NOT NULL,
	"parcela_id" text NOT NULL,
	"plantilla_id" text NOT NULL,
	"ciclo_id" text NOT NULL,
	"responsable" text NOT NULL,
	"cantidad" double precision NOT NULL,
	"costo" double precision NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requerimientos" (
	"id" text PRIMARY KEY NOT NULL,
	"folio" text NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"solicitante" text NOT NULL,
	"observaciones" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "semilleros" (
	"id" text PRIMARY KEY NOT NULL,
	"parcela_id" text NOT NULL,
	"fecha_produccion" timestamp with time zone NOT NULL,
	"costo_mano_obra" double precision NOT NULL,
	"costo_insumos" double precision NOT NULL,
	"costo_maquinaria" double precision NOT NULL,
	"plantas_producidas" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "siembras" (
	"id" text PRIMARY KEY NOT NULL,
	"ciclo_id" text NOT NULL,
	"plantilla_id" text NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"cantidad_plantas" integer NOT NULL,
	"costo_unitario_planta" double precision NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vales_salida" (
	"id" text PRIMARY KEY NOT NULL,
	"folio" text NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"responsable" text NOT NULL,
	"rancho_id" text NOT NULL,
	"parcela_id" text NOT NULL,
	"plantilla_id" text NOT NULL,
	"ciclo_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ciclos" ADD CONSTRAINT "ciclos_parcela_id_parcelas_id_fk" FOREIGN KEY ("parcela_id") REFERENCES "public"."parcelas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_requerimiento_id_requerimientos_id_fk" FOREIGN KEY ("requerimiento_id") REFERENCES "public"."requerimientos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cuentas_por_pagar" ADD CONSTRAINT "cuentas_por_pagar_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detalle_cotizacion" ADD CONSTRAINT "detalle_cotizacion_cotizacion_id_cotizaciones_id_fk" FOREIGN KEY ("cotizacion_id") REFERENCES "public"."cotizaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detalle_cotizacion" ADD CONSTRAINT "detalle_cotizacion_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detalle_orden_compra" ADD CONSTRAINT "detalle_orden_compra_orden_compra_id_ordenes_compra_id_fk" FOREIGN KEY ("orden_compra_id") REFERENCES "public"."ordenes_compra"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detalle_orden_compra" ADD CONSTRAINT "detalle_orden_compra_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detalle_recepcion" ADD CONSTRAINT "detalle_recepcion_recepcion_id_recepciones_id_fk" FOREIGN KEY ("recepcion_id") REFERENCES "public"."recepciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detalle_recepcion" ADD CONSTRAINT "detalle_recepcion_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detalle_requerimiento" ADD CONSTRAINT "detalle_requerimiento_requerimiento_id_requerimientos_id_fk" FOREIGN KEY ("requerimiento_id") REFERENCES "public"."requerimientos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detalle_requerimiento" ADD CONSTRAINT "detalle_requerimiento_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detalle_vale" ADD CONSTRAINT "detalle_vale_vale_salida_id_vales_salida_id_fk" FOREIGN KEY ("vale_salida_id") REFERENCES "public"."vales_salida"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detalle_vale" ADD CONSTRAINT "detalle_vale_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcelas" ADD CONSTRAINT "parcelas_rancho_id_ranchos_id_fk" FOREIGN KEY ("rancho_id") REFERENCES "public"."ranchos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantillas" ADD CONSTRAINT "plantillas_parcela_id_parcelas_id_fk" FOREIGN KEY ("parcela_id") REFERENCES "public"."parcelas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recepciones" ADD CONSTRAINT "recepciones_orden_compra_id_ordenes_compra_id_fk" FOREIGN KEY ("orden_compra_id") REFERENCES "public"."ordenes_compra"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registros_actividad" ADD CONSTRAINT "registros_actividad_actividad_id_actividades_id_fk" FOREIGN KEY ("actividad_id") REFERENCES "public"."actividades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registros_actividad" ADD CONSTRAINT "registros_actividad_rancho_id_ranchos_id_fk" FOREIGN KEY ("rancho_id") REFERENCES "public"."ranchos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registros_actividad" ADD CONSTRAINT "registros_actividad_parcela_id_parcelas_id_fk" FOREIGN KEY ("parcela_id") REFERENCES "public"."parcelas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registros_actividad" ADD CONSTRAINT "registros_actividad_plantilla_id_plantillas_id_fk" FOREIGN KEY ("plantilla_id") REFERENCES "public"."plantillas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registros_actividad" ADD CONSTRAINT "registros_actividad_ciclo_id_ciclos_id_fk" FOREIGN KEY ("ciclo_id") REFERENCES "public"."ciclos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semilleros" ADD CONSTRAINT "semilleros_parcela_id_parcelas_id_fk" FOREIGN KEY ("parcela_id") REFERENCES "public"."parcelas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "siembras" ADD CONSTRAINT "siembras_ciclo_id_ciclos_id_fk" FOREIGN KEY ("ciclo_id") REFERENCES "public"."ciclos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "siembras" ADD CONSTRAINT "siembras_plantilla_id_plantillas_id_fk" FOREIGN KEY ("plantilla_id") REFERENCES "public"."plantillas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vales_salida" ADD CONSTRAINT "vales_salida_rancho_id_ranchos_id_fk" FOREIGN KEY ("rancho_id") REFERENCES "public"."ranchos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vales_salida" ADD CONSTRAINT "vales_salida_parcela_id_parcelas_id_fk" FOREIGN KEY ("parcela_id") REFERENCES "public"."parcelas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vales_salida" ADD CONSTRAINT "vales_salida_plantilla_id_plantillas_id_fk" FOREIGN KEY ("plantilla_id") REFERENCES "public"."plantillas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vales_salida" ADD CONSTRAINT "vales_salida_ciclo_id_ciclos_id_fk" FOREIGN KEY ("ciclo_id") REFERENCES "public"."ciclos"("id") ON DELETE no action ON UPDATE no action;