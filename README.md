# Badgeuse

Ce projet vise à numériser le système de présence du CESI.

## Installation

```shell
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install build-essential screen python-dev python-smbus python-pip python-mysql.connector screen git php-cli php-mysql -y
sudo pip install RPi.GPIO requests
git clone https://github.com/lthiery/SPI-Py
cd SPI-Py
sudo python setup.py install
cd
git clone https://github.com/adafruit/Adafruit_Python_CharLCD
cd Adafruit_Python_CharLCD
sudo python setup.py install
cd
git clone https://github.com/Itega/badgeuse
chmod +x /home/pi/badgeuse/lcd_write
echo '
device_tree_param=spi=on
dtoverlay=spi-bcm2708' >> /boot/config.txt
```

### Configuration de la BDD

```shell
sudo mysql -u root <<-EOF
UPDATE mysql.user SET Password=PASSWORD('root') WHERE User='root';
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
DELETE FROM mysql.user WHERE User='';
DELETE FROM mysql.db WHERE Db='test' OR Db='test_%';
CREATE DATABASE badgeuse;
FLUSH PRIVILEGES;

DELIMITER |
CREATE PROCEDURE insert_presence(IN uid VARCHAR(255), IN salle VARCHAR(255), IN isMatin TINYINT(1))
  BEGIN
    IF NOT EXISTS (SELECT badge_uid,salle,date,isMatin FROM presences WHERE (presences.badge_uid=uid AND presences.salle=salle AND presences.date=CURDATE() AND presences.isMatin=isMatin))
    THEN
       INSERT INTO presences(badge_uid, salle, date, isMatin)
       VALUES(uid, salle, CURDATE(), isMatin);
      END IF;
  END|

CREATE PROCEDURE uid_lookup(IN uid VARCHAR(255), OUT name VARCHAR(255), OUT surname VARCHAR(255))
  BEGIN
    SELECT eleves.name, eleves.surname 
    INTO name, surname 
    FROM eleves 
    WHERE eleves.id IN (
      SELECT badges.eleve_id 
      FROM badges 
      WHERE badges.uid = uid
    );
  END|

CREATE PROCEDURE user_whout_badge(IN promo VARCHAR(255), OUT id INT(10), OUT name VARCHAR(255), OUT surname VARCHAR(255))
  BEGIN
    SELECT eleves.id,eleves.name,eleves.surname
    INTO id,name,surname
    FROM eleves
    WHERE eleves.id NOT IN(SELECT eleves.id
        FROM eleves JOIN badges ON eleves.id = badges.eleve_id
        WHERE (eleves.id = badges.eleve_id)) AND eleves.promotion = promo
    LIMIT 1;
   END|

CREATE PROCEDURE add_badge(IN id_eleve INT(10),IN uid VARCHAR(191))
	BEGIN
		INSERT INTO badges(uid,eleve_id)
		VALUES(uid,id_eleve);
	END|
DELIMITER;
EOF
```

## Branchements à effectuer
Pour savoir à quel pin correspond chaque nombre, utiliser <https://pinout.xyz/>


Pour le RC522 :

| RC522 | Pi   |
|-------|------|
| SDA   | 24   |
| SCK   | 23   |
| MOSI  | 19   |
| MISO  | 21   |
| GND   | GND  |
| RST   | 22   |
| 3.3v  | 3.3V |

Pour l'écran LCD :

| LCD  | Pi  | Commentaires                                                                                  |
|------|-----|-----------------------------------------------------------------------------------------------|
| RS   | 36  |                                                                                               |
| EN   | 37  |                                                                                               |
| D4   | 32  |                                                                                               |
| D5   | 11  |                                                                                               |
| D6   | 12  |                                                                                               |
| D7   | 13  |                                                                                               |
| VSS  | GND |                                                                                               |
| VCC  | 5V  |                                                                                               |
| R/W  | GND |                                                                                               |
| VEE  | 5V  | Permet de régler le contraste, il faut ajouter une résistance ou un potentiomètre entre deux. |
| LED+ | 5V  | Penser à vérifier que l'écran intègre déjà une résistance.                                    |
| LED- | GND |                                                                                               |

## Lancer le programme

```shell
sudo python /home/pi/badgeuse/badgeuse.py
```

Une fois le programme lancé, à chaque fois qu'un badge est scanné son UID sera affiché. Vous pouvez ensuite entrer cet UID dans la base de données pour l'associer à un badge.

## Liens

- Librairie utilisé pour le RC522 : https://github.com/mxgxw/MFRC522-python
- Librairie utilisé pour l'écran LCD : https://github.com/adafruit/Adafruit_Python_CharLCD
- Documentation et cablage du LCD : http://www.circuitstoday.com/interfacing-16x2-lcd-with-8051


- Pour toutes informations supplémentaires, vous pouvez me contacter à julien.zolli@viacesi.fr


## License

[Distributed under the AGPL v3 license](https://github.com/Itega/badgeuse/blob/master/LICENSE)


