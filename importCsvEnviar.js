const fs = require('fs');
const csv = require('csv-parser');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const mjml2html = require('mjml');

async function main() {
  // Conexión a la base de datos nueva
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'mailer',
    password: 'mailerpass',       // pon tu contraseña
    database: 'clientes_csv'
  });

  // Primero leemos el CSV y guardamos en base de datos
  const resultados = [];
  fs.createReadStream('suscriptores.csv')  // nombre archivo CSV que tengas
    .pipe(csv())
    .on('data', (data) => resultados.push(data))
    .on('end', async () => {
      console.log('CSV leído. Insertando en BD...');

      // Insertamos cada fila en la tabla
      for (const fila of resultados) {
        const { nombre, apellidos, correo, telefono, gustos } = fila;
        try {
          await db.execute(
            'INSERT INTO suscriptores_csv (nombre, apellidos, correo, telefono, gustos) VALUES (?, ?, ?, ?, ?)',
            [nombre, apellidos, correo, telefono, gustos]
          );
        } catch (err) {
          console.error('Error insertando:', err);
        }
      }
      console.log('Inserción terminada.');

      // Ahora leemos los suscriptores para enviar correos
      try {
        const [usuarios] = await db.execute('SELECT * FROM suscriptores_csv WHERE gustos = "Cómics"');

        if (usuarios.length === 0) {
          console.log('No hay usuarios con gustos en Cómics para enviar correo.');
          return;
        }

        // Leemos el archivo MJML para convertirlo a HTML
        const mjmlTemplate = fs.readFileSync('SalonComic.mjml', 'utf8');
        const htmlOutput = mjml2html(mjmlTemplate);

        // Configuración nodemailer con Gmail
        let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'feria.valencia.mailer@gmail.com',
            pass: 'pxcs rcgf txky cyum'  // contraseña de aplicación
          }
        });

        // Enviamos un correo a cada usuario
        for (const usuario of usuarios) {
          const mailOptions = {
            from: '"Feria Valencia" <feria.valencia.mailer@gmail.com>',
            to: usuario.correo,
            subject: 'Boletín Salón del Cómic - Valencia 2025',
            html: htmlOutput.html
          };

          try {
            await transporter.sendMail(mailOptions);
            console.log(`Correo enviado a: ${usuario.correo}`);
          } catch (err) {
            console.error(`Error enviando correo a ${usuario.correo}:`, err);
          }
        }

      } catch (err) {
        console.error('Error leyendo usuarios o enviando correos:', err);
      }

      await db.end();
    });
}

main();
