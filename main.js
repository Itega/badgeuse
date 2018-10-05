const rc522 = require("node-rc522");

rc522.startListening()
    .then(function(rfidTag){
        console.log(rfidTag);
    })
    .catch(console.warn);
