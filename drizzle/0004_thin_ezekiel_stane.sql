CREATE TYPE "public"."titular_tipo" AS ENUM('cliente', 'proveedor', 'trabajador', 'familiar', 'negocio');--> statement-breakpoint
ALTER TABLE "cuentas" ADD COLUMN "titular_tipo" "titular_tipo";--> statement-breakpoint
ALTER TABLE "cuentas" ADD COLUMN "titular_nombre" text;--> statement-breakpoint
ALTER TABLE "cuentas" ADD COLUMN "banco_nombre" text;--> statement-breakpoint
ALTER TABLE "cuentas" ADD COLUMN "numero_cuenta" text;