const {LcdConfig} = require('./config');
const rc522 = require("node-mfrc522");
const sqlite3 = require('sqlite3');
sqlite3.verbose();//TODO REMOVE
const Lcd = require('lcd');
const helpers = require('./helpers');

const lcd = new Lcd(LcdConfig);
lcd.once('ready', ()=> {
    helpers.initLcd(lcd);
});


const db = new sqlite3.Database('/home/pi/badgeuse.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error(err.message);
    }
    db.serialize(() => {
        db.run('CREATE TABLE IF NOT EXISTS badges (uid TEXT PRIMARY KEY, person_id UNSIGNED INTEGER)');
        db.run('CREATE TABLE IF NOT EXISTS presences (id INTEGER PRIMARY KEY AUTOINCREMENT, person_id UNSIGNED INTEGER, datetime TEXT, salle TEXT)');
        db.run('CREATE TABLE IF NOT EXISTS people (id INTEGER PRIMARY KEY, name TEXT, surname TEXT)');
    });

    helpers.initDb(db);
});

let locked = false;

const onData = uid => {
    if(!locked) {
        console.log(uid)
        helpers.getPersonFromUid(uid).then(person => {
            if(!person.name && person.uid){
                const badge = person;
                person = badge.person;

                helpers.insertNewPerson(badge);
            }

            helpers.success(person);
        }).catch((err) => {
            helpers.failed();
        });
        locked = true;
        setTimeout(()=>{locked = false}, 1000)
    }
};

const onExit = exitCode => {
    console.log('Exit code : ' + exitCode)
};

rc522(onData, onExit);

// db.close((err) => {
//     if (err) {
//         console.error(err.message);
//     }
//     console.log('Close the database connection.');
// });
