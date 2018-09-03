#!/usr/bin/php
<?php
$dblocal = new PDO('mysql:host=localhost;dbname=badgeuse', 'root', 'root');
$dbext = new PDO('mysql:host=host;dbname=badgeuse', 'username', 'password');
try {
    foreach($dbext->query('SELECT * from eleves') as $row) {
        $req = $dblocal->prepare('INSERT INTO eleves(id, name, surname, promotion) values(?, ?, ?, ?)');
        $req->bindParam(1, $row['id']);
        $req->bindParam(2, $row['name']);
        $req->bindParam(3, $row['surname']);
        $req->bindParam(4, $row['promotion']);
        $req->execute();
    }
} catch (Exception $e) {
    $dbext->rollBack();
}
