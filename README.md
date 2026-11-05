# Pedidos

Plataforma de pedidos de comida: registro de restaurantes, carga de catálogos y compra por parte de
los usuarios. Sin envío ni pagos.

## Stack

| Capa          | Tecnología                                  |
| ------------- | ------------------------------------------- |
| Backend       | Spring Boot 4.1 · Java 21 · Spring Data JPA |
| Frontend      | Angular 21 · Tailwind CSS 4                 |
| Base de datos | PostgreSQL 17 (Docker)                      |

## Estructura

```text
backend/             API REST (Spring Boot, arquitectura hexagonal por módulos)
frontend/            Cliente web (Angular, una carpeta por feature)
docs/                Arquitectura, convenciones y decisiones (ADRs)
.claude/             Skills, agentes y hooks para Claude Code
AGENTS.md            Contexto para asistentes de IA
docker-compose.yml   Base de datos para desarrollo
```

## Requisitos

- JDK 21 o superior
- Node.js 20.19 o superior
- Docker Desktop

## Primera vez

```bash
npm install              # en la raíz: activa el hook que valida los commits
cd frontend
npm install
```

## Levantar el proyecto

**1. Base de datos**

```bash
docker compose up -d
```

**2. Backend** (http://localhost:8080)

```bash
cd backend
./mvnw spring-boot:run
```

En Windows con PowerShell: `.\mvnw.cmd spring-boot:run`

**3. Frontend** (http://localhost:4200)

```bash
cd frontend
npm start
```

Al abrir el frontend se muestra el estado de los tres servicios. Si todo está en verde, el entorno
está listo.

## Verificar antes de un pull request

```bash
cd backend && ./mvnw verify
cd frontend && npm run lint && npm test -- --watch=false && npm run build
```

`./mvnw verify` revisa formato, reglas de arquitectura y tests (necesita Docker encendido). La CI
corre lo mismo en cada pull request.

## Configuración

El backend lee estas variables de entorno, con valores por defecto para desarrollo local:

| Variable         | Por defecto                                |
| ---------------- | ------------------------------------------ |
| `DB_URL`         | `jdbc:postgresql://localhost:5432/pedidos` |
| `DB_USER`        | `pedidos`                                  |
| `DB_PASSWORD`    | `pedidos`                                  |
| `PORT`           | `8080`                                     |
| `ADMIN_EMAIL`    | vacío                                      |
| `ADMIN_PASSWORD` | vacío                                      |

Al arrancar, el backend crea la cuenta de administrador ("Administrador") con `ADMIN_EMAIL` y
`ADMIN_PASSWORD` si no hay una cuenta con ese correo:

- Si la cuenta ya existe como admin, no la toca. Cambiar `ADMIN_PASSWORD` después no cambia la
  contraseña.
- Si falta una de las dos, el correo no es válido o es de un cliente o un dueño, o la contraseña no
  cumple las reglas (de 8 caracteres a 72 bytes), el backend no arranca y muestra el motivo.
- Sin las dos variables arranca sin admin y lo avisa en el log. En desarrollo:
  `ADMIN_EMAIL=admin@pedidos.com ADMIN_PASSWORD=<clave> ./mvnw spring-boot:run`.

En desarrollo, Angular redirige las peticiones a `/api` hacia el backend usando
`frontend/proxy.conf.json`.

## Documentación

- [Arquitectura](docs/arquitectura.md)
- Convenciones: [backend](docs/convenciones/backend.md), [frontend](docs/convenciones/frontend.md),
  [API](docs/convenciones/api.md), [tests](docs/convenciones/testing.md),
  [Git y pull requests](docs/convenciones/git.md)
- [Decisiones de arquitectura](docs/adr/README.md)
- [Contexto para asistentes de IA](AGENTS.md)
