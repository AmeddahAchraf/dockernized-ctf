<?php
session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SQLi CTF Challenge</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .challenge-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .challenge-card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: #f9f9f9; }
        .challenge-card h3 { margin-top: 0; color: #333; }
        .difficulty { padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .easy { background: #4CAF50; color: white; }
        .medium { background: #FF9800; color: white; }
        .hard { background: #F44336; color: white; }
        .expert { background: #9C27B0; color: white; }
        .nav { margin-bottom: 20px; }
        .nav a { margin-right: 15px; text-decoration: none; color: #007bff; }
        .nav a:hover { text-decoration: underline; }
        .flag-submit { margin-top: 15px; }
        .flag-submit input { padding: 8px; margin-right: 10px; border: 1px solid #ddd; border-radius: 4px; }
        .flag-submit button { padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .alert { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔥 Advanced SQL Injection CTF Challenge 🔥</h1>
            <p>Master all types of SQL injection vulnerabilities - from classic to cutting-edge techniques!</p>
        </div>

        <div class="nav">
            <a href="index.php">Home</a>
            <a href="login.php">Login Challenge</a>
            <a href="search.php">Search Challenge</a>
            <a href="blind.php">Blind SQLi</a>
            <a href="second_order.php">Second Order</a>
            <a href="json.php">JSON SQLi</a>
            <a href="error.php">Error-Based</a>
            <a href="leaderboard.php">Leaderboard</a>
        </div>

        <div class="challenge-grid">
            <div class="challenge-card">
                <h3>1. Classic Authentication Bypass <span class="difficulty easy">EASY</span></h3>
                <p>Bypass login authentication using classic SQL injection techniques.</p>
                <p><strong>Target:</strong> <a href="login.php">Login Form</a></p>
                <p><strong>Hint:</strong> Sometimes the simplest approaches work best...</p>
                <div class="flag-submit">
                    <input type="text" placeholder="Enter flag" id="flag1">
                    <button onclick="submitFlag(1)">Submit</button>
                </div>
            </div>

            <div class="challenge-card">
                <h3>2. Union-Based Data Extraction <span class="difficulty medium">MEDIUM</span></h3>
                <p>Extract sensitive data using UNION SELECT statements.</p>
                <p><strong>Target:</strong> <a href="search.php">Product Search</a></p>
                <p><strong>Hint:</strong> Union makes strength, but you need to know the right columns...</p>
                <div class="flag-submit">
                    <input type="text" placeholder="Enter flag" id="flag2">
                    <button onclick="submitFlag(2)">Submit</button>
                </div>
            </div>

            <div class="challenge-card">
                <h3>3. Blind Time-Based Injection <span class="difficulty hard">HARD</span></h3>
                <p>Extract data when no direct output is visible using time delays.</p>
                <p><strong>Target:</strong> <a href="blind.php">User Profile</a></p>
                <p><strong>Hint:</strong> Time is of the essence... SLEEP() might help.</p>
                <div class="flag-submit">
                    <input type="text" placeholder="Enter flag" id="flag3">
                    <button onclick="submitFlag(3)">Submit</button>
                </div>
            </div>

            <div class="challenge-card">
                <h3>4. Second-Order SQL Injection <span class="difficulty hard">HARD</span></h3>
                <p>Exploit injection that triggers in a different context than where it's injected.</p>
                <p><strong>Target:</strong> <a href="second_order.php">Order System</a></p>
                <p><strong>Hint:</strong> What you plant today may bloom tomorrow...</p>
                <div class="flag-submit">
                    <input type="text" placeholder="Enter flag" id="flag4">
                    <button onclick="submitFlag(4)">Submit</button>
                </div>
            </div>

            <div class="challenge-card">
                <h3>5. JSON-Based SQL Injection <span class="difficulty expert">EXPERT</span></h3>
                <p>Modern injection technique targeting JSON data handling.</p>
                <p><strong>Target:</strong> <a href="json.php">Comment System</a></p>
                <p><strong>Hint:</strong> JSON might be parsed differently than you think...</p>
                <div class="flag-submit">
                    <input type="text" placeholder="Enter flag" id="flag5">
                    <button onclick="submitFlag(5)">Submit</button>
                </div>
            </div>

            <div class="challenge-card">
                <h3>6. Error-Based Information Disclosure <span class="difficulty medium">MEDIUM</span></h3>
                <p>Extract information through detailed error messages.</p>
                <p><strong>Target:</strong> <a href="error.php">Error Reporter</a></p>
                <p><strong>Hint:</strong> Sometimes errors tell you more than success...</p>
                <div class="flag-submit">
                    <input type="text" placeholder="Enter flag" id="flag6">
                    <button onclick="submitFlag(6)">Submit</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        function submitFlag(challengeId) {
            const flag = document.getElementById('flag' + challengeId).value;
            // This would typically send to a server endpoint
            alert('Flag submitted: ' + flag + ' for challenge ' + challengeId);
        }

        function submitMasterFlag() {
            const flag = document.getElementById('master_flag').value;
            alert('Master flag submitted: ' + flag);
        }
    </script>
</body>
</html>
