---
name: verify
description: Corre la verificación completa del proyecto (formato, lint, reglas de arquitectura, tests y build) para el backend, el frontend o ambos, y corrige lo que falle. Usar antes de dar una tarea por terminada, antes de commitear o cuando el usuario pide verificar o revisar que todo pase.
---

# Verificar

## 1. Qué verificar

Mira qué cambió con `git status --short` y `git diff --name-only main...HEAD`. Verifica solo el lado
que cambió; si cambiaron ambos o hay dudas, verifica los dos.

## 2. Backend

Necesita Docker encendido (`docker info`). Si no está, avisa al usuario en lugar de saltarte los
tests.

```bash
cd backend
./mvnw spotless:apply
./mvnw verify
```

En Windows con PowerShell: `.\mvnw.cmd spotless:apply` y `.\mvnw.cmd verify`.

`verify` incluye: formato (Spotless), compilación, tests unitarios y de integración
(Testcontainers) y reglas de arquitectura (`ArchitectureTest`).

## 3. Frontend

```bash
cd frontend
npm run format
npm run lint
npm test -- --watch=false
npm run build
```

## 4. Si algo falla

- Corrige la causa. No desactives reglas, no agregues `@Disabled`, `it.skip`,
  `eslint-disable` ni `@SuppressWarnings` para que pase.
- Si `ArchitectureTest` o `boundaries/dependencies` fallan, el código está en la capa equivocada:
  muévelo según `docs/arquitectura.md`.
- Si una regla parece estar mal, detente y explícaselo al usuario; cambiarla requiere una ADR.
- Vuelve a correr la verificación completa después de corregir.

## 5. Reporte

Termina con una tabla corta:

| Lado     | Paso            | Resultado    |
| -------- | --------------- | ------------ |
| Backend  | `./mvnw verify` | OK, 18 tests |
| Frontend | `npm run lint`  | OK           |
| Frontend | `npm test`      | OK, 15 tests |
| Frontend | `npm run build` | OK           |

Si algo quedó sin verificar (por ejemplo, Docker apagado), dilo explícitamente.
