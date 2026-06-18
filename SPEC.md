# ESPECIFICACIÓN FUNCIONAL

## Sistema de Gestión Agrícola para Producción de Piña

### Objetivo General

Administrar y controlar las operaciones relacionadas con la producción de piña, permitiendo conocer en todo momento los costos e inversiones realizadas en:

* Mano de obra
* Productos e insumos
* Maquinaria y equipo
* Semilleros

a nivel de:

* Rancho
* Parcela (Lote)
* Plantilla (Tabla)
* Ciclo de cultivo

Asimismo deberá proporcionar trazabilidad completa desde la solicitud de materiales hasta la generación de cuentas por pagar.

---

# 1. ESTRUCTURA PRODUCTIVA

## 1.1 Ranchos

El sistema deberá permitir registrar ranchos.

Datos mínimos:

* Nombre
* Estado (Activo/Inactivo)

---

## 1.2 Parcelas (Lotes)

Cada rancho podrá contener múltiples parcelas.

Datos mínimos:

* Rancho
* Número o identificador
* Superficie en m²
* Estado

---

## 1.3 Plantillas (Tablas)

Cada parcela podrá contener múltiples plantillas.

Datos mínimos:

* Parcela
* Número
* Superficie en m²

---

# 2. CICLOS DE CULTIVO

## 2.1 Ciclo

El sistema deberá registrar ciclos productivos.

Un ciclo representa el proceso completo desde preparación de tierra hasta cosecha.

Datos mínimos:

* Parcela
* Fecha de inicio
* Fecha estimada de cosecha
* Estado

Estados:

```text
Planeado
Activo
Cosechado
Cerrado
```

---

## 2.2 Siembra

El sistema deberá registrar siembras realizadas en cada plantilla.

Datos:

* Ciclo
* Plantilla
* Fecha
* Cantidad de plantas sembradas

---

# 3. SEMILLEROS

## 3.1 Áreas semillero

El sistema deberá permitir identificar parcelas destinadas a semillero.

Deberá registrar:

* Costos de mano de obra
* Costos de insumos
* Costos de maquinaria

---

## 3.2 Producción de plantas

El sistema deberá registrar:

* Cantidad de plantas obtenidas
* Fecha de producción

---

## 3.3 Costeo de semilla

El sistema deberá calcular:

```text
Costo Total Semillero
/
Cantidad de Plantas Generadas
=
Costo Unitario de Planta
```

Este costo podrá transferirse a nuevas siembras.

---

# 4. MANO DE OBRA

## 4.1 Catálogo de actividades

El sistema deberá administrar un catálogo de actividades.

Ejemplos:

* Siembra
* Deshierbe
* Fumigación
* Croquis
* Limpieza
* Preparación de tierra

---

## 4.2 Registro de actividades realizadas

El sistema deberá registrar:

* Fecha
* Actividad
* Rancho
* Parcela
* Plantilla
* Responsable
* Cantidad ejecutada
* Costo

---

## 4.3 Costeo

El sistema deberá acumular costos de mano de obra por:

* Rancho
* Parcela
* Plantilla
* Ciclo

---

# 5. PRODUCTOS E INSUMOS

## 5.1 Catálogo de productos

Cada producto deberá registrar:

* Ingrediente activo
* Nombre comercial
* Presentación
* Unidad de medida

---

## 5.2 Restricciones

Un producto no podrá eliminarse si posee:

* Compras registradas
* Vales de salida
* Movimientos de inventario

---

# 6. PROVEEDORES

## 6.1 Catálogo de proveedores

Datos requeridos:

* Razón social
* Contacto
* Teléfono principal
* Teléfono secundario
* WhatsApp
* Correo electrónico

---

# 7. INVENTARIOS

## 7.1 Almacén

El sistema deberá mantener existencias de productos.

---

## 7.2 Método PEPS

El inventario deberá operar bajo el método:

```text
PEPS
(Primeras Entradas Primeras Salidas)
```

---

## 7.3 Entradas

Cada entrada deberá registrar:

* Producto
* Fecha
* Cantidad
* Costo unitario
* Proveedor
* Factura asociada

---

## 7.4 Salidas

Cada salida deberá registrar:

* Producto
* Cantidad
* Costo unitario
* Destino

---

## 7.5 Existencias

El sistema deberá mostrar:

* Existencia actual
* Historial de movimientos
* Kardex

---

# 8. REQUERIMIENTOS

## 8.1 Solicitudes

El área operativa podrá generar solicitudes de requerimientos.

Datos mínimos:

* Folio
* Fecha
* Solicitante
* Observaciones

---

## 8.2 Detalle

Cada solicitud deberá contener:

* Producto
* Cantidad requerida
* Unidad de medida

---

# 9. COTIZACIONES

## 9.1 Cotización de requerimientos

El sistema deberá generar cotizaciones asociadas a solicitudes.

---

## 9.2 Seguimiento

El sistema deberá permitir conocer:

* Productos cotizados
* Productos pendientes
* Productos comprados

---

# 10. ÓRDENES DE COMPRA

## 10.1 Generación

El sistema deberá generar órdenes de compra.

Datos mínimos:

* Folio
* Fecha
* Proveedor
* Productos
* Cantidades

---

## 10.2 Estados

```text
Borrador
Autorizada
Parcialmente surtida
Surtida
Cancelada
```

---

# 11. RECEPCIÓN DE PRODUCTOS

## 11.1 Recepción

El almacén deberá registrar:

* Orden de compra
* Factura
* Productos recibidos
* Cantidades

---

## 11.2 Validación

El sistema deberá permitir comparar:

* Orden de compra
* Factura
* Productos recibidos

---

# 12. CUENTAS POR PAGAR

## 12.1 Generación

La recepción de productos podrá generar cuentas por pagar.

Datos mínimos:

* Proveedor
* Factura
* Importe
* Fecha de vencimiento

---

# 13. VALES DE SALIDA

## 13.1 Generación

El almacén podrá generar vales de salida.

---

## 13.2 Información requerida

* Folio
* Fecha
* Responsable
* Productos entregados
* Cantidades
* Costos

---

## 13.3 Imputación de costo

Cada salida deberá asociarse a:

* Rancho
* Parcela
* Plantilla
* Ciclo

---

# 14. COSTEO AGRÍCOLA

## 14.1 Acumulación de costos

El sistema deberá acumular:

### Mano de obra

* Siembra
* Mantenimiento
* Croquis
* Otras actividades

### Productos

* Fertilizantes
* Fungicidas
* Adherentes
* Otros insumos

### Maquinaria y equipo

* Costos registrados

---

## 14.2 Niveles de costeo

El sistema deberá calcular costos por:

* Rancho
* Parcela
* Plantilla
* Ciclo de cultivo

---

# 15. TRAZABILIDAD

El sistema deberá permitir rastrear:

```text
Solicitud
↓
Cotización
↓
Orden de Compra
↓
Recepción
↓
Factura
↓
Cuenta por Pagar
↓
Salida de Inventario
↓
Aplicación en Campo
↓
Costo Final
```

---

# 16. REPORTES

## Producción

* Plantas sembradas
* Plantas producidas
* Plantas utilizadas

---

## Inventario

* Existencias
* Movimientos
* Kardex PEPS

---

## Compras

* Solicitudes
* Cotizaciones
* Órdenes
* Facturas

---

## Costos

* Por rancho
* Por parcela
* Por plantilla
* Por ciclo

---

# REQUISITOS PENDIENTES DE DEFINICIÓN

## Organización territorial

Pendiente aclarar:

* ¿Parcela, lote y fracción son sinónimos?
* ¿Existe otro nivel jerárquico?

---

## Plantas

Pendiente definir:

* Mortalidad de plantas.
* Reposición de plantas.
* Historial de pérdidas.

---

## Semilleros

Pendiente definir:

* Cuándo inicia un semillero.
* Cuándo finaliza.
* Cómo se transfiere el costo a la nueva siembra.

---

## Mano de obra

Pendiente definir:

* Pago por persona.
* Pago por cuadrilla.
* Pago semanal.
* Pago quincenal.
* Pago a destajo.

---

## Maquinaria y equipo

Pendiente definir:

* Catálogo de maquinaria.
* Horas máquina.
* Costos operativos.
* Mantenimiento.
* Combustible.

---

## Pipetas

Pendiente definir:

* Qué es exactamente una pipeta.
* Cómo se prepara.
* Quién la prepara.
* Cómo se costea.
* Cómo se aplica.
* Si existe una receta o formulación reutilizable.

---

## Lista de requerimientos

Pendiente definir:

* Significado de "numApp".
* Significado de "Repet".
* Significado exacto de "Lugar".

---

## Compras

Pendiente definir:

* Una cotización por proveedor o global.
* Compras parciales.
* Compras en múltiples órdenes.

---

## Inventario

Pendiente definir:

* Productos caducados.
* Mermas.
* Ajustes de inventario.
* Existencias mínimas.
* Existencias máximas.

---

## Recepciones

Pendiente definir:

* Recepciones parciales.
* Devoluciones.
* Diferencias contra factura.

---

## Costeo

Pendiente definir:

* Distribución de costos indirectos.
* Costos administrativos.
* Costos compartidos entre varias plantillas.

---

## Ciclo de cultivo

Pendiente definir:

* Estados exactos del ciclo.
* Eventos de cierre.
* Reglas de reapertura.
* Manejo de cosechas parciales.

---

Con esta especificación ya puede elaborarse un **modelo entidad-relación**, un **diagrama BPMN de procesos**, y una **estimación funcional por módulos** mucho más defendible para una propuesta económica.
