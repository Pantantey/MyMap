/**
 * Puntos de Interés (POIs) para mostrar en el mapa.
 *
 * Cómo agregar un nuevo punto:
 * 1. Agrega un objeto a este array con:
 *    - id:         Identificador único (número)
 *    - titulo:     Texto que se muestra en el modal
 *    - descripcion:Texto descriptivo más detallado
 *    - imagen:     Ruta a la imagen dentro de src/assets/ (ej: "mi-imagen.png")
 *    - lat:        Latitud (dentro de BOUNDS)
 *    - lng:        Longitud (dentro de BOUNDS)
 *
 * 2. Coloca la imagen en: src/assets/
 *
 * Ejemplo:
 * {
 *   id: 1,
 *   titulo: "Mi Casa",
 *   descripcion: "Aquí vivo",
 *   imagen: "mi-casa.png",
 *   lat: 10.0685,
 *   lng: -84.4700,
 * }
 */
const poiData = [
  // ==============================
  //  AGREGA TUS PUNTOS AQUÍ ABAJO
  // ==============================
  {
    id: 1,
    titulo: "Izquierda hogares",
    descripcion: "Aquí es donde quedaba hogares crea",
    imagen: "mapa_barrio.png",
    lat: 10.07134,
    lng: -84.47555,
  },
  {
    id: 2,
    titulo: "Cima de cuesta",
    descripcion: "Se ve una cuesta para abajo",
    imagen: "mapa_barrio.png",
    lat: 10.07197,
    lng: -84.46631,
  },
];

export default poiData;