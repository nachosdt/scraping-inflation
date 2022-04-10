# Scraping the Inflation

This package helps to measure inflation in Spain, scraping various supermarkets websites, using [Puppeteer](https://www.npmjs.com/package/puppeteer).

Also useful if you need data of thousands of products to practice or develop a personal project.

<img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/UK_and_US%2C_1990-Feb_2022.svg" height="300" align="right">

Websites scraped:

-   [Mercadona](https://tienda.mercadona.es/categories)
-   [Carrefour](https://www.carrefour.es/supermercado)
-   [Día](https://www.dia.es/compra-online/)

## Getting Started

### Installation

To use Scraping Inflation in your project, run:

```bash
npm i scraping-inflation
```

**Example**

```js
const scraping = require("scraping-inflation");

scraping.mercadona(true, true, "28001").then((products) => {
    // Do something with products
});

(async function getCarrefourProducts() {
    let products = await scraping.carrefour(false, false);
    // Do something with products
})();

let diaProducts = scraping.dia(true, false);
diaProducts.then((products) => {
    // Do something with products
});
```

To run Chromium in headless mode, set first argument to `true`.

To save products in .json file, set second argument to `true`.

The progress of the scraping process will be shown in the STDOUT (console).

The result of the scraping process is an array of JSON of all the products of the website.
