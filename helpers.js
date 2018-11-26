const resources = require('./resources');
const config = require('./config');
const Gpio = require('onoff').Gpio;

const helpers = {
    db: undefined,
    lcd: undefined,
    greenLed: new Gpio(config.greenLed, 'out'),
    redLed: new Gpio(config.redLed, 'out'),

    initDb(db) {
        this.db = db;
    },
    initLcd(lcd) {
        this.lcd = lcd;

        this.lcd.on('error', console.log);
        this.LcdReset();
    },
    LcdWrite(string, reset) {
        let lines = string.split('\n');

        this.lcd.clear();
        this.lcd.setCursor(0, 0);
        this.lcd.print(lines[0]);
        if (lines[1]) {
            this.lcd.once('printed', () => {
                this.lcd.setCursor(0, 1);
                this.lcd.print(lines[1]);
            });
        }

        if (reset) setTimeout(() => {
            this.LcdReset()
        }, 1000);
    },
    LcdReset() {
        this.LcdWrite('Scannez votre\nbadge');
    },
    blinkGreen(){
        this.greenLed.writeSync(1);
        setTimeout(()=>{this.greenLed.writeSync(0)}, 1000);
    },
    blinkRed(){
        this.redLed.writeSync(1);
        setTimeout(()=>{this.redLed.writeSync(0)}, 1000);
    },
    getPersonFromUid(uid) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM people WHERE people.id IN (SELECT badges.person_id FROM badges WHERE badges.uid = ?)', [uid], (err, row) => {
                if (err) {
                    return reject(err);
                }

                return row ? resolve(row) : resources.getPersonFromUid(uid).then((body) => {
                    resolve(body);
                }).catch(reject);
            });
        })
    },
    success(person) {
        this.insertPresence(person);
        this.LcdWrite(`${person.name}\n${person.surname}`, true);
        this.blinkGreen();
    },
    failed() {
        this.LcdWrite('Badge inconnu', true);
        this.blinkRed();
    },
    insertNewPerson(badge){
        this.db.run('INSERT OR REPLACE INTO badges (uid, person_id) values(?, ?)', [badge.uid, badge.person_id]);
        this.db.run('INSERT OR REPLACE INTO people (id, name, surname) values(?, ?, ?)', [badge.person.id, badge.person.name, badge.person.surname]);
    },
    insertPresence(person){
        this.db.run('INSERT INTO presences (person_id, datetime, salle) values(?, DATETIME(\'now\',\'localtime\'), ?)', [person.id, config.salle]);
    }
};

module.exports = helpers;
