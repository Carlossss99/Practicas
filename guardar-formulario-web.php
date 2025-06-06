<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$servername = "localhost";
$username = "root";
$password = "0000";
$dbname = "suscriptores_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Sanear datos recibidos
    $nombre = isset($_POST["nombre"]) ? trim($_POST["nombre"]) : '';
    $apellido1 = isset($_POST["apellido1"]) ? trim($_POST["apellido1"]) : '';
    $apellido2 = isset($_POST["apellido2"]) ? trim($_POST["apellido2"]) : '';
    $telefono = isset($_POST["telefono"]) ? trim($_POST["telefono"]) : '';
    $email = isset($_POST["email"]) ? trim($_POST["email"]) : '';
    $ciudad = isset($_POST["ciudad"]) ? trim($_POST["ciudad"]) : '';
    $poblacion = isset($_POST["poblacion"]) ? trim($_POST["poblacion"]) : '';
    $direccion = isset($_POST["direccion"]) ? trim($_POST["direccion"]) : '';


    $sql = "INSERT INTO suscriptores (nombre, apellido1, apellido2, telefono, email, ciudad, poblacion, direccion) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        die("Error en prepare: " . $conn->error);
    }

    $stmt->bind_param("ssssssss", $nombre, $apellido1, $apellido2, $telefono, $email, $ciudad, $poblacion, $direccion);

    if ($stmt->execute()) {
        header("Location: gracias.html");
        exit();
    } else {
        echo "Error al guardar en la base de datos: " . $stmt->error;
    }

    $stmt->close();
}
$conn->close();
?>
