const fs = require("fs");

// Function to filter products and delete repeated products
function filterProducts(products) {
    let result = [];
    let productsDescriptions = [];
    products.forEach((product) => {
        let description = removeAccents(product.description.toLowerCase());
        if (!productsDescriptions.includes(description)) {
            productsDescriptions.push(description);
            result.push(product);
        }
    });
    return result;
}

function removeAccents(str) {
    let accents = [
        /[\300-\306]/g,
        /[\340-\346]/g, // A, a
        /[\310-\313]/g,
        /[\350-\353]/g, // E, e
        /[\314-\317]/g,
        /[\354-\357]/g, // I, i
        /[\322-\330]/g,
        /[\362-\370]/g, // O, o
        /[\331-\334]/g,
        /[\371-\374]/g, // U, u
    ];
    let noaccents = ["A", "a", "E", "e", "I", "i", "O", "o", "U", "u"];
    for (let i = 0; i < accents.length; i++) {
        str = str.replace(accents[i], noaccents[i]);
    }
    return str;
}

class Log {
    constructor(fileName, initialMessage = "") {
        this.fileName = fileName + ".txt";
        this.content = initialMessage + "\n\n";
    }
    writeToLog(message) {
        this.content += message + "\n";
    }
    printLog() {
        console.log(this.content);
    }
    saveLog() {
        fs.writeFileSync(this.fileName, this.content, {
            encoding: "utf8",
        });
    }
}

// Get today's date inj format YYYY-MM-DD
function getTodayDate() {
    let today = new Date();
    let dd = today.getDate();
    let mm = today.getMonth() + 1;
    let yyyy = today.getFullYear();
    if (dd < 10) {
        dd = "0" + dd;
    }
    if (mm < 10) {
        mm = "0" + mm;
    }
    return yyyy + "-" + mm + "-" + dd;
}

function printOrSaveMessage(log, saveLog, color, ...message) {
    if (saveLog) {
        log.writeToLog(message.join(" "));
    } else {
        console.log(color, ...message);
    }
}
module.exports = { filterProducts, Log, getTodayDate, printOrSaveMessage };
