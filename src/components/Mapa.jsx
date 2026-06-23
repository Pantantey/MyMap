import { useRef, useState, useEffect, useMemo } from "react";
import Marcador from "./Marcador";
import RouteLayer from "./RouteLayer";
import PoiMarker from "./PoiMarker";
import { latLngToPixel, scaleToDisplay } from "../mapUtils";
import poiData from "../data/poiData";
import mapa_barrio from "../assets/mapa_barrio.png";

/**
 * Mapa que muestra la imagen de fondo, el marcador GPS y las rutas grabadas.
 *
 * Usa MAP_IMAGE (constants.js) para las dimensiones reales del mapa via mapUtils.
 * El marcador solo se muestra si el GPS está dentro de BOUNDS.
 * Las coordenadas se escalan automáticamente al tamaño mostrado en pantalla.
 */
export default function Mapa({ latitude, longitude, routes, currentRoute }) {
  const imgRef = useRef(null);
  const contRef = useRef(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  // Detectar el tamaño real en pantalla del contenedor (puede diferir del real por CSS)
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

  // Calcular posición del marcador GPS solo si está dentro del mapa
  const hasValidCoords = latitude !== null && longitude !== null;
  const realPos = hasValidCoords ? latLngToPixel(latitude, longitude) : null;

  // Escalar la posición al tamaño mostrado en pantalla
  const marcadorPos =
    realPos && displaySize.width > 0
      ? scaleToDisplay(realPos.x, realPos.y, displaySize.width, displaySize.height)
      : null;

  // Calcular posiciones de los POIs en píxeles de pantalla
  const poisConPosicion = useMemo(() => {
    if (displaySize.width <= 0) return [];
    return poiData
      .map((poi) => {
        const real = latLngToPixel(poi.lat, poi.lng);
        if (!real) return null;
        const display = scaleToDisplay(real.x, real.y, displaySize.width, displaySize.height);
        return { poi, x: display.x, y: display.y };
      })
      .filter((item) => item !== null);
  }, [displaySize]);

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
          displayWidth={displaySize.width}
          displayHeight={displaySize.height}
        />
      )}
      {poisConPosicion.map(({ poi, x, y }) => (
        <PoiMarker key={poi.id} poi={poi} x={x} y={y} />
      ))}
    </div>
  );
}