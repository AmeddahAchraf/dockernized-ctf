<?php
include 'config.php';

$message = '';
$start_time = microtime(true);

if (isset($_GET['user_id'])) {
    $user_id = $_GET['user_id'];
    
    // VULNERABLE: Blind SQL Injection with time-based detection
    $query = "SELECT username, email FROM users WHERE id = $user_id";
    
    try {
        $result = $mysqli->query($query);
        
        if ($result && $result->num_rows > 0) {
            $user = $result->fetch_assoc();
            $message = "User found: " . $user['username'] . " (" . $user['email'] . ")";
        } else {
            $message = "User not found";
        }
    } catch (Exception $e) {
        $message = "An error occurred";
    }
}

$end_time = microtime(true);
$execution_time = round(($end_time - $start_time) * 1000, 2);
?>

<!DOCTYPE html>
<html>
<head>
    <title>User Profile - Blind SQLi Challenge</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input[type="number"] { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .result { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .hint { background: #fff3cd; color: #856404; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .back-link { margin-bottom: 20px; }
        .back-link a { color: #007bff; text-decoration: none; }
        .timing { font-size: 12px; color: #666; margin-top: 10px; }
    </style>
</head>
<body>
    
    
    <h2>Challenge 3: Blind Time-Based SQL Injection</h2>
    
    <div class="hint">
        <strong>Objective:</strong> Extract the flag using time-based blind injection.<br>
        <strong>Hint:</strong> Use SLEEP() function to create delays when conditions are true. There are 27 chars<br>
        <strong>Target:</strong> flag_value from flags table where flag_name = 'blind_sqli'<br>
        <strong>Payload example:</strong> 1 AND IF(SUBSTRING((SELECT flag_value FROM flags WHERE flag_name='blind_sqli'),1,1)='C',SLEEP(3),0)
    </div>
    
    <form method="GET">
        <div class="form-group">
            <label>User ID:</label>
            <input type="text" name="user_id" min="1" value="<?php echo htmlspecialchars($_GET['user_id'] ?? ''); ?>">
        </div>
        <button type="submit">Get User Profile</button>
    </form>
    
    <?php if ($message): ?>
        <div class="result">
            <?php echo $message; ?>
            <div class="timing">Execution time: <?php echo $execution_time; ?>ms</div>
        </div>
    <?php endif; ?>
    
    <div style="margin-top: 20px; font-size: 12px; color: #666;">
        <strong>Debug Info:</strong><br>
        Query: <?php echo isset($query) ? $query : 'No query executed'; ?><br>
        <strong>Available user IDs:</strong> 1, 2, 3, 4
    </div>
</body>
</html>
