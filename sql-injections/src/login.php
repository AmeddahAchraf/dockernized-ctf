<?php
include 'config.php';
session_start();

$message = '';
$error = '';

if ($_POST) {
    $username = $_POST['username'];
    $password = $_POST['password'];
    
    // VULNERABLE: Direct string concatenation - Classic SQL Injection
    $query = "SELECT * FROM users WHERE username = '$username' AND password = '$password'";
    
    $result = $mysqli->query($query);
    
    if ($result && $result->num_rows > 0) {
        $user = $result->fetch_assoc();
        $_SESSION['user'] = $user;
        
        if ($user['role'] === 'admin') {
            $message = "Welcome admin! Here's your flag: CTF{cl4ss1c_sql_1nj3ct10n_m4st3r}";
        } else {
            $message = "Welcome " . $user['username'] . "! You need admin access for the flag.";
        }
    } else {
        $error = "Invalid credentials!";
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Login Challenge</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input[type="text"], input[type="password"] { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .alert { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .hint { background: #fff3cd; color: #856404; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .back-link { margin-bottom: 20px; }
        .back-link a { color: #007bff; text-decoration: none; }
    </style>
</head>
<body>
    
    
    <h2>Challenge 1: Classic Authentication Bypass</h2>
    
    <div class="hint">
        <strong>Hint:</strong> Try logging in as admin. What happens if you manipulate the SQL query?<br>
        <strong>Example usernames:</strong> admin, user1, guest<br>
        <strong>Payload hint:</strong> Think about how to make the WHERE clause always true...
    </div>
    
    <?php if ($message): ?>
        <div class="alert success"><?php echo $message; ?></div>
    <?php endif; ?>
    
    <?php if ($error): ?>
        <div class="alert error"><?php echo $error; ?></div>
    <?php endif; ?>
    
    <form method="POST">
        <div class="form-group">
            <label>Username:</label>
            <input type="text" name="username" required>
        </div>
        <div class="form-group">
            <label>Password:</label>
            <input type="password" name="password" required>
        </div>
        <button type="submit">Login</button>
    </form>
    
    <div style="margin-top: 20px; font-size: 12px; color: #666;">
        <strong>Debug Info (for CTF purposes):</strong><br>
        Last query: <?php echo isset($query) ? $query : 'No query executed'; ?>
    </div>
</body>
</html>

