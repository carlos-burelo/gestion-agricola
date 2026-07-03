CREATE TYPE "public"."direccion_movimiento_financiero" AS ENUM('entrada', 'salida');--> statement-breakpoint
CREATE TYPE "public"."rol_usuario" AS ENUM('admin', 'persona');--> statement-breakpoint
CREATE TYPE "public"."tipo_categoria" AS ENUM('ingreso', 'egreso');--> statement-breakpoint
CREATE TYPE "public"."tipo_cuenta" AS ENUM('banco', 'efectivo', 'persona', 'reserva');--> statement-breakpoint
CREATE TABLE "categorias" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"tipo" "tipo_categoria" NOT NULL,
	"parent_id" text,
	"orden" integer NOT NULL,
	"estado" "estado_activo" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cuentas" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"tipo" "tipo_cuenta" NOT NULL,
	"moneda" text NOT NULL,
	"saldo_inicial" double precision NOT NULL,
	"estado" "estado_activo" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movimientos" (
	"id" text PRIMARY KEY NOT NULL,
	"cuenta_id" text NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"direccion" "direccion_movimiento_financiero" NOT NULL,
	"categoria_id" text,
	"monto" double precision NOT NULL,
	"beneficiario" text,
	"referencia" text,
	"folio" text,
	"descripcion" text,
	"traspaso_id" text,
	"creado_por" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traspasos" (
	"id" text PRIMARY KEY NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"cuenta_origen_id" text NOT NULL,
	"cuenta_destino_id" text NOT NULL,
	"monto" double precision NOT NULL,
	"referencia" text,
	"creado_por" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuario_cuentas" (
	"id" text PRIMARY KEY NOT NULL,
	"usuario_id" text NOT NULL,
	"cuenta_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"rol" "rol_usuario" NOT NULL,
	"estado" "estado_activo" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_parent_id_categorias_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_cuenta_id_cuentas_id_fk" FOREIGN KEY ("cuenta_id") REFERENCES "public"."cuentas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_traspaso_id_traspasos_id_fk" FOREIGN KEY ("traspaso_id") REFERENCES "public"."traspasos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_creado_por_usuarios_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traspasos" ADD CONSTRAINT "traspasos_cuenta_origen_id_cuentas_id_fk" FOREIGN KEY ("cuenta_origen_id") REFERENCES "public"."cuentas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traspasos" ADD CONSTRAINT "traspasos_cuenta_destino_id_cuentas_id_fk" FOREIGN KEY ("cuenta_destino_id") REFERENCES "public"."cuentas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traspasos" ADD CONSTRAINT "traspasos_creado_por_usuarios_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario_cuentas" ADD CONSTRAINT "usuario_cuentas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario_cuentas" ADD CONSTRAINT "usuario_cuentas_cuenta_id_cuentas_id_fk" FOREIGN KEY ("cuenta_id") REFERENCES "public"."cuentas"("id") ON DELETE no action ON UPDATE no action;