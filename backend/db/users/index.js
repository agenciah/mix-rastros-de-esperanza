// Archivo: db/users/index.js

// Init DB
import {
  openDb,
  ensureTableExists,
  ensurePagosTable,
  ensureFacturasServicioTable,
  ensureAdminsTable,
  ensureMensajesTable,
  ensureMensajesReporteTable,
  ensureMensajesAdministradorTable
} from './initDb.js';

// Core
import {
  findUserByEmail,
  findUserByPhone,
  findUserById,
  createUser,
  updateUserConfirmationToken,
  updateUserRole,
  updateUserPassword,
  updateUserProfile,
  updateUserState,
  updateUserSubscription,
  updateUserLocation,
  updateUserUltimaConexion,
  updateUserNumeroReferencia
} from './core.js';

import { insertCatalogos } from './insertCatalogos.js';

// Fichas
import {
  ensureFichasTables
} from './initFichasDb.js';

// Exportar todo
export {
  // DB
  openDb,
  ensureTableExists,
  ensurePagosTable,
  ensureFacturasServicioTable,
  ensureAdminsTable,
  ensureMensajesTable,
  ensureMensajesReporteTable,
  ensureMensajesAdministradorTable,

  // Usuarios
  findUserByEmail,
  findUserByPhone,
  findUserById,
  createUser,
  updateUserConfirmationToken,
  updateUserRole,
  updateUserPassword,
  updateUserProfile,
  updateUserState,
  updateUserSubscription,
  updateUserLocation,
  updateUserUltimaConexion,
  updateUserNumeroReferencia,

  // Fichas
  ensureFichasTables,

  insertCatalogos
};
