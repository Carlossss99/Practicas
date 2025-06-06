<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$servername = "localhost";
$username = "webuser";
$password = "0000";
$database = "boletines";

$conn = new mysqli($servername, $username, $password, $database);
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $nombre = trim($_POST['nombre'] ?? '');
    $apellidos = trim($_POST['apellidos'] ?? '');
    $correo = trim($_POST['correo'] ?? '');
    $telefono = trim($_POST['telefono'] ?? '');
    $gustos = trim($_POST['gustos'] ?? '');

    $errores = [];
    if (!$nombre) $errores[] = "El nombre es obligatorio.";
    if (!$apellidos) $errores[] = "Los apellidos son obligatorios.";
    if (!$correo || !filter_var($correo, FILTER_VALIDATE_EMAIL)) $errores[] = "Correo inválido.";
    if (!$telefono || !preg_match('/^[0-9]{9}$/', $telefono)) $errores[] = "Teléfono no válido (9 dígitos).";
    if (!$gustos) $errores[] = "Selecciona una opción.";

    if (empty($errores)) {
        $stmt = $conn->prepare("INSERT INTO suscripciones (nombre, apellidos, correo, telefono, gustos) VALUES (?, ?, ?, ?, ?)");
        if ($stmt === false) {
            die("Error en la preparación de la consulta: " . $conn->error);
        }
        $stmt->bind_param("sssss", $nombre, $apellidos, $correo, $telefono, $gustos);
        if ($stmt->execute()) {
            $stmt->close();
            $conn->close();
            header("Location: gracias.html");
            exit();
        } else {
            echo "Error al guardar los datos: " . $stmt->error;
        }
    } else {
        foreach ($errores as $error) {
            echo "<p style='color:red;'>$error</p>";
        }
    }
}

$conn->close();
?>
