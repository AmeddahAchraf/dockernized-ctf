<?php
include 'config.php';

$message = '';
$comments = [];

if ($_POST) {
    $post_id = $_POST['post_id'];
    $author = $_POST['author'];
    $content = $_POST['content'];
    $rating = $_POST['rating'];
    $verified = isset($_POST['verified']) ? 'true' : 'false';
    
    // VULNERABLE: JSON injection in metadata field
    $metadata = '{"rating": ' . $rating . ', "verified": ' . $verified . '}';
    
    // This query is vulnerable to JSON-based SQL injection
    $query = "INSERT INTO comments (post_id, author, content, metadata) VALUES ($post_id, '$author', '$content', '$metadata')";
    
    try {
        $mysqli->query($query);
        $message = "Comment added successfully!";
    } catch (Exception $e) {
        $message = "Error: " . $e->getMessage();
    }
}

// Retrieve comments with JSON extraction
$comments_query = "SELECT id, author, content, JSON_EXTRACT(metadata, '$.rating') as rating, JSON_EXTRACT(metadata, '$.verified') as verified FROM comments ORDER BY id DESC";
$comments_result = $mysqli->query($comments_query);
if ($comments_result) {
    while ($row = $comments_result->fetch_assoc()) {
        $comments[] = $row;
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Comment System - JSON SQLi Challenge</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .form-section { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input[type="text"], input[type="number"], textarea, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .hint { background: #fff3cd; color: #856404; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .success { background: #d4edda; color: #155724; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .error { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .back-link { margin-bottom: 20px; }
        .back-link a { color: #007bff; text-decoration: none; }
        .comment { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .comment-meta { font-size: 12px; color: #666; }
    </style>
</head>
<body>
    
    
    <h2>Challenge 5: JSON-Based SQL Injection</h2>
    
    <div class="hint">
        <strong>Objective:</strong> Extract the flag using JSON-based SQL injection.<br>
        <strong>Concept:</strong> Exploit JSON parsing in SQL queries.<br>
        <strong>Target:</strong> flag_value from flags table where flag_name = 'json_sqli'<br>
        <strong>Hint:</strong> The rating field is parsed as JSON. Try injecting into the JSON structure.<br>
        <strong>Example payload:</strong> 5}, "flag": (SELECT flag_value FROM flags WHERE flag_name='json_sqli'), "extra": {"fake": 1
    </div>
    
    <?php if ($message): ?>
        <div class="success"><?php echo $message; ?></div>
    <?php endif; ?>
    
    <div class="form-section">
        <h3>Add Comment</h3>
        <form method="POST">
            <div class="form-group">
                <label>Post ID:</label>
                <input type="number" name="post_id" value="1" required>
            </div>
            <div class="form-group">
                <label>Author:</label>
                <input type="text" name="author" required>
            </div>
            <div class="form-group">
                <label>Content:</label>
                <textarea name="content" rows="4" required></textarea>
            </div>
            <div class="form-group">
                <label>Rating (1-5):</label>
                <input type="number" name="rating" min="1" max="5" value="5" required>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" name="verified"> Verified Purchase
                </label>
            </div>
            <button type="submit">Add Comment</button>
        </form>
    </div>
    
    <h3>Comments:</h3>
    <?php if (!empty($comments)): ?>
        <?php foreach ($comments as $comment): ?>
            <div class="comment">
                <strong><?php echo htmlspecialchars($comment['author']); ?></strong>
                <div class="comment-meta">Rating: <?php echo $comment['rating']; ?> | Verified: <?php echo $comment['verified']; ?></div>
                <p><?php echo htmlspecialchars($comment['content']); ?></p>
            </div>
        <?php endforeach; ?>
    <?php else: ?>
        <p>No comments found.</p>
    <?php endif; ?>
</body>
</html>
