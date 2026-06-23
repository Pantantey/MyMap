/**
 * Límites geográficos del mapa (bounding box).
 * Esquina superior izquierda = (norte, oeste)
 * Esquina inferior derecha = (sur, este)
 *
 * CAMBIA estos valores según tu imagen.
 */
export const BOUNDS = {
  north: 10.07746,
  south: 10.05838,
  west: -84.47714,
  east: -84.4642,
};

/**
 * Dimensiones REALES de la imagen del mapa en píxeles.
 * La imagen actual es 602×905.
 * Si cambias la imagen, actualiza estos valores.
 */
export const MAP_IMAGE = {
  width: 602,
  height: 905,
};
