// backend/utils/emailAliases.js
import dotenv from 'dotenv'
dotenv.config()

export function getFromAlias(tipo = 'notificaciones') {
  switch (tipo) {
    case 'soporte':
      return `"Simplika Soporte" <${process.env.EMAIL_ALIAS_SOPORTE}>`
    case 'contacto':
      return `"Simplika Contacto" <${process.env.EMAIL_ALIAS_CONTACTO}>`
    case 'notificaciones':
    default:
      return `"Simplika" <${process.env.EMAIL_ALIAS_NOTIFICACIONES}>`
  }
}
