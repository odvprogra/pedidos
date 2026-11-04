# 0005. Código en inglés, documentación en español

- **Estado:** Aceptada
- **Fecha:** 2026-10-14

## Contexto

El equipo y los usuarios hablan español. Los frameworks, librerías y la mayoría de ejemplos están en
inglés, y mezclar idiomas dentro del código produce nombres como `getRestaurante` o `saveProducto`.

## Decisión

Vamos a escribir en inglés todo lo que es código: clases, métodos, variables, rutas de la API, nombres
de tablas y columnas, tests y mensajes de commit.

Vamos a escribir en español todo lo que leen personas: README, ADRs, convenciones, skills y agentes
de IA, descripciones de pull requests, textos de la interfaz, mensajes de error que ve el usuario y
rutas del frontend (`/restaurantes`).

## Alternativas consideradas

- **Todo en español:** natural para el equipo, pero choca con los nombres del framework
  (`findById`, `@GetMapping`) y genera mezclas.
- **Todo en inglés:** consistente, pero la documentación es para el equipo y los docentes, que la
  leen mejor en español.

## Consecuencias

- **Positivas:** el código se lee de forma uniforme junto con el framework; la documentación es
  cómoda para quien la usa.
- **Negativas:** hay que traducir términos del negocio. Para evitar sinónimos, usamos siempre los
  mismos: restaurante → `restaurant`, catálogo → `catalog`, producto → `product`, pedido → `order`,
  cliente → `customer`, dueño del restaurante → `owner`.
