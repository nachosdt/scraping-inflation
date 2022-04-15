const puppeteer = require("puppeteer");
const fs = require("fs");

let url = "https://tienda.mercadona.es/categories/112";

/**
 * Scrapes the website and returns an array of products
 * @param {boolean} headless - Whether to run the browser in headless mode
 * @param {boolean} saveFile - Whether to save the scraped data to a file named "mercadona.json"
 * @param {string} postalCode - Postal code to search
 * @returns {Promise<Array>} - Array of all Mercadona products
 * */
async function scrap(headless, saveFile, postalCode) {
    // Get start time in miliseconds
    let startTime = new Date().getTime();

    const browser = await puppeteer.launch({
        headless: headless,
        args: [
            "--start-maximized", // you can also use '--start-fullscreen'
            "--disable-dev-shm-usage", // overcome limited resource problems
        ],
        defaultViewport: { width: 1620, height: 900 },
        slowMo: 50,
    });
    const page = await browser.newPage();
    console.log("Navigating to Mercadona URL:", url);
    await page.goto(url, {
        waitUntil: "networkidle2",
    });
    // Input postal code
    await page.type("input.ym-hide-content", postalCode);
    const [response] = await Promise.all([
        page.waitForNavigation({
            waitUntil: "networkidle2",
        }),
        page.click("button.button.button-primary.button-big"),
    ]);
    // Accept cookies
    await page.click(
        "div.cookie-banner>div>div>button.ui-button.ui-button--small.ui-button--primary.ui-button--positive"
    );
    // Find number of categories
    let categories = await page.$$eval(".category-menu__item", (cat) => {
        return cat.map((e) => e.querySelector(".subhead1-r").textContent);
    });
    console.log(categories.length, "categories found...");
    let totalProducts = [];
    for (let i = 1; i <= categories.length; i++) {
        // Select category
        await Promise.all([
            page.waitForNavigation({
                waitUntil: "networkidle2",
            }),
            page.click(`.category-menu__item:nth-child(${i})`),
        ]);
        // Get selected category
        let category = await page.$eval(".category-menu__item.open", (cat) => {
            return cat.querySelector(".subhead1-r").textContent;
        });
        console.log("\x1b[32m%s\x1b[0m", "Category:", category);
        // Get all category products
        let categoryProducts = await getCategoryProducts(page, category);
        console.log(
            categoryProducts.length,
            "products found in category",
            category
        );
        totalProducts = totalProducts.concat(categoryProducts);
    }
    console.log(totalProducts.length, "total products found...");
    saveFile &&
        fs.writeFileSync(
            "mercadona.json",
            JSON.stringify(totalProducts, null, 4)
        );
    // Get end time in miliseconds
    let endTime = new Date().getTime();
    console.log("Total time:", (endTime - startTime) / 1000, "seconds");
    await browser.close();
    return totalProducts;
}

async function getCategoryProducts(page, category) {
    // Get selected subcategory
    let subcategory = await page.$eval(".category-item--selected", (subcat) => {
        return subcat.querySelector(".category-item__link").textContent;
    });
    console.log("\x1b[36m%s\x1b[0m", "Subcategory:", subcategory);
    // Get subcategory page products
    let products = await page.$$eval(".product-cell", (prod) => {
        let result = [];
        prod.forEach((e) => {
            let format = e.querySelector(".product-format").textContent.trim();
            let product = {
                name:
                    e
                        .querySelector(".product-cell__description-name")
                        .textContent.trim() +
                    " " +
                    format.toLowerCase(),
                price: e
                    .querySelector(".product-price__unit-price")
                    .textContent.trim(),
                img: e.querySelector(".product-cell__image-wrapper img").src,
            };
            result.push(product);
        });
        return result;
    });
    // Add category, subcategory and third level category to products and normalize
    products.forEach((e) => {
        e.category = category;
        e.subcategory = subcategory;
        e.thirdLevelCategory = "";
        e.supermarket = "mercadona";
        normalizeCategory(e);
    });
    console.log(products.length, "products found...");
    // Check if button .category-detail__next-subcategory exists
    let nextButtonExists = false;
    try {
        let nextButton = await page.$eval(
            ".category-detail__next-subcategory",
            (button) => {
                return button ? button.textContent : "";
            }
        );
        if (nextButton) {
            nextButtonExists = true;
            // console.log("Next button found:", nextButton);
        }
    } catch (error) {
        nextButtonExists = false;
    }

    if (nextButtonExists) {
        // Scroll page until end
        await page.$eval(".category-detail__next-subcategory", (e) => {
            e.scrollIntoView({
                behavior: "smooth",
                block: "end",
                inline: "end",
            });
        });
        const [response] = await Promise.all([
            page.waitForNavigation({
                waitUntil: "networkidle2",
            }),
            page.click(".category-detail__next-subcategory"),
        ]);
        products = products.concat(await getCategoryProducts(page, category));
    } else {
        console.log(
            "\x1b[32m%s\x1b[0m",
            "End of category",
            category,
            "reached..."
        );
    }
    return products;
}

// Normalize category of product
function normalizeCategory(product) {
    if (
        product.category === "Agua y refrescos" ||
        product.category === "Bodega" ||
        product.category === "Zumos"
    ) {
        product.thirdLevelCategory = product.subcategory;
        product.subcategory = product.category;
        product.category = "Bebidas";
    } else if (product.category === "Limpieza y hogar") {
        product.category = "Limpieza y Hogar";
    } else if (
        product.category === "Aceite, especias y salsas" ||
        product.category === "Aperitivos" ||
        product.category === "Arroz, legumbres y pasta" ||
        product.category === "Azucar, caramelos y chocolate" ||
        product.category === "Cacao, café e infusiones" ||
        product.category === "Cereales y galletas" ||
        product.category === "Huevos, leche y mantequilla" ||
        product.category === "Postres y yogures" ||
        product.category === "Congelados" ||
        product.category === "Pizzas y platos preparados" ||
        product.category === "Conservas, caldos y cremas"
    ) {
        product.thirdLevelCategory = product.subcategory;
        product.subcategory = product.category;
        product.category = "Despensa";
    } else if (
        product.category === "Carne" ||
        product.category === "Marisco y pescado" ||
        product.category === "Panadería y pastelería" ||
        product.category === "Charcutería y quesos" ||
        product.category === "Fruta y verdura"
    ) {
        product.thirdLevelCategory = product.subcategory;
        product.subcategory = product.category;
        product.category = "Productos Frescos";
    } else if (
        product.category === "Cuidado del cabello" ||
        product.category === "Cuidado facial y corporal" ||
        product.category === "Fitoterapia y parafarmacia" ||
        product.category === "Maquillaje"
    ) {
        product.thirdLevelCategory = product.subcategory;
        product.subcategory = product.category;
        product.category = "Perfumería e Higiene";
    }
}

module.exports = { scrap };
