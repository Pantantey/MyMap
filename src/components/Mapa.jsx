import { useRef, useState, useEffect } from "react";
import Marcador from "./Marcador";
import mapa_barrio from "../assets/mapa_barrio.png";

/**
 * Límites geográficos del mapa (bounding box).
 * Esquina superior izquierda = (norte, oeste)
 * Esquina inferior derecha = (sur, este)
 */
const BOUNDS = {
  north: 10.07746,
  south: 10.05838,
  west: -84.47714,
  east: -84.4642,
};

/**
 * Convierte coordenadas geográficas a píxeles dentro del mapa.
 *
 * @param {number} lat - Latitud del usuario.
 * @param {number} lng - Longitud del usuario.
 * @param {number} imgWidth - Ancho de la imagen del mapa en píxeles.
 * @param {number} imgHeight - Alto de la imagen del mapa en píxeles.
 * @returns {{ x: number, y: number }}
 */
function latLngToPixel(lat, lng, imgWidth, imgHeight) {
  const x = ((lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * imgWidth;
  const y = ((BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south)) * imgHeight;
  return { x, y };
}

/**
 * Mapa que muestra la imagen de fondo y un marcador con la posición GPS.
 *
 * @param {{ latitude: number|null, longitude: number|null }} props
 */
export default function Mapa({ latitude, longitude }) {
  const imgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Obtener dimensiones reales de la imagen una vez cargue
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    function handleLoad() {
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    }

    if (img.complete) {
      handleLoad();
    } else {
      img.addEventListener("load", handleLoad);
      return () => img.removeEventListener("load", handleLoad);
    }
  }, []);

  // Calcular posición del marcador solo si hay coordenadas válidas
  const marcadorPos =
    latitude !== null && longitude !== null && dimensions.width > 0
      ? latLngToPixel(latitude, longitude, dimensions.width, dimensions.height)
      : null;

  return (
    <div className="mapa-contenedor">
      <img
        ref={imgRef}
        src={mapa_barrio}
        alt="Mapa del barrio"
        className="mapa-imagen"
        draggable={false}
      />
      {marcadorPos && <Marcador x={marcadorPos.x} y={marcadorPos.y} />}
    </div>
  );
}