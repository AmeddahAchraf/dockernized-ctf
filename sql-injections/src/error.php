<?php
include 'config.php';

$message = '';
$error = '';

if (isset($_GET['report_id'])) {
    $report_id = $_GET['report_id'];
    
    // VULNERABLE: Error-based SQL injection with detailed error messages
    $query = "SELECT * FROM logs WHERE id = $report_id AND (SELECT COUNT(*) FROM logs WHERE user_id = (SELECT user_id FROM logs WHERE id = $report_id)) > 0";
    
    try {
        $result = $mysqli->query($query);
        
        if ($result && $result->num_rows > 0) {
            $log = $result->fetch_assoc();
            $message = "Report found: " . $log['action'] . " by user " . $log['user_id'];
        } else {
            $message = "Report not found or no access";
        }
    } catch (Exception $e) {
        // VULNERABLE: Detailed error messages leak information
        $error = "Database Error: " . $e->getMessage() . "\nQuery: " . $query;
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Error Reporter - Error-Based SQLi Challenge</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input[type="number"] { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .hint { background: #fff3cd; color: #856404; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .success { background: #d4edda; color: #155724; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .error { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin: 10px 0; white-space: pre-wrap; }
        .back-link { margin-bottom: 20px; }
        .back-link a { color: #007bff; text-decoration: none; }
    </style>
</head>
<body>
    
    
    <h2>Challenge 6: Error-Based Information Disclosure</h2>
    
    <div class="hint">
        <strong>Objective:</strong> Extract the flag using error-based SQL injection.<br>
        <strong>Concept:</strong> Force database errors that reveal information.<br>
        <strong>Target:</strong> flag_value from flags table where flag_name = 'error_sqli'<br>
        <strong>Hint:</strong> Use functions like EXTRACTVALUE(), UPDATEXML(), or subquery errors.<br>
        <strong>Example payload:</strong> 1 AND EXTRACTVALUE(1, CONCAT('~', (SELECT flag_value FROM flags WHERE flag_name='error_sqli')))
    </div>
    
    <?php if ($message): ?>
        <div class="success"><?php echo $message; ?></div>
    <?php endif; ?>
    
    <?php if ($error): ?>
        <div class="error"><?php echo $error; ?></div>
    <?php endif; ?>
    
    <form method="GET">
        <div class="form-group">
            <label>Report ID:</label>
            <input type="number" name="report_id" min="1" value="<?php echo htmlspecialchars($_GET['report_id'] ?? ''); ?>">
        </div>
        <button type="submit">View Report</button>
    </form>
    
    <div style="margin-top: 20px; font-size: 12px; color: #666;">
        <strong>Available report IDs:</strong> 1, 2, 3<br>
        <strong>Debug Info:</strong> Detailed error messages are enabled for this challenge.
    </div>
</body>
</html>
