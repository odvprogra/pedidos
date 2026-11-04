# 0001. Registrar las decisiones de arquitectura

- **Estado:** Aceptada
- **Fecha:** 2026-10-14

## Contexto

El proyecto lo desarrolla un equipo con ayuda de asistentes de IA. Tanto las personas como los
asistentes necesitan saber por qué el proyecto es como es; si no, las decisiones se vuelven a
discutir en cada tarea o se rompen sin darse cuenta.

## Decisión

Vamos a registrar cada decisión importante como un Architecture Decision Record en
`docs/adr/NNNN-titulo.md`, partiendo de [la plantilla](template.md):

- Formato corto: Estado, Contexto, Decisión, Alternativas consideradas y Consecuencias.
- Una página como máximo.
- Una ADR aceptada no se reescribe. Si cambiamos de opinión, se escribe una nueva que la reemplaza y
  la anterior pasa a _Reemplazada_.
- Romper una regla de los estándares está permitido solo si queda una ADR que explique por qué.

## Alternativas consideradas

- **No escribir las decisiones:** no cuesta nada hoy, pero el motivo se pierde y la IA no tiene de
  dónde leerlo.
- **Documentos de diseño largos:** demasiado pesados para mantenerlos al día en un proyecto de un
  semestre.

## Consecuencias

- **Positivas:** las decisiones se revisan en los pull requests, están junto al código y sirven
  para defender el proyecto en las presentaciones.
- **Negativas:** requiere disciplina. Una decisión sin ADR es deuda en la documentación.
