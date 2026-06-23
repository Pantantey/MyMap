import { useState } from "react";
import PoiModal from "./PoiModal";

// Importar todas las imágenes de assets para que Vite las procese en build time
const images = import.meta.glob("../assets/*", { eager: true });

/**
 * Obtiene la URL de una imagen de assets por su nombre de archivo.
 */
function getImageUrl(filename) {
  const key = `../assets/${filename}`;
  return images[key]?.default || "";
}

/**
 * Marcador de Punto de Interés (POI) en el mapa.
 * Muestra un círculo con la imagen dentro.
 * Al hacer clic abre un modal con la info completa.
 *
 * @param {{
 *   poi: { id: number, titulo: string, descripcion: string, imagen: string, lat: number, lng: number },
 *   x: number,
 *   y: number,
 * }} props
 */
export default function PoiMarker({ poi, x, y }) {
  const [isOpen, setIsOpen] = useState(false);
  const imgSrc = getImageUrl(poi.imagen);

  return (
    <>
      <div
        className="poi-marcador"
        style={{
          left: `${x}px`,
          top: `${y}px`,
        }}
        onClick={() => setIsOpen(true)}
        title={poi.titulo}
      >
        <div className="poi-circulo">
          {imgSrc && (
            <img
              src={imgSrc}
              alt={poi.titulo}
              className="poi-imagen"
              draggable={false}
            />
          )}
        </div>
      </div>

      {isOpen && (
        <PoiModal poi={poi} imgSrc={imgSrc} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}