---
name: pull-request
description: Prepara los cambios para integrarlos a main. Verifica, agrupa los cambios en commits con Conventional Commits y redacta la descripción del pull request con la plantilla del proyecto.
disable-model-invocation: true
---

# Preparar un pull request

## 1. Rama

- Si estás en `main`, crea una rama antes de commitear: `feat/<tema>`, `fix/<tema>`, `docs/<tema>`,
  `chore/<tema>` (en español y kebab-case: `feat/registro-restaurante`).
- Nunca se commitea ni se hace push directo a `main`.

## 2. Verificar

Ejecuta la skill `verify` para el lado que cambió. Si algo falla, se corrige antes de commitear.

## 3. Commits

- Revisa `git diff` completo y separa los cambios por intención: un commit por cosa que se pueda
  explicar en una línea.
- Formato Conventional Commits en inglés, imperativo y minúsculas:
  `feat(backend): add restaurant registration use case`.
- Alcances permitidos: `backend`, `frontend`, `db`, `docs`, `ci`, `deps`, `ai`.
- Nunca uses `--no-verify` ni `--amend` sobre commits ya publicados.
- No incluyas archivos generados, secretos ni `.env`.

## 4. Descripción del pull request

Usa `.github/pull_request_template.md`, en español:

- **Qué cambia:** una o dos frases.
- **Por qué:** la historia o el problema, con el issue si existe.
- **Cómo se probó:** comandos ejecutados y tests agregados por capa.
- **Capturas:** solo si cambió la UI.
- **Decisiones:** ADR nueva o afectada.
- Marca solo los puntos del Definition of Done que realmente se cumplen.

## 5. Publicar

Solo si el usuario lo pide: `git push -u origin <rama>` y `gh pr create` con la descripción anterior.
Nunca `git push --force` sobre una rama compartida.
