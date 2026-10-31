# Constitución de PlannerMC
1. **Stack mínimo:** cada tecnología y dependencia debe responder a un requisito aprobado y tener su justificación documentada.
2. **Spec y código:** todo comportamiento implementado debe corresponder a un criterio de aceptación en la spec; ambos se revisan juntos cuando cambia.
3. **Lógica separada:** las reglas de negocio deben poder ejecutarse y verificarse sin depender de la interfaz.
4. **Tests:** cada cambio de lógica requiere pruebas automatizadas de los criterios afectados; solo se reportan pruebas realmente ejecutadas.
5. **Persistencia:** assets, PMs, repuestos y compras confirmados se guardan de forma persistente; cada escritura se verifica leyendo el registro guardado.
6. **Idioma:** identificadores, comentarios, interfaz y documentación empresarial se redactan en inglés; la conversación y sus aclaraciones usan el idioma elegido por el planificador, inicialmente inglés.
