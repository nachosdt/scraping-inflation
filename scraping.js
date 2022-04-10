const mercadona = require("./mercadona");
const carrefour = require("./carrefour");
const dia = require("./dia");

class Scraping {
    constructor() {}
    mercadona(headless, postalCode, saveFile) {
        return mercadona.scrap(headless, postalCode, saveFile);
    }
    carrefour(headless, saveFile) {
        return carrefour.scrap(headless, saveFile);
    }
    dia(headless, saveFile) {
        return dia.scrap(headless, saveFile);
    }
}

module.exports = new Scraping();
