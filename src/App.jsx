import useGeolocation from "./hooks/useGeolocation";
import Mapa from "./components/Mapa";
import "./App.css";

function App() {
  const { latitude, longitude, error, loading } = useGeolocation();

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

      <Mapa latitude={latitude} longitude={longitude} />
    </div>
  );
}

export default App;