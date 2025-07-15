<?php
include 'config.php';

$results = [];
$error = '';

if (isset($_GET['q'])) {
    $search = $_GET['q'];
    
    // VULNERABLE: Direct string concatenation - Union-based SQL Injection
    $query = "SELECT name, description, price FROM products WHERE name LIKE '%$search%' OR description LIKE '%$search%'";
    
    try {
        $result = $mysqli->query($query);
        
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $results[] = $row;
            }
        }
    } catch (Exception $e) {
        $error = "Database error: " . $e->getMessage();
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Product Search - Union SQLi Challenge</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .search-box { margin-bottom: 20px; }
        .search-box input { width: 70%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        .search-box button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .product { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .hint { background: #fff3cd; color: #856404; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .error { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .back-link { margin-bottom: 20px; }
        .back-link a { color: #007bff; text-decoration: none; }
    </style>
</head>
<body>
    
    
    <h2>Challenge 2: Union-Based Data Extraction</h2>
    
    <div class="hint">
        <strong>Objective:</strong> Extract the flag from the flags table using UNION SELECT.<br>
        <strong>Hint:</strong> The current query selects 3 columns (name, description, price). You need to match this structure.<br>
        <strong>Tables available:</strong> products, users, flags, orders, logs, comments<br>
        <strong>Flag location:</strong> flags table, flag_value column where flag_name = 'union_sqli'
    </div>
    
    <?php if ($error): ?>
        <div class="error"><?php echo $error; ?></div>
    <?php endif; ?>
    
    <div class="search-box">
        <form method="GET">
            <input type="text" name="q" placeholder="Search products..." value="<?php echo htmlspecialchars($_GET['q'] ?? ''); ?>">
            <button type="submit">Search</button>
        </form>
    </div>
    
    <?php if (!empty($results)): ?>
        <h3>Search Results:</h3>
        <?php foreach ($results as $product): ?>
            <div class="product">
                <h4><?php echo htmlspecialchars($product['name']); ?></h4>
                <p><?php echo htmlspecialchars($product['description']); ?></p>
                <p><strong>Price:</strong> $<?php echo htmlspecialchars($product['price']); ?></p>
            </div>
        <?php endforeach; ?>
    <?php endif; ?>
    
    <div style="margin-top: 20px; font-size: 12px; color: #666;">
        <strong>Debug Info:</strong><br>
        Query: <?php echo isset($query) ? $query : 'No query executed'; ?>
    </div>
</body>
</html>

