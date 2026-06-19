import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Hook para grabar rutas GPS.
 * Cada vez que se inicia una grabación se crea una nueva ruta.
 * Al detener, la ruta se guarda en el historial.
 * Al reiniciar, se crea otra ruta independiente (no se conecta con la anterior).
 *
 * @param {{ latitude: number|null, longitude: number|null }} coords - Coordenadas actuales
 * @returns {{
 *   isRecording: boolean,
 *   routes: Array<Array<{lat: number, lng: number}>>,
 *   currentRoute: Array<{lat: number, lng: number}>,
 *   startRecording: () => void,
 *   stopRecording: () => void,
 *   clearRoutes: () => void,
 * }}
 */
export default function useRouteRecorder(coords) {
  const [isRecording, setIsRecording] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [currentRoute, setCurrentRoute] = useState([]);
  const lastPointRef = useRef(null);
  const currentRouteRef = useRef([]);

  // Mantener la ref sincronizada con el estado
  useEffect(() => {
    currentRouteRef.current = currentRoute;
  }, [currentRoute]);

  // Distancia mínima entre puntos para evitar duplicados (en grados)
  const MIN_DISTANCE = 0.00001;

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setCurrentRoute([]);
    currentRouteRef.current = [];
    lastPointRef.current = null;
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    // Guardar la ruta actual en el historial si tiene al menos 2 puntos
    const routeToSave = currentRouteRef.current;
    if (routeToSave.length >= 2) {
      setRoutes((prev) => [...prev, [...routeToSave]]);
    }
    setCurrentRoute([]);
    currentRouteRef.current = [];
    lastPointRef.current = null;
  }, []);

  const clearRoutes = useCallback(() => {
    setRoutes([]);
    setCurrentRoute([]);
    currentRouteRef.current = [];
    lastPointRef.current = null;
  }, []);

  // Agregar puntos a la ruta actual mientras se está grabando
  useEffect(() => {
    if (!isRecording) return;
    if (coords.latitude == null || coords.longitude == null) return;

    const point = { lat: coords.latitude, lng: coords.longitude };

    // Evitar puntos duplicados o muy cercanos
    if (lastPointRef.current) {
      const dist = Math.sqrt(
        Math.pow(point.lat - lastPointRef.current.lat, 2) +
        Math.pow(point.lng - lastPointRef.current.lng, 2)
      );
      if (dist < MIN_DISTANCE) return;
    }

    lastPointRef.current = point;
    setCurrentRoute((prev) => [...prev, point]);
  }, [isRecording, coords]);

  return {
    isRecording,
    routes,
    currentRoute,
    startRecording,
    stopRecording,
    clearRoutes,
  };
}
