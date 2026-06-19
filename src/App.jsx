import useGeolocation from "./hooks/useGeolocation";
import useRouteRecorder from "./hooks/useRouteRecorder";
import Mapa from "./components/Mapa";
import "./App.css";

function App() {
  const { latitude, longitude, error, loading } = useGeolocation();
  const {
    isRecording,
    routes,
    currentRoute,
    startRecording,
    stopRecording,
    clearRoutes,
  } = useRouteRecorder({ latitude, longitude });

  return (
    <div className="app">
      <h1 className="app-titulo">Mi Mapa Online</h1>

      {loading && <p className="app-mensaje">Obteniendo ubicación...</p>}

      {error && (
        <div className="app-error">
          <p>Error: {error}</p>
          <p className="app-error-ayuda">
            Asegúrate de haber permitido el acceso a la ubicación en tu
            navegador.
          </p>
        </div>
      )}

      {!loading && !error && (
        <p className="app-coords">
          Lat: {latitude?.toFixed(5)} &middot; Lng: {longitude?.toFixed(5)}
        </p>
      )}

      <div className="controles-ruta">
        <button
          className={`btn-ruta ${isRecording ? "btn-ruta-grabando" : "btn-ruta-detener"}`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? "⏹ Detener grabación" : "⏺ Grabar ruta"}
        </button>

        {routes.length > 0 && (
          <button className="btn-ruta btn-ruta-limpiar" onClick={clearRoutes}>
            🗑 Limpiar rutas
          </button>
        )}
      </div>

      {isRecording && (
        <p className="app-mensaje app-grabando">
          Grabando ruta... ({currentRoute.length} puntos)
        </p>
      )}

      {routes.length > 0 && (
        <p className="app-coords">
          Rutas guardadas: {routes.length}
        </p>
      )}

      <Mapa
        latitude={latitude}
        longitude={longitude}
        routes={routes}
        currentRoute={currentRoute}
      />
    </div>
  );
}

export default App;
