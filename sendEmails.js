const fs = require('fs');
const mjml = require('mjml');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');

// Leer archivo MJML de comics
const htmlComics = mjml(fs.readFileSync('SalonComic.mjml', 'utf-8')).html;

// Leer archivo MJML de motos
const htmlMotos = mjml(fs.readFileSync('2ruedas.mjml', 'utf-8')).html;

// Configuración de conexión MySQL
const connectionConfig = {
  host: 'localhost',
  user: 'mailer',
  password: 'mailerpass',
  database: 'boletines'
};

// Configurar transporte de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'feria.valencia.mailer@gmail.com',
    pass: 'pxcs rcgf txky cyum'
  }
});

// Función para normalizar texto (elimina tildes y pasa a minúsculas)
function normalizarTexto(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Función principal
async function main() {
  try {
    const connection = await mysql.createConnection(connectionConfig);

    const [suscriptores] = await connection.execute(
      "SELECT nombre, apellidos, correo, gustos FROM suscripciones"
    );

    if (suscriptores.length === 0) {
      console.log('❗ No hay suscriptores en la base de datos.');
      return;
    }

    for (const usuario of suscriptores) {
      const gusto = normalizarTexto(usuario.gustos);

      let asunto = '';
      let html = '';

      if (gusto === 'comics') {
        asunto = '📚 Boletín del Salón del Comic de Valencia';
        html = htmlComics;
      } else if (gusto === 'motos') {
        asunto = '🏍️ Boletín de MotoGP y 2 Ruedas';
        html = htmlMotos;
      } else {
        console.log(`⚠️ Gusto no reconocido para ${usuario.correo}: ${usuario.gustos}`);
        continue;
      }

      const mailOptions = {
        from: '"Feria Valencia" <feria.valencia.mailer@gmail.com>',
        to: usuario.correo,
        subject: asunto,
        html: html
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Correo enviado a: ${usuario.nombre} ${usuario.apellidos} <${usuario.correo}>`);

        // Guardar estado "Enviado"
        await connection.execute(
          'INSERT INTO historial_envios (usuario, nombre, estado) VALUES (?, ?, ?)',
          [usuario.correo, usuario.nombre, 'Enviado']
        );
      } catch (err) {
        console.error(`❌ Error al enviar a ${usuario.correo}:`, err.message);

        // Guardar estado "Fallo"
        await connection.execute(
          'INSERT INTO historial_envios (usuario, nombre, estado) VALUES (?, ?, ?)',
          [usuario.correo, usuario.nombre, 'Fallo']
        );
      }
    }

    await connection.end();
  } catch (err) {
    console.error('⚠️ Error al conectar o consultar la base de datos:', err);
  }
}

main();
