# 0007. Desarrollo asistido por IA

- **Estado:** Aceptada
- **Fecha:** 2026-10-14

## Contexto

El proyecto se desarrolla con asistentes de IA (principalmente Claude Code). Sin contexto, un
asistente inventa estructuras, mezcla estilos y repite errores que ya se corrigieron. Distintos
integrantes pueden usar herramientas distintas.

## Decisión

Vamos a tratar el contexto para la IA como parte del código del proyecto:

- **`AGENTS.md`** en la raíz es la fuente única: qué es el proyecto, comandos, reglas que no se
  negocian y dónde está cada documento. Lo leen Claude Code, Copilot, Cursor y otros.
- **`CLAUDE.md`** importa `AGENTS.md` y lista las skills y agentes de Claude Code.
- **Skills** (`.claude/skills/`) para los flujos que se repiten: crear una feature en el backend o en
  el frontend, verificar, escribir una ADR, preparar un pull request. Cada una trae un ejemplo de
  código verificado que se usa como molde.
- **Agentes** (`.claude/agents/`) con un rol acotado: analizar una historia, escribir tests, revisar
  la arquitectura y revisar la interfaz.
- **Hooks** de Claude Code que formatean automáticamente los archivos del frontend que la IA edita.
- Las reglas importantes se verifican con herramientas ([ADR-0006](0006-calidad-automatizada.md)),
  no solo con texto.
- Todo el código generado pasa por la misma revisión humana y la misma CI que el código escrito a
  mano.

## Alternativas consideradas

- **Solo un prompt largo en `CLAUDE.md`:** funciona al principio, pero crece sin orden y no sirve a
  quien usa otra herramienta.
- **Sin configuración:** cada persona obtiene resultados distintos y el código pierde coherencia.

## Consecuencias

- **Positivas:** la IA produce código con la misma estructura sin importar quién la use; las skills
  documentan los flujos también para las personas.
- **Negativas:** las skills y los ejemplos de referencia hay que mantenerlos al día cuando cambia
  una convención. Si una convención cambia, se actualiza en el mismo pull request.
