import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import Marcador from "./Marcador";
import RouteLayer from "./RouteLayer";
import PoiMarker from "./PoiMarker";
import { latLngToPixel, scaleToDisplay } from "../mapUtils";
import poiData from "../data/poiData";
import mapa_barrio from "../assets/mapa_barrio.png";

/** Zoom mínimo, máximo e incremento */
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 5;
const ZOOM_STEP = 0.2;

/**
 * Mapa con zoom y paneo.
 * - Zoom con rueda del mouse o pellizco táctil.
 * - Arrastrar para moverse cuando hay zoom.
 * - Botones + / - / 🔄 para control.
 */
export default function Mapa({ latitude, longitude, routes, currentRoute }) {
  const imgRef = useRef(null);
  const contRef = useRef(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [cursor, setCursor] = useState("default");
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const lastPinchDistRef = useRef(null);

  // ---- Detectar tamaño en pantalla ----
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

    const observer = new ResizeObserver(updateDisplaySize);
    observer.observe(cont);

    return () => {
      img.removeEventListener("load", handleLoad);
      observer.disconnect();
    };
  }, []);

  // ---- Zoom con rueda del mouse ----
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom((prev) => {
      const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev + delta));
      return Math.round(next * 10) / 10;
    });
  }, []);

  // ---- Zoom con pellizco táctil ----
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDistRef.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && lastPinchDistRef.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / lastPinchDistRef.current;
      lastPinchDistRef.current = dist;

      setZoom((prev) => {
        const next = prev * scale;
        return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(next * 10) / 10));
      });
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastPinchDistRef.current = null;
  }, []);

  // ---- Paneo con mouse ----
  const handleMouseDown = useCallback((e) => {
    if (zoom <= 1) return;
    isPanningRef.current = true;
    setCursor("grabbing");
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }, [zoom, pan]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanningRef.current) return;
    setPan({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false;
    setCursor(zoom > 1 ? "grab" : "default");
  }, [zoom]);

  // ---- Paneo con dedo (touch) ----
  const handlePanTouchStart = useCallback((e) => {
    if (zoom <= 1 || e.touches.length !== 1) return;
    isPanningRef.current = true;
    panStartRef.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
  }, [zoom, pan]);

  const handlePanTouchMove = useCallback((e) => {
    if (!isPanningRef.current || e.touches.length !== 1) return;
    e.preventDefault();
    setPan({
      x: e.touches[0].clientX - panStartRef.current.x,
      y: e.touches[0].clientY - panStartRef.current.y,
    });
  }, []);

  // ---- Controles de zoom ----
  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(ZOOM_MAX, Math.round((prev + ZOOM_STEP) * 10) / 10));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(ZOOM_MIN, Math.round((prev - ZOOM_STEP) * 10) / 10));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setCursor("default");
  }, []);

  // Actualizar cursor cuando cambia el zoom (si no está arrastrando)
  useEffect(() => {
    if (!isPanningRef.current) {
      setCursor(zoom > 1 ? "grab" : "default");
    }
  }, [zoom]);

  // ---- Posición del marcador GPS ----
  const hasValidCoords = latitude !== null && longitude !== null;
  const realPos = hasValidCoords ? latLngToPixel(latitude, longitude) : null;
  const marcadorPos =
    realPos && displaySize.width > 0
      ? scaleToDisplay(realPos.x, realPos.y, displaySize.width, displaySize.height)
      : null;

  // ---- Posiciones de POIs ----
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
    <div className="mapa-wrapper">
      {/* Controles de zoom */}
      <div className="zoom-controles">
        <button className="zoom-btn" onClick={zoomIn} title="Acercar">+</button>
        <span className="zoom-nivel">{Math.round(zoom * 100)}%</span>
        <button className="zoom-btn" onClick={zoomOut} title="Alejar">−</button>
        {zoom !== 1 && (
          <button className="zoom-btn zoom-btn-reset" onClick={resetZoom} title="Restablecer">⟲</button>
        )}
      </div>

      {/* Viewport del mapa */}
      <div
        className="mapa-contenedor"
        ref={contRef}
        onWheel={handleWheel}
        onTouchStart={(e) => {
          handleTouchStart(e);
          handlePanTouchStart(e);
        }}
        onTouchMove={(e) => {
          handleTouchMove(e);
          handlePanTouchMove(e);
        }}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor }}
      >
        {/* Contenido interno escalado */}
        <div
          className="mapa-inner"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "0 0",
          }}
        >
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
      </div>
    </div>
  );
}