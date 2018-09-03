#!/usr/bin/php
<?php
$dblocal = new PDO('mysql:host=localhost;dbname=badgeuse', 'root', 'root');
$dbext = new PDO('mysql:host=host;dbname=badgeuse', 'username', 'password');
try {
    foreach($dbext->query('SELECT * from badges') as $row) {
        $req = $dblocal->prepare('INSERT INTO badges(uid, eleve_id) values(?, ?)');
        $req->bindParam(1, $row['uid']);
        $req->bindParam(2, $row['eleve_id']);
        $req->execute();
    }
} catch (Exception $e) {
    $dbext->rollBack();
}

