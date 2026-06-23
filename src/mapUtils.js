import { BOUNDS, MAP_IMAGE } from "./constants";

/**
 * Verifica si unas coordenadas están dentro de los límites del mapa.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {boolean}
 */
export function isInsideBounds(lat, lng) {
  return (
    lat >= BOUNDS.south &&
    lat <= BOUNDS.north &&
    lng >= BOUNDS.west &&
    lng <= BOUNDS.east
  );
}

/**
 * Convierte coordenadas geográficas a píxeles DENTRO de la imagen real.
 * Usa MAP_IMAGE (constants.js) como dimensiones reales de la imagen.
 * Retorna null si las coordenadas están fuera del mapa.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {{ x: number, y: number } | null}
 */
export function latLngToPixel(lat, lng) {
  if (!isInsideBounds(lat, lng)) return null;

  const x =
    ((lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * MAP_IMAGE.width;
  const y =
    ((BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south)) * MAP_IMAGE.height;
  return { x, y };
}

/**
 * Escala coordenadas del tamaño real de la imagen al tamaño mostrado en pantalla.
 *
 * @param {number} realX - Coordenada X en la imagen real
 * @param {number} realY - Coordenada Y en la imagen real
 * @param {number} displayWidth - Ancho mostrado en pantalla (px)
 * @param {number} displayHeight - Alto mostrado en pantalla (px)
 * @returns {{ x: number, y: number }}
 */
export function scaleToDisplay(realX, realY, displayWidth, displayHeight) {
  const scaleX = displayWidth / MAP_IMAGE.width;
  const scaleY = displayHeight / MAP_IMAGE.height;
  return {
    x: realX * scaleX,
    y: realY * scaleY,
  };
}

/**
 * Convierte un array de coordenadas geográficas a píxeles en la imagen real.
 * Filtra automáticamente los puntos fuera del mapa.
 *
 * @param {Array<{lat: number, lng: number}>} route
 * @returns {Array<{x: number, y: number}>}
 */
export function routeToRealPixels(route) {
  return route
    .map((p) => latLngToPixel(p.lat, p.lng))
    .filter((p) => p !== null);
}

/**
 * Escala un array completo de puntos reales al tamaño mostrado en pantalla.
 *
 * @param {Array<{x: number, y: number}>} realPoints
 * @param {number} displayWidth
 * @param {number} displayHeight
 * @returns {Array<{x: number, y: number}>}
 */
export function scalePointsToDisplay(realPoints, displayWidth, displayHeight) {
  return realPoints.map((p) => scaleToDisplay(p.x, p.y, displayWidth, displayHeight));
}