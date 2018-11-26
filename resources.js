const request = require('request');
const {uri} = require('./config');
const resources = {
    getPersonFromUid(uid){
        return new Promise((resolve, reject) => {
            request(`${uri}api/badge/${uid}`, function (err, res, body) {
                if(err) {
                    return reject(err);
                }
                if(res && res.statusCode !== 200){
                    return reject(res);
                }
                body = JSON.parse(body);

                if(!body.length) return reject("No user found");

                resolve(body[0]);
            });
        })
    }
};

module.exports = resources;
