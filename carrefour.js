const puppeteer = require("puppeteer");
const fs = require("fs");

let url = "https://www.carrefour.es/supermercado";

/**
 * Scrapes the website and returns an array of products
 * @param {boolean} headless - Whether to run the browser in headless mode
 * @param {boolean} saveFile - Whether to save the scraped data to a file named "carrefour.json"
 * @returns {Promise<Array>} - Array of all Carrefour products
 * */
async function scrap(headless, saveFile) {
    // Get start time in miliseconds
    let startTime = new Date().getTime();

    const browser = await puppeteer.launch({
        headless: headless,
        args: [
            "--start-maximized", // you can also use '--start-fullscreen'
            "--disable-dev-shm-usage", // overcome limited resource problems
        ],
        defaultViewport: { width: 1620, height: 900 },
        slowMo: 60,
    });
    const page = await browser.newPage();
    console.log("Navigating to Carrefour URL:", url);
    await page.goto(url, {
        waitUntil: "networkidle2",
    });
    // Accept cookies
    await page.click("#onetrust-reject-all-handler");
    // Close modal
    await page.click("span.icon-cross-thin");
    // Get number of categories
    let categories = await page.$$eval(
        ".nav-first-level-categories__slide",
        (cat) => {
            return cat.map((e) => {
                return {
                    name: e.title,
                    url: e.querySelector(
                        ".nav-first-level-categories__list-element"
                    ).href,
                };
            });
        }
    );
    console.log(categories.length, "categories found...");
    let totalProducts = [];
    for (let i = 1; i < categories.length; i++) {
        totalCategoryProducts = [];
        // Select category
        await page.goto(categories[i].url, {
            waitUntil: "networkidle2",
        });
        // Get selected category
        let category = await page.$eval(
            "a.nav-first-level-categories__list-element.ripple.active>span",
            (cat) => {
                return cat.textContent.trim();
            }
        );
        console.log("\x1b[32m%s\x1b[0m", "Category:", category);
        // Find number of subcategories
        let subcategories = await page.$$eval(
            ".nav-second-level-categories__slide",
            (cat) => {
                return cat.map((e) => {
                    return {
                        name: e.title,
                        url: e.querySelector(
                            ".nav-second-level-categories__list-element"
                        ).href,
                    };
                });
            }
        );
        console.log(subcategories.length, "subcategories found...");
        for (let j = 1; j < subcategories.length; j++) {
            let totalSubcategoryProducts = [];
            // Select subcategory
            await page.goto(subcategories[j].url, {
                waitUntil: "networkidle2",
            });
            // Get selected subcategory
            let subcategory = await page.$eval(
                "a.nav-first-level-categories__list-element.ripple.active>span",
                (cat) => {
                    return cat.textContent.trim();
                }
            );
            console.log("\x1b[36m%s\x1b[0m", "Subcategory:", subcategory);
            // Get 3rd level subcategories
            let thirdLevelCategories = await page.$$eval(
                ".nav-second-level-categories__slide",
                (cat) => {
                    return cat.map((e) => e.title);
                }
            );
            console.log(
                thirdLevelCategories.length,
                "third level categories found..."
            );
            for (let l = 1; l <= thirdLevelCategories.length; l++) {
                // Select subcategory
                await Promise.all([
                    page.waitForNavigation({
                        waitUntil: "networkidle2",
                    }),
                    page.click(
                        `.nav-second-level-categories__slide:nth-child(${l})>a`
                    ),
                ]);
                // Get selected subcategory
                let thirdLevelCategory = await page.$eval(
                    "a.nav-second-level-categories__list-element.ripple.active>p",
                    (cat) => {
                        return cat.textContent.trim();
                    }
                );
                console.log(
                    "\x1b[31m%s\x1b[0m",
                    "Third level category:",
                    thirdLevelCategory
                );
                if (
                    !thirdLevelCategory.includes("Todos los") &&
                    !thirdLevelCategory.includes("Todas las")
                ) {
                    // Get products
                    let products = await getProducts(
                        page,
                        category,
                        subcategory,
                        thirdLevelCategory
                    );
                    console.log(products.length, "products found...");
                    /* console.log(products); */
                    totalSubcategoryProducts =
                        totalSubcategoryProducts.concat(products);
                } else {
                    console.log(
                        "\x1b[31m%s\x1b[0m",
                        "Skip third level category",
                        thirdLevelCategory
                    );
                }
            }
            console.log(
                "\x1b[36m%s\x1b[0m",
                "End of subcategory:",
                subcategory
            );
            console.log(totalSubcategoryProducts.length, "products found...");
            totalCategoryProducts = totalCategoryProducts.concat(
                totalSubcategoryProducts
            );
        }
        console.log("\x1b[32m%s\x1b[0m", "End of category:", category);
        console.log(totalCategoryProducts.length, "products found...");
        totalProducts = totalProducts.concat(totalCategoryProducts);
    }
    console.log(totalProducts.length, "total products found...");
    saveFile &&
        fs.writeFileSync(
            "carrefour.json",
            JSON.stringify(totalProducts, null, 4)
        );
    // Get end time in miliseconds
    let endTime = new Date().getTime();
    console.log("Total time:", (endTime - startTime) / 1000, "seconds");
    await browser.close();
    return totalProducts;
}

async function getProducts(page, category, subcategory, thirdLevelCategory) {
    // Scroll to bottom to load lazy-loaded products
    await autoScroll(page);
    // Get products
    let products = await page.$$eval(".product-card-list__item", (prod) => {
        let result = [];
        prod.forEach((e) => {
            if (!e.classList.contains("trade-banner")) {
                result.push({
                    description: e
                        .querySelector(".product-card__title-link")
                        ?.textContent.trim(),
                    price:
                        e
                            .querySelector(".product-card__price")
                            ?.textContent.trim() ||
                        e
                            .querySelector(".product-card__price--current")
                            ?.textContent.trim(),
                    image:
                        e.querySelector(".product-card__image")?.src[0] === "h"
                            ? e.querySelector(".product-card__image")?.src
                            : e.querySelector(".product-card__image")?.dataset
                                  .src,
                    url: e.querySelector(".product-card__media-link")?.href,
                    pricePerUnit: e
                        .querySelector(".product-card__price-per-unit")
                        .textContent.trim(),
                });
            }
        });
        return result;
    });
    products.forEach((e) => {
        e.category = category;
        e.subcategory = subcategory;
        e.class = thirdLevelCategory;
        e.source = "carrefour";
        normalizeCategory(e);
    });
    // check if next-page button is enabled
    let nextButtonExists = false;
    try {
        let nextButton = await page.$eval(".pagination__next", (button) => {
            return button.classList.contains("pagination__next--disabled")
                ? ""
                : "Exists";
        });
        if (nextButton) {
            nextButtonExists = true;
        }
    } catch (error) {
        nextButtonExists = false;
    }
    // Click on next page if next-page button exists
    if (nextButtonExists) {
        await Promise.all([
            page.waitForNavigation({
                waitUntil: "networkidle2",
            }),
            page.click(".pagination__next"),
        ]);
        // Get more products
        products = products.concat(
            await getProducts(page, category, subcategory, thirdLevelCategory)
        );
    } else {
        console.log(
            "\x1b[31m%s\x1b[0m",
            "End of third level category",
            thirdLevelCategory,
            "reached..."
        );
    }
    return products;
}

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            let totalHeight = 0;
            let distance = 100;
            let timer = setInterval(() => {
                let scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    // Scroll up 400px after page is scrolled down, to show button
                    window.scrollBy(0, totalHeight - 400);
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

// Normalize category of product
function normalizeCategory(product) {
    if (product.category === "La Despensa") {
        product.category = "Despensa";
    } else if (product.category === "Parafarmacia") {
        product.category = "Perfumería e Higiene";
        product.class = product.subcategory;
        product.subcategory = "Parafarmacia";
    }
}

module.exports = { scrap };
