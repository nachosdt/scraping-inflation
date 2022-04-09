const mercadona = require("./mercadona");
const carrefour = require("./carrefour");

class Scraping {
    constructor() {}
    mercadona(headless, postalCode, saveFile) {
        return mercadona.scrap(headless, postalCode, saveFile);
    }
    carrefour(headless, saveFile) {
        return carrefour.scrap(headless, saveFile);
    }
}

module.exports = new Scraping();
