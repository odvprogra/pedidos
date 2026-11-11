# 0013. Las pruebas E2E usan Playwright desde una carpeta propia

- **Estado:** Propuesta
- **Fecha:** 2026-11-10

## Contexto

El enunciado del proyecto pide pruebas End-to-End automatizadas que usen la interfaz real: hacer un
pedido, gestionarlo como restaurante, ver el historial, la regla del carrito de un solo restaurante
y el control de acceso. En la defensa se tienen que poder correr de nuevo, y los de integración ya
exigen un entorno controlado, sin datos cargados a mano.

Hasta ahora había tests unitarios y de integración en el backend (JUnit y Testcontainers) y tests
de componentes en el frontend (Vitest), pero nada que recorriera la app con un navegador. En
`frontend/` no se instala nada hasta pasar a Node 24 con npm 11.

## Decisión

Vamos a escribir los E2E con Playwright (`@playwright/test`) en una carpeta `e2e/` en la raíz, con
su propio `package.json`. `npm test` en `e2e/`:

1. Levanta la base de Docker si hace falta y recrea una base vacía `pedidos_e2e`.
2. Arranca el backend contra esa base en el puerto 8090, con un admin propio, y el frontend con
   `ng serve` en el 4210, con un proxy hacia el 8090. No reusa servidores ya levantados.
3. Corre los tests uno detrás de otro en el Chrome instalado (`channel: 'chrome'`), sin descargar
   navegadores.

Cada test arma sus datos por la API (cuentas, restaurante, menú, pedidos) y recién después usa la
interfaz para lo que prueba. Los selectores son los de un usuario: rol y nombre accesible
(`getByRole('button', { name: 'Aceptar el pedido #12' })`), y un `data-*` solo donde el texto no
alcanza, como el total.

## Alternativas consideradas

- **Cypress:** hace lo mismo, pero corre dentro del navegador, maneja peor varias pestañas y
  contextos, y su descarga es más pesada. Playwright trae los `webServer`, los reportes y el
  `request` para preparar datos sin plugins.
- **Playwright dentro de `frontend/`:** dejaría todo junto, pero toca el lockfile del frontend, que
  no se puede regenerar hasta pasar a Node 24, y mezcla los tests de componentes con los de la app
  completa.
- **Selenium WebDriver:** más bajo nivel; las esperas y los selectores accesibles hay que
  escribirlos a mano.
- **Datos fijos en un script SQL:** más rápido, pero se rompe con cada cambio del esquema y saltea
  las reglas de negocio que los datos tienen que cumplir. Crear los datos por la API usa las mismas
  validaciones que la app.

## Consecuencias

- **Positivas:** un solo comando corre los E2E desde cero, en la defensa o en otra máquina con
  Docker, Java 21, Node y Chrome. La base de desarrollo y los puertos 8080 y 4200 no se tocan, así
  que se puede correr con la app de desarrollo levantada. Cada test es independiente porque crea sus
  propios datos.
- **Negativas:** la corrida tarda unos minutos porque arranca el backend y el frontend. Usa el Chrome
  instalado, así que en una máquina sin Chrome hay que cambiar el `channel` o correr
  `npx playwright install chromium`. `mvnw spring-boot:run` comparte `backend/target/` con
  `mvnw verify`: no se corren a la vez. Una base `pedidos_e2e` queda en el contenedor entre
  corridas, y se recrea en la siguiente.
