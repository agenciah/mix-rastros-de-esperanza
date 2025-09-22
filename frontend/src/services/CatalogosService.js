import api from "../lib/axios.js"

export const getTiposLugar = async () => {
  try {
    const { data } = await api.get("/fichas/catalogos/tipos-lugar")
    // devolvemos siempre un array
    return data.catalogo_tipo_lugar || []
  } catch (error) {
    console.error("❌ Error en getTiposLugar:", error.response?.data || error.message)
    throw error
  }
}

export const getPartesCuerpo = async () => {
  try {
    const { data } = await api.get("/fichas/catalogos/partes-cuerpo")
    return data.catalogo_partes_cuerpo || []
  } catch (error) {
    console.error("❌ Error en getPartesCuerpo:", error.response?.data || error.message)
    throw error
  }
}

export const getPrendas = async () => {
  try {
    const { data } = await api.get("/fichas/catalogos/prendas")
    return data.catalogo_prendas || []
  } catch (error) {
    console.error("❌ Error en getPrendas:", error.response?.data || error.message)
    throw error
  }
}
