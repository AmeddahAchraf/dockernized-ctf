<?php
// Database configuration
$host = $_ENV['DB_HOST'] ?? 'localhost';
$dbname = $_ENV['DB_NAME'] ?? 'ctf_db';
$username = $_ENV['DB_USER'] ?? 'ctf_user';
$password = $_ENV['DB_PASS'] ?? 'ctf_password';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}

// Vulnerable MySQLi connection for some challenges
$mysqli = new mysqli($host, $username, $password, $dbname);
if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}

// Known flags for validation
$flags = [
    'classic_sqli' => 'CTF{cl4ss1c_sql_1nj3ct10n_m4st3r}',
    'union_sqli' => 'CTF{un10n_s3l3ct_h4ck3r_pr0}',
    'blind_sqli' => 'CTF{bl1nd_t1m3_b4s3d_n1nj4}',
    'second_order' => 'CTF{s3c0nd_0rd3r_1nj3ct10n_3xp3rt}',
    'json_sqli' => 'CTF{j50n_sql_1nj3ct10n_w1z4rd}',
    'error_sqli' => 'CTF{3rr0r_b4s3d_1nf0rm4t10n_l34k}',
    'master_flag' => 'CTF{sql_1nj3ct10n_gr4ndm4st3r_2024}'
];
?>
