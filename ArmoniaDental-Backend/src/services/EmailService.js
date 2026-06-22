import nodemailer from "nodemailer";

const validarConfiguracionCorreo = () => {
  const variablesObligatorias = [
    "EMAIL_HOST",
    "EMAIL_PORT",
    "EMAIL_USER",
    "EMAIL_PASSWORD",
  ];

  const faltantes = variablesObligatorias.filter(
    (variable) => !process.env[variable]
  );

  if (faltantes.length > 0) {
    throw new Error(
      `Faltan variables de correo en el .env: ${faltantes.join(", ")}`
    );
  }
};

const crearTransportador = () => {
  validarConfiguracionCorreo();

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const escaparHTML = (valor = "") => {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

/*
 * Comprueba que Gmail y la contraseña de aplicación
 * estén configurados correctamente.
 */
export const verificarConexionCorreo = async () => {
  const transportador = crearTransportador();

  await transportador.verify();

  return true;
};

/*
 * Envía el enlace para restablecer la contraseña.
 */
export const enviarCorreoRecuperacion = async ({
  destinatario,
  nombre,
  enlaceRecuperacion,
  minutosExpiracion = 20,
}) => {
  const transportador = crearTransportador();

  const nombreSeguro = escaparHTML(nombre || "usuario");
  const enlaceSeguro = escaparHTML(enlaceRecuperacion);

  const remitenteNombre =
    process.env.EMAIL_FROM_NAME || "Armonía Dental";

  const asunto = "Restablece tu contraseña de Armonía Dental";

  const textoPlano = `
Hola ${nombre || "usuario"}:

Recibimos una solicitud para restablecer la contraseña de tu cuenta de Armonía Dental.

Abre el siguiente enlace:

${enlaceRecuperacion}

Este enlace vencerá en ${minutosExpiracion} minutos.

Si no solicitaste este cambio, puedes ignorar este mensaje.
  `.trim();

  const contenidoHTML = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Restablecer contraseña</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #f9f9ff;
          font-family: Arial, Helvetica, sans-serif;
          color: #151c27;
        "
      >
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="background-color: #f9f9ff; padding: 32px 16px;"
        >
          <tr>
            <td align="center">
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  max-width: 560px;
                  background-color: #ffffff;
                  border: 1px solid #bec8ce;
                  border-radius: 18px;
                  overflow: hidden;
                "
              >
                <tr>
                  <td
                    align="center"
                    style="
                      background-color: #006686;
                      padding: 28px 24px;
                      color: #ffffff;
                    "
                  >
                    <div style="font-size: 38px; margin-bottom: 8px;">
                      ꨄ︎
                    </div>

                    <h1
                      style="
                        margin: 0;
                        font-size: 24px;
                        font-weight: 700;
                      "
                    >
                      Armonía Dental
                    </h1>

                    <p
                      style="
                        margin: 6px 0 0;
                        font-size: 13px;
                        color: #d8f4fb;
                      "
                    >
                      Sistema de gestión clínica
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 32px;">
                    <h2
                      style="
                        margin: 0 0 16px;
                        font-size: 21px;
                        color: #151c27;
                      "
                    >
                      Restablecer contraseña
                    </h2>

                    <p
                      style="
                        margin: 0 0 14px;
                        font-size: 15px;
                        line-height: 1.6;
                        color: #3f484e;
                      "
                    >
                      Hola, <strong>${nombreSeguro}</strong>.
                    </p>

                    <p
                      style="
                        margin: 0 0 24px;
                        font-size: 15px;
                        line-height: 1.6;
                        color: #3f484e;
                      "
                    >
                      Recibimos una solicitud para cambiar la contraseña
                      de tu cuenta. Presiona el siguiente botón para
                      crear una nueva.
                    </p>

                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                    >
                      <tr>
                        <td align="center">
                          <a
                            href="${enlaceSeguro}"
                            style="
                              display: inline-block;
                              padding: 13px 26px;
                              background-color: #006686;
                              color: #ffffff;
                              text-decoration: none;
                              border-radius: 999px;
                              font-size: 14px;
                              font-weight: 700;
                            "
                          >
                            Cambiar mi contraseña
                          </a>
                        </td>
                      </tr>
                    </table>

                    <div
                      style="
                        margin-top: 26px;
                        padding: 15px;
                        background-color: #f0f3ff;
                        border-radius: 12px;
                        font-size: 13px;
                        line-height: 1.5;
                        color: #3f484e;
                      "
                    >
                      Este enlace vencerá en
                      <strong>${minutosExpiracion} minutos</strong>.
                    </div>

                    <p
                      style="
                        margin: 24px 0 8px;
                        font-size: 12px;
                        line-height: 1.5;
                        color: #687078;
                      "
                    >
                      Si el botón no funciona, copia y pega este enlace
                      en tu navegador:
                    </p>

                    <p
                      style="
                        margin: 0;
                        font-size: 11px;
                        line-height: 1.5;
                        color: #006686;
                        word-break: break-all;
                      "
                    >
                      ${enlaceSeguro}
                    </p>

                    <p
                      style="
                        margin: 26px 0 0;
                        font-size: 12px;
                        line-height: 1.5;
                        color: #687078;
                      "
                    >
                      Si no solicitaste este cambio, puedes ignorar el
                      mensaje. Tu contraseña actual continuará funcionando.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td
                    align="center"
                    style="
                      padding: 18px 24px;
                      border-top: 1px solid #e4e8eb;
                      font-size: 11px;
                      color: #687078;
                    "
                  >
                    © 2026 Armonía Dental · Todos los derechos reservados
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const resultado = await transportador.sendMail({
    from: `"${remitenteNombre}" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: asunto,
    text: textoPlano,
    html: contenidoHTML,
  });

  return {
    messageId: resultado.messageId,
    accepted: resultado.accepted,
    rejected: resultado.rejected,
  };
};