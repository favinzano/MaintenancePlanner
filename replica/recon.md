# Recon funcional: iMPS, GWOS-AI y PlannerMC

**Fecha de corte:** 2026-10-29  
**Estado:** recon documental de productos + observación visual de MacroCap Operations  
**Objetivo:** identificar qué capacidades de iMPS y GWOS-AI se acercan a PlannerMC, qué se puede reutilizar como referencia y qué parte sigue siendo propia de PlannerMC.

## Alcance y método

Este análisis usa páginas oficiales de Innovapptive y Prometheus Group, la especificación local de PlannerMC y una observación visual de MacroCap Operations. Los proveedores describen sus productos en páginas comerciales; no se observó una sesión funcional de iMPS o GWOS-AI. La vista de MacroCap se usó como referencia de identidad y presentación visual, no para recopilar información operativa.

La matriz de [features.csv](./features.csv) marca evidencia del proveedor como yes, partial o no evidence. No evidence significa que la capacidad no quedó establecida por las fuentes citadas; no prueba que el producto carezca de ella. Las etiquetas must/skip expresan cómo coincide la función con el alcance actual de PlannerMC, no la importancia del producto comercial.

## Fuentes

| Fuente | Evidencia usada |
| --- | --- |
| [Innovapptive iMPS: Maintenance Planning and Scheduling](https://www.innovapptive.com/software/planning-and-scheduling-software) | Agentes de empaque, readiness, bundling, duración/frecuencia, demanda y programación; flujo de demanda hasta feedback de ejecución. |
| [Prometheus-AI capabilities](https://www.prometheusgroup.com/ai-capabilities) | GWOS-AI, recomendaciones basadas en historial, re-asignación en lenguaje natural, cambios masivos y optimización por crew/location. |
| [GWOS-AI for Oracle](https://www.prometheusgroup.com/solutions/planning-and-scheduling-oracle) | Guía de planificación, Scheduler Gantt, Shift Updater, resultados de ejecución y sincronización Oracle descrita por el proveedor. |
| [Prometheus Planning & Scheduling for SAP](https://www.prometheusgroup.com/solutions/planning-and-scheduling) | Dashboard, Scheduler, Shift Updater, Order Planner, Work Package Manager, Material Shopping Cart. |
| [MacroCap Operations / Production Operations](https://ops.macrocaplabs.com/production-operations/daily-overview) | Vista Daily Overview observada con una sesión abierta del navegador. Solo se registró disposición visual. |
| [Logo MacroCap Labs](https://ops.macrocaplabs.com/macrocap-labs-logo-auth-384-v2.avif) | Asset del wordmark visible en la pantalla de acceso; dimensiones nativas 224×71 px. |
| [PlannerMC MVP spec](../specs/001-plannermc-mvp/spec.md) | Requisitos funcionales, límites del MVP e idioma. |
| [PlannerMC plan](../specs/001-plannermc-mvp/plan.md) | Arquitectura propuesta y decisiones técnicas todavía abiertas. |

## Qué declara cada producto

### Innovapptive iMPS

La página del proveedor describe siete agentes para empaque, readiness, agrupamiento de trabajos, optimización de duración/frecuencia, pronóstico de demanda y programación/despacho. El Work Packaging Agent asocia una nueva orden de trabajo con historial del activo o con un activo similar identificado, y compone operaciones, materiales, trades y permisos con un nivel de confianza. El planner puede aprobar, guardar como draft o devolver para construcción manual.

El Schedule Readiness Agent comprueba estado de materiales, permisos, aislamientos y acciones pendientes; cada blocker puede tener responsable y fecha. La página también declara una solicitud de compra cuando falta stock y que lo no resuelto se mantiene fuera del programa. La planificación considera ventanas de downtime, fechas ERP/EAM, capacidad y habilidades del crew. El scheduler conserva aprobación y puede modificar o revertir recomendaciones. La historia de ejecución alimenta recomendaciones posteriores.

Estas son declaraciones del proveedor, no observaciones de comportamiento del producto. La página menciona un product tour, pero no se inspeccionó una sesión del software.

### Prometheus GWOS-AI

Las páginas oficiales describen una guía paso a paso para revisar trabajo existente, insertar trabajos con fecha fija, planificar PMs y correctivos, y optimizar por crew/location. GWOS-AI se presenta como entrenado con más de veinte años de datos de mantenimiento y como capaz de reasignar recursos mediante lenguaje natural, hacer cambios masivos y usar resultados de trabajo completado para futuras recomendaciones.

Para Oracle, el proveedor describe un Dashboard configurable por rol, un Scheduler gráfico Gantt con drag-and-drop y cambios masivos, y Shift Updater para disponibilidad de labor, craft y crews. También describe conexión directa y sincronización en tiempo real con Oracle.

Para SAP, el proveedor enumera:

- **Order Planner:** planificación de órdenes con biblioteca de actividades templadas.
- **Work Package Manager:** compilación de documentos relacionados con las órdenes.
- **Material Shopping Cart:** búsqueda de materiales e información de inventario y precio.
- **Scheduler y Shift Updater:** programación gráfica y disponibilidad de recursos.

Las fuentes citadas describen integración empresarial, pero no permiten afirmar que cada integración y configuración tenga el mismo contrato de escritura, dirección o sincronización.

## Flujos que se pueden contrastar

### iMPS, según el flujo publicado

1. Recibe órdenes de trabajo, PMs y demanda correctiva desde ERP/EAM y señales de planta.
2. Construye un paquete con operaciones, materiales, trades, permisos, historial/evidencia y duración.
3. Comprueba readiness y mantiene bloqueos visibles con responsable y fecha.
4. Verifica restricciones de downtime, fechas, crew, habilidades, turnos y capacidad.
5. Recomienda la asignación; el scheduler aprueba, ajusta o revierte.
6. Recibe feedback de ejecución para futuras recomendaciones.

### GWOS-AI, según el flujo publicado

1. Revisa el backlog y los trabajos fijos.
2. Agrega PMs y trabajos correctivos.
3. Planifica mediante actividades templadas, materiales y documentos de la orden.
4. Optimiza fechas y recursos por crew/location.
5. Actualiza la disponibilidad del crew y ajusta el Gantt.
6. Usa duraciones, materiales y resultados reales en recomendaciones posteriores.

### PlannerMC, según la especificación local

1. Analiza un equipo a partir de manual PDF/Word/imagen, investigación externa o datos del planner.
2. Expone procedencia, limitaciones y dudas, y espera la decisión del Maintenance Planner antes de avanzar.
3. Propone el equipo y sus sub-assets directos.
4. Prepara una PM en inglés con duración, frecuencia, estado operativo, seguridad/LOTO, tarea y verificación final, hasta 15 pasos.
5. Permite editar y aprobar, conserva borradores/revisiones y registra fuentes o datos del planner.
6. Entrega el contenido para copiar manualmente al CMMS.

La especificación deja fuera la programación de órdenes, inventario, compras, creación/cierre de WOs y sincronización directa con el CMMS.

## Qué tan cerca están de PlannerMC

[Inference] **iMPS es el referente funcional más cercano para el trabajo con evidencia y el readiness previo a programar.** Su paquete de trabajo toma órdenes existentes e historial de ejecución y agrega operaciones, materiales, trades y permisos. PlannerMC empieza con documentación del equipo, investigación o información del planner y produce un procedimiento PM revisable. Coinciden en presentar propuestas con evidencia y aprobación humana, pero su entrada, resultado y límite operativo son distintos.

[Inference] **GWOS-AI es el referente más cercano para la experiencia empresarial de órdenes, plantillas, materiales, disponibilidad de crews y programación.** Sus módulos públicos cubren planificación y ejecución conectada al ERP. PlannerMC no programa órdenes ni sincroniza con el CMMS en el MVP.

[Inference] **Ninguna de las páginas citadas establece paridad con el núcleo específico de PlannerMC:** extraer referencias de manual/OEM, proponer jerarquía equipo/sub-assets, redactar PMs operativas en inglés con límite de 15 pasos y reglas de seguridad, sostener conversación de voz/texto es/en, conservar las decisiones y versiones exigidas, y permitir solo copia manual al CMMS. No tener esa prueba pública no equivale a demostrar que el proveedor no ofrezca la función.

La mejor combinación de referencias para el alcance vigente sería tomar de iMPS la claridad de evidencia, blockers y aprobación; de GWOS-AI, la organización de actividades, materiales y documentos de una orden. Las funciones de programación, compra, inventario y sincronización deben seguir fuera del MVP hasta que cambie su especificación.

## Referencia visual MacroCap

La marca solicitada quedó documentada en [brand-reference.md](./brand-reference.md). Observé una pantalla sign-in y Daily Overview en tema oscuro, con el wordmark MacroCap Labs, el título de aplicación MacroCap Operations, una barra lateral de iconos lineales, controles globales, KPI cards, gráficas y tablas.

La página de acceso usa Geist Variable. Los tokens oscuros medidos incluyen fondo #0A0A0A, superficie de tarjeta #171717, texto #FAFAFA, texto secundario #A1A1A1 y primario de interfaz #BCD3E0. Los píxeles más frecuentes del logo AVIF indican aproximadamente cyan #00A7CA y verde #59BB4E; al ser una imagen comprimida, esos dos colores son muestras, no una guía oficial.

La instrucción del usuario se registra como requisito de diseño para PlannerMC. No cambié la especificación de producto ni preparé UI en este paso de recon.

## Feature matrix

La comparación fila por fila está en [features.csv](./features.csv). Es una tabla adaptada a dos referencias de producto y una especificación local; no se puede pasar sin transformación al parity checker original/clone de la replica skill.

## Límites y cuestiones no verificadas

- No se accedió a una cuenta ni a una demostración de iMPS o GWOS-AI.
- No se verificaron clics, estados vacíos, errores, permisos, responsive design ni estructura real de datos en los productos comerciales.
- Las cifras de ROI y rendimiento de las páginas son declaraciones de marketing, no resultados contrastados en este recon.
- No se verificó el paquete de iconos de MacroCap, una guía de marca, los colores de modo claro ni la licencia/hosting de la fuente o logo.
- La pantalla MacroCap autenticada mostró datos operativos; ninguno se incluyó en los archivos de investigación.

## Tamaño

Sin estimación de implementación en esta etapa. El objetivo fue comparar productos y registrar una referencia visual, no clonar una de las suites. Las decisiones técnicas de PlannerMC siguen siendo las documentadas en el plan vigente.
