---
name: adr
description: Redacta una nueva Architecture Decision Record en docs/adr usando la plantilla del proyecto y actualiza el índice. Usar cuando se toma o se cambia una decisión técnica (una librería, un patrón, una regla de las convenciones, una herramienta) o cuando el usuario pide documentar una decisión.
---

# Nueva ADR

## 1. Antes de escribir

- Lee `docs/adr/README.md` para ver las existentes y el siguiente número libre.
- Si la decisión cambia una ADR aceptada, la nueva la reemplaza: no se edita la anterior.
- Si faltan datos para el contexto o las alternativas, pregúntalos al usuario. Una ADR no inventa
  motivos.

## 2. Escribir

1. Archivo `docs/adr/NNNN-titulo-en-kebab-case.md` (cuatro dígitos, título en español).
2. Copia la estructura de `docs/adr/template.md`: Estado, Fecha, Contexto, Decisión, Alternativas
   consideradas y Consecuencias.
3. Estado `Propuesta` si el equipo todavía no la aprobó; `Aceptada` si el usuario lo confirma.
4. Fecha de hoy en formato `AAAA-MM-DD`.
5. Al menos dos alternativas reales, cada una con el motivo por el que no se eligió.
6. Consecuencias positivas y negativas. Si no hay negativas, la decisión no está bien analizada.
7. Una página como máximo. Frases directas, sin relleno.

## 3. Después de escribir

- Agrega la fila al índice de `docs/adr/README.md` y quítala de "Pendientes" si estaba ahí.
- Si reemplaza otra ADR, cambia el estado de la anterior a
  `Reemplazada por [NNNN](NNNN-titulo.md)`.
- Si la decisión cambia una convención, actualiza en el mismo cambio `docs/convenciones/`,
  `AGENTS.md` y las skills afectadas (`.claude/skills/`).
