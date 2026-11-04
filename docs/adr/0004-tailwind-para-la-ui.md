# 0004. Tailwind CSS para la interfaz

- **Estado:** Aceptada
- **Fecha:** 2026-10-14

## Contexto

La aplicación tiene dos caras: la del cliente, que debe verse como una app de delivery y usarse bien
en el celular, y el panel del restaurante, con formularios y listas. Necesitamos una forma de
estilizar que sea consistente y que la IA genere bien.

## Decisión

Vamos a usar Tailwind CSS 4 con tokens de diseño propios definidos en `src/styles.css` (`@theme`).
Los componentes visuales reutilizables (badge, botón, card, modal) se construyen en `shared/ui`. Los
componentes no tienen archivo de estilos propio.

## Alternativas consideradas

- **PrimeNG:** acelera mucho las tablas y formularios del panel, pero el aspecto es genérico y
  pelearíamos con sus estilos para la parte del cliente.
- **Angular Material:** sólido y accesible, pero con una estética Material difícil de cambiar.
- **SCSS propio:** total libertad, pero cada componente reinventa espaciados y colores.

## Consecuencias

- **Positivas:** un solo lugar para los colores y espaciados; los estilos viven junto al template;
  los asistentes de IA generan Tailwind con mucha precisión.
- **Negativas:** los templates tienen muchas clases. Lo mitigamos con el plugin de Prettier que las
  ordena y extrayendo componentes cuando un patrón se repite. Los componentes complejos (calendario,
  autocompletado) hay que construirlos o buscar una librería headless con una ADR.
