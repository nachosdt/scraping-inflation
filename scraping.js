const mercadona = require("./mercadona");
const carrefour = require("./carrefour");
const dia = require("./dia");

class Scraping {
    constructor() {}
    /**
     * Scrapes the website and returns an array of products
     * @param {boolean} headless - Whether to run the browser in headless mode
     * @param {boolean} saveFile - Whether to save the scraped data to a file named "mercadona.json"
     * @param {string} postalCode - Postal code to search
     * @returns {Promise<Array>} - Array of all Mercadona products
     * */
    mercadona(headless, saveFile, postalCode) {
        return mercadona.scrap(headless, saveFile, postalCode);
    }
    /**
     * Scrapes the website and returns an array of products
     * @param {boolean} headless - Whether to run the browser in headless mode
     * @param {boolean} saveFile - Whether to save the scraped data to a file named "carrefour.json"
     * @returns {Promise<Array>} - Array of all Carrefour products
     * */
    carrefour(headless, saveFile) {
        return carrefour.scrap(headless, saveFile);
    }
    /**
     * Scrapes the website and returns an array of products
     * @param {boolean} headless - Whether to run the browser in headless mode
     * @param {boolean} saveFile - Whether to save the scraped data to a file named "dia.json"
     * @returns {Promise<Array>} - Array of all Día products
     * */
    dia(headless, saveFile) {
        return dia.scrap(headless, saveFile);
    }
}

/* module.exports = new Scraping(); */
let scrap = new Scraping();
scrap.carrefour(true, true);
