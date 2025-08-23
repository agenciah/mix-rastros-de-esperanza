// backend/db/insertCatalogos.js
import path from "path";
import { fileURLToPath } from "url";
import { openDb } from "./initFichasDb.js";
import { ensureFichasTables } from "./initFichasDb.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Catálogos: listas cuidadas y pensadas para búsquedas reales.
 */
const TIPOS_LUGAR = [
  "Vía pública",
  "Domicilio particular",
  "Trabajo",
  "Escuela",
  "Hospital / Clínica",
  "SEMEFO / Servicio Médico Forense",
  "Estación de policía",
  "Centro de reclusión",
  "Refugio / Albergue",
  "Centro de transporte (aeropuerto, estación de autobuses)",
  "Parque / Área verde",
  "Zona rural / Campo",
  "Playa / Costa",
  "Centro comercial / Plaza",
  "Hotel / Motel",
  "Bodega / Nave",
  "Centro comunitario",
  "Iglesia / Templo",
  "Carretera / Autopista",
  "Terminal marítima / Puerto",
  "Otro",
];

const PARTES_CUERPO = [
  // Cabeza y cara
  { nombre: "Frente", categoria: "Cabeza" },
  { nombre: "Pelo", categoria: "Cabeza" },
  { nombre: "Cejas", categoria: "Cabeza" },
  { nombre: "Ojos", categoria: "Cabeza" },
  { nombre: "Párpados", categoria: "Cabeza" },
  { nombre: "Nariz", categoria: "Cabeza" },
  { nombre: "Tabique nasal", categoria: "Cabeza" },
  { nombre: "Pómulos", categoria: "Cabeza" },
  { nombre: "Orejas", categoria: "Cabeza" },
  { nombre: "Pabellón auricular", categoria: "Cabeza" },
  { nombre: "Mandíbula", categoria: "Cabeza" },
  { nombre: "Mentón", categoria: "Cabeza" },

  // Boca
  { nombre: "Boca", categoria: "Boca" },
  { nombre: "Labios", categoria: "Boca" },
  { nombre: "Dientes", categoria: "Boca" },
  { nombre: "Lengua", categoria: "Boca" },
  { nombre: "Encías", categoria: "Boca" },
  { nombre: "Mejillas", categoria: "Boca" },
  { nombre: "Paladar", categoria: "Boca" },

  // Cuello y torso
  { nombre: "Cuello", categoria: "Cuello y Torso" },
  { nombre: "Clavículas", categoria: "Cuello y Torso" },
  { nombre: "Hombros", categoria: "Cuello y Torso" },
  { nombre: "Pecho / Tórax", categoria: "Cuello y Torso" },
  { nombre: "Abdomen", categoria: "Cuello y Torso" },
  { nombre: "Espalda", categoria: "Cuello y Torso" },
  { nombre: "Cintura", categoria: "Cuello y Torso" },
  { nombre: "Ombligo", categoria: "Cuello y Torso" },
  { nombre: "Caderas", categoria: "Cuello y Torso" },

  // Brazos y manos
  { nombre: "Brazo", categoria: "Brazos y Manos" },
  { nombre: "Codo", categoria: "Brazos y Manos" },
  { nombre: "Antebrazo", categoria: "Brazos y Manos" },
  { nombre: "Muñeca", categoria: "Brazos y Manos" },
  { nombre: "Mano", categoria: "Brazos y Manos" },
  { nombre: "Palma de la mano", categoria: "Brazos y Manos" },
  { nombre: "Dorso de la mano", categoria: "Brazos y Manos" },
  { nombre: "Dedos de la mano", categoria: "Brazos y Manos" },
  { nombre: "Uñas de la mano", categoria: "Brazos y Manos" },

  // Piernas y pies
  { nombre: "Muslo", categoria: "Piernas y Pies" },
  { nombre: "Rodilla", categoria: "Piernas y Pies" },
  { nombre: "Pantorrilla", categoria: "Piernas y Pies" },
  { nombre: "Tobillo", categoria: "Piernas y Pies" },
  { nombre: "Pie", categoria: "Piernas y Pies" },
  { nombre: "Empeine", categoria: "Piernas y Pies" },
  { nombre: "Planta del pie", categoria: "Piernas y Pies" },
  { nombre: "Talón", categoria: "Piernas y Pies" },
  { nombre: "Dedos del pie", categoria: "Piernas y Pies" },
  { nombre: "Uñas del pie", categoria: "Piernas y Pies" },

  // Rasgos generales
  { nombre: "Piel", categoria: "Rasgos Generales" },
  { nombre: "Pecas", categoria: "Rasgos Generales" },
  { nombre: "Lunar", categoria: "Rasgos Generales" },
  { nombre: "Mancha de nacimiento", categoria: "Rasgos Generales" },
  { nombre: "Cicatriz", categoria: "Rasgos Generales" },
  { nombre: "Tatuaje", categoria: "Rasgos Generales" },
  { nombre: "Piercing", categoria: "Rasgos Generales" },
  { nombre: "Amputación", categoria: "Rasgos Generales" },
  { nombre: "Prótesis", categoria: "Rasgos Generales" },
  { nombre: "Gafas", categoria: "Rasgos Generales" },
  { nombre: "Bigote", categoria: "Rasgos Generales" },
  { nombre: "Barba", categoria: "Rasgos Generales" },
];

const PRENDAS = [
  // Prendas superiores
  { tipo: "Camisa", cat: "Prendas superiores" },
  { tipo: "Blusa", cat: "Prendas superiores" },
  { tipo: "Playera", cat: "Prendas superiores" },
  { tipo: "Sudadera", cat: "Prendas superiores" },
  { tipo: "Suéter", cat: "Prendas superiores" },
  { tipo: "Chamarra", cat: "Prendas superiores" },
  { tipo: "Chaleco", cat: "Prendas superiores" },
  { tipo: "Abrigo", cat: "Prendas superiores" },
  { tipo: "Chaqueta", cat: "Prendas superiores" },
  { tipo: "Camisa de vestir", cat: "Prendas superiores" },
  { tipo: "Top", cat: "Prendas superiores" },

  // Prendas inferiores
  { tipo: "Pantalón", cat: "Prendas inferiores" },
  { tipo: "Pantalón de mezclilla", cat: "Prendas inferiores" },
  { tipo: "Shorts", cat: "Prendas inferiores" },
  { tipo: "Falda", cat: "Prendas inferiores" },
  { tipo: "Vestido", cat: "Prendas inferiores" },
  { tipo: "Jumpsuit", cat: "Prendas inferiores" },
  { tipo: "Leggings", cat: "Prendas inferiores" },

  // Calzado
  { tipo: "Zapatos", cat: "Calzado" },
  { tipo: "Tenis", cat: "Calzado" },
  { tipo: "Botas", cat: "Calzado" },
  { tipo: "Sandalias", cat: "Calzado" },
  { tipo: "Zapatillas", cat: "Calzado" },

  // Accesorios
  { tipo: "Bufanda", cat: "Accesorios" },
  { tipo: "Gorra", cat: "Accesorios" },
  { tipo: "Sombrero", cat: "Accesorios" },
  { tipo: "Lentes de sol", cat: "Accesorios" },
  { tipo: "Cinturón", cat: "Accesorios" },
  { tipo: "Guantes", cat: "Accesorios" },
  { tipo: "Reloj", cat: "Accesorios" },
  { tipo: "Collar", cat: "Accesorios" },
  { tipo: "Pulsera", cat: "Accesorios" },
  { tipo: "Anillo", cat: "Accesorios" },
  { tipo: "Bolsa", cat: "Accesorios" },
  { tipo: "Mochila", cat: "Accesorios" },
  { tipo: "Pañuelo", cat: "Accesorios" },
  { tipo: "Aretes", cat: "Accesorios" },

  // Exterior
  { tipo: "Impermeable", cat: "Ropa exterior" },
  { tipo: "Gabardina", cat: "Ropa exterior" },
  { tipo: "Rompevientos", cat: "Ropa exterior" },

  // Ropa interior
  { tipo: "Ropa interior", cat: "Ropa interior" },
  { tipo: "Brasier", cat: "Ropa interior" },
  { tipo: "Calzón", cat: "Ropa interior" },
  { tipo: "Boxer", cat: "Ropa interior" },
  { tipo: "Calcetas", cat: "Ropa interior" },
  { tipo: "Calcetines", cat: "Ropa interior" },

  // Otros útiles para búsqueda
  { tipo: "Traje de baño", cat: "Otros" },
  { tipo: "Uniforme escolar", cat: "Otros" },
  { tipo: "Uniforme laboral", cat: "Otros" },
];

/**
 * Inserta catálogos con INSERT OR IGNORE y logs de progreso.
 */
export async function insertCatalogos() {
  const db = await openDb();
  await ensureFichasTables();

  console.log("⏳ Iniciando seed de catálogos…");
  await db.exec("BEGIN");

  try {
    // Tipos de lugar
    let insTipos = 0;
    for (const nombre_tipo of TIPOS_LUGAR) {
      const res = await db.run(
        `INSERT OR IGNORE INTO catalogo_tipo_lugar (nombre_tipo) VALUES (?)`,
        nombre_tipo
      );
      if (res.changes) insTipos += res.changes;
    }
    console.log(
      `📍 Tipos de lugar: +${insTipos} insertados, ${TIPOS_LUGAR.length - insTipos} ya existían`
    );

    // Partes del cuerpo
    let insPartes = 0;
    for (const { nombre, categoria } of PARTES_CUERPO) {
      const res = await db.run(
        `INSERT OR IGNORE INTO catalogo_partes_cuerpo (nombre_parte, categoria_principal) VALUES (?, ?)`,
        nombre,
        categoria
      );
      if (res.changes) insPartes += res.changes;
    }
    console.log(
      `🧍 Partes del cuerpo: +${insPartes} insertadas, ${PARTES_CUERPO.length - insPartes} ya existían`
    );

    // Prendas
    let insPrendas = 0;
    for (const { tipo, cat } of PRENDAS) {
      const res = await db.run(
        `INSERT OR IGNORE INTO catalogo_prendas (tipo_prenda, categoria_general) VALUES (?, ?)`,
        tipo,
        cat
      );
      if (res.changes) insPrendas += res.changes;
    }
    console.log(
      `👕 Prendas: +${insPrendas} insertadas, ${PRENDAS.length - insPrendas} ya existían`
    );

    await db.exec("COMMIT");
    console.log("✅ Seed de catálogos finalizado correctamente.");
  } catch (err) {
    console.error("💥 Error durante el seed de catálogos:", err);
    await db.exec("ROLLBACK");
    throw err;
  }
}

/**
 * Permite ejecutar este archivo directamente:
 *   node backend/db/insertCatalogos.js
 */
const isDirectRun =
  process.argv[1] &&
  `file://${path.resolve(process.argv[1])}` === import.meta.url;

if (isDirectRun) {
  insertCatalogos()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
