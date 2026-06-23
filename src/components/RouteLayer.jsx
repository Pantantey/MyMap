import { useMemo } from "react";
import {
  routeToRealPixels,
  scalePointsToDisplay,
} from "../mapUtils";

/**
 * Capa SVG que dibuja las rutas grabadas sobre el mapa.
 * Tanto el marcador como las rutas usan las mismas funciones
 * de conversión (mapUtils.js) para que coincidan exactamente.
 *
 * @param {{
 *   routes: Array<Array<{lat: number, lng: number}>>,
 *   currentRoute: Array<{lat: number, lng: number}>,
 *   displayWidth: number,
 *   displayHeight: number,
 * }} props
 */
export default function RouteLayer({
  routes,
  currentRoute,
  displayWidth,
  displayHeight,
}) {
  // Convertir ruta actual a píxeles en pantalla
  const currentDisplayPoints = useMemo(() => {
    const realPoints = routeToRealPixels(currentRoute);
    return scalePointsToDisplay(realPoints, displayWidth, displayHeight);
  }, [currentRoute, displayWidth, displayHeight]);

  // Convertir rutas guardadas a píxeles en pantalla
  const allRoutesDisplayPoints = useMemo(
    () =>
      routes
        .filter((r) => r.length >= 2)
        .map((route) => {
          const realPoints = routeToRealPixels(route);
          return scalePointsToDisplay(realPoints, displayWidth, displayHeight);
        }),
    [routes, displayWidth, displayHeight]
  );

  // Generar string de path SVG para un array de puntos
  const toPath = (points) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg
      className="rute-layer"
      width={displayWidth}
      height={displayHeight}
      viewBox={`0 0 ${displayWidth} ${displayHeight}`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      {/* Rutas completadas (azul) */}
      {allRoutesDisplayPoints.map((points, idx) => {
        if (points.length < 2) return null;
        return (
          <path
            key={`route-${idx}`}
            d={toPath(points)}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.8}
          />
        );
      })}
      {/* Ruta actual (rojo) */}
      {currentDisplayPoints.length >= 2 && (
        <path
          d={toPath(currentDisplayPoints)}
          fill="none"
          stroke="#ef4444"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />
      )}
    </svg>
  );
}