<?php
include 'config.php';

// Simple leaderboard simulation
$leaderboard = [
    ['rank' => 1, 'username' => 'hacker_pro', 'flags' => 6, 'time' => '2h 15m'],
    ['rank' => 2, 'username' => 'sql_ninja', 'flags' => 5, 'time' => '3h 42m'],
    ['rank' => 3, 'username' => 'code_breaker', 'flags' => 4, 'time' => '4h 18m'],
    ['rank' => 4, 'username' => 'cyber_warrior', 'flags' => 3, 'time' => '5h 33m'],
    ['rank' => 5, 'username' => 'bug_hunter', 'flags' => 2, 'time' => '6h 07m'],
];
?>

<!DOCTYPE html>
<html>
<head>
    <title>Leaderboard - SQLi CTF Challenge</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .back-link { margin-bottom: 20px; }
        .back-link a { color: #007bff; text-decoration: none; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; }
        .rank-1 { background-color: #ffd700; }
        .rank-2 { background-color: #c0c0c0; }
        .rank-3 { background-color: #cd7f32; }
        .challenge-status { margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 4px; }
        .flag-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 15px; }
        .flag-item { padding: 10px; border: 1px solid #ddd; border-radius: 4px; text-align: center; }
        .flag-found { background-color: #d4edda; color: #155724; }
        .flag-pending { background-color: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    
    
    <h2>🏆 Leaderboard</h2>
    
    <table>
        <thead>
            <tr>
                <th>Rank</th>
                <th>Username</th>
                <th>Flags Captured</th>
                <th>Total Time</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($leaderboard as $entry): ?>
            <tr class="<?php echo $entry['rank'] <= 3 ? 'rank-' . $entry['rank'] : ''; ?>">
                <td><?php echo $entry['rank']; ?></td>
                <td><?php echo $entry['username']; ?></td>
                <td><?php echo $entry['flags']; ?>/6</td>
                <td><?php echo $entry['time']; ?></td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
    
    <div class="challenge-status">
        <h3>Challenge Status</h3>
        <p>Track your progress through all SQL injection challenges:</p>
        
        <div class="flag-list">
            <div class="flag-item flag-pending">
                <strong>Classic SQLi</strong><br>
                <small>Authentication Bypass</small>
            </div>
            <div class="flag-item flag-pending">
                <strong>Union SQLi</strong><br>
                <small>Data Extraction</small>
            </div>
            <div class="flag-item flag-pending">
                <strong>Blind SQLi</strong><br>
                <small>Time-Based</small>
            </div>
            <div class="flag-item flag-pending">
                <strong>Second-Order</strong><br>
                <small>Stored Injection</small>
            </div>
            <div class="flag-item flag-pending">
                <strong>JSON SQLi</strong><br>
                <small>Modern Technique</small>
            </div>
            <div class="flag-item flag-pending">
                <strong>Error-Based</strong><br>
                <small>Information Disclosure</small>
            </div>
        </div>
    </div>
</body>
</html>
