const puppeteer = require("puppeteer");
const fs = require("fs");
const {
    filterProducts,
    Log,
    getTodayDate,
    printOrSaveMessage,
} = require("./functions.js");

let url = "https://www.dia.es/compra-online/";
// body > div > div > span.Transparent-close
/**
 * Scrapes the website and returns an array of products
 * @param {boolean} headless - Whether to run the browser in headless mode
 * @param {boolean} saveFile - Whether to save the scraped data to a file named "dia.json"
 * @param {boolean} saveLog - Whether to save the log messages to a .txt file or print them to the console
 * @returns {Promise<Array>} - Array of all Día products
 * */
async function scrapingDia(headless, saveFile, saveLog) {
    // Get start time in miliseconds
    let startTime = new Date().getTime();
    let today = getTodayDate();
    let log = new Log("dia" + today, today);
    try {
        const browser = await puppeteer.launch({
            headless: headless,
            args: [
                "--start-maximized", // you can also use '--start-fullscreen'
                "--disable-dev-shm-usage", // overcome limited resource problems
            ],
            defaultViewport: { width: 1620, height: 900 },
            slowMo: 80,
        });
        const page = await browser.newPage();
        printOrSaveMessage(log, saveLog, "", "Navigating to Día URL:", url);
        await page.goto(url, {
            waitUntil: "networkidle2",
        });
        // Accept cookies
        await page.click("#onetrust-accept-btn-handler");
        // Show all categories
        await page.click(".btn-product-catalog");
        // Get all categories, subcategories and third level categories, with its url
        // categoriesTree = [{name: "category", subcategories: [{name: "subcategory", thirdLevelCategories: [{name: "thirdLevelCategory", url: "url"}]}]}]
        let categoriesTree = await page.$$eval(
            "#nav-submenu-container>ul>li:not([class^='main_menu_element'])",
            (cat) => {
                let result = [];
                cat.forEach((e) => {
                    let category = {
                        name: e
                            .querySelector(".btn-main-category")
                            .textContent.trim(),
                        subcategories: [],
                    };
                    let subcategories = e.querySelectorAll(
                        ".child-menu>.child-menu-container>li"
                    );
                    subcategories.forEach((subcategory) => {
                        let subcategoryName = subcategory
                            .querySelector("a")
                            .textContent.trim();
                        let subcategoryUrl =
                            subcategory.querySelector("a").href;
                        let thirdLevelCategories = [];
                        // If subcategories have child ul.grandchild-menu-container, get third level categories
                        if (subcategory.querySelector(".grandchild-menu")) {
                            let _thirdLevelCategories = [
                                ...subcategory.querySelectorAll(
                                    ".grandchild-menu>li:not([class^='go-to-category-child'])>a"
                                ),
                            ];
                            thirdLevelCategories = _thirdLevelCategories.map(
                                (thirdLevelCategory) => {
                                    let thirdLevelCategoryName =
                                        thirdLevelCategory.textContent.trim();
                                    let thirdLevelCategoryUrl =
                                        thirdLevelCategory.href;
                                    return {
                                        name: thirdLevelCategoryName,
                                        url: thirdLevelCategoryUrl,
                                    };
                                }
                            );
                        }
                        category.subcategories.push({
                            name: subcategoryName,
                            url: subcategoryUrl,
                            thirdLevelCategories: thirdLevelCategories,
                        });
                    });
                    result.push(category);
                });
                return result;
            }
        );
        printOrSaveMessage(
            log,
            saveLog,
            "",
            categoriesTree.length,
            "categories found..."
        );

        // Navigate through categoriesTree and get products
        let totalProducts = [];
        for (let i = 0; i < categoriesTree.length; i++) {
            let category = categoriesTree[i];
            printOrSaveMessage(
                log,
                saveLog,
                "\x1b[32m%s\x1b[0m",
                "Category:",
                category.name
            );
            printOrSaveMessage(
                log,
                saveLog,
                "",
                category.subcategories.length,
                "subcategories found..."
            );
            let categoryProducts = [];
            // Iterate through subcategories
            for (let j = 0; j < category.subcategories.length; j++) {
                printOrSaveMessage(
                    log,
                    saveLog,
                    "\x1b[36m%s\x1b[0m",
                    "Subcategory:",
                    category.subcategories[j].name
                );
                let subcategory = category.subcategories[j];
                let subcategotyProducts = [];
                // Iterate through third level categories if any
                if (subcategory.thirdLevelCategories.length > 0) {
                    printOrSaveMessage(
                        log,
                        saveLog,
                        "",
                        subcategory.thirdLevelCategories.length,
                        "third level categories found..."
                    );
                    for (
                        let k = 0;
                        k < subcategory.thirdLevelCategories.length;
                        k++
                    ) {
                        let thirdLevelCategory =
                            subcategory.thirdLevelCategories[k];
                        printOrSaveMessage(
                            log,
                            saveLog,
                            "\x1b[31m%s\x1b[0m",
                            "Third level category:",
                            thirdLevelCategory.name
                        );
                        await page.goto(thirdLevelCategory.url, {
                            waitUntil: "networkidle2",
                        });
                        // Get products
                        let products = await getProducts(page);
                        printOrSaveMessage(
                            log,
                            saveLog,
                            "",
                            products.length,
                            "products found in third level category",
                            thirdLevelCategory.name
                        );
                        printOrSaveMessage(
                            log,
                            saveLog,
                            "\x1b[31m%s\x1b[0m",
                            "End of third level category",
                            thirdLevelCategory.name,
                            "reached..."
                        );
                        // Add category, subcategory and third level category to products
                        products.forEach((product) => {
                            product.category = category.name;
                            product.subcategory = subcategory.name;
                            product.class = thirdLevelCategory.name;
                            normalizeCategory(product);
                        });
                        subcategotyProducts =
                            subcategotyProducts.concat(products);
                    }
                } else {
                    // Navigate to subcategory
                    printOrSaveMessage(
                        log,
                        saveLog,
                        "",
                        "No third level categories found in subcategory:",
                        subcategory.name
                    );
                    printOrSaveMessage(
                        log,
                        saveLog,
                        "",
                        "Navigating directly to subcategory:",
                        subcategory.name
                    );
                    await page.goto(subcategory.url, {
                        waitUntil: "networkidle2",
                    });
                    // Get products
                    let products = await getProducts(page);
                    // Add category, subcategory and third level category to products
                    products.forEach((product) => {
                        product.category = category.name;
                        product.subcategory = subcategory.name;
                        product.class = "";
                        normalizeCategory(product);
                    });
                    subcategotyProducts = subcategotyProducts.concat(products);
                }
                printOrSaveMessage(
                    log,
                    saveLog,
                    "\x1b[36m%s\x1b[0m",
                    "End of subcategory",
                    subcategory.name,
                    "reached..."
                );
                printOrSaveMessage(
                    log,
                    saveLog,
                    "",
                    subcategotyProducts.length,
                    "products found in subcategory:",
                    subcategory.name
                );
                categoryProducts = categoryProducts.concat(subcategotyProducts);
            }
            printOrSaveMessage(
                log,
                saveLog,
                "\x1b[36m%s\x1b[0m",
                "End of category",
                category.name,
                "reached..."
            );
            printOrSaveMessage(
                log,
                saveLog,
                "",
                categoryProducts.length,
                "products found in category:",
                category.name
            );
            totalProducts = totalProducts.concat(categoryProducts);
        }
        printOrSaveMessage(
            log,
            saveLog,
            "",
            totalProducts.length,
            "total products found..."
        );
        let uniqueProducts = filterProducts(totalProducts);
        printOrSaveMessage(
            log,
            saveLog,
            "",
            uniqueProducts.length,
            "unique products found..."
        );
        saveFile &&
            fs.writeFileSync(
                "dia" + today + ".json",
                JSON.stringify(uniqueProducts, null, 4)
            );
        // Get end time in miliseconds
        let endTime = new Date().getTime();
        printOrSaveMessage(
            log,
            saveLog,
            "",
            "Total time:",
            (endTime - startTime) / 1000,
            "seconds"
        );
        saveLog && log.saveLog();
        await browser.close();
        return uniqueProducts;
    } catch (error) {
        printOrSaveMessage(log, saveLog, "", "Error: " + error);
        saveLog && (log.saveLog(), console.log(error));
        return error;
    }
}

async function getProducts(page) {
    let products = await page.$$eval(".product-list__item", (product) => {
        let result = [];
        product.forEach((e) => {
            let productName = e.querySelector(".productMainLink").title.trim();
            let productUrl = e.querySelector(".productMainLink").href;
            let productPrice = e
                .querySelector(".productMainLink .price")
                .textContent.trim()
                .replace("&nbsp;", " ");
            let productImage =
                e.querySelector(".productMainLink .crispImage")?.src ||
                e.querySelector(".productMainLink .missing-product-image")?.src;
            let pricePerUnit = e
                .querySelector(".pricePerKilogram")
                .textContent.trim()
                .replace("&nbsp;", " ");
            // Get lowest price when we get 2 prices (2nd is the lowest)
            productPrice = productPrice.replace(/\t/g, "");
            productPrice.includes("\n") &&
                (productPrice = productPrice.split("\n")[1]);
            pricePerUnit = pricePerUnit.replace(/\t/g, "");
            pricePerUnit.includes("\n") &&
                (pricePerUnit = pricePerUnit.split("\n")[1]);
            result.push({
                description: productName,
                url: productUrl,
                price: productPrice,
                image: productImage,
                pricePerUnit: pricePerUnit,
                source: "dia",
            });
        });
        return result;
    });
    // check if next-page button is enabled
    let nextButtonExists = false;
    try {
        let nextButton = await page.$eval(".btn-pager--next", (button) => {
            return button.classList.contains("disabled") ? "" : "Exists";
        });
        if (nextButton) {
            nextButtonExists = true;
        }
    } catch (error) {
        nextButtonExists = false;
    }
    // Click on next page if next-page button exists
    if (nextButtonExists) {
        let url = await page.$eval(".btn-pager--next", (button) => {
            return button.href;
        });
        await page.goto(url, {
            waitUntil: "networkidle2",
        });
        // Get more products
        products = products.concat(await getProducts(page));
    }
    return products;
}

// Normalize category of product
function normalizeCategory(product) {
    if (
        product.category === "Platos Preparados" ||
        product.category === "Congelados"
    ) {
        product.class = product.subcategory;
        product.subcategory = product.category;
        product.category = "Despensa";
    } else if (product.category === "Cuidado del Hogar") {
        product.category = "Limpieza y Hogar";
    } else if (product.category === "Bodega") {
        product.category = "Bebidas";
    } else if (product.category === "Frescos") {
        product.category = "Productos Frescos";
    } else if (product.category === "Cuidado Personal") {
        product.category = "Perfumería e Higiene";
    }
}

module.exports = { scrapingDia };
