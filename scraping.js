const { scrapingMercadona } = require("./mercadona");
const { scrapingCarrefour } = require("./carrefour");
const { scrapingDia } = require("./dia");

class Scraping {
    constructor() {}
    /**
     * Scrapes the website and returns an array of products
     * @param {boolean} headless - Whether to run the browser in headless mode
     * @param {boolean} saveFile - Whether to save the scraped data to a file named "mercadona.json"
     * @param {boolean} saveLog - Whether to save the log messages to a .txt file or print them to the console
     * @param {string} postalCode - Postal code to search
     * @returns {Promise<Array>} - Array of all Mercadona products
     * */
    mercadona(headless, saveFile, saveLog, postalCode) {
        return scrapingMercadona(headless, saveFile, saveLog, postalCode);
    }
    /**
     * Scrapes the website and returns an array of products
     * @param {boolean} headless - Whether to run the browser in headless mode
     * @param {boolean} saveFile - Whether to save the scraped data to a file named "carrefour.json"
     * @param {boolean} saveLog - Whether to save the log messages to a .txt file or print them to the console
     * @returns {Promise<Array>} - Array of all Carrefour products
     * */
    carrefour(headless, saveFile, saveLog) {
        return scrapingCarrefour(headless, saveFile, saveLog);
    }
    /**
     * Scrapes the website and returns an array of products
     * @param {boolean} headless - Whether to run the browser in headless mode
     * @param {boolean} saveFile - Whether to save the scraped data to a file named "dia.json"
     * @param {boolean} saveLog - Whether to save the log messages to a .txt file or print them to the console
     * @returns {Promise<Array>} - Array of all Día products
     * */
    dia(headless, saveFile, saveLog) {
        return scrapingDia(headless, saveFile, saveLog);
    }
}

module.exports = new Scraping();
