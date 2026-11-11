# 0014. Las imágenes de restaurantes y productos son direcciones web

- **Estado:** Propuesta
- **Fecha:** 2026-11-10

## Contexto

El enunciado pide que cada restaurante muestre un logo o imagen y que cada producto tenga imagen.
El modelo de datos dejaba la columna para una ADR propia, porque su tipo depende de dónde se guarde
el archivo. La app no tiene almacenamiento de archivos, y la materia evalúa sobre todo los tests:
conviene lo más simple que se pueda probar bien en cada capa.

## Decisión

Vamos a guardar la imagen como una dirección web: `image_url varchar(500)`, opcional, en
`restaurants` y en `products`. El dueño la pega en el formulario. El dominio la valida con
`ImageUrls.normalize` (`shared.domain.model`): sin espacios a los costados, esquema `http` o `https`
y un host; si no cumple, `422` con `restaurant.invalid_image_url` o `catalog.invalid_image_url`. La
interfaz la muestra con `<img>` y, si no hay imagen o no carga, vuelve al placeholder de la marca.

## Alternativas consideradas

- **Subir el archivo al backend y guardarlo en disco:** suma un endpoint `multipart`, límites de
  tamaño y tipo, y una carpeta que hay que respaldar y servir; los tests de integración tendrían
  que manejar archivos.
- **Guardar la imagen en la base (`bytea`):** evita el disco, pero agranda cada fila, obliga a un
  endpoint para servirla y hace pesadas las listas.
- **Un servicio de almacenamiento externo (S3 o similar):** es lo que haría un producto real, pero
  agrega credenciales, costos y un servicio del que dependerían los tests.

## Consecuencias

- **Positivas:** no hay archivos que subir, servir ni respaldar. La regla se prueba con un test
  unitario puro y cada capa la cubre con sus tests de siempre. Cambiar después a archivos propios
  solo cambia de dónde sale la dirección.
- **Negativas:** la imagen depende de un sitio ajeno: si lo borran o bloquea el enlace, la app
  muestra el placeholder. La app no controla el tamaño ni el contenido de la imagen. El dueño
  necesita tener la imagen publicada en algún lado.
