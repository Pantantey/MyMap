import { useMemo } from "react";

/**
 * Convierte coordenadas geográficas a píxeles dentro del mapa.
 */
function latLngToPixel(lat, lng, bounds, imgWidth, imgHeight) {
  const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * imgWidth;
  const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * imgHeight;
  return { x, y };
}

/**
 * Capa SVG que dibuja las rutas grabadas sobre el mapa.
 *
 * @param {{
 *   routes: Array<Array<{lat: number, lng: number}>>,
 *   currentRoute: Array<{lat: number, lng: number}>,
 *   bounds: { north: number, south: number, west: number, east: number },
 *   mapWidth: number,
 *   mapHeight: number,
 * }} props
 */
export default function RouteLayer({
  routes,
  currentRoute,
  bounds,
  mapWidth,
  mapHeight,
}) {
  const currentPoints = useMemo(
    () =>
      currentRoute.length >= 2
        ? currentRoute.map((p) => latLngToPixel(p.lat, p.lng, bounds, mapWidth, mapHeight))
        : [],
    [currentRoute, bounds, mapWidth, mapHeight]
  );

  const allRoutesPoints = useMemo(
    () =>
      routes
        .filter((r) => r.length >= 2)
        .map((route) =>
          route.map((p) => latLngToPixel(p.lat, p.lng, bounds, mapWidth, mapHeight))
        ),
    [routes, bounds, mapWidth, mapHeight]
  );

  // Generar string de path SVG para una ruta
  const toPath = (points) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg
      className="rute-layer"
      width={mapWidth}
      height={mapHeight}
      viewBox={`0 0 ${mapWidth} ${mapHeight}`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      {/* Rutas completadas */}
      {allRoutesPoints.map((points, idx) => (
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
      ))}
      {/* Ruta actual (grabándose) */}
      {currentPoints.length >= 2 && (
        <path
          d={toPath(currentPoints)}
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