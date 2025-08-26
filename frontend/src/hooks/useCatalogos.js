import { useEffect, useState } from "react";
import { getTiposLugar, getPartesCuerpo, getPrendas } from "../services/CatalogosService.js";

export default function useCatalogos() {
  const [tiposLugar, setTiposLugar] = useState([]);
  const [partesCuerpo, setPartesCuerpo] = useState([]);
  const [prendas, setPrendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lugaresRes, partesRes, prendasRes] = await Promise.all([
            
          getTiposLugar(),
          getPartesCuerpo(),
          getPrendas()
        ]);
        console.log("Partes cuerpo API:", partesRes);
        console.log("Prendas API:", prendasRes);
        console.log("Tipos lugar API:", lugaresRes);


        // Desestructuramos los arrays dentro de la respuesta
        setTiposLugar(lugaresRes);
        setPartesCuerpo(partesRes);
        setPrendas(prendasRes);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { tiposLugar, partesCuerpo, prendas, loading, error };
}
