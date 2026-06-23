import { useRef, useState, useEffect } from "react";
import Marcador from "./Marcador";
import RouteLayer from "./RouteLayer";
import { BOUNDS, MAP_IMAGE } from "../constants";
import mapa_barrio from "../assets/mapa_barrio.png";

/**
 * Verifica si unas coordenadas están dentro de los límites del mapa.
 */
function isInsideBounds(lat, lng) {
  return (
    lat >= BOUNDS.south &&
    lat <= BOUNDS.north &&
    lng >= BOUNDS.west &&
    lng <= BOUNDS.east
  );
}

/**
 * Convierte coordenadas geográficas a píxeles DENTRO de la imagen real.
 * Usa las dimensiones configuradas en MAP_IMAGE (no el tamaño en pantalla).
 * Retorna null si las coordenadas están fuera del mapa.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {{ x: number, y: number } | null}
 */
function latLngToPixel(lat, lng) {
  if (!isInsideBounds(lat, lng)) return null;

  const x =
    ((lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * MAP_IMAGE.width;
  const y =
    ((BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south)) * MAP_IMAGE.height;
  return { x, y };
}

/**
 * Escala coordenadas del tamaño real de la imagen al tamaño mostrado en pantalla.
 */
function scaleToDisplay(realX, realY, displayWidth, displayHeight) {
  const scaleX = displayWidth / MAP_IMAGE.width;
  const scaleY = displayHeight / MAP_IMAGE.height;
  return {
    x: realX * scaleX,
    y: realY * scaleY,
  };
}

/**
 * Mapa que muestra la imagen de fondo, el marcador GPS y las rutas grabadas.
 *
 * Usa MAP_IMAGE (constants.js) para las dimensiones reales del mapa.
 * El marcador solo se muestra si el GPS está dentro de BOUNDS.
 * Las coordenadas se escalan automáticamente al tamaño mostrado en pantalla.
 */
export default function Mapa({ latitude, longitude, routes, currentRoute }) {
  const imgRef = useRef(null);
  const contRef = useRef(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  // Detectar el tamaño real en pantalla de la imagen (puede diferir del real por CSS)
  useEffect(() => {
    const img = imgRef.current;
    const cont = contRef.current;
    if (!img || !cont) return;

    function updateDisplaySize() {
      setDisplaySize({
        width: cont.clientWidth,
        height: cont.clientHeight,
      });
    }

    // Esperar a que la imagen cargue para medir
    function handleLoad() {
      updateDisplaySize();
    }

    if (img.complete) {
      handleLoad();
    } else {
      img.addEventListener("load", handleLoad);
    }

    // Usar ResizeObserver para actualizar si la ventana cambia de tamaño
    const observer = new ResizeObserver(updateDisplaySize);
    observer.observe(cont);

    return () => {
      img.removeEventListener("load", handleLoad);
      observer.disconnect();
    };
  }, []);

  // Calcular posición del marcador solo si está dentro del mapa
  const hasValidCoords = latitude !== null && longitude !== null;
  const realPos = hasValidCoords ? latLngToPixel(latitude, longitude) : null;

  // Escalar la posición al tamaño mostrado en pantalla
  const marcadorPos =
    realPos && displaySize.width > 0
      ? scaleToDisplay(realPos.x, realPos.y, displaySize.width, displaySize.height)
      : null;

  return (
    <div className="mapa-contenedor" ref={contRef}>
      <img
        ref={imgRef}
        src={mapa_barrio}
        alt="Mapa del barrio"
        className="mapa-imagen"
        draggable={false}
      />
      {marcadorPos && <Marcador x={marcadorPos.x} y={marcadorPos.y} />}
      {displaySize.width > 0 && (
        <RouteLayer
          routes={routes}
          currentRoute={currentRoute}
          bounds={BOUNDS}
          mapWidth={MAP_IMAGE.width}
          mapHeight={MAP_IMAGE.height}
        />
      )}
    </div>
  );
}
