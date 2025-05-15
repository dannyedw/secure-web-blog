// Requiring fs module in which 
// readFile function is defined.
const fs = require('fs');
 
fs.readFile('Input.txt', (err, data) => {
    if (err) throw err;
 
    console.log(data.toString());

    let sentence = "8423746198739213 qwerty";

    if(data.toString().includes(sentence))
    {
        console.log("BAD PASS");
    }
    else
    {
        console.log("GOOD PASS");
    }

});