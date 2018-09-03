#!/usr/bin/php
<?php
$dblocal = new PDO('mysql:host=localhost;dbname=badgeuse', 'root', 'root');
$dbext = new PDO('mysql:host=host;dbname=badgeuse', 'username', 'password');
try {
	$dbext->beginTransaction();
    foreach($dblocal->query('SELECT * from presences') as $row) {
        $req = $dbext->prepare('CALL insert_presence(?, ?, ?)');
        $req->bindParam(1, $row['badge_uid']);
        $req->bindParam(2, $row['salle']);
        $req->bindParam(3, $row['isMatin']);
        $req->execute();
    }
	$dbext->commit();
	$dblocal->query('DELETE FROM presences');
} catch (Exception $e) {
    $dbext->rollBack();
    echo $e;
}
