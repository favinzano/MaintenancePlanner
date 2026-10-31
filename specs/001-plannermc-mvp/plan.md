# Plan técnico del MVP de PlannerMC

**Estado:** plan técnico de referencia; el intake local de manuales está implementado parcialmente. La evidencia actual de implementación y pruebas está en [build log](../../replica/build-log.md) y [test plan](../../replica/test-plan.md).
**Fecha de revisión documental:** 2026-10-31.
**Base:** [constitución](../../docs/constitution.md) y [especificación](./spec.md), leídas antes de preparar este plan.

El contenido normativo procede de esos documentos. Las estructuras, tecnologías y algoritmos siguientes son propuestas técnicas para satisfacerlo. Los ejemplos son sintéticos. Las decisiones no fijadas por la especificación se registran como **[NECESITA ACLARACIÓN]**, con el trabajo que bloquean. Este plan no modifica la constitución ni la especificación.

## 0. Alcance y revisión de coherencia

### 0.1. Alcance de esta entrega

Un equipo por análisis; locación y área preconfiguradas; equipo y sub-assets directos; manuales, investigación externa o datos operativos; propuestas de PM; conversación por voz y texto en español o inglés; interfaz y documentación empresarial en inglés; acceso individual; persistencia, revisiones y copia manual al CMMS.

No se implementarán compras, inventario de repuestos, informes, KPIs, gestión o ejecución de Work Orders, sincronización con un CMMS, colaboración entre cuentas, niveles inferiores a sub-assets ni eliminación de manuales. Las instrucciones de una PM pueden mencionar acciones posteriores en el CMMS, pero eso no autoriza a PlannerMC a ejecutarlas.

### 0.2. Contraste con la constitución

| Principio | Lectura frente a la especificación | Ajuste documental necesario |
| --- | --- | --- |
| C1. Stack mínimo | La especificación no elige tecnologías. Cada componente propuesto se justifica en la sección 6 mediante requisitos concretos. | Ninguno por contradicción. Las dependencias elegidas al implementar deberán quedar asociadas a esas decisiones. |
| C2. Spec y código | La matriz y el catálogo de pruebas vinculan el diseño con RF, RNF y AC. | Ninguno por contradicción. Si una duda de este plan cambia comportamiento, deberá resolverse en la especificación antes de implementarlo. |
| C3. Lógica separada | Es compatible con todos los flujos; la aprobación y las validaciones pertenecen al dominio y los casos de uso. | Ninguno. |
| C4. Tests | Exige pruebas automatizadas para cambios de lógica; este documento describe pruebas futuras. | Ninguno. La validación documental del plan no equivale a probar el producto. |
| C5. Persistencia | RF-9/AC-7 amplía expresamente la verificación a manuales, borradores, revisiones, consultas registradas y preferencias. No contradice «cada escritura» de C5. Repuestos y compras permanecen fuera del MVP. | Ninguno por contradicción. La eliminación de un borrador requiere comprobar ausencia, no recuperar un registro que ya no existe; esa precisión se propone en la sección 5. |
| C6. Idioma | Coincide con RF-11/AC-3 a AC-6 y RNF-2/RNF-3: interfaz y documentación empresarial en inglés; conversación en español o inglés, inicialmente inglés. RNF-1 reserva el español para la documentación de especificación. | **No hay conflicto de idioma en los archivos actuales.** No corresponde restaurar la antigua regla de todos los mensajes en inglés. |

Distinción necesaria al presentar errores: los rótulos y avisos propios de la interfaz se muestran en inglés; la explicación y la pregunta dentro de la conversación usan el idioma preferido. El texto literal de una fuente puede conservar su idioma original como evidencia; el contenido empresarial derivado debe estar en inglés.

La especificación declara que no quedan dudas abiertas de la ronda anterior. Las dudas de la sección 9 son decisiones de concreción técnica o límites de comportamiento que esa declaración no define. No se presentan como nuevas funciones aprobadas.

## 1. Estructura de módulos y responsabilidades

### 1.1. Organización propuesta

Un monolito modular: una aplicación web y un servidor de aplicación, desplegables juntos, con una base de datos persistente. Los módulos son límites internos, no servicios independientes.

| ID | Módulo | Responsabilidad | Límite |
| --- | --- | --- | --- |
| M1 | Identity | Autenticar usuario y contraseña, resolver sesión, cuenta y espacio; aplicar propiedad de los registros. | No administrar permisos de colaboración ni permitir acceso cruzado entre cuentas. |
| M2 | IntakeAndSources | Recibir manuales; extraer texto/OCR; conservar páginas o secciones; investigar y ordenar fuentes; registrar sus límites. | No decidir suficiencia ni aprobar una fuente en nombre del planificador. |
| M3 | AssetRegistry | Nombre propuesto/original/final; jerarquía; propuestas de cambio; posibles duplicados. | Sin niveles inferiores al sub-asset ni fusión automática. |
| M4 | MaintenancePlanning | Tareas, frecuencias, duración, estado operativo, máximo de pasos y propuestas de división. | No crear órdenes en el CMMS ni fijar intervalos sin procedencia identificada. |
| M5 | ReviewAndDecisions | Preguntas pendientes, autorización de avance, validación técnica opcional, aprobación y revisiones. | «Pendiente» describe información o una interacción, no un tercer estado de aprobación de PM. |
| M6 | Persistence | Repositorios, transacciones, originales, versiones, lectura posterior, repetición y concurrencia. | No incorporar reglas de frecuencia, idioma o seguridad dentro del almacenamiento. |
| M7 | ConversationAndDocuments | Conversación es/en; entrada/salida de voz; documento inglés y copia íntegra o por paso. | Una respuesta conversacional no sustituye una decisión de dominio persistida. |
| M8 | WebInterface | Login, conversación, carga, jerarquía, edición, diferencias, avisos y controles de copia. | No decidir aprobación, deduplicación ni resolución de conflictos solo en el navegador. |

Estructura lógica propuesta, todavía no creada:

- `src/domain/`: reglas de assets, PMs, frecuencias, procedencia y revisión; sin acceso a red, archivos, base de datos o componentes visuales.
- `src/application/`: casos de uso y coordinación de M1–M7.
- `src/ports/`: contratos de repositorios, documentos, búsqueda, extracción, generación, reconocimiento y síntesis de voz.
- `src/adapters/`: HTTP, PostgreSQL y proveedores externos que se seleccionen.
- `src/ui/`: componentes y estados de presentación de M8.
- `tests/unit/`, `tests/integration/`, `tests/contracts/` y `tests/e2e/`: pruebas por límite.
- `migrations/`: evolución del almacenamiento; su creación pertenece a implementación.

Dependencias: interfaz → casos de uso → dominio. Los adaptadores implementan los contratos que utilizan los casos de uso; el dominio no importa adaptadores ni interfaz. Los textos de la UI y los identificadores se escriben en inglés.

### 1.2. Responsabilidad de la asistencia generativa

La extracción y la generación entregan candidatos estructurados con referencias, no escrituras aprobadas. Los validadores del dominio comprueban estructura, propiedad, profundidad, límites de pasos y estados. El planificador decide la aplicabilidad técnica.

Los documentos y páginas recuperados se tratan como contenido fuente, no como instrucciones para cambiar permisos, aprobar una PM o ejecutar operaciones. Ningún proveedor recibe acceso directo a los repositorios de escritura. Esta separación implementa la aprobación explícita y el aislamiento de RF-9 y RF-11.

## 2. Modelo de datos JSON

### 2.1. Entidades e invariantes

JSON es el contrato de intercambio y de contenido versionado. No implica almacenar todo el sistema en un único archivo JSON.

| Entidad | Datos principales | Reglas |
| --- | --- | --- |
| UserPreferences | userId, workspaceId, username, conversationLanguage | es/en; valor inicial en. Las credenciales y sesiones no forman parte de las respuestas JSON del producto. |
| Catalog | companyId, locations, areas | Cada área pertenece a una locación del mismo espacio. Configuración externa a este flujo. |
| Analysis | equipmentId, sourceIds, decisionIds, processingStage | Un equipo. processingStage es estado de procesamiento, no estado de PM. |
| Asset | id, ownerId, workspaceId, parentAssetId, kind, originalName, nameEn, confirmedAt, rowVersion | kind: equipment o subAsset; subAsset tiene como padre un equipment. Un confirmedAt nulo representa una propuesta, no un «borrador de manual/asset». |
| AssetChangeProposal | targetAssetId, proposedContent, expectedRowVersion | Conserva el registro confirmado hasta aplicar el cambio autorizado. |
| Source | kind, ownerId, originalDocumentId, url, model, applicability, originalText, locator | kind: manual, externalReference o plannerData. Una referencia inexistente queda nula; no se inventa URL, página o modelo. |
| OriginalDocument | id, bytes, mimeType, originalFilename, digest, ownerId | Original inmutable y conservado; los bytes no viajan dentro del JSON de lectura habitual. |
| EvidenceAnnotation | fieldPath, sourceRefs, basis, unresolvedIssueIds | Procedencia por campo o paso; la aprobación no la convierte en «verificada». |
| Frequency | suggested, selected, sourceRefs, basis, isEstimated | Calendario, horas, ciclos, condición compuesta o sin resolver; separa sugerencia de elección final. |
| PM | id, assetId, currentApprovedVersionId | Identidad estable; se puede vincular a un asset propuesto, mostrando esa limitación según RF-4/AC-6. No se permiten referencias a otra cuenta. |
| PMVersion | id, pmId, status, revisionNumber, content, rowVersion, approval | status solo draft o confirmedApproved. Inicial definitiva: revisionNumber 0, etiqueta Initial; posteriores 1, 2, etc. |
| TechnicalValidation | consulted, collaboratorName, validatedElementRefs | Opcional. Sin respuesta literal obligatoria ni autoridad aprobadora atribuida al técnico. |
| PendingIssue | id, fieldPath, reason, plannerDecision, remainsUnresolved | Continuar no borra la duda. La respuesta que resuelve un dato actualiza ese dato y su procedencia. |
| PlannerDecision | action, targetId, targetRowVersion, issueIds, value, decidedAt | Vinculada a contenido concreto para no reutilizar un «sí» sobre una propuesta distinta. |
| OperationReceipt | ownerId, operationId, requestDigest, targetVersionId, resultDigest | Resultado de una escritura; soporta reconciliar reintentos sin duplicar la aprobación. |

**Versiones distintas:** rowVersion cambia al editar o guardar y sirve para detectar conflictos; revisionNumber solo se asigna al aprobar una revisión formal. Una revisión en preparación es una PMVersion draft con baseApprovedVersionId; no cambia la definitiva vigente.

**Referencias:** el historial aprobado conserva una instantánea del contenido y del nombre del asset utilizado. Renombrar un asset no reescribe el documento aprobado. Las relaciones siguen usando identificadores estables.

**Frecuencias:** una frecuencia simple contiene tipo, valor y unidad. Una compuesta contiene condiciones y la relación explícita, por ejemplo whicheverComesFirst. Si la fuente no permite determinar la relación, queda pendiente; no se elige una por defecto. No se ejecuta un calendario de mantenimiento dentro del MVP.

### 2.2. Ejemplo JSON sintético

Este ejemplo sirve exclusivamente para revisar la estructura. Nombres, documentos, referencias, fechas, intervalos, duración y validación técnica son ficticios; no constituyen una PM operativa ni evidencia de una máquina real. El dominio example.invalid no identifica una fuente consultada. Los pasos son marcadores de demostración en inglés.

El ejemplo contiene una versión inicial aprobada y una revisión en borrador de la misma PM. La frecuencia estimada sigue identificada como tal después de la aprobación. La documentación empresarial está en inglés; el dato original aportado por el planificador conserva su español.

```json
{
  "schemaVersion": 1,
  "exampleOnly": true,
  "workspace": {
    "id": "workspace-demo",
    "companyId": "company-demo",
    "companyName": "Demonstration Company"
  },
  "user": {
    "id": "planner-demo",
    "username": "demo.planner",
    "preferences": {
      "conversationLanguage": "es",
      "interfaceLanguage": "en",
      "documentLanguage": "en",
      "enabledChannels": ["text", "voice"]
    }
  },
  "catalog": {
    "locations": [{"id": "location-demo", "nameEn": "Lake Mary"}],
    "areas": [{"id": "area-demo", "locationId": "location-demo", "nameEn": "Canning"}]
  },
  "analysis": {
    "id": "analysis-demo",
    "ownerId": "planner-demo",
    "workspaceId": "workspace-demo",
    "equipmentId": "equipment-demo",
    "sourceIds": ["source-manual", "source-planner", "source-external"],
    "processingStage": "awaitingReview",
    "decisionIds": ["decision-advance"]
  },
  "assets": [
    {
      "id": "equipment-demo",
      "ownerId": "planner-demo",
      "workspaceId": "workspace-demo",
      "kind": "equipment",
      "parentAssetId": null,
      "locationId": "location-demo",
      "areaId": "area-demo",
      "originalName": "B110052 Cranfiller Welm",
      "nameEn": "Cranfiller",
      "manufacturer": null,
      "model": null,
      "serial": null,
      "sourceRefs": [{"sourceId": "source-manual", "page": 2}],
      "confirmedAt": "2026-10-17T14:00:00Z",
      "rowVersion": 2
    },
    {
      "id": "subasset-demo",
      "ownerId": "planner-demo",
      "workspaceId": "workspace-demo",
      "kind": "subAsset",
      "parentAssetId": "equipment-demo",
      "locationId": "location-demo",
      "areaId": "area-demo",
      "originalName": "Valve 46",
      "nameEn": "Filling Valve 46",
      "sourceRefs": [{"sourceId": "source-manual", "section": "Demonstration hierarchy"}],
      "confirmedAt": "2026-10-17T14:01:00Z",
      "rowVersion": 1
    }
  ],
  "documents": [
    {
      "id": "document-demo",
      "ownerId": "planner-demo",
      "originalFilename": "demonstration-manual.pdf",
      "mimeType": "application/pdf",
      "binaryRef": "binary-demo",
      "retention": "preserve",
      "exampleOnly": true
    }
  ],
  "sources": [
    {
      "id": "source-manual",
      "kind": "manual",
      "ownerId": "planner-demo",
      "originalDocumentId": "document-demo",
      "applicability": "plannerReviewed",
      "model": null
    },
    {
      "id": "source-planner",
      "kind": "plannerData",
      "ownerId": "planner-demo",
      "originalText": "Ejemplo ficticio: el equipo trabaja un turno diario.",
      "originalLanguage": "es"
    },
    {
      "id": "source-external",
      "kind": "externalReference",
      "ownerId": "planner-demo",
      "url": "https://example.invalid/demonstration-reference",
      "manufacturer": null,
      "model": "Demonstration variant",
      "applicability": "differentVariant",
      "usedInProposal": false
    }
  ],
  "frequencies": [
    {
      "id": "frequency-demo",
      "suggested": {"kind": "calendar", "value": 1, "unit": "week"},
      "selected": {"kind": "calendar", "value": 1, "unit": "month"},
      "basis": "plannerData",
      "sourceRefs": [{"sourceId": "source-planner"}],
      "isEstimated": true,
      "selectedBy": "planner-demo"
    }
  ],
  "contentSnapshots": [
    {
      "id": "content-initial",
      "language": "en",
      "assetNameEn": "Filling Valve 46",
      "titleEn": "Demonstration Inspection",
      "frequencyId": "frequency-demo",
      "estimatedDurationMinutes": 10,
      "operatingState": "stopped",
      "steps": [
        {"number": 1, "kind": "operatingState", "textEn": "Demonstration only: equipment stopped."},
        {"number": 2, "kind": "safety", "textEn": "Demonstration placeholder for applicable site safety instructions."},
        {"number": 3, "kind": "task", "textEn": "Demonstration placeholder for the documented inspection activity."},
        {"number": 4, "kind": "finalVerification", "textEn": "Verify completion. If a repair is needed, create a corrective work order in the CMMS and close the completed inspection PM there."}
      ],
      "evidence": [
        {"fieldPath": "assetNameEn", "sourceRefs": [{"sourceId": "source-manual", "page": 2}], "basis": "document"},
        {"fieldPath": "frequencyId", "sourceRefs": [{"sourceId": "source-planner"}], "basis": "estimate"}
      ]
    },
    {
      "id": "content-revision",
      "language": "en",
      "assetNameEn": "Filling Valve 46",
      "titleEn": "Revised Demonstration Inspection",
      "frequencyId": "frequency-demo",
      "estimatedDurationMinutes": null,
      "operatingState": "stopped",
      "steps": [
        {"number": 1, "kind": "operatingState", "textEn": "Demonstration only: equipment stopped."},
        {"number": 2, "kind": "safety", "textEn": "Demonstration placeholder for applicable site safety instructions."},
        {"number": 3, "kind": "task", "textEn": "Demonstration placeholder for the revised inspection activity."},
        {"number": 4, "kind": "finalVerification", "textEn": "Verify completion. If a repair is needed, create a corrective work order in the CMMS and close the completed inspection PM there."}
      ],
      "evidence": [
        {"fieldPath": "frequencyId", "sourceRefs": [{"sourceId": "source-planner"}], "basis": "estimate"}
      ],
      "pendingIssueIds": ["issue-duration"]
    }
  ],
  "pms": [
    {
      "id": "pm-demo",
      "ownerId": "planner-demo",
      "workspaceId": "workspace-demo",
      "assetId": "subasset-demo",
      "currentApprovedVersionId": "version-initial"
    }
  ],
  "pmVersions": [
    {
      "id": "version-initial",
      "pmId": "pm-demo",
      "status": "confirmedApproved",
      "revisionNumber": 0,
      "revisionLabelEn": "Initial",
      "rowVersion": 4,
      "contentId": "content-initial",
      "baseApprovedVersionId": null,
      "technicalValidation": {
        "consulted": true,
        "collaboratorName": "Demonstration Technician",
        "validatedElementRefs": ["frequency-demo"]
      },
      "approval": {"plannerId": "planner-demo", "approvedAt": "2026-10-17T14:10:00Z"}
    },
    {
      "id": "version-revision-draft",
      "pmId": "pm-demo",
      "status": "draft",
      "revisionNumber": null,
      "rowVersion": 2,
      "contentId": "content-revision",
      "baseApprovedVersionId": "version-initial",
      "technicalValidation": {"consulted": false, "collaboratorName": null, "validatedElementRefs": []},
      "approval": null
    }
  ],
  "pendingIssues": [
    {
      "id": "issue-duration",
      "targetVersionId": "version-revision-draft",
      "fieldPath": "estimatedDurationMinutes",
      "reasonEn": "Duration has not been provided.",
      "plannerDecision": "continueWithLimitation",
      "remainsUnresolved": true
    }
  ],
  "decisions": [
    {
      "id": "decision-advance",
      "action": "authorizeAssetProposal",
      "targetId": "analysis-demo",
      "targetRowVersion": 1,
      "value": "continue",
      "decidedAt": "2026-10-17T13:50:00Z"
    }
  ]
}
```

El ejemplo omite bytes, contraseñas, tokens y hashes reales. En persistencia se calculará el digest del original; no se aceptará un valor aportado por el generador como prueba de integridad. Las instantáneas aprobadas también incluyen copias inmutables de las frecuencias referenciadas: editar la frecuencia de una nueva revisión no modifica la anterior.

### 2.3. Estados y transiciones

| Objeto | Transición | Condición |
| --- | --- | --- |
| Propuesta de asset | propuesta → registro confirmado | Decisión del planificador; nombres, locación y área resueltos según RF-1; advertencias de relaciones revisadas. |
| PM | draft → confirmedApproved | Confirmación explícita de la versión revisada y sus limitaciones; validaciones estructurales satisfechas. |
| PM definitiva | confirmedApproved → nueva versión draft | Preparar revisión, conservando la definitiva anterior. |
| Revisión | draft → confirmedApproved | Asignar siguiente número formal y fecha una sola vez. |
| Borrador | draft → eliminado | Petición manual del propietario; no eliminar original, asset ni versión aprobada. |
| Dato pendiente | sin resolver → respondido / continuar con limitación | Una respuesta documenta el valor; continuar conserva la incertidumbre. |
| Operación técnica | processing / awaitingDecision / completed / failed / resultUnverified | Estados de ejecución o respuesta, no estados de aprobación de PM. |

Una edición de una PM definitiva se dirige a una nueva revisión; «sobrescribir tras revisar un conflicto» se aplica al borrador o propuesta editable, no a reemplazar silenciosamente una versión definitiva.

## 3. Flujos y algoritmos en pseudocódigo

Los bloques describen comportamiento, no son código ejecutable. Todos los flujos reciben una identidad autenticada. Las acciones de voz y texto utilizan los mismos casos de uso.

### F1. AnalyzeManual

```text
RECIBIR actor, analysisId, document
COMPROBAR propiedad del análisis y que representa un solo equipo
VALIDAR formato y carga con los límites aprobados en Q3
SI la carga no está completa o el archivo no es utilizable
    DEVOLVER problema conocido y opciones corregir / sustituir / continuar sin usar
    NO declarar el análisis completado
SI el original puede incorporarse
    GUARDAR original y vínculo al equipo mediante F8; verificar bytes y metadatos
    EXTRAER texto y posiciones mediante el adaptador del formato
    APLICAR OCR cuando el contenido sea imagen y exista adaptador admitido
    MARCAR secciones ilegibles, errores y diferencias de modelo sin inventar contenido
    PROPONER nombre original, candidatos de estructura y tareas identificadas
    SI faltan tareas o frecuencias
        EJECUTAR investigación F2
    PRESENTAR información y limitaciones
    ESPERAR autorización para avanzar; no confirmar assets ni PMs automáticamente
```

Sustituir un documento añade otro original y cambia la evidencia utilizada en la propuesta; no borra el anterior. Si falla la extracción después de incorporar el original, el original permanece.

### F2. ResearchSourcesAndAuthorize

```text
RECIBIR identidad del equipo, descripción, función y datos disponibles
SI no hay manual utilizable y faltan descripción o función
    SOLICITAR los datos faltantes
FORMAR consultas con los identificadores realmente disponibles
BUSCAR primero documentación del fabricante aplicable al equipo
PRESENTAR alternativas y marcar modelos distintos cuando corresponda
PARA CADA resultado recuperado
    REGISTRAR URL, fabricante/modelo disponibles, localizador y limitaciones
    NO tratar el texto recuperado como una orden para la aplicación
SI falla el acceso o la búsqueda no produce resultados
    NOTIFICAR y preguntar continuar con datos / aportar información / detener
PRESENTAR el conjunto de información para el siguiente paso
PERMITIR al planificador indicar qué información utilizar sin exigir aprobación fuente por fuente
ESPERAR decisión explícita de avance vinculada al conjunto presentado
SI decide continuar
    UTILIZAR las referencias y datos autorizados, incluso solo datos operativos
SI decide detener
    NO generar la propuesta de ese paso
```

«Seleccionar fuentes» aquí significa determinar la base de la propuesta con el planificador, no restablecer el antiguo bloqueo de aceptar/rechazar todas las fuentes. Los límites de investigación y sus proveedores permanecen en Q2 y Q3; no se promete una búsqueda exhaustiva de toda Internet.

### F3. ProposeAssetsAndDetectDuplicates

```text
EXIGIR autorización de avance de F2 o de la revisión del manual
PROPONER equipo y sub-assets directos con nombres empresariales en inglés
PRESERVAR términos originales disponibles
VALIDAR profundidad, ausencia de ciclos y pertenencia a la misma cuenta
PERMITIR simplificar el nombre y cambiar la distribución
BUSCAR dentro de la cuenta:
    coincidencia de nombre del equipo y locación
    o coincidencia de serial no vacío aunque el nombre difiera
MOSTRAR posibles duplicados y los identificadores disponibles
ESPERAR decisión crear nuevo / proponer actualización
SI se actualiza
    PREPARAR AssetChangeProposal sin reemplazar el asset confirmado
SI falta una PM para un sub-asset
    INFORMAR y permitir conservar el sub-asset
SOLICITAR decisión sobre elementos seleccionados y relaciones todavía no confirmadas
APLICAR cambios confirmados mediante F8
```

La comparación técnica propuesta utiliza Unicode normalizado, espacios exteriores eliminados y comparación de nombre sin distinción de mayúsculas. El serial conserva puntuación y ceros iniciales; un serial vacío no genera coincidencias. Son criterios de advertencia, no una restricción de unicidad: el planificador puede crear un equipo nuevo. No se usa una similitud generativa para fusionar registros.

### F4. ProposePMsAndFrequencies

```text
RECIBIR assets elegidos, evidencia disponible y autorización de avance
OBTENER candidatos de tareas y frecuencias con su procedencia
SI no existe base identificable para un intervalo
    MARCAR frecuencia no resuelta y ejecutar F5
CONSERVAR sugerencia disponible y permitir al planificador elegir frecuencia final
AGRUPAR tareas por asset, frecuencia y estado operativo conocido
SEPARAR las tareas en marcha y detenidas aunque compartan frecuencia
SI estado operativo o condición compuesta no están claros
    EJECUTAR F5 sin inventar una agrupación equivalente
PARA CADA grupo
    REDACTAR contenido empresarial en inglés
    INCLUIR estado operativo, precauciones aplicables, acciones y verificación final
    INCLUIR instrucción de orden correctiva/cierre en CMMS para inspecciones
    CONSERVAR correspondencia entre instrucciones de origen y pasos resumidos
    SI no cabe en 15 pasos sin perder indicaciones necesarias
        PROPONER partición, no aplicarla automáticamente
        ESPERAR decisión del planificador
        REDACTAR cada PM resultante con sus propias indicaciones iniciales y finales
    COMPROBAR máximo de 15 pasos y señales de contenido no resuelto
    GUARDAR PM como draft mediante F8
PRESENTAR borradores editables y sus limitaciones
```

No se cuenta cada frase como un paso, pero tampoco se oculta el procedimiento completo dentro de un único paso con subpasos independientes. El planificador revisa la fidelidad y la utilidad de la síntesis; una validación de estructura no demuestra corrección técnica del texto. Si la partición no se autoriza, se vuelve a editar o se mantiene pendiente la propuesta; no se genera una PM de más de 15 pasos.

### F5. ResolvePendingData

```text
RECIBIR el punto afectado, sus fuentes y la versión presentada
EXPLICAR el problema en el idioma de conversación elegido
OFRECER aportar respuesta / continuar con limitación
SI el planificador aporta respuesta
    ACTUALIZAR el campo; registrar procedencia plannerData o la nueva referencia
    MARCAR resuelto solo aquello que la respuesta efectivamente resuelve
SI el planificador decide continuar
    REGISTRAR esa decisión vinculada al contenido revisado
    CONSERVAR el dato no resuelto y su advertencia visible en la documentación
SI la decisión no identifica el punto o corresponde a una versión anterior
    SOLICITAR aclaración
NO convertir una decisión de continuar en evidencia documental
```

Las ausencias de frecuencia, duración o información técnica no se convierten por defecto en bloqueos: RF-7 permite decisión explícita de continuar. En cambio, fallos de autenticación, referencias a otra cuenta, ciclos o un formato ilegible no son datos técnicos que el planificador pueda dar por válidos. Faltas de nombre, locación o área al confirmar equipo se rigen por RF-1/AC-5.

### F6. ReviewAndConfirm

```text
RECIBIR actor, targetVersionId, expectedRowVersion, operationId, decisión
RECUPERAR contenido actual, procedencia y limitaciones
SI la misma versión ya fue aprobada por esa operación o por otra confirmación equivalente
    RECUPERAR su resultado verificado; no crear otra PM ni revisión
COMPROBAR propiedad, estado, versión editada y decisión explícita del planificador
MOSTRAR las limitaciones que siguen abiertas y las relaciones no confirmadas
SI no hay decisión sobre las limitaciones mostradas
    ESPERAR decisión; no inferir consentimiento
SI frecuencia estimada y no hubo consulta técnica
    PERMITIR continuar sin añadir un bloqueo
SI se registró consulta
    GUARDAR validación y colaborador; no exigir respuesta literal del técnico
COMPROBAR límites de jerarquía, pasos y documento inglés
SI el contenido cambió desde la revisión
    EJECUTAR F9 y solicitar nueva revisión del contenido
APROBAR mediante F8:
    congelar contenido y procedencia de la versión
    asignar Initial/0 o siguiente revisión formal
    guardar aprobador y fecha
    actualizar la referencia a versión vigente una sola vez
DEVOLVER éxito solo después de lectura posterior satisfactoria
```

La autorización no elimina las anotaciones de estimación o falta de evidencia. Una PM vinculada a un asset aún propuesto presenta esa relación para decisión según RF-4/AC-6; confirmar la PM no confirma implícitamente el asset.

### F7. CreateRevisionOrDeleteDraft

```text
SI se solicita modificar una PM definitiva
    CREAR versión draft basada en la definitiva con número formal todavía nulo
    CONSERVAR la versión aprobada y su documento sin cambios
    EDITAR mediante control de rowVersion
    APROBAR posteriormente mediante F6
SI se solicita eliminar un draft propio
    COMPROBAR que no se convirtió en definitivo desde que se abrió
    ELIMINAR solo el draft y su contenido exclusivo
    PRESERVAR manuales, assets y versiones aprobadas
    COMPROBAR ausencia tras confirmar la escritura
SI no se solicita eliminación
    CONSERVAR el draft sin vencimiento por antigüedad o inactividad
```

### F8. PersistAndReadBack

```text
AUTENTICAR y delimitar ownerId/workspaceId desde la sesión
CALCULAR huella del comando y del resultado esperado
BUSCAR recibo previo por ownerId + operationId
SI existe y la huella del comando coincide
    RECUPERAR y verificar su resultado; devolverlo sin repetir la mutación
SI existe con otro comando
    DEVOLVER conflicto de operación, sin escribir
INICIAR transacción breve
    COMPROBAR rowVersion y reglas de unicidad de confirmación
    ESCRIBIR datos, instantánea de resultado y recibo en la misma transacción
    COMPARAR datos escritos antes de cerrar la transacción
CONFIRMAR transacción
LEER de nuevo desde almacenamiento primario en una operación independiente
COMPARAR identidad, propietario, versión y contenido esperado
PARA original documental, verificar también bytes y digest
PARA eliminación, verificar ausencia y conservación de referencias protegidas
SI lectura coincide
    DEVOLVER resultado verificado
SI falla lectura, conexión o comparación
    DEVOLVER resultUnverified y operationId; no declarar éxito ni rollback inexistente
    AL REINTENTAR, reconciliar el recibo antes de intentar cualquier nueva escritura
```

No se mantienen transacciones abiertas durante llamadas a IA, búsquedas, reconocimiento de voz o espera de respuesta humana. La unicidad por versión aprobada también debe impedir duplicados cuando dos pestañas envían operationId distintos para la misma versión.

### F9. ResolveConcurrentEdit

```text
COMPARAR expectedRowVersion con rowVersion actual al intentar guardar
SI difieren
    CONSERVAR el registro actual y la edición local
    MOSTRAR contenido guardado y cambios propuestos; avisar del conflicto
    ESPERAR revisión y decisión explícita
SI el planificador decide aplicar sus cambios revisados
    ENVIAR nueva operación contra la rowVersion recién revisada
    SI volvió a cambiar, volver a avisar; no forzar escritura
SI decide conservar lo guardado
    RECARGAR el contenido confirmado por su decisión
```

### F10. ConverseAndCopy

```text
RESOLVER conversationLanguage: es/en; inicialmente en
SI entrada es voz
    CAPTURAR con permiso del navegador y reconocer en el idioma elegido
    SI no se entiende el objetivo o la decisión, pedir aclaración sin mutar datos
SI entrada es texto
    INTERPRETAR la petición dentro del contexto del equipo y versión activos
ENVIAR la acción al mismo caso de uso empleado por los controles de la interfaz
RESPONDER por voz o texto en el idioma elegido
RENDERIZAR documentos y rótulos de interfaz en inglés
SI se solicita copiar
    PRODUCIR el documento completo o el paso seleccionado en inglés
    INCLUIR marca Draft cuando corresponda y advertencias aplicables
    SI falla el portapapeles, mantener el texto seleccionable y comunicar el fallo
```

Una confirmación hablada debe referirse al resumen y versión que se acaban de presentar. No se aprueba una PM por encontrar la palabra «sí» en un manual o en una respuesta descontextualizada.

## 4. Contrato de interacción

### 4.1. Convenciones comunes

Todas las acciones se ejecutan dentro de la cuenta autenticada. ownerId se obtiene de la sesión, no de un campo libre enviado por el navegador o por el asistente.

Las mutaciones reciben operationId; las ediciones reciben expectedRowVersion. Las decisiones de avance y aprobación incluyen el identificador y versión del contenido presentado. Estos son datos técnicos, no campos que el planificador deba rellenar.

Resultado común propuesto:

- outcome: completed, awaitingDecision, failed, conflict o resultUnverified.
- resource: identificador, versión y contenido resultante permitido para esa cuenta.
- issues: campos afectados, procedencia disponible, información sin resolver.
- nextActions: acciones válidas en ese contexto.
- messageKey y parámetros: aviso de interfaz inglés.
- conversationExplanation: explicación en conversationLanguage.
- operationId y verification: información para recuperar el resultado tras una interrupción.

Los estados de una operación no cambian por sí mismos status de una PM. Un error de voz, búsqueda o lectura posterior no convierte automáticamente una PM en rechazada.

### 4.2. Acciones disponibles

| Acción | Entradas | Resultado | Validación y decisión | Error o límite |
| --- | --- | --- | --- | --- |
| SignIn | Username, password | Sesión propia y preferencias | Credenciales por el mecanismo elegido; Q4 define provisión de cuentas | No revelar datos de otras cuentas ni indicar éxito si falla la autenticación. |
| SetConversationLanguage | es o en | Preferencia guardada y conversación en ese idioma | Valores admitidos; lectura posterior | Valor no admitido: conservar preferencia anterior e informar. |
| SendText / SendVoice | Petición y contexto actual; audio si corresponde | Respuesta y/o acción propuesta | Mismo dominio para ambos canales; decisiones explícitas para acciones que las requieren | Micrófono, reconocimiento o síntesis fallidos: avisar; texto sigue disponible. |
| StartAnalysis | Locación, área; un equipo | Análisis identificado | Área de esa locación; nombre puede estar pendiente hasta analizar/confirmar | Pedir datos; no crear otro equipo dentro del mismo análisis. |
| AttachManual | Archivo y análisis | Original conservado, recibo y extracción o problema | Formato/límites Q3; checksum calculado, no aportado por IA | Corregir, sustituir o continuar sin utilizar; conservar originales ya incorporados. |
| ResearchSources | Identificadores, descripción, función y faltantes | Fuentes y límites encontrados | Prioridad OEM aplicable; marcar variante diferente | Notificar fallo y pedir decisión; no bloqueo automático por falta de fuentes externas. |
| AuthorizeNextStep | Propuesta presentada, versión, decisión | Avance autorizado o análisis detenido | La autorización se refiere a un paso concreto | Ante decisión ambigua o antigua, solicitar aclaración. |
| EditAssetProposal | Nombre, jerarquía, datos y versión | Propuesta actualizada | Inglés empresarial, profundidad y propiedad; confirmar nombre antes del alta definitiva | Advertir duplicados y relaciones pendientes; no reemplazar confirmado sin decisión. |
| ConfirmAssetProposal | Elementos y decisiones sobre avisos | Assets confirmados verificados | RF-1/AC-5; no confirmar elementos no seleccionados implícitamente | Conservar propuesta o informar resultUnverified según la escritura. |
| ProposePMs | Assets, evidencia y autorización | Drafts, o propuesta de partición pendiente | Frecuencia/estado, 15 pasos, referencias disponibles | Mostrar faltantes; pedir decisión de división antes de aplicarla. |
| EditDraft | Campos modificados, expectedRowVersion | Draft guardado | Contenido editable; evidencia anterior conservada como antecedente, nuevos aportes identificados | Si otra sesión guardó antes, conflicto; no sobrescritura silenciosa. |
| ResolvePendingData | Dato/respuesta o continuar con limitación | Campo respondido o incertidumbre conservada | Alcance/versiones de la decisión | No aceptar «continuar» como dato técnico ni inventar el faltante. |
| RecordTechnicalValidation | Elementos validados y colaborador | Registro opcional asociado | Si consulted=true, identificar quién colaboró; sin transcripción ni aprobación del técnico | No bloquear la PM por consulted=false, incluida frecuencia estimada. |
| ConfirmPM | Versión, decisiones, operationId | Una aprobación y documento vigente | Campos no resueltos visibles; aprobación explícita; reglas estructurales | Reintento equivalente devuelve la aprobación existente; fallo de lectura no comunica éxito. |
| StartRevision | PM definitiva y base | Nueva versión draft | Mantener definitiva anterior; número formal todavía nulo | No editar directamente el contenido aprobado. |
| ResolveEditConflict | Última versión revisada y decisión | Cambio aplicado o contenido actual conservado | Nueva comprobación de versión al escribir | Nuevo cambio concurrente: repetir aviso, sin forzar sobrescritura. |
| DeleteDraft | Draft propio y versión | Borrador eliminado y ausencia verificada | No es una PM definitiva; proteger manuales/assets/revisiones | Si cambió a definitiva, no eliminar; mostrar su estado actual. |
| CopyDocument / CopyStep | PMVersion y alcance | Texto inglés copiable | Marca Draft y limitaciones pertinentes; no copiar una versión distinta de la mostrada | Si el portapapeles falla, no afirmar que se copió; ofrecer selección del texto. |

Los textos empresariales introducidos en español reciben una propuesta en inglés antes de integrarse al documento. Los nombres propios, códigos y seriales no se traducen como prosa. El contenido original se conserva como antecedente cuando corresponda; no se presupone que toda entrada escrita por el usuario ya esté en inglés.

### 4.3. Errores y estados técnicos

| Código propuesto | Cuándo | Resultado esperado | Idioma |
| --- | --- | --- | --- |
| AUTH_REQUIRED / ACCESS_DENIED | Sesión ausente o recurso ajeno | Sin contenido ni mutación de otra cuenta | Aviso UI inglés; explicación conversacional localizada. |
| INVALID_INPUT | Estructura inválida, idioma no permitido o referencia inexistente | Señalar campos; conservar trabajo editable | Mismo criterio. |
| DOCUMENT_UNUSABLE | Archivo ilegible, protegido o formato no admitido | Decisión corregir/sustituir/no utilizar | Mismo criterio. |
| EXTERNAL_LOOKUP_FAILED | Red, acceso o proveedor de búsqueda fallido | Decisión del planificador sobre información disponible | Mismo criterio. |
| MODEL_OUTPUT_INVALID | Salida generativa mal formada o sin correspondencia con el contenido | No persistir como PM válida; informar y permitir reintentar o editar | Mismo criterio. |
| DECISION_REQUIRED | Falta autorización de avance, de división o de confirmación | awaitingDecision; conservar datos | Pregunta en idioma de conversación. |
| VERSION_CONFLICT | expectedRowVersion desactualizada | conflict; mostrar diferencias para revisión | UI inglesa y explicación localizada. |
| OPERATION_CONFLICT | operationId reutilizado con otro comando | No ejecutar comando diferente bajo el mismo recibo | Mismo criterio. |
| WRITE_FAILED | Se conoce que la transacción no se confirmó | failed; conservar trabajo para reintento | Mismo criterio. |
| WRITE_RESULT_UNVERIFIED | Commit o lectura posterior inciertos | Reconciliar resultado por operación; no afirmar guardado ni pérdida | Mismo criterio. |
| VOICE_UNAVAILABLE | Permiso, captura, reconocimiento o síntesis fallidos | Informar y mantener interacción por texto | Mismo criterio; no reproducir contenido en otro idioma como sustitución silenciosa. |
| CLIPBOARD_FAILED | Copia no completada | Texto seleccionable; no mensaje falso de copia | Mismo criterio. |

No se establecen tiempos de respuesta ni porcentajes de exactitud no acordados. Los timeouts y límites que se elijan deben tener resultados comprobables y no presentarse como «no existe manual» cuando el hecho es «la búsqueda falló».

## 5. Persistencia y verificación por lectura posterior

### 5.1. Propuesta de almacenamiento

PostgreSQL como repositorio transaccional único del MVP: columnas relacionales para propiedad, identidad, relaciones y unicidad; JSONB para contenido de PM, frecuencias y anotaciones; BYTEA para originales mientras el tamaño/volumen definido en Q3 sea compatible con esta elección.

La disponibilidad de JSONB y almacenamiento binario está documentada en [tipos JSON de PostgreSQL](https://www.postgresql.org/docs/current/datatype-json.html) y [tipos binarios](https://www.postgresql.org/docs/current/datatype-binary.html). La elección de usarlos aquí es una propuesta del plan, no una necesidad impuesta por la especificación.

| Datos | Escritura y conservación | Lectura posterior |
| --- | --- | --- |
| Manual original | Insertar original inmutable con metadatos y digest; no endpoint de eliminación | Recuperar bytes y comparar digest, longitud y vínculo al equipo. |
| Documento sustituto | Nueva identidad; conservar el anterior | Verificar ambos registros y sus referencias. |
| Texto extraído y fuentes | Asociar a original/URL/datos aportados; no reemplazar evidencia previa de una definitiva | Leer localizadores, contenido extraído y propietario. |
| Assets | Propuestas y cambios separados del registro confirmado | Leer nombre, jerarquía, relación de catálogo y versión. |
| PM draft | Guardar ediciones sin asignar revisiones formales | Leer contenido persistido y rowVersion; sin vencimiento automático. |
| PM aprobada | Instantánea inmutable; actualizar puntero a vigente en la misma transacción | Leer versión, aprobador, fecha, número y contenido congelado. |
| Nueva revisión | Conservar definitiva anterior y nueva draft; numerar al aprobar | Leer base, nueva versión y puntero vigente. |
| Consulta técnica | Solo si se registra; conservar colaborador y elementos validados | Leer los campos guardados; no exigir transcript. |
| Preferencia | Valor por usuario es/en | Recuperar valor persistido; no aceptar cambio solo en memoria del navegador. |
| Eliminación de draft | Eliminar draft y contenido exclusivo; conservar entidades protegidas | Comprobar ausencia y existencia de manuales, assets y versiones aprobadas. |
| Recibo de operación | Insertar en la transacción de la operación | Recuperar por operación y contrastar el comando y resultado. |

Las fuentes, documentos, análisis, conversaciones de trabajo y versiones se consultan dentro del propietario y espacio correspondientes. La comprobación de propiedad se aplica también a descargas, búsquedas de duplicados, consultas de recibos y referencias indirectas.

### 5.2. Transacciones y confirmación repetida

- Unidad atómica: la confirmación de una PMVersion, su número de revisión, el puntero vigente y el recibo de operación. Una llamada no confirma por cascada las otras PMs de la pantalla.
- Unicidad técnica de la aprobación por PMVersion. La misma confirmación con otra operationId tampoco produce otra revisión.
- operationId es estable al reintentar una petición; un requestDigest distinto bajo la misma operationId es conflicto.
- El siguiente número formal se asigna dentro de la transacción, protegiendo la serie por PM. Una restricción de unicidad refuerza PM + revisionNumber.
- El control de concurrencia actualiza solamente si coincide expectedRowVersion. Una revisión humana de un conflicto no elimina esta comprobación.
- El intento de borrar un draft y el de aprobarlo se serializan sobre su versión: si ya fue aprobado, la eliminación de borrador no se aplica.

La justificación de transacciones breves y comprobaciones de concurrencia se apoya en la [documentación de aislamiento de PostgreSQL](https://www.postgresql.org/docs/current/transaction-iso.html); la política de revisión del conflicto procede de RF-9/AC-13.

### 5.3. Verificar sin confundir éxito, estado actual y reintento

La verificación se efectúa después del commit, desde una nueva lectura al almacenamiento primario; no desde la respuesta en memoria, el objeto enviado, la caché de UI ni una réplica que pudiera estar atrasada.

Para datos mutables se conserva en el recibo una instantánea técnica del resultado de la operación. Si otra edición posterior legítima ya cambió el registro, se verifica la operación anterior contra su resultado inmutable y se devuelve también la versión actual. No se afirma que el valor actual siga siendo el anterior. Estas instantáneas técnicas no son revisiones formales de PM ni se muestran como tales.

Si se elimina un draft, se elimina también su contenido exclusivo en las instantáneas técnicas; se conserva solo el identificador/resultado mínimo de la eliminación y la información necesaria para impedir que un reintento antiguo lo recree o devuelva el contenido eliminado. La conservación de copias de respaldo pertenece a Q6.

Un error de lectura después de un commit no demuestra que el guardado falló. El contrato resultUnverified conserva la operación para reconciliarla. Un reintento no debe crear una PM diferente para «asegurar» que exista.

Para confirmar originales se comprueban bytes y vínculo, no solo metadatos. Si Q3 lleva a elegir almacenamiento binario separado, este apartado deberá detallarse de nuevo antes de implementar esa alternativa: no se asumirá atomicidad entre servicios diferentes.

### 5.4. Procesamiento de duración variable

Análisis y búsqueda guardan su estado operativo y resultados asociados al análisis. Propuesta inicial: trabajo coordinado por la propia aplicación con registros persistidos en PostgreSQL, sin añadir un servicio de colas. Una interrupción recupera el estado conocido y ofrece reintento de la operación; no borra el original ni aprueba la propuesta.

Los reintentos de lectura externa pueden repetirse; las escrituras internas pasan por F8. Cambiar proveedores o reintentar una generación crea un nuevo candidato para revisión y no altera una definitiva.

El almacenamiento duradero no sustituye una política de respaldo y restauración. La conservación sin vencimiento de drafts y manuales no autoriza purgas por antigüedad ante una cuota agotada: se comunica el fallo de capacidad y se conserva lo ya guardado.

## 6. Decisiones técnicas justificadas

Cada decisión es una propuesta de este plan. Las alternativas descartadas se descartan para este MVP, no como afirmación de que sean incorrectas en otros proyectos. No se han instalado dependencias ni contratado proveedores.

| ID | Propuesta | Requisito/motivo | Alternativa descartada y motivo |
| --- | --- | --- | --- |
| D1 | Monolito modular web con dominio separado y un despliegue de aplicación | C1, C3; flujos de RF-1 a RF-11 comparten identidad y datos | Microservicios: añadirían despliegues y coordinación distribuida sin una necesidad de alcance que los justifique. |
| D2 | TypeScript para interfaz, servidor y contratos; Node.js en una línea LTS mantenida | C1, C2: un lenguaje de implementación para contratos y reglas, con identificadores ingleses | Backend en otro lenguaje junto a un frontend TypeScript: no se ha identificado una biblioteca imprescindible que justifique dos lenguajes. |
| D3 | React para la interfaz y Vite para construcción; servidor Fastify con contratos JSON Schema | M8 requiere edición, jerarquía, conversación, voz y conflictos; validar entradas en el servidor | Framework de aplicación con SSR y funciones distribuidas: no hay requisito de indexación pública ni renderizado de servidor que justifique esa capa en este plan. |
| D4 | PostgreSQL, contenido JSONB y originales BYTEA, sujeto a Q1/Q3 | RF-9/AC-7 a AC-13: transacciones, aislamiento, versiones y datos persistentes | JSON en disco o localStorage como fuente de verdad: no se eligen para coordinar confirmaciones concurrentes y cuentas. SQLite sigue siendo alternativa si Q1 determina un uso exclusivamente local que justifique revisar D4. |
| D5 | Extracción/OCR de manuales en el navegador con PDF.js, Mammoth y Tesseract.js; búsqueda, generación, STT y TTS mantienen puertos con proveedores pendientes | RF-2, RF-3 y RF-11 requieren capacidades distintas; Q2 define el tratamiento local de manuales y aplaza las demás capacidades externas | Enviar manuales a un servicio de procesamiento externo contradice Q2; acoplar el dominio a un único servicio multimodal impediría probarlo por separado. |
| D6 | Extracción local por formato con localizadores; generación con evidencias y salida estructurada permanece diferida | RF-2/AC-5 y RNF-4; RF-5/AC-9 cuando se habilite generación | Enviar todo el manual como texto sin posiciones perdería localizadores; generación sin referencias no respeta la procedencia requerida. |
| D7 | Fragmentos por página/sección para un equipo; sin base vectorial inicial | RF-1 limita a un equipo por análisis; no existe búsqueda corporativa entre manuales en este MVP | Base vectorial y plataforma general de recuperación: añadirían almacenamiento/operación antes de demostrar una necesidad que la selección por secciones no cubra. Si Q3 invalida la estrategia, se revisa esta decisión. |
| D8 | Máquina de estados de dominio y decisiones explícitas; proveedor generativo sin permisos de escritura | RF-3/AC-4, RF-7 y RF-9 | Agente que se autoautoriza y opera la base o el CMMS: contradice el control del planificador y el alcance. |
| D9 | Sesión web propia, credenciales con hash adaptativo y control de propiedad en servidor | RF-11/AC-1 y AC-2; no exponer contraseñas en JSON | Contraseña en texto claro o aislamiento solo por filtros de UI: no se eligen como autenticación y aislamiento de cuentas. La provisión de cuentas queda en Q4. |
| D10 | Captura de voz desde navegador, STT y TTS mediante adaptadores del servidor | RF-11/AC-5: entrada y respuesta hablada en ambos idiomas | Dictado que solo llena un campo de texto: no cubre la respuesta por voz acordada. Una llamada telefónica o plataforma de videollamada añade funciones no solicitadas. |
| D11 | Preferencia es/en para conversación; renderer inglés independiente para interfaz y documento | C6, RNF-2/RNF-3 | Traducir toda la aplicación al idioma conversacional: incumpliría la interfaz y salida empresarial en inglés. |
| D12 | Control optimista de versión, recibo de operación y unicidad por PMVersion aprobada | RF-9/AC-12 y AC-13 | «Gana la última escritura» y deshabilitar solo el botón Confirm: no expresan el comportamiento acordado para dos sesiones y reintentos. |
| D13 | Instantáneas definitivas inmutables; borradores editables y número formal al aprobar | RF-9/AC-2, AC-5 y AC-6 | Numerar una revisión por cada edición o modificar directamente la definitiva: contradice la distinción acordada. |
| D14 | Texto empresarial copiable completo o por paso, con marca Draft cuando aplique | RF-5/AC-7 y AC-8; RF-9/AC-9 | Conector CMMS, exportación específica de un proveedor o creador de Work Orders: fuera de alcance. No se necesita generar PDF o Word de salida para cumplir copiar/pegar. |
| D15 | node:test para dominio/integración y Playwright para recorridos web; dobles para proveedores | C4 y trazabilidad de la sección 7 | Todas las pruebas contra proveedores vivos o comparación literal de texto generativo: mezclarían disponibilidad/coste externo con reglas deterministas y no comprobarían bien las invariantes. |

Referencias técnicas consultadas para estas propuestas:

- Node recomienda líneas Active LTS o Maintenance LTS para producción; la versión exacta se fijará al implementar, sin depender de «latest». [Política de versiones de Node.js](https://nodejs.org/en/about/previous-releases).
- Fastify documenta validación y serialización con esquemas; se propone usar esa frontera sin convertir los esquemas en reglas de negocio. [Validación y serialización](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/).
- Para hashes de contraseña se propone una biblioteca mantenida con Argon2id, conforme a la guía consultada; no escribir una implementación criptográfica propia. [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
- La captura de micrófono requiere permiso y un contexto seguro del navegador. Debe contemplarse en Q1 y en las pruebas de voz. [MDN: getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
- Node dispone de un runner de pruebas integrado; el plan utilizará las funciones disponibles en la línea LTS que se fije. [Node test runner](https://nodejs.org/api/test.html).

La biblioteca de intake local quedó elegida para esta entrega; sus versiones instaladas quedan registradas en `package-lock.json`. Siguen pendientes los proveedores de investigación externa, IA y voz, así como cuotas, modelos, precios, formatos de audio y tiempos límite. Los límites de carga de Q3 tampoco se deducen de la disponibilidad de un servicio.

## 7. Estrategia de tests vinculada a aceptación

### 7.1. Capas y evidencia

- **Unitarias:** jerarquía, separación por frecuencia/estado, conteo de pasos, estados, procedencia, selección de frecuencia y reglas de aprobación. Sin red, UI ni base de datos.
- **Integración:** base real de pruebas, escrituras/lectura posterior, rollback conocido, commit incierto, aislamiento de cuentas, transacciones concurrentes y documentos binarios.
- **Contrato:** adaptadores de extracción, búsqueda, generación y voz con ejemplos válidos, ilegibles, incompletos, contradictorios y fallidos. Respuestas simuladas no acreditan la calidad de un proveedor real.
- **E2E:** recorridos web en español e inglés, voz y texto, copia, edición en dos pestañas y decisiones del planificador.
- **Evaluación de contenido:** corpus de manuales y casos de prueba con procedencia conocida. Comprobar preservación de advertencias, aplicabilidad y referencias; la revisión humana del planificador sigue siendo parte del flujo. No se afirma que el simple conteo de pasos detecte omisiones semánticas.

Para cada prueba futura registrar AC, entrada, resultado esperado, resultado observado y evidencia. No se establece un porcentaje de cobertura arbitrario. El cierre exige cubrir los criterios acordados y resolver los fallos relevantes, no sumar pruebas repetidas.

### 7.2. Catálogo de pruebas previsto

| ID | Cobertura | Escenario y resultado comprobable | Capa |
| --- | --- | --- | --- |
| T01 | RF-1/AC-1 a AC-5 | Un equipo; catálogo válido; nombre derivado editable y original conservado; manual sin nombre solicita entrada; no confirmar equipo sin nombre/locación/área | Unidad, integración, E2E |
| T02 | RF-2/AC-1 | PDF textual, PDF escaneado, Word admitido e imagen; original en idioma distinto de conversación; extracción utilizable o limitación explícita | Contrato, integración |
| T03 | RF-2/AC-2 y AC-5 | Archivo corrupto/protegido/ilegible/no admitido/grande/interrumpido y variante distinta; comunicar problema y ofrecer decisión, sin éxito falso | Contrato, E2E |
| T04 | RF-2/AC-3 y AC-4; RNF-6 | Guardar y volver a leer bytes; sustituir sin borrar original; rechazar eliminación del manual por el flujo de borrador | Integración |
| T05 | RF-3/AC-1 a AC-3 | Sin manual requiere descripción/función; ordenar documentación aplicable del fabricante y señalar variantes; no inventar identificadores faltantes | Unidad, contrato |
| T06 | RF-3/AC-4, AC-5 y AC-7 | No avanzar sin decisión; avanzar con datos operativos autorizados; aceptar/modificar/descartar propuestas sin exigir aprobar todas las fuentes | Unidad, E2E |
| T07 | RF-3/AC-6 y AC-8 | Red fallida, sin resultados, acceso denegado y manual sin frecuencia/tareas; notificar, investigar faltantes y aplicar decisión del planificador | Contrato, E2E |
| T08 | RF-4/AC-1 a AC-4 | Jerarquía locación/área/equipo/sub-asset, válvula 46 admisible, no nietos/ciclos; nombres ingleses y términos originales | Unidad, E2E |
| T09 | RF-4/AC-5 y AC-6 | Conservar sub-asset sin PM; avisar de relación aún no confirmada y no confirmar el padre por cascada | Unidad, integración |
| T10 | RF-5/AC-1 a AC-4 | Campos mínimos presentes o marcados; estado/seguridad al inicio; acciones y verificación final; instrucción correctiva/CMMS sin crear órdenes | Unidad, contrato, contenido |
| T11 | RF-5/AC-5, AC-6 y AC-10 | Casos de 7 y 15 pasos; propuesta de 16 no se publica como PM válida; proponer división y esperar decisión; cada parte conserva seguridad/cierre y máximo | Unidad, contenido, E2E |
| T12 | RF-5/AC-7 y AC-8 | Copia íntegra y por paso en inglés; Draft visible en borrador; limitaciones pertinentes; fallo de portapapeles no comunica éxito | E2E |
| T13 | RF-5/AC-9 | Página/sección o URL/modelo cuando existen; datos del planificador sin cita artificial; referencias a manual sustituido todavía accesibles | Unidad, integración |
| T14 | RF-6/AC-1 a AC-3 | Frecuencia sugerida editable; antecedente opcional; estimación por datos/similar identificado; elección final no borra procedencia | Unidad |
| T15 | RF-6/AC-4, AC-5 y AC-7 | Sin base pide decisión; calendario/horas/ciclos y «primero que ocurra» mantienen significado; discrepancias se muestran al planificador | Unidad, E2E |
| T16 | RF-6/AC-6 y AC-8 | Mismo asset con intervalos distintos produce grupos separados; misma frecuencia con estados en marcha/detenido también | Unidad, contenido |
| T17 | RF-7/AC-1 a AC-5 | Precauciones disponibles, incertidumbre y contradicciones; continuar con limitación no crea datos ni borra avisos; versión modificada exige decisión actual | Unidad, E2E |
| T18 | RF-7/AC-6 | Salida generada no declara cumplimiento OSHA; documento fuente con esa frase no autoriza una declaración propia de PlannerMC | Contrato, contenido |
| T19 | RF-8/AC-1 a AC-4; RF-7/AC-5 | Registrar validación opcional y colaborador sin transcripción; incorporar cambios; **aprobar frecuencia estimada con consulted=false** tras decisión del planificador; no atribuir aprobación al técnico | Unidad, integración, E2E |
| T20 | RF-9/AC-1 a AC-4 | Draft recuperable y editable; varias ediciones sin revisión formal; aprobación única; incertidumbre no crea estados adicionales de PM | Unidad, integración |
| T21 | RF-9/AC-5 y AC-6 | Inicial 0, revisiones 1/2; fecha y diferencias; definitiva anterior intacta durante preparación; frecuencia/nombre anteriores no cambian al editar nueva versión | Integración, E2E |
| T22 | RF-9/AC-7 y AC-8; RNF-5 | Guardar y releer cada tipo de dato; fallo antes de commit, desconexión durante commit, error posterior y contenido discordante; no afirmar éxito sin verificación | Integración |
| T23 | RF-9/AC-9 | Confirmar modifica solo PlannerMC; ninguna llamada de escritura a CMMS; instrucciones copiadas no ejecutan órdenes | Integración, E2E |
| T24 | RF-9/AC-10 y AC-11 | Eliminar draft propio; preservar manuales/assets/definitivas; borrar un draft ya aprobado falla; paso del tiempo no elimina drafts | Unidad, integración |
| T25 | RF-9/AC-12 | Doble clic, reintento y dos operationId para la misma versión: una aprobación; operación previa incompleta se completa una vez; misma clave con contenido distinto produce conflicto | Integración concurrente |
| T26 | RF-9/AC-13 | Dos sesiones guardan cambios; segunda recibe conflicto y conserva edición; revisión y decisión permiten reintentar; tercer cambio vuelve a avisar | Integración, E2E |
| T27 | RF-10/AC-1 a AC-3 | Nombre/locación coincidentes, mismo serial con distinto nombre, serial vacío y múltiples candidatos; planificador elige crear/actualizar | Unidad, E2E |
| T28 | RF-10/AC-4 y AC-5 | Propuesta de actualización no muta confirmado; nueva evidencia notifica y no cambia una versión definitiva | Integración, E2E |
| T29 | RF-11/AC-1 y AC-2 | Login correcto/incorrecto; dos cuentas aisladas en registros, manuales, referencias, duplicados, operaciones y descargas | Integración, E2E |
| T30 | RF-11/AC-3 y AC-4; RNF-2 | Primera conversación inglesa; elegir español, persistir y reabrir; cambiar a inglés; no ofrecer otros idiomas; interfaz sigue inglesa | Integración, E2E |
| T31 | RF-11/AC-5 y AC-6 | Petición y respuesta de voz/texto en es/en; micrófono denegado, audio ininteligible, STT/TTS fallidos y confirmación sin contexto; no ejecutar una mutación ambigua | Contrato, E2E |
| T32 | RNF-1 | Documentación de especificación y AC en español; nombres técnicos ingleses no convierten el documento en una UI | Revisión documental |
| T33 | RNF-3 | Documento/tabla/nombres/descripciones ingleses tras conversación española; cambiar idioma no traduce la PM; preservar códigos y citas originales como evidencia | Unidad, contenido, E2E |
| T34 | RNF-4 | Fuentes, aportes, estimaciones y faltantes distinguibles antes y después de aprobar; edición del planificador no se atribuye al manual | Unidad, integración |
| T35 | RNF-5 y RNF-6 | Reinicio recupera drafts, aprobados, originales y preferencias; borrador eliminado no reaparece por reintento antiguo; restauración según política Q6 | Integración, operación |

### 7.3. Corpus y límites de validación

Utilizar documentos sintéticos o autorizados con respuestas esperadas: manual textual; escaneado con zonas ilegibles; Word e imagen; manual de variante similar; intervalo simple y compuesto; 16 acciones indispensables; conflicto de estado operativo; datos del planificador sin fuente externa. Los casos del ejemplo JSON no cuentan como evidencia industrial.

Para voz: muestras autorizadas o sintéticas en español e inglés, con ruido y términos de equipo. Las pruebas automatizadas de canal usarán entrada controlada; la comprobación de micrófono y reproducción reales requiere el navegador elegido en Q1.

Las pruebas de proveedores vivos se planificarán después de Q2 y se reportarán por separado de las simuladas. No se publicará un resultado de exactitud o latencia sin haberlo medido. En esta fase solo se verifica el documento del plan y la sintaxis de su ejemplo JSON.

## 8. Secuencia de implementación y matriz de trazabilidad

### 8.1. Orden propuesto

| Etapa | Entrega futura | Dependencias y bloqueos | Comprobación de salida |
| --- | --- | --- | --- |
| P0. Cerrar concreción técnica | Resolver bloqueantes restantes de Q1–Q6; registrar decisiones ya tomadas, versiones/proveedores y cambios de comportamiento aprobados | No ejecutar infraestructura ni elegir servicios pagados por este documento | Decisiones documentadas; spec ajustada solo si cambia comportamiento |
| P1. Dominio y contratos | Entidades, estados, frecuencia, jerarquía, procedencia, interfaces de puertos y validaciones | Puede avanzar sin proveedores reales; no depende de decidir reglas ya acordadas otra vez | T01, T08, T14–T17 y T20 unitarias |
| P2. Identidad y persistencia | Supabase Auth, repositorios, propiedad, originales, transacciones, receipts y control de versión | Supabase Auth/PostgreSQL y política de invitaciones aprobados; Q1 para hosting de PlannerMC, Q3 para límites de archivos y Q4 para catálogo inicial | T04, T20–T22, T24–T26, T29 y lectura posterior |
| P3. Ingreso e investigación | Intake local de PDF/DOCX/JPG/JPEG/PNG, OCR, fuentes y decisiones de avance | Intake local definido e implementado para esta entrega; límites numéricos de Q3, investigación externa y sus proveedores siguen abiertos | T02–T07, T13; errores de carga y búsqueda |
| P4. Assets y PMs | Edición de nombres/jerarquía, duplicados, agrupación, 15 pasos, división y restricciones | P1–P3; generación real depende de Q2 | T08–T19, T27–T28 y revisión del corpus |
| P5. Revisión y documento | Confirmación, revisión fechada, eliminación de draft, render/copia inglesa | P2 y P4; no integrar CMMS | T12, T20–T28, T33–T34 |
| P6. Interfaz y conversación | UI inglesa; conversación es/en por texto y voz; experiencia de conflictos y errores | Contratos de P1 permiten desarrollo incremental; voz real depende de Q1–Q3 y Q5 | T29–T31, T33; comprobar entrada y respuesta habladas |
| P7. Aceptación integral | Recorridos completos con manual, sin manual y solo datos; fallos y reinicios | P1–P6; Q6 para comprobar recuperación operativa | Catálogo completo aplicable, hallazgos resueltos y evidencia distinguida de simulaciones |

Las pruebas se construyen junto al comportamiento, no se aplazan todas a P7. Ninguna etapa añade compras, informes o ejecución de Work Orders. Si un proveedor está pendiente, las pruebas de contratos pueden avanzar con dobles; esa parte no se declara integrada hasta probar el adaptador real.

### 8.2. Trazabilidad de RF y RNF

Los rangos de AC de esta tabla incluyen todos los criterios del requisito citado; el detalle de escenarios está en T01–T35.

| Requisito | Módulos | Datos | Flujos | Pruebas |
| --- | --- | --- | --- | --- |
| RF-1, AC-1 a AC-5 | M2, M3, M8 | Catalog, Analysis, Asset | F1, F3 | T01 |
| RF-2, AC-1 a AC-5 | M2, M6, M8 | OriginalDocument, Source, PendingIssue | F1, F5, F8 | T02, T03, T04 |
| RF-3, AC-1 a AC-8 | M2, M5, M7 | Source, Analysis, PlannerDecision | F2, F5 | T05, T06, T07 |
| RF-4, AC-1 a AC-6 | M3, M5, M8 | Asset, AssetChangeProposal, PendingIssue | F3, F5, F8 | T08, T09 |
| RF-5, AC-1 a AC-10 | M4, M5, M7, M8 | PMVersion, Frequency, EvidenceAnnotation | F4, F5, F10 | T10, T11, T12, T13 |
| RF-6, AC-1 a AC-8 | M4, M5 | Frequency, Source, PlannerDecision | F4, F5, F6 | T14, T15, T16, T19 |
| RF-7, AC-1 a AC-6 | M4, M5, M7 | PendingIssue, EvidenceAnnotation, PlannerDecision | F5, F6, F10 | T17, T18, T19 |
| RF-8, AC-1 a AC-4 | M5, M6, M8 | TechnicalValidation, PMVersion | F5, F6, F8 | T19 |
| RF-9, AC-1 a AC-13 | M5, M6, M8 | PM, PMVersion, OperationReceipt, PlannerDecision | F6, F7, F8, F9 | T20, T21, T22, T23, T24, T25, T26 |
| RF-10, AC-1 a AC-5 | M2, M3, M5 | Asset, AssetChangeProposal, Source | F3, F5, F7, F8 | T27, T28 |
| RF-11, AC-1 a AC-6 | M1, M7, M8 | UserPreferences, sesión, contexto de conversación | F8, F10; autorización transversal | T29, T30, T31 |
| RNF-1 | Documentación transversal de los módulos | Spec y AC en español | Revisión documental | T32 |
| RNF-2 | M7, M8 | UserPreferences, messageKey, conversationExplanation | F5, F10 | T30, T31 |
| RNF-3 | M3, M4, M7 | nameEn, content.language, textos empresariales | F3, F4, F10 | T12, T33 |
| RNF-4 | M2, M4, M5, M7 | Source, EvidenceAnnotation, PendingIssue | F1, F2, F4, F5, F6 | T13, T14, T17, T34 |
| RNF-5 | M6 y todos sus consumidores | Registros, versiones, OperationReceipt | F7, F8, F9 | T22, T24, T25, T26, T35 |
| RNF-6 | M2, M6 | OriginalDocument, Source | F1, F7, F8 | T04, T24, T35 |

### 8.3. Condición de cierre de implementación

El cierre requerirá evidencia de los criterios aplicables, incluida aprobación de una frecuencia estimada sin consulta técnica, conservación de incertidumbre tras continuar, lectura posterior, voz en ambos idiomas, ausencia de acceso cruzado, límite de pasos y pruebas de repetición/concurrencia.

El documento del plan no declara esos resultados obtenidos. Resolver decisiones técnicas y escribir código tampoco equivaldrá a haber superado esas pruebas.

## 9. Dudas abiertas y decisiones que bloquean

| ID | Duda | Qué decisión bloquea | Qué puede avanzar |
| --- | --- | --- | --- |
| Q1 | **[NECESITA ACLARACIÓN]** ¿Dónde se ejecutarán el frontend y Fastify, y qué navegadores/equipos deberán utilizar voz? Supabase gestionado para Auth y PostgreSQL está aprobado para el MVP. | Hosting de PlannerMC, contexto seguro de micrófono y prueba real de voz; P6/P7 finales | Backend de desarrollo en el workspace y Supabase local o de desarrollo; producción no se configura aquí |
| Q2 | **[PARCIALMENTE RESUELTA PARA INTAKE DE MANUALES]** Extraer PDF con PDF.js, DOCX con Mammoth y OCR de JPG/JPEG/PNG o páginas PDF renderizadas con Tesseract.js en el navegador, con workers/WASM/datos de idioma alojados por la propia aplicación. No enviar bytes del manual ni texto extraído a servicios externos de OCR, IA, búsqueda o voz. Supabase/PostgreSQL sigue siendo el límite de persistencia aprobado para los originales solicitados por el usuario. Investigación externa, generación y voz se aplazan; sus proveedores, transferencia de otros datos/audio y presupuesto siguen abiertos. | Adaptadores reales de investigación/generación/voz, manejo de credenciales, contratos, retención y validación del corpus; P3/P4/P6 para capacidades aplazadas | Extracción local y pruebas deterministas de manuales sin proveedores de procesamiento externos |
| Q3 | **[FORMATOS RESUELTOS; LÍMITES ABIERTOS]** Admitir PDF, DOCX, JPG/JPEG y PNG inicialmente. Configurar límites de bytes y páginas sin fijar valores hasta medir manuales representativos y cuota/uso real de la base. Mantener cargas de producción deshabilitadas hasta establecer capacidad y backups y probar una restauración. Duración de audio e investigación queda aplazada junto con esas funciones. | Límites configurados, pruebas de frontera, capacidad de producción, política de backups y restauración antes de cargas productivas | Procesar un archivo por petición en desarrollo con límites explícitos de entorno; informar límites ausentes/excedidos sin perder originales anteriores |
| Q4 | **[NECESITA ACLARACIÓN]** Definir cómo se cargan las locaciones y áreas iniciales por workspace. La política de cuentas quedó aceptada: invitación individual por operador autorizado, sin registro público ni UI de administración; recuperación mediante Supabase Auth y operador autorizado. | Provisión y validación del catálogo inicial; configuración de email para invitaciones/recuperación antes de producción | Auth y aislamiento con usuarios/catálogos sintéticos; no crear pantallas administrativas no solicitadas |
| Q5 | **[NECESITA ACLARACIÓN]** Precisar si deben conservarse grabaciones o transcripciones de voz y las condiciones de retención de los proveedores elegidos | Persistencia de audio/transcripciones y validación del tratamiento de voz en operación; P6 final | Conversación y decisiones de dominio sin prometer un archivo de audio. Propuesta técnica: audio transitorio, sin biblioteca de grabaciones; no declarada decisión del usuario |
| Q6 | **[NECESITA ACLARACIÓN]** Definir capacidad y criterios operativos de recuperación. Quedó acordado elegir un plan Supabase con backups de base de datos y probar una restauración antes del lanzamiento. El período exacto de retención y el plan se fijarán antes de habilitar cargas en producción. | Aceptación de operación y restauración P7; no la semántica de conservación ya acordada | Persistencia y lectura posterior en desarrollo; no inventar objetivos de recuperación ni una política de purga |

Q1–Q6 no reabren las decisiones ya acordadas sobre 15 pasos, idiomas, voz/texto, consulta opcional, conservación de manuales, borradores sin vencimiento, eliminación manual o conflictos. Si sus respuestas cambian un comportamiento de usuario o el alcance, el ajuste necesario deberá proponerse en la especificación antes de implementarlo; no se modifican los documentos base desde este plan.

