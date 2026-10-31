# Tareas de implementación del MVP de PlannerMC

**Estado:** lista de trabajo pendiente; ninguna casilla acredita implementación o pruebas ejecutadas.
**Base:** [spec.md](./spec.md), [plan.md](./plan.md) y la [constitución](../../docs/constitution.md).

[Unverified] Las duraciones indicadas son estimaciones de esfuerzo activo de **20–30 minutos por tarea**, no tiempos medidos. No incluyen esperas de respuestas, permisos o proveedores. Si durante la ejecución una tarea requiere más de 30 minutos, se divide antes de continuar y se mantienen sus referencias y dependencias; no se marca como terminada por agotarse el tiempo.

## Cómo ejecutar la lista

- Cada tarea incluye alcance, RF que cubre o habilita, dependencias y una línea «Hecho cuando:» verificable.
- Los identificadores **TASK-001** y siguientes pertenecen a esta lista; **T01–T35** son las pruebas definidas en el plan.
- La lista está en orden de dependencia: toda dependencia TASK aparece antes. Una tarea bloqueada no impide avanzar otra que ya tenga satisfechas sus propias dependencias.
- Las tareas de lógica incluyen el cambio y la prueba focalizada del comportamiento indicado. La prueba se añade o ajusta con ese cambio, conforme a la constitución. Las tareas de aceptación ejecutan recorridos ya preparados y registran evidencia; no incluyen corregir todos los defectos encontrados.
- Un fallo de aceptación origina una tarea de corrección acotada antes de cerrar la comprobación afectada. No se vuelven a ejecutar pruebas amplias sin cambios, fallos o dudas que lo justifiquen.
- Una casilla solo se marca tras cumplir «Hecho cuando:». Se registra la evidencia real; una simulación no demuestra integración con un proveedor real.
- El alcance se limita a equipos, assets, sub-assets y PMs. No se añaden compras, informes, KPIs, colaboración entre cuentas ni escritura o gestión de órdenes en el CMMS.
- Las tecnologías del plan siguen siendo propuestas sujetas a sus decisiones pendientes. Crear esta lista no resuelve esas decisiones ni inicia la implementación.

## Bloqueos heredados del plan

Las tareas de decisión requieren una respuesta explícita del usuario; documentar una propuesta o agotar el tiempo no las completa. Una tarea que depende, directa o indirectamente, de una decisión pendiente permanece bloqueada en esa parte.

| Decisión | Estado | Tareas que documentan su resolución |
| --- | --- | --- |
| Q1: entorno y navegador/dispositivo de voz | [NECESITA ACLARACIÓN] | TASK-001, TASK-002 |
| Q2: extracción/OCR, búsqueda, generación, reconocimiento y síntesis de voz | [NECESITA ACLARACIÓN] | TASK-003, TASK-004, TASK-005, TASK-006, TASK-007 |
| Q3: formatos, límites, volumen y almacenamiento | [NECESITA ACLARACIÓN] | TASK-008, TASK-009, TASK-010 |
| Q4: provisión/recuperación de cuentas y catálogo inicial | [NECESITA ACLARACIÓN] | TASK-011, TASK-012 |
| Q5: conservación de voz/transcripciones | [NECESITA ACLARACIÓN] | TASK-013 |
| Q6: respaldo y recuperación | [NECESITA ACLARACIÓN] | TASK-014 |

Cuando una respuesta cambie comportamiento o alcance, el ajuste correspondiente a spec/plan debe quedar documentado y acordado antes de implementar la tarea dependiente. Estas tareas no autorizan a incorporar por defecto autorregistro, archivo de grabaciones u otras funciones no acordadas.

## 1. Decisiones pendientes del plan

- [ ] **TASK-001 — Documentar el entorno de ejecución** (20 min estimados).

  **RF/RNF:** RF-2, RF-9, RF-11. **Depende de:** ninguna tarea previa. **Bloqueo:** Q1 [NECESITA ACLARACIÓN].

  Hecho cuando: Q1 contiene la elección explícita del usuario entre ejecución local, servidor de empresa o alojamiento externo, y sus implicaciones de almacenamiento.

- [ ] **TASK-002 — Documentar navegadores y dispositivos de voz** (20 min estimados).

  **RF/RNF:** RF-11. **Depende de:** TASK-001. **Bloqueo:** Q1 [NECESITA ACLARACIÓN].

  Hecho cuando: Q1 identifica los navegadores/dispositivos objetivo y cómo se dispondrá de un contexto seguro para el micrófono.

- [ ] **TASK-003 — Documentar la elección de extracción y OCR** (25 min estimados).

  **RF/RNF:** RF-2. **Depende de:** ninguna tarea previa. **Bloqueo:** Q2 [NECESITA ACLARACIÓN].

  Hecho cuando: Q2 registra herramienta/proveedor, alternativa descartada y condiciones autorizadas para procesar manuales; no se presenta una propuesta como aprobada.

- [ ] **TASK-004 — Documentar la elección de búsqueda** (25 min estimados).

  **RF/RNF:** RF-3. **Depende de:** ninguna tarea previa. **Bloqueo:** Q2 [NECESITA ACLARACIÓN].

  Hecho cuando: Q2 registra el proveedor elegido, condiciones de uso y presupuesto autorizado para la investigación externa.

- [ ] **TASK-005 — Documentar la elección de generación** (25 min estimados).

  **RF/RNF:** RF-4, RF-5, RF-6, RF-7. **Depende de:** ninguna tarea previa. **Bloqueo:** Q2 [NECESITA ACLARACIÓN].

  Hecho cuando: Q2 registra modelo/proveedor, condiciones de tratamiento de datos y presupuesto aprobados para generar propuestas.

- [ ] **TASK-006 — Documentar la elección de reconocimiento de voz** (20 min estimados).

  **RF/RNF:** RF-11. **Depende de:** ninguna tarea previa. **Bloqueo:** Q2 [NECESITA ACLARACIÓN].

  Hecho cuando: Q2 identifica la opción autorizada para reconocer español e inglés y sus condiciones de envío de audio.

- [ ] **TASK-007 — Documentar la elección de síntesis de voz** (20 min estimados).

  **RF/RNF:** RF-11. **Depende de:** ninguna tarea previa. **Bloqueo:** Q2 [NECESITA ACLARACIÓN].

  Hecho cuando: Q2 identifica la opción autorizada para responder por voz en español e inglés y sus condiciones de uso.

- [ ] **TASK-008 — Documentar formatos y límites de documentos** (20 min estimados).

  **RF/RNF:** RF-2. **Depende de:** ninguna tarea previa. **Bloqueo:** Q3 [NECESITA ACLARACIÓN].

  Hecho cuando: Q3 enumera variantes de Word/imagen, tamaño y páginas admitidos, sin valores deducidos por el implementador.

- [ ] **TASK-009 — Documentar límites de audio e investigación** (20 min estimados).

  **RF/RNF:** RF-3, RF-11. **Depende de:** ninguna tarea previa. **Bloqueo:** Q3 [NECESITA ACLARACIÓN].

  Hecho cuando: Q3 registra duración/formato de audio y alcance/tiempo de búsqueda, junto al mensaje y la decisión disponibles al alcanzar cada límite.

- [ ] **TASK-010 — Ratificar el almacenamiento frente al volumen esperado** (25 min estimados).

  **RF/RNF:** RF-2, RF-9. **Depende de:** TASK-001, TASK-008. **Bloqueo:** Q1/Q3 [NECESITA ACLARACIÓN].

  Hecho cuando: Q3 registra el volumen esperado y confirma D4/D7 o su revisión justificada antes de crear el adaptador de almacenamiento.

- [ ] **TASK-011 — Documentar provisión y recuperación de cuentas** (20 min estimados).

  **RF/RNF:** RF-11. **Depende de:** ninguna tarea previa. **Bloqueo:** Q4 [NECESITA ACLARACIÓN].

  Hecho cuando: Q4 describe cómo se obtienen y recuperan las cuentas, sin asumir autorregistro ni una pantalla administrativa.

- [ ] **TASK-012 — Documentar la carga del catálogo inicial** (20 min estimados).

  **RF/RNF:** RF-1, RF-4. **Depende de:** ninguna tarea previa. **Bloqueo:** Q4 [NECESITA ACLARACIÓN].

  Hecho cuando: Q4 identifica el origen y responsable del catálogo de empresa, locaciones y áreas, y el mecanismo acordado para incorporarlo.

- [ ] **TASK-013 — Documentar conservación de voz y transcripciones** (20 min estimados).

  **RF/RNF:** RF-11. **Depende de:** TASK-006, TASK-007. **Bloqueo:** Q5 [NECESITA ACLARACIÓN].

  Hecho cuando: Q5 registra la decisión del usuario y las condiciones de retención de los proveedores; audio transitorio no se considera aprobado por defecto.

- [ ] **TASK-014 — Documentar respaldo y recuperación** (25 min estimados).

  **RF/RNF:** RF-2, RF-9. **Depende de:** TASK-010. **Bloqueo:** Q6 [NECESITA ACLARACIÓN].

  Hecho cuando: Q6 registra capacidad, respaldo, restauración y criterios de recuperación compatibles con conservar manuales y borradores sin vencimiento.

## 2. Base de desarrollo y contratos

- [ ] **TASK-015 — Preparar la base TypeScript y el ejecutor de pruebas** (25 min estimados).

  **RF/RNF:** RF-1, RF-9, RF-11. **Depende de:** ninguna tarea previa.

  Hecho cuando: La base de desarrollo propuesta en D2 ejecuta una prueba mínima y documenta las versiones/dependencias elegidas; no contiene lógica de producto.

- [ ] **TASK-016 — Crear los límites de dominio, aplicación y adaptadores** (20 min estimados).

  **RF/RNF:** RF-1, RF-4, RF-5, RF-9. **Depende de:** TASK-015.

  Hecho cuando: Una comprobación de dependencias rechaza importaciones de UI, red o almacenamiento desde el dominio.

- [ ] **TASK-017 — Crear datos sintéticos compartidos de prueba** (20 min estimados).

  **RF/RNF:** RF-1, RF-4, RF-9, RF-11. **Depende de:** TASK-015.

  Hecho cuando: Hay dos cuentas, un catálogo y un equipo con sub-asset inequívocamente sintéticos que pueden cargarse sin datos industriales reales.

- [ ] **TASK-018 — Preparar la frontera HTTP de la aplicación** (25 min estimados).

  **RF/RNF:** RF-9, RF-11. **Depende de:** TASK-016.

  Hecho cuando: El servidor del plan devuelve respuestas estructuradas y errores controlados sin exponer detalles internos; las rutas de producto todavía no se dan por implementadas.

- [ ] **TASK-019 — Preparar la interfaz web vacía** (25 min estimados).

  **RF/RNF:** RF-11; RNF-2. **Depende de:** TASK-015.

  Hecho cuando: La aplicación abre una pantalla con rótulos ingleses y separa sus componentes visuales de los casos de uso.

- [ ] **TASK-020 — Preparar el ejecutor de recorridos web** (20 min estimados).

  **RF/RNF:** RF-11. **Depende de:** TASK-019.

  Hecho cuando: Una prueba de navegador abre la interfaz y comprueba un rótulo; queda disponible el mecanismo de evidencia para pruebas E2E.

- [ ] **TASK-021 — Definir el resultado común de las acciones** (25 min estimados).

  **RF/RNF:** RF-3, RF-7, RF-9, RF-11. **Depende de:** TASK-016.

  Hecho cuando: Los contratos distinguen completed, awaitingDecision, failed, conflict y resultUnverified sin añadir estados de aprobación de PM.

## 3. Reglas de dominio y pruebas unitarias

- [ ] **TASK-022 — Modelar catálogo, equipo y sub-assets** (25 min estimados).

  **RF/RNF:** RF-1, RF-4. **Depende de:** TASK-017, TASK-016. **Pruebas del plan:** T01, T08.

  Hecho cuando: Se aceptan equipo y sub-assets directos; una prueba rechaza ciclos, nietos y áreas de otra locación.

- [ ] **TASK-023 — Implementar la elección del nombre del equipo** (25 min estimados).

  **RF/RNF:** RF-1/AC-2, AC-3, AC-4, AC-5. **Depende de:** TASK-022. **Pruebas del plan:** T01.

  Hecho cuando: Se puede simplificar el nombre preservando el original; confirmar sin nombre, locación o área produce la solicitud correspondiente.

- [ ] **TASK-024 — Modelar fuentes y localizadores** (25 min estimados).

  **RF/RNF:** RF-2, RF-3, RF-5/AC-9; RNF-4. **Depende de:** TASK-017, TASK-016. **Pruebas del plan:** T05, T13.

  Hecho cuando: Se representan manual, referencia externa y dato del planificador; una prueba admite página/URL/modelo ausentes sin fabricarlos.

- [ ] **TASK-025 — Modelar las versiones y estados de PM** (25 min estimados).

  **RF/RNF:** RF-9/AC-1, AC-2, AC-3, AC-4, AC-5, AC-6. **Depende de:** TASK-017, TASK-016. **Pruebas del plan:** T20, T21.

  Hecho cuando: Las pruebas admiten solo draft y confirmedApproved y diferencian rowVersion de revisionNumber.

- [ ] **TASK-026 — Modelar frecuencias simples y su elección** (25 min estimados).

  **RF/RNF:** RF-6/AC-1, AC-2, AC-3; RNF-4. **Depende de:** TASK-024. **Pruebas del plan:** T14.

  Hecho cuando: Se conservan sugerencia disponible, elección y procedencia; cambiar la frecuencia no borra que era estimada.

- [ ] **TASK-027 — Modelar frecuencias compuestas y ausentes** (25 min estimados).

  **RF/RNF:** RF-6/AC-4, AC-5, AC-7. **Depende de:** TASK-026. **Pruebas del plan:** T15.

  Hecho cuando: Una prueba mantiene «primero que ocurra» y otra deja pendiente una relación desconocida o frecuencia sin base.

- [ ] **TASK-028 — Separar tareas por asset, frecuencia y estado** (25 min estimados).

  **RF/RNF:** RF-6/AC-6, AC-8. **Depende de:** TASK-022, TASK-027. **Pruebas del plan:** T16.

  Hecho cuando: Las pruebas separan intervalos distintos y tareas en marcha/detenido con igual frecuencia, sin agrupar un estado desconocido por suposición.

- [ ] **TASK-029 — Validar el máximo de pasos** (20 min estimados).

  **RF/RNF:** RF-5/AC-5, AC-10. **Depende de:** TASK-025. **Pruebas del plan:** T11.

  Hecho cuando: Una prueba admite 7 y 15 pasos y rechaza publicar 16, contando seguridad y cierre.

- [ ] **TASK-030 — Definir la estructura mínima de la PM** (25 min estimados).

  **RF/RNF:** RF-5/AC-1, AC-2, AC-3, AC-4. **Depende de:** TASK-025, TASK-024. **Pruebas del plan:** T10.

  Hecho cuando: Se representan estado, precauciones, acciones, cierre, duración y frecuencia; las ausencias quedan señaladas y la orden correctiva solo es una instrucción para el CMMS.

- [ ] **TASK-031 — Modelar respuesta o continuación con limitación** (25 min estimados).

  **RF/RNF:** RF-7/AC-1, AC-2, AC-3, AC-4; RNF-4. **Depende de:** TASK-024, TASK-021. **Pruebas del plan:** T17, T34.

  Hecho cuando: Aportar un dato resuelve el campo correspondiente; continuar mantiene la incertidumbre en una prueba independiente.

- [ ] **TASK-032 — Vincular decisiones al contenido presentado** (25 min estimados).

  **RF/RNF:** RF-3/AC-4, RF-7/AC-5, RF-9/AC-13. **Depende de:** TASK-031, TASK-025. **Pruebas del plan:** T06, T17, T26.

  Hecho cuando: Una decisión sobre otra versión u otro punto solicita revisión y no autoriza la mutación actual.

- [ ] **TASK-033 — Modelar la validación técnica opcional** (20 min estimados).

  **RF/RNF:** RF-8/AC-1, AC-2, AC-3, AC-4. **Depende de:** TASK-025. **Pruebas del plan:** T19.

  Hecho cuando: Consulted=false es válido; consulted=true registra colaborador y elementos sin exigir respuesta literal ni atribuir aprobación al técnico.

- [ ] **TASK-034 — Validar aprobación sin consulta técnica** (25 min estimados).

  **RF/RNF:** RF-6, RF-7/AC-5, RF-8/AC-4, RF-9/AC-3. **Depende de:** TASK-026, TASK-033, TASK-032, TASK-029, TASK-030. **Pruebas del plan:** T19, T20.

  Hecho cuando: Una frecuencia estimada se puede aprobar con decisión del planificador y sin consulta; faltar la decisión sí detiene la aprobación.

- [ ] **TASK-035 — Definir advertencias de posibles duplicados** (25 min estimados).

  **RF/RNF:** RF-10/AC-1, AC-2, AC-3. **Depende de:** TASK-022. **Pruebas del plan:** T27.

  Hecho cuando: Nombre/locación y serial no vacío producen candidatos; espacios/mayúsculas se normalizan sin perder ceros del serial y no se fusiona ningún registro.

- [ ] **TASK-036 — Separar idioma conversacional y empresarial** (20 min estimados).

  **RF/RNF:** RF-11/AC-3, AC-4; RNF-2, RNF-3. **Depende de:** TASK-021. **Pruebas del plan:** T30, T33.

  Hecho cuando: Se admiten es/en con inicio en inglés y se mantiene en el contrato interfaz/documento en inglés aunque la conversación sea española.

## 4. Persistencia, identidad y lectura posterior

- [ ] **TASK-037 — Preparar la base de datos de pruebas** (25 min estimados).

  **RF/RNF:** RF-9. **Depende de:** TASK-010, TASK-015.

  Hecho cuando: Las pruebas abren una base aislada con el motor acordado, ejecutan una transacción y limpian sus datos sin tocar datos de uso real.

- [ ] **TASK-038 — Crear el esquema de cuentas, catálogo y preferencias** (25 min estimados).

  **RF/RNF:** RF-1, RF-11. **Depende de:** TASK-037, TASK-022, TASK-036. **Pruebas del plan:** T29, T30.

  Hecho cuando: Una migración permite dos cuentas aisladas, áreas por locación y una preferencia es/en con valor inicial en inglés.

- [ ] **TASK-039 — Crear el esquema de originales y fuentes** (25 min estimados).

  **RF/RNF:** RF-2, RF-3, RF-5/AC-9. **Depende de:** TASK-037, TASK-024. **Pruebas del plan:** T04, T13.

  Hecho cuando: La migración conserva originales, metadatos, propietario y localizadores sin una cascada que borre manuales al borrar un borrador.

- [ ] **TASK-040 — Crear el esquema de assets y propuestas de cambio** (25 min estimados).

  **RF/RNF:** RF-1, RF-4, RF-10. **Depende de:** TASK-038, TASK-022. **Pruebas del plan:** T08, T28.

  Hecho cuando: Se almacena un equipo con sub-asset y una propuesta de actualización sin modificar el registro confirmado.

- [ ] **TASK-041 — Crear el esquema de PMs y versiones** (25 min estimados).

  **RF/RNF:** RF-5, RF-9. **Depende de:** TASK-040, TASK-025. **Pruebas del plan:** T20, T21.

  Hecho cuando: La migración distingue identidad de PM, versión editable, versión vigente y números formales; rechaza dos números iguales para la misma PM.

- [ ] **TASK-042 — Crear el esquema de decisiones y validaciones** (25 min estimados).

  **RF/RNF:** RF-7, RF-8, RF-9. **Depende de:** TASK-041, TASK-032, TASK-033. **Pruebas del plan:** T17, T19.

  Hecho cuando: Se guardan restricciones, decisión vinculada a versión y consulta opcional sin estados adicionales de aprobación.

- [ ] **TASK-043 — Crear el esquema de recibos de operación** (25 min estimados).

  **RF/RNF:** RF-9/AC-7, AC-8, AC-12. **Depende de:** TASK-041, TASK-021. **Pruebas del plan:** T25.

  Hecho cuando: Se impone unicidad por propietario/operationId y por versión aprobada; queda almacenada la huella de comando y resultado.

- [ ] **TASK-044 — Implementar una escritura transaccional con recibo** (30 min estimados).

  **RF/RNF:** RF-9/AC-7, AC-8, AC-12. **Depende de:** TASK-043. **Pruebas del plan:** T22, T25.

  Hecho cuando: Una prueba guarda datos y recibo juntos y otra revierte ambos ante un fallo anterior al commit.

- [ ] **TASK-045 — Implementar lectura posterior independiente** (30 min estimados).

  **RF/RNF:** RF-9/AC-7, AC-8; RNF-5. **Depende de:** TASK-044. **Pruebas del plan:** T22.

  Hecho cuando: El éxito exige leer del almacenamiento después del commit y comparar propietario, versión y contenido; la caché no basta.

- [ ] **TASK-046 — Distinguir resultado no verificado** (25 min estimados).

  **RF/RNF:** RF-9/AC-8, AC-12. **Depende de:** TASK-045. **Pruebas del plan:** T22.

  Hecho cuando: Una desconexión durante commit o un fallo de lectura posterior devuelve resultUnverified con operationId, sin afirmar guardado ni pérdida.

- [ ] **TASK-047 — Reconciliar un reintento por su recibo** (30 min estimados).

  **RF/RNF:** RF-9/AC-12. **Depende de:** TASK-046. **Pruebas del plan:** T25.

  Hecho cuando: La misma operación recupera su resultado; reutilizar la clave con otro comando produce conflicto sin una segunda escritura.

- [ ] **TASK-048 — Añadir comprobación de versión al guardar** (25 min estimados).

  **RF/RNF:** RF-9/AC-13. **Depende de:** TASK-045, TASK-041. **Pruebas del plan:** T26.

  Hecho cuando: La escritura con expectedRowVersion antigua conserva lo guardado y devuelve VERSION_CONFLICT; una versión vigente puede guardarse.

- [ ] **TASK-049 — Guardar y releer un original documental** (25 min estimados).

  **RF/RNF:** RF-2/AC-3, AC-4, RF-9/AC-7; RNF-6. **Depende de:** TASK-039, TASK-045. **Pruebas del plan:** T04.

  Hecho cuando: Se verifican bytes, longitud, digest y vínculo; incorporar otro manual conserva los dos originales.

- [ ] **TASK-050 — Guardar fuentes y localizadores** (25 min estimados).

  **RF/RNF:** RF-3, RF-5/AC-9, RF-9/AC-7. **Depende de:** TASK-039, TASK-045. **Pruebas del plan:** T13.

  Hecho cuando: Las referencias a página/sección, URL o datos aportados se recuperan con su propietario y sin datos inventados.

- [ ] **TASK-051 — Guardar y recuperar propuestas de assets** (25 min estimados).

  **RF/RNF:** RF-4, RF-9/AC-7, RF-10/AC-4. **Depende de:** TASK-040, TASK-048. **Pruebas del plan:** T08, T28.

  Hecho cuando: Se puede leer propuesta y confirmado por separado; guardar la propuesta no cambia el confirmado.

- [ ] **TASK-052 — Guardar y retomar una PM en borrador** (25 min estimados).

  **RF/RNF:** RF-9/AC-1, AC-2, AC-7, AC-11. **Depende de:** TASK-041, TASK-048. **Pruebas del plan:** T20, T24.

  Hecho cuando: Dos ediciones se recuperan como draft sin revisión formal ni vencimiento automático.

- [ ] **TASK-053 — Persistir decisiones, pendientes y consulta opcional** (25 min estimados).

  **RF/RNF:** RF-7, RF-8, RF-9/AC-7. **Depende de:** TASK-042, TASK-045. **Pruebas del plan:** T17, T19.

  Hecho cuando: Se releen colaborador, elementos, decisión y limitación; consulted=false no crea un requisito de consulta.

- [ ] **TASK-054 — Persistir y releer la preferencia de idioma** (20 min estimados).

  **RF/RNF:** RF-9/AC-7, RF-11/AC-3, AC-4. **Depende de:** TASK-038, TASK-045. **Pruebas del plan:** T30.

  Hecho cuando: Cambiar a español y reabrir recupera es; una escritura fallida conserva el último resultado confirmado.

- [ ] **TASK-055 — Integrar el hash de contraseñas elegido** (25 min estimados).

  **RF/RNF:** RF-11/AC-1. **Depende de:** TASK-011, TASK-015. **Pruebas del plan:** T29.

  Hecho cuando: Una contraseña se verifica mediante la biblioteca acordada; las respuestas y registros de prueba no contienen su valor ni el hash.

- [ ] **TASK-056 — Implementar autenticación de una cuenta** (25 min estimados).

  **RF/RNF:** RF-11/AC-1. **Depende de:** TASK-038, TASK-055, TASK-018. **Pruebas del plan:** T29.

  Hecho cuando: Credenciales correctas autentican y credenciales incorrectas no devuelven datos de cuenta.

- [ ] **TASK-057 — Resolver sesión y propiedad en cada petición** (25 min estimados).

  **RF/RNF:** RF-11/AC-1, AC-2. **Depende de:** TASK-056. **Pruebas del plan:** T29.

  Hecho cuando: La identidad se obtiene de la sesión; alterar ownerId en una entrada no cambia la cuenta efectiva.

- [ ] **TASK-058 — Comprobar el aislamiento de repositorios** (30 min estimados).

  **RF/RNF:** RF-11/AC-2. **Depende de:** TASK-057, TASK-049, TASK-050, TASK-051, TASK-052, TASK-053, TASK-054, TASK-047. **Pruebas del plan:** T29.

  Hecho cuando: Con dos cuentas, consultas directas e indirectas de originales, referencias, versiones y recibos no revelan recursos ajenos.

- [ ] **TASK-059 — Incorporar un catálogo mediante el mecanismo acordado** (20 min estimados).

  **RF/RNF:** RF-1, RF-4. **Depende de:** TASK-012, TASK-038. **Pruebas del plan:** T01.

  Hecho cuando: Un catálogo de prueba queda disponible en el espacio correcto y el selector no mezcla áreas de otra locación.

- [ ] **TASK-060 — Dar de alta una cuenta mediante el mecanismo acordado** (20 min estimados).

  **RF/RNF:** RF-11/AC-1. **Depende de:** TASK-011, TASK-038, TASK-055. **Pruebas del plan:** T29.

  Hecho cuando: Una cuenta de prueba creada por el procedimiento de Q4 puede autenticarse sin añadir autorregistro no acordado.

- [ ] **TASK-061 — Comprobar el procedimiento de recuperación acordado** (25 min estimados).

  **RF/RNF:** RF-11/AC-1. **Depende de:** TASK-060. **Pruebas del plan:** T29.

  Hecho cuando: Se recupera una cuenta de prueba mediante el procedimiento definido en Q4 y se registra el resultado; no se inventa un flujo alternativo.

## 5. Manuales, investigación y autorizaciones

- [ ] **TASK-062 — Definir contratos de extracción y búsqueda** (25 min estimados).

  **RF/RNF:** RF-2, RF-3. **Depende de:** TASK-024, TASK-021. **Pruebas del plan:** T02, T05.

  Hecho cuando: Los contratos tienen resultados utilizables, parciales y fallidos con localizadores; pueden probarse con dobles sin proveedor real.

- [ ] **TASK-063 — Preparar documentos sintéticos de extracción** (25 min estimados).

  **RF/RNF:** RF-2. **Depende de:** TASK-008, TASK-017. **Pruebas del plan:** T02, T03.

  Hecho cuando: Hay muestras de los formatos admitidos con texto/posiciones esperados y una muestra corrupta identificadas como sintéticas.

- [ ] **TASK-064 — Preparar muestras escaneadas y variantes** (25 min estimados).

  **RF/RNF:** RF-2/AC-1, AC-2, AC-5. **Depende de:** TASK-063. **Pruebas del plan:** T02, T03.

  Hecho cuando: Un escaneo parcial y una variante diferente tienen resultados esperados registrados sin usar material industrial no autorizado.

- [ ] **TASK-065 — Conectar extracción de PDF textual** (30 min estimados).

  **RF/RNF:** RF-2/AC-1. **Depende de:** TASK-003, TASK-062, TASK-063. **Pruebas del plan:** T02.

  Hecho cuando: El adaptador devuelve texto con páginas de una muestra PDF y traduce el error del proveedor al contrato acordado.

- [ ] **TASK-066 — Conectar extracción de Word admitido** (30 min estimados).

  **RF/RNF:** RF-2/AC-1. **Depende de:** TASK-003, TASK-062, TASK-063. **Pruebas del plan:** T02, T03.

  Hecho cuando: Una muestra Word admitida conserva localizadores de sección y una variante no admitida produce un error conocido.

- [ ] **TASK-067 — Conectar OCR de una imagen** (30 min estimados).

  **RF/RNF:** RF-2/AC-1, AC-2. **Depende de:** TASK-003, TASK-062, TASK-064. **Pruebas del plan:** T02, T03.

  Hecho cuando: La imagen devuelve texto/localizadores y marca la zona ilegible sin sustituirla por texto supuesto.

- [ ] **TASK-068 — Integrar OCR para páginas escaneadas** (25 min estimados).

  **RF/RNF:** RF-2/AC-1, AC-2. **Depende de:** TASK-065, TASK-067. **Pruebas del plan:** T02, T03.

  Hecho cuando: Un PDF mixto conserva números de página y usa OCR donde corresponde; una página fallida no se presenta como leída.

- [ ] **TASK-069 — Recibir y conservar un manual** (30 min estimados).

  **RF/RNF:** RF-2/AC-2, AC-3, AC-4. **Depende de:** TASK-008, TASK-049, TASK-058, TASK-018. **Pruebas del plan:** T03, T04.

  Hecho cuando: La carga válida conserva el original y la lectura lo verifica; carga incompleta y límite excedido notifican el problema sin éxito falso.

- [ ] **TASK-070 — Coordinar análisis del manual conservado** (30 min estimados).

  **RF/RNF:** RF-1/AC-2, RF-2/AC-1, AC-5. **Depende de:** TASK-069, TASK-065, TASK-066, TASK-068, TASK-050. **Pruebas del plan:** T01, T02, T03.

  Hecho cuando: El análisis selecciona el extractor del formato, guarda localizadores y presenta limitaciones sin confirmar automáticamente assets.

- [ ] **TASK-071 — Aplicar decisiones ante un manual inutilizable** (25 min estimados).

  **RF/RNF:** RF-2/AC-2, AC-4, AC-5. **Depende de:** TASK-070, TASK-053. **Pruebas del plan:** T03, T04.

  Hecho cuando: Corregir/sustituir/continuar sin utilizar llevan al resultado esperado y un original ya incorporado permanece.

- [ ] **TASK-072 — Conectar una búsqueda externa** (30 min estimados).

  **RF/RNF:** RF-3/AC-2, AC-3. **Depende de:** TASK-004, TASK-062, TASK-050. **Pruebas del plan:** T05.

  Hecho cuando: Una consulta devuelve enlaces y metadatos disponibles con su procedencia; datos ausentes quedan vacíos.

- [ ] **TASK-073 — Priorizar documentación aplicable y marcar variantes** (25 min estimados).

  **RF/RNF:** RF-3/AC-2, AC-3. **Depende de:** TASK-072. **Pruebas del plan:** T05.

  Hecho cuando: Un caso controlado presenta primero OEM aplicable y diferencia variantes similares sin declararlas del modelo exacto.

- [ ] **TASK-074 — Gestionar fallos y límites de investigación** (25 min estimados).

  **RF/RNF:** RF-3/AC-6. **Depende de:** TASK-009, TASK-072, TASK-031. **Pruebas del plan:** T07.

  Hecho cuando: Sin resultados, acceso denegado, timeout y fallo de red solicitan decisión y no afirman que no existe manual.

- [ ] **TASK-075 — Autorizar el siguiente paso con la información reunida** (25 min estimados).

  **RF/RNF:** RF-3/AC-1, AC-4, AC-5, AC-7. **Depende de:** TASK-073, TASK-074, TASK-032, TASK-053. **Pruebas del plan:** T06.

  Hecho cuando: Se puede continuar solo con datos operativos autorizados y decidir sobre propuestas sin aceptar obligatoriamente cada fuente.

- [ ] **TASK-076 — Investigar tareas o frecuencias ausentes del manual** (25 min estimados).

  **RF/RNF:** RF-2, RF-3/AC-8. **Depende de:** TASK-070, TASK-075. **Pruebas del plan:** T07.

  Hecho cuando: El caso de manual sin frecuencia inicia investigación y vuelve a presentar información/limitaciones antes del avance.

- [ ] **TASK-077 — Retomar el procesamiento interrumpido** (25 min estimados).

  **RF/RNF:** RF-2, RF-3, RF-9/AC-7, AC-8. **Depende de:** TASK-070, TASK-075, TASK-047. **Pruebas del plan:** T07, T35.

  Hecho cuando: Tras reinicio se recupera el análisis conocido; reintentar no borra originales ni aprueba propuestas.

## 6. Propuestas de assets, PMs y decisiones

- [ ] **TASK-078 — Definir el contrato de generación de candidatos** (20 min estimados).

  **RF/RNF:** RF-4, RF-5, RF-6. **Depende de:** TASK-022, TASK-030, TASK-062. **Pruebas del plan:** T08, T10.

  Hecho cuando: Un doble devuelve candidatos con referencias y no dispone de métodos de escritura ni aprobación.

- [ ] **TASK-079 — Conectar una petición al generador elegido** (30 min estimados).

  **RF/RNF:** RF-4, RF-5, RF-6. **Depende de:** TASK-005, TASK-078. **Pruebas del plan:** T10.

  Hecho cuando: Una petición acotada produce salida estructurada y un fallo del servicio se traduce al contrato, sin mutar registros.

- [ ] **TASK-080 — Validar la salida y los límites de la generación** (25 min estimados).

  **RF/RNF:** RF-5/AC-9, RF-7/AC-6; RNF-4. **Depende de:** TASK-079, TASK-024. **Pruebas del plan:** T13, T18.

  Hecho cuando: Las pruebas detectan salida mal formada, referencias ajenas/inexistentes y declaración propia de cumplimiento OSHA; instrucciones dentro de una fuente no autorizan acciones.

- [ ] **TASK-081 — Proponer equipo y sub-assets desde evidencia** (25 min estimados).

  **RF/RNF:** RF-1/AC-2, RF-4/AC-1, AC-2, AC-3, AC-4. **Depende de:** TASK-080, TASK-023, TASK-051, TASK-075. **Pruebas del plan:** T01, T08.

  Hecho cuando: Un caso genera equipo/sub-assets con nombres ingleses y términos originales, tras autorización, sin confirmar ni crear niveles inferiores.

- [ ] **TASK-082 — Consultar posibles duplicados de la cuenta** (25 min estimados).

  **RF/RNF:** RF-10/AC-1, AC-2, AC-3. **Depende de:** TASK-035, TASK-051, TASK-058. **Pruebas del plan:** T27, T29.

  Hecho cuando: La consulta devuelve coincidencias propias con identificadores disponibles y nunca incluye candidatos de otra cuenta.

- [ ] **TASK-083 — Guardar la edición de una propuesta de asset** (25 min estimados).

  **RF/RNF:** RF-4/AC-4, RF-10/AC-4. **Depende de:** TASK-081, TASK-082, TASK-048. **Pruebas del plan:** T08, T28.

  Hecho cuando: Cambiar nombre o jerarquía conserva el confirmado y presenta duplicados para la decisión de crear/actualizar.

- [ ] **TASK-084 — Confirmar únicamente los assets seleccionados** (30 min estimados).

  **RF/RNF:** RF-1/AC-5, RF-4/AC-5, AC-6, RF-10/AC-3, AC-4. **Depende de:** TASK-083, TASK-053. **Pruebas del plan:** T01, T09, T28.

  Hecho cuando: Se pueden conservar sub-assets sin PM; las relaciones pendientes se muestran y confirmar una selección no confirma otros elementos por cascada.

- [ ] **TASK-085 — Resolver un dato pendiente mediante una decisión** (25 min estimados).

  **RF/RNF:** RF-7/AC-1, AC-2, AC-3, AC-4, AC-5. **Depende de:** TASK-031, TASK-032, TASK-053. **Pruebas del plan:** T17, T34.

  Hecho cuando: La operación guarda una respuesta o una continuación con limitación y su lectura conserva exactamente el resultado elegido.

- [ ] **TASK-086 — Obtener candidatos de tareas con procedencia** (25 min estimados).

  **RF/RNF:** RF-5/AC-1, AC-9, RF-6/AC-1, AC-3, AC-4. **Depende de:** TASK-080, TASK-076, TASK-027. **Pruebas del plan:** T10, T13, T14, T15.

  Hecho cuando: Las tareas/frecuencias contienen su base disponible y las ausencias se remiten a decisión; no se inventan localizadores.

- [ ] **TASK-087 — Redactar una secuencia breve en inglés** (30 min estimados).

  **RF/RNF:** RF-5/AC-2, AC-3, AC-4, AC-6; RNF-3. **Depende de:** TASK-086, TASK-030, TASK-028. **Pruebas del plan:** T10, T11, T33.

  Hecho cuando: Un ejemplo controlado conserva acciones, estado, seguridad y cierre mediante correspondencia con la fuente; la orden correctiva es solo texto para el CMMS.

- [ ] **TASK-088 — Proponer una división cuando no caben 15 pasos** (25 min estimados).

  **RF/RNF:** RF-5/AC-5, AC-10. **Depende de:** TASK-087, TASK-029, TASK-032. **Pruebas del plan:** T11.

  Hecho cuando: El caso de 16 acciones indispensables produce una propuesta de división y no aplica la partición sin decisión.

- [ ] **TASK-089 — Aplicar la división autorizada** (25 min estimados).

  **RF/RNF:** RF-5/AC-10. **Depende de:** TASK-088. **Pruebas del plan:** T11.

  Hecho cuando: Tras autorización, cada PM conserva sus indicaciones iniciales y finales y no supera 15 pasos; rechazar la división conserva la propuesta pendiente.

- [ ] **TASK-090 — Guardar las PMs propuestas como borradores** (25 min estimados).

  **RF/RNF:** RF-5, RF-6/AC-6, AC-8, RF-9/AC-1. **Depende de:** TASK-089, TASK-052, TASK-084, TASK-085. **Pruebas del plan:** T09, T16, T20.

  Hecho cuando: Los grupos revisados se guardan como drafts recuperables; una relación de asset sin confirmar se advierte sin confirmarla implícitamente.

- [ ] **TASK-091 — Aplicar una frecuencia elegida por el planificador** (25 min estimados).

  **RF/RNF:** RF-6/AC-1, AC-2, AC-3, AC-5, AC-7. **Depende de:** TASK-090, TASK-027. **Pruebas del plan:** T14, T15.

  Hecho cuando: La frecuencia elegida sustituye el valor de trabajo y conserva sugerencia/procedencia; los conflictos requieren decisión explícita.

- [ ] **TASK-092 — Editar tareas y duración conservando procedencia** (25 min estimados).

  **RF/RNF:** RF-5/AC-1, RF-7/AC-3, RF-9/AC-2; RNF-4. **Depende de:** TASK-090, TASK-048, TASK-085. **Pruebas del plan:** T20, T34.

  Hecho cuando: La edición se recupera sin generar revisión formal y los nuevos aportes no se atribuyen al manual.

- [ ] **TASK-093 — Registrar una consulta técnica opcional** (20 min estimados).

  **RF/RNF:** RF-8/AC-1, AC-2, AC-3, AC-4. **Depende de:** TASK-033, TASK-053, TASK-092. **Pruebas del plan:** T19.

  Hecho cuando: La validación registra colaborador y elementos; cambios derivados se aplican al draft sin exigir una transcripción ni consulta cuando se omite.

- [ ] **TASK-094 — Notificar nueva evidencia sin cambiar definitivas** (25 min estimados).

  **RF/RNF:** RF-10/AC-5. **Depende de:** TASK-050, TASK-083, TASK-090. **Pruebas del plan:** T28.

  Hecho cuando: Una referencia nueva que contradice la usada genera una decisión pendiente y conserva las versiones confirmadas.

## 7. Confirmación, revisiones y eliminación

- [ ] **TASK-095 — Preparar la instantánea de aprobación** (25 min estimados).

  **RF/RNF:** RF-7/AC-5, RF-9/AC-3, AC-4, AC-5; RNF-4. **Depende de:** TASK-034, TASK-091, TASK-092, TASK-093. **Pruebas del plan:** T20, T21, T34.

  Hecho cuando: El contenido candidato incluye nombres, frecuencias, procedencia y dudas revisadas; una edición posterior no modifica esa instantánea.

- [ ] **TASK-096 — Asignar la numeración formal dentro de transacción** (25 min estimados).

  **RF/RNF:** RF-9/AC-6, AC-12. **Depende de:** TASK-041, TASK-044. **Pruebas del plan:** T21, T25.

  Hecho cuando: La inicial obtiene 0/Initial y las siguientes 1/2; dos intentos sobre la misma versión no consumen números diferentes.

- [ ] **TASK-097 — Confirmar una versión de PM de forma atómica** (30 min estimados).

  **RF/RNF:** RF-9/AC-3, AC-7, AC-8, AC-9, AC-12. **Depende de:** TASK-095, TASK-096, TASK-047, TASK-048. **Pruebas del plan:** T20, T22, T23, T25.

  Hecho cuando: Se escriben versión, puntero vigente y recibo juntos, se verifica la lectura y no se realiza ninguna llamada de escritura al CMMS.

- [ ] **TASK-098 — Probar reintentos y confirmaciones simultáneas** (25 min estimados).

  **RF/RNF:** RF-9/AC-12. **Depende de:** TASK-097. **Pruebas del plan:** T25.

  Hecho cuando: Doble pulsación, respuesta perdida y dos operationId distintos para la misma versión dejan una aprobación; operación fallida antes de commit puede completarse una vez.

- [ ] **TASK-099 — Probar aprobación persistida de una estimación sin consulta** (20 min estimados).

  **RF/RNF:** RF-6, RF-7/AC-5, RF-8/AC-4, RF-9/AC-3. **Depende de:** TASK-097. **Pruebas del plan:** T19, T34.

  Hecho cuando: El caso consulted=false y frecuencia estimada se aprueba con decisión explícita y sigue mostrando la estimación al releer.

- [ ] **TASK-100 — Preparar una revisión de una definitiva** (25 min estimados).

  **RF/RNF:** RF-9/AC-5, AC-6. **Depende de:** TASK-097, TASK-052. **Pruebas del plan:** T21.

  Hecho cuando: Se crea un draft basado en la definitiva, sin número formal aún, y editarlo no altera nombre/frecuencia/contenido de la versión anterior.

- [ ] **TASK-101 — Probar la aprobación de dos revisiones sucesivas** (25 min estimados).

  **RF/RNF:** RF-9/AC-5, AC-6. **Depende de:** TASK-100, TASK-096. **Pruebas del plan:** T21.

  Hecho cuando: Se obtienen revisión 1 y revisión 2 con fecha y cambios registrados; la vigente cambia solo después de aprobación verificada.

- [ ] **TASK-102 — Eliminar un borrador propio con verificación** (25 min estimados).

  **RF/RNF:** RF-9/AC-10, AC-11. **Depende de:** TASK-052, TASK-049, TASK-097. **Pruebas del plan:** T24.

  Hecho cuando: Se comprueba la ausencia del draft y la conservación de manuales, assets y definitivas; la antigüedad no provoca borrado.

- [ ] **TASK-103 — Probar borrado frente a aprobación y reintento antiguo** (25 min estimados).

  **RF/RNF:** RF-9/AC-10, AC-12. **Depende de:** TASK-102, TASK-047, TASK-098. **Pruebas del plan:** T24, T25, T35.

  Hecho cuando: No se elimina una versión ya aprobada ni se recrea/devuelve un draft eliminado al reintentar una operación antigua; se conserva solo el recibo mínimo pertinente.

- [ ] **TASK-104 — Aplicar cambios después de revisar un conflicto** (25 min estimados).

  **RF/RNF:** RF-9/AC-13. **Depende de:** TASK-048, TASK-092, TASK-097. **Pruebas del plan:** T26.

  Hecho cuando: Se conserva lo guardado hasta decisión explícita y se exige la última versión revisada; un tercer cambio vuelve a producir aviso.

- [ ] **TASK-105 — Verificar una operación cuyo registro volvió a cambiar** (25 min estimados).

  **RF/RNF:** RF-9/AC-7, AC-8, AC-13. **Depende de:** TASK-047, TASK-104. **Pruebas del plan:** T22, T26.

  Hecho cuando: La operación anterior se contrasta con su resultado inmutable y se informa la versión actual, sin afirmar que el valor antiguo sigue vigente.

## 8. Frontera HTTP e interfaz de trabajo

- [ ] **TASK-106 — Exponer inicio de análisis y decisión de avance** (25 min estimados).

  **RF/RNF:** RF-1, RF-3/AC-4. **Depende de:** TASK-018, TASK-057, TASK-059, TASK-075. **Pruebas del plan:** T01, T06.

  Hecho cuando: Las acciones validan catálogo y decisión/versiones, y devuelven el contrato común sin escribir por una autorización ambigua.

- [ ] **TASK-107 — Exponer edición, duplicados y confirmación de assets** (25 min estimados).

  **RF/RNF:** RF-4, RF-10. **Depende de:** TASK-018, TASK-057, TASK-084, TASK-082. **Pruebas del plan:** T08, T27, T29.

  Hecho cuando: Las rutas usan los casos de uso existentes y el actor de sesión; una petición cruzada no obtiene ni modifica un asset.

- [ ] **TASK-108 — Exponer creación y edición de borradores** (25 min estimados).

  **RF/RNF:** RF-5, RF-6, RF-9/AC-1, AC-2, AC-13. **Depende de:** TASK-018, TASK-057, TASK-090, TASK-091, TASK-092. **Pruebas del plan:** T20, T26.

  Hecho cuando: Las entradas inválidas se señalan y una edición antigua devuelve conflicto; no hay validaciones de aprobación exclusivas de la UI.

- [ ] **TASK-109 — Exponer decisiones pendientes y validación técnica** (25 min estimados).

  **RF/RNF:** RF-7, RF-8. **Depende de:** TASK-018, TASK-057, TASK-085, TASK-093. **Pruebas del plan:** T17, T19.

  Hecho cuando: Las rutas guardan la decisión sobre su versión y permiten continuar sin consulta técnica.

- [ ] **TASK-110 — Exponer confirmación y preparación de revisión** (25 min estimados).

  **RF/RNF:** RF-9/AC-3, AC-5, AC-6, AC-12. **Depende de:** TASK-018, TASK-057, TASK-097, TASK-100. **Pruebas del plan:** T21, T25.

  Hecho cuando: Repetir la solicitud de confirmación devuelve la aprobación existente y pedir revisión prepara un draft sin mutar la definitiva.

- [ ] **TASK-111 — Exponer eliminación de borradores y lectura del resultado** (20 min estimados).

  **RF/RNF:** RF-9/AC-10. **Depende de:** TASK-018, TASK-057, TASK-102, TASK-103. **Pruebas del plan:** T24, T29.

  Hecho cuando: Una cuenta elimina su draft y comprueba ausencia; no puede usar la acción para borrar manuales, versiones aprobadas o borradores ajenos.

- [ ] **TASK-112 — Conectar el formulario de acceso** (20 min estimados).

  **RF/RNF:** RF-11/AC-1; RNF-2. **Depende de:** TASK-019, TASK-056, TASK-057, TASK-020. **Pruebas del plan:** T29.

  Hecho cuando: Los rótulos están en inglés y un error de acceso no abre el área de trabajo.

- [ ] **TASK-113 — Conectar la preferencia de idioma** (20 min estimados).

  **RF/RNF:** RF-11/AC-3, AC-4; RNF-2. **Depende de:** TASK-112, TASK-054, TASK-036. **Pruebas del plan:** T30.

  Hecho cuando: El selector ofrece español/inglés, persiste la elección y no cambia los rótulos ingleses de la interfaz.

- [ ] **TASK-114 — Conectar el inicio del análisis de un equipo** (25 min estimados).

  **RF/RNF:** RF-1. **Depende de:** TASK-112, TASK-106. **Pruebas del plan:** T01.

  Hecho cuando: Se eligen locación/área y se muestra el nombre sugerido editable con el original visible; los faltantes se solicitan.

- [ ] **TASK-115 — Conectar la carga y los problemas de manual** (25 min estimados).

  **RF/RNF:** RF-2. **Depende de:** TASK-114, TASK-069, TASK-071. **Pruebas del plan:** T03, T04.

  Hecho cuando: Una carga válida muestra su resultado y los fallos ofrecen corregir/sustituir/no utilizar sin ocultar originales conservados.

- [ ] **TASK-116 — Presentar información y autorización del siguiente paso** (25 min estimados).

  **RF/RNF:** RF-3. **Depende de:** TASK-115, TASK-075, TASK-074, TASK-106. **Pruebas del plan:** T05, T06, T07.

  Hecho cuando: Se muestran procedencia, variantes y límites; la persona puede continuar con datos, aportar información o detener sin aprobar cada fuente.

- [ ] **TASK-117 — Conectar el editor de equipo y sub-assets** (30 min estimados).

  **RF/RNF:** RF-4, RF-10. **Depende de:** TASK-116, TASK-107. **Pruebas del plan:** T08, T09, T27.

  Hecho cuando: Se editan nombres/jerarquía hasta sub-assets y se muestran duplicados/relaciones pendientes para decisión antes de confirmar.

- [ ] **TASK-118 — Conectar el editor básico de PM** (30 min estimados).

  **RF/RNF:** RF-5/AC-1, RF-6, RF-9/AC-2. **Depende de:** TASK-117, TASK-108. **Pruebas del plan:** T10, T14, T20.

  Hecho cuando: Se editan frecuencia, duración, estado y pasos del draft; guardar y recargar recupera la edición y su procedencia.

- [ ] **TASK-119 — Conectar la decisión de división de una PM** (20 min estimados).

  **RF/RNF:** RF-5/AC-10. **Depende de:** TASK-118, TASK-088, TASK-089. **Pruebas del plan:** T11.

  Hecho cuando: La propuesta muestra la partición y espera una decisión; cada PM resultante cumple el máximo y conserva inicio/cierre.

- [ ] **TASK-120 — Conectar la revisión de datos no resueltos** (25 min estimados).

  **RF/RNF:** RF-7. **Depende de:** TASK-118, TASK-109. **Pruebas del plan:** T17, T34.

  Hecho cuando: El planificador puede responder o continuar con limitación y el dato no resuelto permanece visible después de continuar.

- [ ] **TASK-121 — Conectar la validación técnica opcional** (20 min estimados).

  **RF/RNF:** RF-8. **Depende de:** TASK-118, TASK-109. **Pruebas del plan:** T19.

  Hecho cuando: Se puede registrar colaborador/elementos o seguir sin consulta; no se exige respuesta literal ni se atribuye aprobación al técnico.

- [ ] **TASK-122 — Conectar la revisión final y confirmación** (25 min estimados).

  **RF/RNF:** RF-7/AC-5, RF-9/AC-3, AC-8, AC-12. **Depende de:** TASK-120, TASK-121, TASK-110. **Pruebas del plan:** T19, T22, T25.

  Hecho cuando: Se confirma el contenido presentado con sus límites; success solo aparece al verificar la escritura y doble clic no duplica la PM.

- [ ] **TASK-123 — Listar, retomar y eliminar borradores propios** (25 min estimados).

  **RF/RNF:** RF-9/AC-1, AC-10, AC-11. **Depende de:** TASK-122, TASK-111. **Pruebas del plan:** T20, T24.

  Hecho cuando: Se retoma un draft guardado y se elimina otro sin perder manuales, assets ni versiones aprobadas.

- [ ] **TASK-124 — Mostrar la definitiva y preparar una revisión** (25 min estimados).

  **RF/RNF:** RF-9/AC-5, AC-6. **Depende de:** TASK-122, TASK-100. **Pruebas del plan:** T21.

  Hecho cuando: Se distingue Initial de revisiones numeradas/fechadas y la definitiva no cambia mientras se edita la siguiente.

- [ ] **TASK-125 — Conectar la revisión del conflicto entre sesiones** (25 min estimados).

  **RF/RNF:** RF-9/AC-13. **Depende de:** TASK-118, TASK-104. **Pruebas del plan:** T26.

  Hecho cuando: Dos pestañas muestran el conflicto sin perder la edición local y exigen revisión/decisión antes de sobrescribir.

- [ ] **TASK-126 — Renderizar el documento empresarial inglés** (25 min estimados).

  **RF/RNF:** RF-5/AC-7, AC-8, AC-9; RNF-3. **Depende de:** TASK-030, TASK-036, TASK-095. **Pruebas del plan:** T12, T13, T33.

  Hecho cuando: El documento incluye encabezados y pasos ingleses, marca Draft cuando corresponde y conserva advertencias/citas pertinentes.

- [ ] **TASK-127 — Conectar copia completa y por paso** (20 min estimados).

  **RF/RNF:** RF-5/AC-7, AC-8. **Depende de:** TASK-126, TASK-118. **Pruebas del plan:** T12.

  Hecho cuando: Ambas copias corresponden a la versión mostrada; el fallo del portapapeles deja texto seleccionable sin mensaje falso de éxito.

## 9. Conversación por texto y voz

- [ ] **TASK-128 — Preparar el contexto de la conversación** (25 min estimados).

  **RF/RNF:** RF-3/AC-4, RF-7/AC-5, RF-11/AC-4, AC-6. **Depende de:** TASK-032, TASK-036, TASK-109. **Pruebas del plan:** T06, T17, T31.

  Hecho cuando: Cada turno identifica idioma, equipo y versión activos; una respuesta descontextualizada no autoriza cambios.

- [ ] **TASK-129 — Conectar acciones conversacionales a los casos de uso** (30 min estimados).

  **RF/RNF:** RF-3, RF-7, RF-9, RF-11/AC-4, AC-6. **Depende de:** TASK-128, TASK-106, TASK-107, TASK-108, TASK-109, TASK-110, TASK-111, TASK-079. **Pruebas del plan:** T17, T23, T31.

  Hecho cuando: La conversación usa las acciones permitidas y las mismas validaciones que la UI; texto de fuentes no ejecuta herramientas ni operaciones del CMMS.

- [ ] **TASK-130 — Conectar peticiones y respuestas por texto** (25 min estimados).

  **RF/RNF:** RF-11/AC-4, AC-6; RNF-2. **Depende de:** TASK-129, TASK-113. **Pruebas del plan:** T30, T31, T33.

  Hecho cuando: Una petición española obtiene explicación española y una inglesa obtiene explicación inglesa, manteniendo rótulos y documento en inglés.

- [ ] **TASK-131 — Definir contratos de reconocimiento y síntesis** (20 min estimados).

  **RF/RNF:** RF-11/AC-5. **Depende de:** TASK-021, TASK-036. **Pruebas del plan:** T31.

  Hecho cuando: Los contratos incluyen es/en y errores controlados; pueden probarse mediante audio/respuestas sintéticos sin proveedor real.

- [ ] **TASK-132 — Capturar audio con permiso del navegador** (25 min estimados).

  **RF/RNF:** RF-11/AC-5. **Depende de:** TASK-002, TASK-009, TASK-131, TASK-130. **Pruebas del plan:** T31.

  Hecho cuando: La captura obtiene audio en el formato acordado y detecta permiso denegado o límite alcanzado sin ejecutar una acción de dominio.

- [ ] **TASK-133 — Conectar reconocimiento de una petición hablada** (30 min estimados).

  **RF/RNF:** RF-11/AC-5. **Depende de:** TASK-006, TASK-009, TASK-131. **Pruebas del plan:** T31.

  Hecho cuando: El adaptador devuelve texto en es/en y diferencia audio no interpretable de error del servicio, sin inventar una petición.

- [ ] **TASK-134 — Conectar síntesis de una respuesta** (30 min estimados).

  **RF/RNF:** RF-11/AC-5. **Depende de:** TASK-007, TASK-131. **Pruebas del plan:** T31.

  Hecho cuando: El adaptador entrega audio para una respuesta en es/en y devuelve error controlado si no puede sintetizarla.

- [ ] **TASK-135 — Conectar la petición hablada al flujo conversacional** (25 min estimados).

  **RF/RNF:** RF-11/AC-5, RF-7/AC-5, RF-9/AC-3. **Depende de:** TASK-132, TASK-133, TASK-130. **Pruebas del plan:** T31.

  Hecho cuando: Una petición reconocida pasa por las mismas decisiones y validaciones que texto; un «sí» sin contexto pide aclaración.

- [ ] **TASK-136 — Reproducir la respuesta en el idioma elegido** (20 min estimados).

  **RF/RNF:** RF-11/AC-5. **Depende de:** TASK-135, TASK-134. **Pruebas del plan:** T31, T33.

  Hecho cuando: La respuesta se reproduce en el idioma conversacional y no cambia el idioma del documento empresarial.

- [ ] **TASK-137 — Aplicar el tratamiento de audio acordado** (25 min estimados).

  **RF/RNF:** RF-11/AC-5. **Depende de:** TASK-013, TASK-136. **Pruebas del plan:** T31.

  Hecho cuando: El recorrido de captura/proveedor/transcripción respeta Q5 y documenta su resultado; cualquier ampliación de comportamiento está antes reflejada en la spec.

- [ ] **TASK-138 — Probar fallos de voz y continuidad por texto** (25 min estimados).

  **RF/RNF:** RF-11/AC-5, AC-6. **Depende de:** TASK-137, TASK-130. **Pruebas del plan:** T31.

  Hecho cuando: Permiso denegado, reconocimiento fallido y síntesis fallida se notifican; el planificador sigue por texto y no se confirma una mutación ambigua.

## 10. Comprobación integral y cierre

- [ ] **TASK-139 — Comprobar acceso a originales y citas desde una PM** (25 min estimados).

  **RF/RNF:** RF-2/AC-3, AC-4, RF-5/AC-9, RF-11/AC-2. **Depende de:** TASK-049, TASK-050, TASK-058, TASK-126. **Pruebas del plan:** T04, T13, T29.

  Hecho cuando: Se abre el original/localizador propio referenciado por una PM, incluso tras sustituir el manual; una referencia ajena no da acceso.

- [ ] **TASK-140 — Presentar la decisión ante evidencia nueva** (20 min estimados).

  **RF/RNF:** RF-10/AC-5. **Depende de:** TASK-094, TASK-117, TASK-124. **Pruebas del plan:** T28.

  Hecho cuando: La UI avisa del cambio de evidencia y deja decidir sobre propuesta/revisión sin modificar la definitiva.

- [ ] **TASK-141 — Comprobar adaptadores reales de documentos y búsqueda** (30 min estimados).

  **RF/RNF:** RF-2, RF-3. **Depende de:** TASK-115, TASK-116, TASK-068, TASK-066, TASK-072. **Pruebas del plan:** T02, T05, T07.

  Hecho cuando: Se ejecuta una prueba acotada con muestras autorizadas de los adaptadores elegidos y se separa su evidencia de las pruebas con dobles.

- [ ] **TASK-142 — Revisar una síntesis y una división del corpus** (25 min estimados).

  **RF/RNF:** RF-5, RF-7/AC-6. **Depende de:** TASK-119, TASK-079, TASK-063. **Pruebas del plan:** T10, T11, T18.

  Hecho cuando: Dos casos acotados conservan acciones/avisos y procedencia; la evaluación semántica queda registrada por separado del conteo de pasos.

- [ ] **TASK-143 — Ejecutar un recorrido completo con manual en inglés** (25 min estimados).

  **RF/RNF:** RF-1, RF-2, RF-3, RF-4, RF-5, RF-9, RF-11. **Depende de:** TASK-122, TASK-127, TASK-141, TASK-142, TASK-139. **Pruebas del plan:** T01, T02, T06, T08, T12, T20.

  Hecho cuando: Inicio, manual, autorización, assets, PM, aprobación verificada y copia funcionan en un caso sintético; se registra evidencia y cualquier fallo por separado.

- [ ] **TASK-144 — Ejecutar un recorrido español con datos operativos** (25 min estimados).

  **RF/RNF:** RF-3/AC-5, RF-5, RF-6, RF-7, RF-8, RF-9, RF-11. **Depende de:** TASK-130, TASK-099, TASK-122, TASK-127. **Pruebas del plan:** T06, T19, T30, T33, T34.

  Hecho cuando: Sin manual ni fuentes externas, el caso autorizado llega a una PM inglesa; frecuencia estimada y ausencia de consulta no bloquean su aprobación.

- [ ] **TASK-145 — Ejecutar la decisión tras fallos de investigación** (20 min estimados).

  **RF/RNF:** RF-2/AC-2, RF-3/AC-6, AC-8, RF-7. **Depende de:** TASK-116, TASK-115, TASK-076. **Pruebas del plan:** T03, T07, T17.

  Hecho cuando: Un manual problemático y una búsqueda fallida ofrecen las decisiones previstas, conservan lo guardado y no aparentan éxito.

- [ ] **TASK-146 — Ejecutar revisión y eliminación de un borrador** (25 min estimados).

  **RF/RNF:** RF-9/AC-5, AC-6, AC-10, AC-11. **Depende de:** TASK-124, TASK-123, TASK-101, TASK-103. **Pruebas del plan:** T21, T24.

  Hecho cuando: Se aprueba una revisión y se elimina un draft diferente; la definitiva anterior, los manuales y assets permanecen recuperables.

- [ ] **TASK-147 — Ejecutar el conflicto real entre dos pestañas** (25 min estimados).

  **RF/RNF:** RF-9/AC-12, AC-13. **Depende de:** TASK-125, TASK-098. **Pruebas del plan:** T25, T26.

  Hecho cuando: Dos pestañas producen aviso antes de sobrescribir y una doble confirmación de la misma versión deja una aprobación.

- [ ] **TASK-148 — Ejecutar aislamiento de dos cuentas en la interfaz** (25 min estimados).

  **RF/RNF:** RF-11/AC-1, AC-2. **Depende de:** TASK-112, TASK-139, TASK-123, TASK-127. **Pruebas del plan:** T29.

  Hecho cuando: Una cuenta no abre ni copia PMs, originales o referencias ajenos aun alterando los identificadores solicitados.

- [ ] **TASK-149 — Comprobar cambio de idioma y persistencia de preferencia** (20 min estimados).

  **RF/RNF:** RF-11/AC-3, AC-4; RNF-2, RNF-3. **Depende de:** TASK-113, TASK-130, TASK-127. **Pruebas del plan:** T30, T33.

  Hecho cuando: Se cambia es/en, se reabre la sesión y se comprueban conversación localizada, interfaz inglesa y copia empresarial inglesa.

- [ ] **TASK-150 — Preparar el entorno acordado para probar micrófono** (25 min estimados).

  **RF/RNF:** RF-11/AC-5. **Depende de:** TASK-001, TASK-002, TASK-138.

  Hecho cuando: El entorno de prueba dispone de contexto seguro y permiso de micrófono en el navegador acordado; no se confunde con publicar el producto.

- [ ] **TASK-151 — Comprobar conversación real por voz en español** (20 min estimados).

  **RF/RNF:** RF-11/AC-5. **Depende de:** TASK-150. **Pruebas del plan:** T31.

  Hecho cuando: Una petición hablada obtiene respuesta audible española mediante los proveedores elegidos; se registra evidencia distinta de la simulada.

- [ ] **TASK-152 — Comprobar conversación real por voz en inglés** (20 min estimados).

  **RF/RNF:** RF-11/AC-5. **Depende de:** TASK-150. **Pruebas del plan:** T31.

  Hecho cuando: Una petición hablada obtiene respuesta audible inglesa y conserva el documento inglés; el resultado se registra sin inferir exactitud no medida.

- [ ] **TASK-153 — Ejecutar el aviso de escritura no verificada** (25 min estimados).

  **RF/RNF:** RF-9/AC-7, AC-8, AC-12. **Depende de:** TASK-122, TASK-046, TASK-047. **Pruebas del plan:** T22, T25.

  Hecho cuando: Un fallo posterior al commit no muestra éxito; reintentar reconcilia la misma operación sin crear otra PM.

- [ ] **TASK-154 — Comprobar recuperación tras reinicio** (25 min estimados).

  **RF/RNF:** RF-2, RF-9, RF-11; RNF-5, RNF-6. **Depende de:** TASK-146, TASK-149, TASK-077. **Pruebas del plan:** T35.

  Hecho cuando: Tras reiniciar se recuperan originales, drafts, definitivas y preferencias; un draft eliminado no reaparece.

- [ ] **TASK-155 — Preparar el respaldo según la política acordada** (25 min estimados).

  **RF/RNF:** RF-2, RF-9; RNF-5, RNF-6. **Depende de:** TASK-014, TASK-154. **Pruebas del plan:** T35.

  Hecho cuando: Una copia de prueba contiene originales y registros con su relación, según Q6, sin purgar manuales ni drafts por antigüedad.

- [ ] **TASK-156 — Comprobar una restauración aislada** (25 min estimados).

  **RF/RNF:** RF-2, RF-9; RNF-5, RNF-6. **Depende de:** TASK-155. **Pruebas del plan:** T35.

  Hecho cuando: La restauración en un entorno aislado recupera una muestra verificable de originales/versiones y registra los criterios operativos acordados.

- [ ] **TASK-157 — Revisar idioma documental y límites del MVP** (20 min estimados).

  **RF/RNF:** RF-4, RF-5, RF-9, RF-11; RNF-1, RNF-2, RNF-3. **Depende de:** TASK-143, TASK-144, TASK-140. **Pruebas del plan:** T23, T32, T33.

  Hecho cuando: La documentación de requisitos sigue en español; UI/salida empresarial en inglés; no hay escritura CMMS, compras, informes, colaboración ni jerarquía adicional.

- [ ] **TASK-158 — Consolidar trazabilidad y evidencia de aceptación** (25 min estimados).

  **RF/RNF:** RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-11; RNF-1, RNF-2, RNF-3, RNF-4, RNF-5, RNF-6. **Depende de:** TASK-145, TASK-147, TASK-148, TASK-151, TASK-152, TASK-153, TASK-156, TASK-157. **Pruebas del plan:** T01–T35.

  Hecho cuando: T01–T35 tienen evidencia, resultado o bloqueo explícito; no se declara aceptación con fallos relevantes o proveedores pendientes ni se marca una prueba no ejecutada como superada.


