
// =============================================
// ELEGANCE STORE - PRODUCTS PAGE
// =============================================

// STORE PRODUCTS AND CATEGORIES

let allProducts = [];
let allCategories = [];


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
                return convertFromFirestoreDocument(document);
            });

        allCategories = (categoryResponse.documents || [])
            .map(function (document) {
                return convertFromFirestoreDocument(document);
            });

        // LOAD CATEGORY OPTIONS

        loadCategoryOptions();

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

function displayProducts(products) {

    productGrid.innerHTML = "";

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

        return;
    }

    activeProducts.forEach(function (product) {

        // CREATE PRODUCT CARD

        const productCard = document.createElement("div");

        productCard.className = "product-card";

        // PRODUCT IMAGE

        const image = document.createElement("img");

        image.className = "product-image";

        image.src = "https://placehold.co/400x300?text=Product";

        image.alt = product.title || "Product";

        // PRODUCT INFORMATION

        const details = document.createElement("div");

        details.className = "product-info";

        const category = document.createElement("p");

        category.className = "product-category";

        category.textContent = getCategoryName(product.cat_id);

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

        productCard.appendChild(image);
        productCard.appendChild(details);

        productGrid.appendChild(productCard);

    });

}


// =============================================
// CREATE ADD TO CART BUTTON
// =============================================

function createAddToCartButton(product) {

    const addButton = document.createElement("button");

    addButton.className = "btn";
    addButton.type = "button";
    addButton.textContent = "Add to Cart";

    // CHECK PRODUCT STOCK

    addButton.disabled = Number(product.qty || 0) <= 0;

    if (addButton.disabled) {

        addButton.textContent = "Out of Stock";

        return addButton;
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

        try {

            addButton.disabled = true;

            addButton.textContent = "Adding...";

            await addToCart(userId, product);

            addButton.textContent = "Added to Cart!";

            addButton.style.backgroundColor = "#493B59";

            setTimeout(function () {

                addButton.textContent = "Add to Cart";

                addButton.style.backgroundColor = "";

                addButton.disabled = false;

            }, 1500);

        } catch (error) {

            console.error("Add to Cart Error:", error);

            alert("Unable to add product to cart. Please try again.");

            addButton.textContent = "Add to Cart";

            addButton.disabled = false;
        }

    });

    return addButton;
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
