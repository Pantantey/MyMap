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
 *
 * Zoom natural: al usar la rueda, el punto bajo el mouse permanece fijo.
 * Al usar botones +/-, el centro del viewport permanece fijo.
 * Arrastrar para moverse cuando hay zoom.
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
  const lastPinchDistRef = useRef(0);
  const lastPinchCenterRef = useRef({ x: 0, y: 0 });

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

  /**
   * Aplica zoom centrado en un punto (mouseX, mouseY) relativo al viewport.
   * - mouseX, mouseY: posición del mouse en píxeles del viewport.
   * - newZoom: nuevo nivel de zoom.
   */
  const applyZoomAtPoint = useCallback((mouseX, mouseY, newZoom) => {
    setZoom(newZoom);

    setPan((prevPan) => {
      // Coordenadas del punto en el contenido antes del zoom
      const contentX = (mouseX - prevPan.x) / zoom;
      const contentY = (mouseY - prevPan.y) / zoom;

      // Nuevo pan para que ese punto del contenido coincida con la posición del mouse
      return {
        x: mouseX - contentX * newZoom,
        y: mouseY - contentY * newZoom,
      };
    });
  }, [zoom]);

  // ---- Zoom con rueda del mouse ----
  const handleWheel = useCallback((e) => {
    e.preventDefault();

    // Posición del mouse relativa al contenedor
    const rect = contRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom((prev) => {
      const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev + delta));

      // Aplicar zoom centrado en el mouse inmediatamente
      requestAnimationFrame(() => {
        applyZoomAtPoint(mouseX, mouseY, Math.round(next * 10) / 10);
      });

      return next;
    });
  }, [applyZoomAtPoint]);

  // ---- Zoom con pellizco táctil ----
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDistRef.current = Math.sqrt(dx * dx + dy * dy);

      // Centro del pellizco relativo al contenedor
      const rect = contRef.current.getBoundingClientRect();
      lastPinchCenterRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top,
      };
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && lastPinchDistRef.current > 0) {
      e.preventDefault();

      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / lastPinchDistRef.current;
      lastPinchDistRef.current = dist;

      // Centro actual del pellizco
      const rect = contRef.current.getBoundingClientRect();
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

      setZoom((prev) => {
        const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev * scale));

        requestAnimationFrame(() => {
          applyZoomAtPoint(centerX, centerY, Math.round(next * 10) / 10);
        });

        return next;
      });
    }
  }, [applyZoomAtPoint]);

  const handleTouchEnd = useCallback(() => {
    lastPinchDistRef.current = 0;
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
    if (!contRef.current) return;
    const rect = contRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    setZoom((prev) => {
      const next = Math.min(ZOOM_MAX, Math.round((prev + ZOOM_STEP) * 10) / 10);

      requestAnimationFrame(() => {
        applyZoomAtPoint(centerX, centerY, next);
      });

      return next;
    });
  }, [applyZoomAtPoint]);

  const zoomOut = useCallback(() => {
    if (!contRef.current) return;
    const rect = contRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    setZoom((prev) => {
      const next = Math.max(ZOOM_MIN, Math.round((prev - ZOOM_STEP) * 10) / 10);

      requestAnimationFrame(() => {
        applyZoomAtPoint(centerX, centerY, next);
      });

      return next;
    });
  }, [applyZoomAtPoint]);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setCursor("default");
  }, []);

  // Actualizar cursor cuando cambia el zoom
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