
// =============================================
// ELEGANCE STORE - PRODUCTS PAGE
// =============================================

// STORE PRODUCTS AND CATEGORIES

let allProducts = [];
let allCategories = [];

// PAGINATION

const PRODUCTS_PER_PAGE = 6;

let currentPage = 1;
let lastShownProducts = [];


// =============================================
// GET HTML ELEMENTS
// =============================================

const productGrid = document.getElementById("product-grid");
const searchInput = document.getElementById("product-search");
const sortSelect = document.getElementById("sort-products");
const categoryFilter = document.getElementById("category-filter");
const minPriceInput = document.getElementById("min-price");
const maxPriceInput = document.getElementById("max-price");
const applyFilterButton = document.getElementById("apply-filter");


// =============================================
// LOAD PRODUCTS AND CATEGORIES
// =============================================

async function loadProductsPage() {

    try {

        productGrid.innerHTML = `
            <div class="empty-products">
                <h3>Loading products...</h3>
                <p>Please wait while we fetch your products.</p>
            </div>
        `;

        // FETCH PRODUCTS FROM FIRESTORE

        const productResponse = await getProducts();

        // FETCH CATEGORIES FROM FIRESTORE

        const categoryResponse = await getCategories();

        // CONVERT FIRESTORE DOCUMENTS

        allProducts = (productResponse.documents || [])
            .map(function (document) {

                const product = convertFromFirestoreDocument(document);

                // USE DOCUMENT ID WHEN THE ID FIELD IS MISSING

                if (!product.id && document.name) {
                    product.id = document.name.split("/").pop();
                }

                return product;
            });

        allCategories = (categoryResponse.documents || [])
            .map(function (document) {
                return convertFromFirestoreDocument(document);
            });

        // LOAD CATEGORY OPTIONS

        loadCategoryOptions();

        // PRESELECT CATEGORY FROM URL (e.g. products.html?category=abc)

        const urlCategory =
            new URLSearchParams(window.location.search).get("category");

        if (urlCategory) {

            categoryFilter.value = urlCategory;

            applyProductFilters();

            return;
        }

        // DISPLAY PRODUCTS

        displayProducts(allProducts);

    } catch (error) {

        console.error("Products Loading Error:", error);

        productGrid.innerHTML = `
            <div class="empty-products">
                <h3>Unable to load products</h3>
                <p>Please log in again and refresh this page.</p>
                <p>Check the browser console for details.</p>
            </div>
        `;
    }
}


// =============================================
// LOAD CATEGORIES INTO DROPDOWN
// =============================================

function loadCategoryOptions() {

    categoryFilter.innerHTML = `
        <option value="">All Categories</option>
    `;

    allCategories.forEach(function (category) {

        const option = document.createElement("option");

        option.value = category.categoryId || category.id || "";

        option.textContent =
            category.categoryName || category.name || "Category";

        categoryFilter.appendChild(option);

    });
}


// =============================================
// GET CATEGORY NAME
// =============================================

function getCategoryName(categoryId) {

    const category = allCategories.find(function (item) {

        return (
            item.categoryId === categoryId ||
            item.id === categoryId
        );

    });

    return category
        ? (category.categoryName || category.name || "General")
        : "General";
}


// =============================================
// DISPLAY PRODUCTS
// =============================================

function displayProducts(products, keepPage) {

    productGrid.innerHTML = "";

    lastShownProducts = products;

    if (!keepPage) {
        currentPage = 1;
    }

    // ACTIVE PRODUCTS ONLY

    const activeProducts = products.filter(function (product) {
        return product.status === "active";
    });

    if (activeProducts.length === 0) {

        productGrid.innerHTML = `
            <div class="empty-products">
                <h3>No Products Found</h3>
                <p>There are currently no products to display.</p>
            </div>
        `;

        renderPagination(0);

        return;
    }

    // CURRENT PAGE ONLY

    const totalPages = Math.ceil(activeProducts.length / PRODUCTS_PER_PAGE);

    currentPage = Math.min(Math.max(1, currentPage), totalPages);

    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;

    const pageProducts = activeProducts.slice(start, start + PRODUCTS_PER_PAGE);

    renderPagination(activeProducts.length);

    pageProducts.forEach(function (product) {

        // CREATE PRODUCT CARD

        const productCard = document.createElement("div");

        productCard.className = "product-card";

        // PRODUCT IMAGE

        const image = document.createElement("img");

        image.className = "product-image";

        const categoryName = getCategoryName(product.cat_id);

        setProductImage(image, product, categoryName);

        image.alt = product.title || "Product";

        // IMAGE AREA WITH HOVER DETAILS

        const media = document.createElement("div");

        media.className = "product-media";

        media.appendChild(image);

        media.appendChild(createHoverDetails(product, categoryName));

        // PRODUCT INFORMATION

        const details = document.createElement("div");

        details.className = "product-info";

        const category = document.createElement("p");

        category.className = "product-category";

        category.textContent = categoryName;

        const title = document.createElement("h3");

        title.className = "product-title";

        title.textContent = product.title || "Untitled Product";

        const description = document.createElement("p");

        description.className = "product-description";

        description.textContent =
            product.description || "No description available";

        const price = document.createElement("h4");

        price.className = "product-price";

        price.textContent = "₹" + Number(product.price || 0).toFixed(2);

        // CREATE INDIVIDUAL ADD TO CART BUTTON

        const addButton = createAddToCartButton(product);

        // ADD ELEMENTS TO CARD

        details.appendChild(category);
        details.appendChild(title);
        details.appendChild(description);
        details.appendChild(price);
        details.appendChild(addButton);

        productCard.appendChild(media);
        productCard.appendChild(details);

        productGrid.appendChild(productCard);

    });

}


// =============================================
// PAGINATION CONTROLS
// =============================================

function renderPagination(totalProducts) {

    let pager = document.getElementById("product-pagination");

    if (!pager) {

        pager = document.createElement("div");

        pager.id = "product-pagination";

        pager.className = "product-pagination";

        productGrid.after(pager);
    }

    pager.innerHTML = "";

    const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

    if (totalPages <= 1) {
        return;
    }

    function addButton(label, page, disabled, active) {

        const button = document.createElement("button");

        button.type = "button";
        button.textContent = label;
        button.disabled = disabled;

        if (active) {
            button.className = "active";
            button.setAttribute("aria-current", "page");
        }

        button.addEventListener("click", function () {

            currentPage = page;

            displayProducts(lastShownProducts, true);

            productGrid.scrollIntoView({ behavior: "smooth", block: "start" });
        });

        pager.appendChild(button);
    }

    addButton("‹ Prev", currentPage - 1, currentPage === 1, false);

    for (let page = 1; page <= totalPages; page++) {
        addButton(String(page), page, false, page === currentPage);
    }

    addButton("Next ›", currentPage + 1, currentPage === totalPages, false);

    const info = document.createElement("span");

    const first = (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
    const last = Math.min(currentPage * PRODUCTS_PER_PAGE, totalProducts);

    info.textContent = "Showing " + first + "–" + last + " of " + totalProducts;

    pager.appendChild(info);
}


// =============================================
// HOVER DETAILS OVERLAY
// =============================================

function createHoverDetails(product, categoryName) {

    const overlay = document.createElement("div");

    overlay.className = "product-hover-details";

    const heading = document.createElement("h4");

    heading.textContent = product.title || "Untitled Product";

    overlay.appendChild(heading);

    const description = document.createElement("p");

    description.className = "hover-description";

    description.textContent =
        product.description || "No description available";

    overlay.appendChild(description);

    const list = document.createElement("ul");

    function addRow(label, value) {

        const row = document.createElement("li");

        const name = document.createElement("span");

        name.textContent = label;

        const data = document.createElement("strong");

        data.textContent = value;

        row.appendChild(name);
        row.appendChild(data);

        list.appendChild(row);
    }

    const stock = Number(product.qty || 0);

    addRow("Category", categoryName);

    addRow("Price", "₹" + Number(product.price || 0).toFixed(2));

    addRow(
        "Availability",
        stock > 0 ? stock + " in stock" : "Out of stock"
    );

    if (product.brand) {
        addRow("Brand", product.brand);
    }

    overlay.appendChild(list);

    if (product.id) {

        const link = document.createElement("a");

        link.className = "hover-link";

        link.href =
            "product-details.html?id=" + encodeURIComponent(product.id);

        link.textContent = "View Full Details →";

        overlay.appendChild(link);
    }

    return overlay;
}


// =============================================
// CREATE QUANTITY PICKER + ADD TO CART BUTTON
// =============================================

function createAddToCartButton(product) {

    const wrapper = document.createElement("div");

    wrapper.className = "cart-controls";

    const stock = Number(product.qty || 0);

    const qtyInput = document.createElement("input");

    qtyInput.type = "number";
    qtyInput.className = "qty-input";
    qtyInput.min = 1;
    qtyInput.max = Math.max(1, stock);
    qtyInput.value = 1;
    qtyInput.setAttribute("aria-label", "Quantity for " + (product.title || "product"));

    const addButton = document.createElement("button");

    addButton.className = "btn";
    addButton.type = "button";
    addButton.textContent = "Add to Cart";

    wrapper.appendChild(qtyInput);
    wrapper.appendChild(addButton);

    // CHECK PRODUCT STOCK

    if (stock <= 0) {

        addButton.disabled = true;
        qtyInput.disabled = true;

        addButton.textContent = "Out of Stock";

        return wrapper;
    }

    // ADD PRODUCT TO CART

    addButton.addEventListener("click", async function () {

        const userId = sessionStorage.getItem("firebaseUserId");

        const token = sessionStorage.getItem("firebaseIdToken");

        if (!userId || !token) {

            alert("Please log in before adding products to your cart.");

            window.location.href = "login.html";

            return;
        }

        const quantity = Number(qtyInput.value);

        if (!Number.isInteger(quantity) || quantity < 1) {

            alert("Please choose a quantity of at least 1.");

            qtyInput.value = 1;

            return;
        }

        if (quantity > stock) {

            alert("Only " + stock + " in stock.");

            qtyInput.value = stock;

            return;
        }

        try {

            addButton.disabled = true;

            addButton.textContent = "Adding...";

            await addToCart(userId, product, quantity);

            addButton.textContent = "Added " + quantity + "!";

            addButton.style.backgroundColor = "#493B59";

            setTimeout(function () {

                addButton.textContent = "Add to Cart";

                addButton.style.backgroundColor = "";

                addButton.disabled = false;

                qtyInput.value = 1;

            }, 1500);

        } catch (error) {

            console.error("Add to Cart Error:", error);

            alert(error.message || "Unable to add product to cart. Please try again.");

            addButton.textContent = "Add to Cart";

            addButton.disabled = false;
        }

    });

    return wrapper;
}


// =============================================
// SEARCH PRODUCTS
// =============================================

searchInput.addEventListener("input", function () {

    applyProductFilters();

});


// =============================================
// SORT PRODUCTS
// =============================================

sortSelect.addEventListener("change", function () {

    applyProductFilters();

});


// =============================================
// APPLY FILTERS BUTTON
// =============================================

applyFilterButton.addEventListener("click", function () {

    applyProductFilters();

});


// =============================================
// FILTER AND SORT PRODUCTS
// =============================================

function applyProductFilters() {

    let filteredProducts = allProducts.filter(function (product) {

        // ACTIVE PRODUCTS

        if (product.status !== "active") {
            return false;
        }

        // SEARCH FILTER

        const searchText = searchInput.value.toLowerCase().trim();

        const title = (product.title || "").toLowerCase();

        const description =
            (product.description || "").toLowerCase();

        const matchesSearch =
            title.includes(searchText) ||
            description.includes(searchText);

        // CATEGORY FILTER

        const selectedCategory = categoryFilter.value;

        const matchesCategory =
            !selectedCategory ||
            product.cat_id === selectedCategory;

        // PRICE FILTER

        const minPrice = minPriceInput.value === ""
            ? 0
            : Number(minPriceInput.value);

        const maxPrice = maxPriceInput.value === ""
            ? Infinity
            : Number(maxPriceInput.value);

        const productPrice = Number(product.price || 0);

        const matchesPrice =
            productPrice >= minPrice &&
            productPrice <= maxPrice;

        return (
            matchesSearch &&
            matchesCategory &&
            matchesPrice
        );

    });

    // SORT PRODUCTS

    const sortValue = sortSelect.value;

    if (sortValue === "low") {

        filteredProducts.sort(function (a, b) {
            return Number(a.price) - Number(b.price);
        });

    }

    if (sortValue === "high") {

        filteredProducts.sort(function (a, b) {
            return Number(b.price) - Number(a.price);
        });

    }

    if (sortValue === "name") {

        filteredProducts.sort(function (a, b) {
            return (a.title || "").localeCompare(b.title || "");
        });

    }

    // DISPLAY FILTERED PRODUCTS

    displayProducts(filteredProducts);

}


// =============================================
// START PRODUCTS PAGE
// =============================================

loadProductsPage();
