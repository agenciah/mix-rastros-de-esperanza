import dotenv from 'dotenv';
dotenv.config();

const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:3001';

export function wrapEmailLayout(contentHtml) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Email Simplika</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #f6f8fb;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 6px rgba(0,0,0,0.06);
          }
          .header {
            background-color: #111827;
            padding: 20px;
            text-align: center;
          }
          .header img {
            max-height: 40px;
          }
          .body {
            padding: 30px;
            color: #374151;
            font-size: 15px;
            line-height: 1.6;
          }
          .footer {
            padding: 20px;
            font-size: 12px;
            text-align: center;
            color: #9ca3af;
          }
          a {
            color: #3b82f6;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <!-- La ruta ha sido cambiada a un Content-ID (cid) -->
            <img src="cid:logo_simplika" alt="Simplika Logo" />
          </div>
          <div class="body">
            ${contentHtml}
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Simplika. Todos los derechos reservados.
          </div>
        </div>
      </body>
    </html>
  `;
}
