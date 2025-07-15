
<?php
include 'config.php';
session_start();

$message = '';
$orders = [];

// Step 1: Register a new user (injection point)
if ($_POST && isset($_POST['register'])) {
    $username = $_POST['reg_username'];
    $email = $_POST['reg_email'];
    
    // VULNERABLE: Store malicious payload in username
    $query = "INSERT INTO users (username, email, password) VALUES ('$username', '$email', 'default123')";
    
    try {
        $mysqli->query($query);
        $message = "User registered successfully!";
    } catch (Exception $e) {
        $message = "Registration failed: " . $e->getMessage();
    }
}

// Step 2: Place an order (where injection triggers)
if ($_POST && isset($_POST['order'])) {
    $user_id = $_POST['user_id'];
    $product_name = $_POST['product_name'];
    $quantity = $_POST['quantity'];
    
    // First, get the username (this is where the injection triggers)
    $user_query = "SELECT username FROM users WHERE id = $user_id";
    $user_result = $mysqli->query($user_query);
    
    if ($user_result && $user_result->num_rows > 0) {
        $user = $user_result->fetch_assoc();
        $username = $user['username'];
        
        // VULNERABLE: Second-order injection - username from database used in query
        $order_query = "INSERT INTO orders (user_id, product_name, quantity) VALUES ($user_id, '$product_name', $quantity)";
        $log_query = "INSERT INTO logs (user_id, action, ip_address) VALUES ($user_id, 'ORDER_PLACED_BY_$username', '127.0.0.1')";
        
        try {
            $mysqli->query($order_query);
            $mysqli->query($log_query);
            $message = "Order placed successfully!";
        } catch (Exception $e) {
            $message = "Order failed: " . $e->getMessage();
        }
    }
}

// Display recent orders
$orders_query = "SELECT o.id, o.product_name, o.quantity, u.username, o.order_date FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.order_date DESC LIMIT 10";
$orders_result = $mysqli->query($orders_query);
if ($orders_result) {
    while ($row = $orders_result->fetch_assoc()) {
        $orders[] = $row;
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Order System - Second Order SQLi Challenge</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .form-section { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input[type="text"], input[type="email"], input[type="number"], select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; }
        .hint { background: #fff3cd; color: #856404; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .success { background: #d4edda; color: #155724; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .error { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .back-link { margin-bottom: 20px; }
        .back-link a { color: #007bff; text-decoration: none; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    
    
    <h2>Challenge 4: Second-Order SQL Injection</h2>
    
    <div class="hint">
        <strong>Objective:</strong> Extract the flag using second-order SQL injection.<br>
        <strong>Concept:</strong> Inject malicious payload in Step 1, trigger it in Step 2.<br>
        <strong>Target:</strong> flag_value from flags table where flag_name = 'second_order'<br>
        <strong>Hint:</strong> Register a user with a malicious username, then place an order with that user.<br>
        <strong>Example payload:</strong> admin',(SELECT flag_value FROM flags WHERE flag_name='second_order'))-- 
    </div>
    
    <?php if ($message): ?>
        <div class="success"><?php echo $message; ?></div>
    <?php endif; ?>
    
    <div class="form-section">
        <h3>Step 1: Register New User</h3>
        <form method="POST">
            <div class="form-group">
                <label>Username:</label>
                <input type="text" name="reg_username" required>
            </div>
            <div class="form-group">
                <label>Email:</label>
                <input type="email" name="reg_email" required>
            </div>
            <button type="submit" name="register">Register User</button>
        </form>
    </div>
    
    <div class="form-section">
        <h3>Step 2: Place Order</h3>
        <form method="POST">
            <div class="form-group">
                <label>User ID:</label>
                <input type="number" name="user_id" min="1" required>
            </div>
            <div class="form-group">
                <label>Product Name:</label>
                <input type="text" name="product_name" required>
            </div>
            <div class="form-group">
                <label>Quantity:</label>
                <input type="number" name="quantity" min="1" required>
            </div>
            <button type="submit" name="order">Place Order</button>
        </form>
    </div>
    
    <h3>Recent Orders:</h3>
    <?php if (!empty($orders)): ?>
        <table>
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Username</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($orders as $order): ?>
                <tr>
                    <td><?php echo $order['id']; ?></td>
                    <td><?php echo htmlspecialchars($order['username']); ?></td>
                    <td><?php echo htmlspecialchars($order['product_name']); ?></td>
                    <td><?php echo $order['quantity']; ?></td>
                    <td><?php echo $order['order_date']; ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php else: ?>
        <p>No orders found.</p>
    <?php endif; ?>
</body>
</html>
