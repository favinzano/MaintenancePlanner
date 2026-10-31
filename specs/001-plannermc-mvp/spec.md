# PlannerMC: análisis de manual, assets y propuesta de PM

**Estado:** especificación actualizada con las decisiones acordadas en la ronda de aclaraciones.

## Contexto y objetivo

PlannerMC ayuda al Maintenance Planner a analizar un equipo, definir sus assets y sub-assets y preparar PMs para copiar al CMMS. Busca reducir el tiempo de preparación y el trabajo repetitivo. Esta primera fase comprende equipos, assets y PMs; las compras, los informes y los KPIs corresponden a etapas posteriores.

El flujo parte de un manual, de una investigación externa o de datos aportados por el planificador. La herramienta presenta propuestas, comunica las limitaciones encontradas y pregunta al planificador si puede continuar. El planificador decide los nombres definitivos, la jerarquía, las tareas, las frecuencias y la aprobación de cada PM. Su decisión de continuar no convierte información sin verificar en información documentada.

## Usuarios

- **Usuario principal:** Maintenance Planner, con nombre de usuario y contraseña propios.
- **Consulta técnica opcional:** el planificador puede validar nombres, jerarquía, tareas o frecuencias con un técnico. El técnico no necesita utilizar PlannerMC ni aprobar registros directamente.
- **Empresa:** una empresa por espacio, con locaciones y áreas preconfiguradas.
- **Acceso individual:** cada planificador utiliza su propia cuenta. Compartir trabajo entre cuentas queda fuera de esta primera fase.

## Historias de usuario

- Como Maintenance Planner, quiero recibir una propuesta de nombre basada en el manual y editarla antes de adoptarla.
- Como Maintenance Planner, quiero definir un equipo y sus sub-assets directos para preparar su mantenimiento.
- Como Maintenance Planner, quiero aprovechar manuales, referencias externas y datos operativos, y decidir cuándo hay información para continuar.
- Como Maintenance Planner, quiero revisar PMs de hasta 15 pasos, ajustar sus frecuencias y disponer de su contenido en inglés para copiarlo al CMMS.
- Como Maintenance Planner, quiero conversar por voz y por texto en español o inglés, según mi preferencia, mientras la interfaz y los documentos empresariales permanecen en inglés.
- Como Maintenance Planner, quiero editar una PM hasta aprobar su versión definitiva y generar revisiones fechadas cuando posteriormente cambie.

## Requisitos funcionales

### RF-1. Iniciar el análisis e identificar el equipo

- **AC-1:** Cuando el planificador inicie un análisis, el sistema deberá trabajar con un equipo por análisis y solicitar su locación y área mediante las listas preconfiguradas.
- **AC-2:** Cuando el manual identifique el equipo, el sistema deberá proponer su nombre a partir del manual y permitir que el planificador lo conserve o edite; el nombre no deberá depender de una lista preconfigurada.
- **AC-3:** Cuando el planificador simplifique el nombre, el sistema deberá utilizar el nombre elegido y conservar el nombre original como referencia. Por ejemplo, deberá permitir cambiar «B110052 Cranfiller Welm» por «Cranfiller».
- **AC-4:** Si no se puede obtener el nombre del manual o no hay manual, el sistema deberá solicitar al planificador que indique o confirme el nombre del equipo.
- **AC-5:** Si faltan la locación, el área o la confirmación del nombre, el sistema deberá solicitar esos datos antes de confirmar la configuración del equipo.

### RF-2. Utilizar y conservar el manual

- **AC-1:** Cuando el planificador aporte un manual, el sistema deberá aceptar archivos PDF, Word e imágenes y analizar su contenido cuando pueda leerlo e interpretarlo, independientemente de su idioma.
- **AC-2:** Si el archivo está corrupto, protegido, es ilegible, tiene un formato no admitido, supera un límite de carga o su carga se interrumpe, el sistema deberá comunicar el problema y preguntar al planificador si desea corregirlo, sustituirlo o continuar sin utilizarlo.
- **AC-3:** Cuando se incorpore un manual al análisis, el sistema deberá conservarlo asociado al equipo y mantener las referencias a su contenido. El manual no será un borrador de PM ni se eliminará en este flujo.
- **AC-4:** Si se utiliza otro manual posteriormente, el sistema deberá conservar el manual previamente incorporado y sus referencias.
- **AC-5:** Si el manual corresponde a otra variante, contiene información contradictoria o no identifica claramente el equipo, el sistema deberá comunicar esa limitación al planificador antes de continuar con las propuestas afectadas.

### RF-3. Investigar y solicitar la decisión del planificador

- **AC-1:** Si no hay manual utilizable, el sistema deberá solicitar una descripción del equipo y su función, y permitir aportar fabricante, modelo, serial, fotografías y datos operativos disponibles.
- **AC-2:** Cuando investigue el equipo, el sistema deberá priorizar la documentación del fabricante aplicable al equipo y presentar las alternativas encontradas cuando esa documentación no esté disponible o no resuelva la consulta.
- **AC-3:** Cuando una referencia corresponda a un equipo o variante diferente, el sistema deberá indicarlo y mostrar el fabricante, modelo y enlace cuando estén disponibles.
- **AC-4:** Antes de avanzar desde la información reunida hacia la propuesta de assets o PMs, el sistema deberá presentar la información disponible y sus limitaciones y preguntar al planificador si autoriza continuar con ese paso.
- **AC-5:** Cuando el planificador autorice continuar con datos operativos disponibles aunque no haya referencias externas, el sistema deberá utilizarlos para preparar la propuesta solicitada e identificar su procedencia.
- **AC-6:** Si falla la búsqueda, no se encuentran resultados o una fuente es inaccesible, el sistema deberá informar al planificador y solicitar su decisión sobre continuar con la información disponible, aportar información adicional o detener ese análisis.
- **AC-7:** Cuando presente una propuesta, el sistema deberá permitir al planificador aceptarla, modificarla o descartarla. La revisión de las propuestas no deberá depender de un proceso obligatorio de aceptación o rechazo individual de todas las fuentes.
- **AC-8:** Si el manual no contiene las tareas o frecuencias necesarias para preparar la propuesta, el sistema deberá buscar referencias externas y presentar los resultados al planificador para que decida cómo continuar.

### RF-4. Definir assets y sub-assets

- **AC-1:** Cuando el planificador autorice preparar la jerarquía, el sistema deberá proponer los niveles locación, área, equipo o asset principal y sub-assets directos.
- **AC-2:** Cuando el equipo incluya partes mantenibles identificadas, el sistema deberá permitir representarlas como sub-assets directos. Son ejemplos la válvula número 46 de un filler y la máquina dispensadora de pega de un tray packer.
- **AC-3:** Cuando se configure un sub-asset, el sistema no deberá desarrollar niveles inferiores a ese sub-asset en esta fase.
- **AC-4:** Cuando presente la jerarquía, el sistema deberá permitir al planificador editar los nombres y la distribución y decidir qué elementos confirmar. Los nombres empresariales deberán estar en inglés; el término de la fuente deberá mostrarse cuando esté disponible.
- **AC-5:** Si no se ha podido proponer una PM para un sub-asset, el sistema deberá comunicarlo y permitir al planificador decidir si conserva ese sub-asset.
- **AC-6:** Si una confirmación parcial deja una PM sin asset confirmado o un sub-asset sin equipo confirmado, el sistema deberá advertir la relación afectada y solicitar la decisión del planificador antes de continuar.

### RF-5. Redactar la PM y su salida para el CMMS

- **AC-1:** Cuando prepare una PM, el sistema deberá incluir el asset o sub-asset correspondiente, la frecuencia propuesta o elegida, la duración prevista en minutos, el estado operativo requerido y los pasos de la tarea. Si falta alguno de esos datos, deberá señalarlo y solicitar la decisión del planificador según RF-7.
- **AC-2:** Cuando redacte la secuencia, el sistema deberá comenzar indicando si el equipo debe estar en marcha o detenido y las precauciones aplicables, incluida la comprobación de desenergización o LOTO cuando corresponda.
- **AC-3:** Cuando redacte el procedimiento, el sistema deberá describir las acciones correspondientes a la tarea, como inspeccionar, limpiar, desmontar o ensamblar, y terminar con la verificación de los pasos realizados.
- **AC-4:** Cuando la PM sea de inspección, el sistema deberá incluir la indicación de generar una orden correctiva en el CMMS si se detecta una reparación necesaria y de cerrar allí la PM como completada una vez realizada la inspección. PlannerMC no deberá crear ni cerrar esas órdenes en esta fase.
- **AC-5:** Cuando genere o presente una PM para aprobación, el sistema deberá limitarla a un máximo de 15 pasos, contando las indicaciones iniciales de seguridad y la verificación final. Podrá tener menos pasos según la actividad.
- **AC-6:** Cuando resuma un procedimiento extenso, el sistema deberá conservar las acciones, condiciones y avisos necesarios para la tarea, y presentar la redacción al planificador para su evaluación. El límite de pasos no deberá utilizarse para omitir esas indicaciones.
- **AC-7:** Cuando presente el contenido de una PM, el sistema deberá hacerlo en inglés y permitir copiar el documento completo o cada paso por separado para pegarlo en el CMMS elegido por el planificador.
- **AC-8:** Mientras una PM no haya sido confirmada y aprobada, el sistema deberá identificarla como borrador, también al presentar su contenido para copiar.
- **AC-9:** Cuando existan referencias documentales para un asset, tarea o frecuencia, el sistema deberá mostrar la página o sección del manual, o el enlace y los datos disponibles de la referencia externa. Cuando la propuesta proceda de datos del planificador, deberá indicar esa procedencia sin exigir una referencia documental inexistente.
- **AC-10:** Si una PM no puede redactarse en un máximo de 15 pasos conservando las acciones, condiciones y avisos necesarios, el sistema deberá proponer dividirla en varias PMs y esperar la decisión del planificador antes de aplicar la división. Cada PM resultante deberá cumplir el máximo de 15 pasos, incluidas sus indicaciones iniciales de seguridad y su verificación final.

### RF-6. Proponer y editar frecuencias

- **AC-1:** Cuando el manual o la investigación indiquen una frecuencia, el sistema deberá presentarla como sugerencia y permitir que el planificador la conserve o cambie.
- **AC-2:** Cuando estén disponibles el intervalo, la unidad y la referencia originales, el sistema deberá mostrarlos como antecedentes. Su disponibilidad o conservación como frecuencia final no será obligatoria para que el planificador elija otra frecuencia.
- **AC-3:** Cuando proponga una frecuencia a partir de datos operativos o de equipos similares, el sistema deberá identificarla como estimación e indicar su base disponible; el planificador deberá decidir la frecuencia final.
- **AC-4:** Si no hay información que permita proponer una frecuencia con una base identificable, el sistema deberá comunicarlo y solicitar al planificador que indique la frecuencia o decida cómo continuar.
- **AC-5:** Cuando una frecuencia se exprese en calendario, horas, ciclos o mediante una condición compuesta, el sistema deberá presentar esa indicación al planificador y permitirle definir el intervalo y la condición finales.
- **AC-6:** Cuando existan tareas con frecuencias distintas para un mismo asset, el sistema deberá proponer PMs separadas por frecuencia y someterlas a la revisión del planificador.
- **AC-7:** Si las fuentes discrepan sobre una frecuencia, el sistema deberá mostrar las alternativas y solicitar la decisión del planificador.
- **AC-8:** Cuando un mismo asset tenga tareas con igual frecuencia y unas requieran el equipo en marcha y otras detenido, el sistema deberá proponer PMs separadas según ese estado operativo y someterlas a la revisión del planificador.

### RF-7. Comunicar restricciones, seguridad y datos pendientes

- **AC-1:** Cuando haya información sobre el estado operativo y los controles de seguridad, el sistema deberá incluirla en la propuesta e indicar su procedencia disponible.
- **AC-2:** Si falta un dato, existe una contradicción o no se puede establecer el estado operativo o los controles aplicables, el sistema deberá explicar el punto afectado y preguntar al planificador si desea aportar una respuesta o continuar con esa limitación.
- **AC-3:** Cuando el planificador decida continuar sin resolver un dato, el sistema deberá conservar visible su condición de no resuelto; la decisión no deberá presentarse como evidencia técnica ni completar el dato con información inventada.
- **AC-4:** Si dos fuentes discrepan sobre una tarea o una condición de seguridad, el sistema deberá presentar las indicaciones en conflicto y solicitar la decisión del planificador.
- **AC-5:** Cuando presente una PM para confirmar, el sistema deberá mostrar las restricciones que sigan sin resolver y solicitar la decisión explícita del planificador. No deberá rechazar automáticamente la confirmación solo por la ausencia de una consulta técnica.
- **AC-6:** Cuando presente una PM, el sistema no deberá declarar que cumple con OSHA.

### RF-8. Registrar una validación técnica opcional

- **AC-1:** Cuando el planificador considere necesaria una consulta técnica, el sistema deberá permitir registrar que se realizó la validación de los elementos correspondientes y quién colaboró en ella.
- **AC-2:** Si de esa consulta resultan modificaciones, el sistema deberá permitir incorporarlas a la propuesta que el planificador está revisando.
- **AC-3:** Cuando registre la validación, el sistema no deberá exigir una transcripción de la respuesta del técnico ni atribuirle la aprobación final de la PM; la aprobación corresponderá al planificador.
- **AC-4:** Si el planificador decide que no necesita consulta técnica, el sistema deberá permitir continuar, incluso si la frecuencia propuesta es estimada.

### RF-9. Guardar, aprobar y revisar PMs, y eliminar borradores

- **AC-1:** Cuando se genere una PM, el sistema deberá guardarla como borrador editable que el planificador pueda retomar. En este flujo, «borrador» designa la PM todavía no aprobada, no el manual, las fuentes ni la configuración de assets.
- **AC-2:** Mientras la PM sea borrador, el sistema deberá permitir editar sus tareas, frecuencia y demás contenido hasta que el planificador decida que es la versión definitiva. Las ediciones de trabajo no deberán generar revisiones definitivas sucesivas.
- **AC-3:** Cuando el planificador confirme y apruebe la PM, el sistema deberá guardar esa versión como definitiva. «Confirmada y aprobada» será una sola condición final, sin una segunda aprobación independiente.
- **AC-4:** Cuando haya datos no resueltos o estimaciones, el sistema deberá mostrarlos como información sobre el contenido, sin crear estados adicionales de aprobación de la PM.
- **AC-5:** Cuando el planificador necesite modificar una PM definitiva, el sistema deberá permitir preparar una nueva revisión y conservar la versión definitiva anterior hasta que se confirme y apruebe la nueva.
- **AC-6:** Cuando se confirme una revisión posterior a la primera versión definitiva, el sistema deberá identificarla consecutivamente como revisión 1, revisión 2 y siguientes, y registrar la fecha y las modificaciones realizadas.
- **AC-7:** Cuando guarde datos del flujo, el sistema deberá comprobar la escritura recuperando los datos guardados. Esto comprende assets, manuales, PMs en borrador o definitivas, revisiones, validaciones técnicas registradas y preferencias.
- **AC-8:** Si falla el guardado o su comprobación, el sistema deberá informar que no ha podido confirmar el guardado y no presentar la operación como completada.
- **AC-9:** Cuando confirme una PM, el sistema deberá guardar el resultado en PlannerMC sin crear ni actualizar registros en un CMMS externo.
- **AC-10:** Cuando el planificador solicite eliminar un borrador de PM de su cuenta, el sistema deberá permitir eliminarlo. Esta acción no deberá eliminar los manuales, los assets asociados ni las versiones definitivas o revisiones previamente aprobadas.
- **AC-11:** Mientras el planificador no elimine manualmente un borrador de PM, el sistema deberá conservarlo sin fecha de vencimiento ni eliminación automática por antigüedad o inactividad.
- **AC-12:** Cuando el planificador repita la confirmación de una misma versión de PM, por una doble pulsación o un reintento después de una interrupción, el sistema deberá conservar una sola aprobación de esa versión, sin duplicar la PM ni generar una revisión adicional. Si la confirmación anterior no se completó, el reintento deberá permitir completarla una sola vez; el resultado deberá verificarse conforme a AC-7 y AC-8.
- **AC-13:** Si el planificador intenta guardar cambios de una PM cuyo contenido ya fue modificado y guardado desde otra pestaña o sesión de su misma cuenta, el sistema deberá avisar del conflicto y solicitar que revise los cambios antes de decidir cómo continuar. El sistema deberá conservar lo ya guardado y no sobrescribirlo automáticamente; cualquier sobrescritura requerirá la decisión explícita del planificador después de esa revisión.

### RF-10. Advertir posibles duplicados y cambios de evidencia

- **AC-1:** Cuando coincidan el nombre del equipo y la locación con un registro existente, el sistema deberá advertir un posible duplicado y mostrar fabricante, modelo o serial cuando estén disponibles.
- **AC-2:** Cuando un mismo serial disponible esté asociado a registros con nombres diferentes, el sistema deberá mostrar esos registros al planificador para que determine si representan el mismo equipo.
- **AC-3:** Ante un posible duplicado, el sistema deberá permitir al planificador decidir si continúa con un equipo nuevo o propone actualizar el existente.
- **AC-4:** Cuando se proponga una actualización, el sistema deberá conservar los datos confirmados existentes hasta que el planificador confirme el cambio.
- **AC-5:** Si una nueva evidencia modifica o contradice la información utilizada, el sistema deberá comunicarlo y solicitar la decisión del planificador sobre las propuestas o revisiones afectadas, sin sustituir automáticamente las versiones definitivas.

### RF-11. Acceso individual, idioma y modalidades de conversación

- **AC-1:** Cuando un planificador acceda a su trabajo, el sistema deberá requerir su propio nombre de usuario y contraseña.
- **AC-2:** Cuando un planificador acceda con su cuenta, el sistema deberá mostrar su trabajo y no dar acceso al trabajo de otra cuenta en esta fase.
- **AC-3:** Cuando un planificador utilice la herramienta inicialmente, la conversación deberá estar en inglés y deberá poder elegir entre español e inglés y cambiar su preferencia posteriormente. Estos serán los únicos idiomas de conversación admitidos en esta primera fase.
- **AC-4:** Cuando el planificador elija español o inglés como idioma de interacción, el sistema deberá utilizarlo para las peticiones, las respuestas conversacionales y las aclaraciones, manteniendo la interfaz y la documentación empresarial en inglés.
- **AC-5:** Cuando el planificador utilice la conversación por voz, el sistema deberá recibir sus peticiones habladas y responder por voz en el idioma de interacción elegido, español o inglés.
- **AC-6:** Cuando el planificador utilice la conversación por texto, el sistema deberá recibir sus peticiones escritas y responder por texto en el idioma de interacción elegido, español o inglés.

## Requisitos no funcionales

- **RNF-1:** La especificación y sus criterios de aceptación deberán estar en español.
- **RNF-2:** Los menús, botones, cuadros, etiquetas y mensajes propios de la interfaz deberán estar en inglés. Las explicaciones conversacionales y las preguntas al planificador deberán usar su idioma elegido.
- **RNF-3:** Los nombres y descripciones de assets, las tablas de documentación y el contenido de las PMs destinado a la empresa deberán estar en inglés, independientemente del idioma de conversación y del CMMS utilizado.
- **RNF-4:** El sistema deberá distinguir información procedente de documentos, datos aportados por el planificador, estimaciones e información no resuelta. La aprobación de una PM no deberá eliminar esas distinciones.
- **RNF-5:** Los datos guardados deberán persistir para retomar el trabajo y sus escrituras deberán verificarse por lectura posterior, conforme a RF-9.
- **RNF-6:** Los manuales incorporados deberán conservarse como documentos asociados al equipo. No se ofrecerá su eliminación en esta fase.

## Casos límite

- **Archivo problemático:** notificar el problema y solicitar si se corrige, se sustituye o no se utiliza. Un fallo de lectura no deberá presentarse como un análisis completado.
- **Manual de otra variante:** mostrar la diferencia; priorizar la documentación aplicable del fabricante y continuar con alternativas según la decisión del planificador.
- **Búsqueda fallida o sin resultados:** informar y preguntar si se continúa con los datos disponibles, se aporta información o se detiene el análisis. La falta de fuentes externas por sí sola no impedirá proponer a partir de datos operativos autorizados.
- **Frecuencia compuesta o contradictoria:** mostrar las indicaciones disponibles y solicitar la frecuencia final al planificador.
- **Igual frecuencia con distinto estado operativo:** proponer PMs separadas para las tareas con el equipo en marcha y las tareas con el equipo detenido, aunque correspondan al mismo asset y frecuencia.
- **Datos de seguridad sin resolver:** comunicar la restricción, solicitar la decisión del planificador y mantener visible la incertidumbre.
- **Confirmación parcial de la jerarquía:** advertir las relaciones afectadas y pedir al planificador que decida cómo continuar.
- **Duplicados:** presentar los registros coincidentes y solicitar la decisión de crear o actualizar.
- **Nueva evidencia:** comunicar el efecto sobre la información disponible y dejar al planificador decidir si modifica la propuesta o inicia una revisión.
- **Fallo de guardado o de lectura posterior:** notificar que el guardado no está confirmado, sin comunicar éxito.
- **Confirmación repetida o reintentada:** conservar una sola aprobación de la misma versión, sin duplicar la PM ni crear otra revisión; si la operación anterior no se completó, permitir completarla una sola vez.
- **Edición simultánea de la misma PM:** avisar cuando otra pestaña o sesión de la misma cuenta haya guardado cambios y solicitar una revisión y decisión explícita antes de sobrescribir lo guardado.
- **Asset sin PM propuesta:** comunicarlo y permitir conservar el asset. La ausencia de una PM no deberá presentarse como una PM completada.
- **Procedimiento que no cabe en 15 pasos:** proponer su división en varias PMs y esperar la decisión del planificador, conservando las indicaciones necesarias y el límite por PM.
- **Cambio de idioma de conversación:** mantener en inglés la interfaz y los documentos empresariales.

## Fuera de alcance

- Sincronización o escritura directa en Limble u otro CMMS.
- Crear, ejecutar o cerrar Work Orders dentro de PlannerMC. La PM podrá incluir la instrucción de generar una orden correctiva y cerrar la inspección en el CMMS.
- Identificación, compra y registro de repuestos.
- Informes de downtime, Work Orders, compras, Excel o KPIs; pertenecen a fases posteriores.
- Procesamiento por lotes de equipos o manuales.
- Niveles inferiores a los sub-assets directos del equipo.
- Configuración de locaciones y áreas, consideradas preconfiguradas.
- Compartir trabajo o colaborar entre cuentas de planificadores.
- Idiomas de conversación distintos del español y el inglés. Esta restricción no modifica los idiomas de los manuales que puedan analizarse conforme a RF-2.
- Eliminación de manuales incorporados.
- Declaraciones de cumplimiento OSHA.

## Criterios de finalización

- El planificador puede analizar un equipo con un manual, investigación externa o datos operativos disponibles y autorizar el avance de cada paso.
- El nombre propuesto puede editarse y la jerarquía se limita al equipo y sus sub-assets directos.
- Las tareas del mismo asset y frecuencia que requieren el equipo en marcha o detenido se proponen en PMs separadas según ese estado operativo.
- Cada PM propuesta tiene como máximo 15 pasos, incluidas las indicaciones iniciales de seguridad y la verificación final.
- Cuando no sea posible conservar las indicaciones necesarias en 15 pasos, se propone una división en varias PMs que solo se aplica tras la decisión del planificador.
- La PM presenta asset, frecuencia, duración prevista en minutos, estado operativo, precauciones y procedimiento; los datos no resueltos se muestran al planificador para su decisión.
- La consulta técnica es opcional, registra la validación y quién colaboró cuando se utiliza, y no sustituye la aprobación del planificador.
- Las PMs se editan como borradores hasta su confirmación y aprobación; los cambios posteriores se formalizan como revisiones consecutivas y fechadas.
- El planificador puede eliminar manualmente sus borradores de PM conservando los manuales, los assets asociados y las versiones o revisiones aprobadas.
- Los borradores de PM se conservan sin vencimiento hasta que el planificador los elimine manualmente.
- Una doble confirmación o un reintento de la misma versión produce una sola aprobación, sin duplicar la PM ni generar revisiones adicionales.
- Los cambios guardados desde otra pestaña o sesión de la misma cuenta no se sobrescriben automáticamente: el planificador recibe un aviso de conflicto y revisa antes de decidir.
- La interfaz y el contenido empresarial están en inglés; la conversación utiliza español o inglés según la preferencia del planificador, con inglés como idioma inicial.
- El planificador puede conversar por voz y por texto en ambos idiomas admitidos; los documentos empresariales siguen disponibles por escrito en inglés para copiarlos al CMMS.
- El planificador puede copiar la PM completa o por pasos al CMMS; las órdenes se crean y cierran en ese CMMS.
- Los manuales se conservan y las escrituras de los datos del flujo se verifican mediante lectura posterior.
- Cada planificador accede con sus credenciales y no comparte trabajo entre cuentas en esta fase.
- Las dudas abiertas que afecten a la aceptación de esta funcionalidad están resueltas antes de considerarla finalizada.

## Dudas abiertas

No quedan dudas abiertas registradas tras esta ronda de aclaraciones.
