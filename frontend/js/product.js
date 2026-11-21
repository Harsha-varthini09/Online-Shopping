
// =============================================
// ELEGANCE STORE - PRODUCTS PAGE
// =============================================


// STORE PRODUCTS AND CATEGORIES

let allProducts = [];
let allCategories = [];


// GET HTML ELEMENTS

const productGrid =
    document.getElementById("product-grid");

const searchInput =
    document.getElementById("product-search");

const sortSelect =
    document.getElementById("sort-products");

const categoryFilter =
    document.getElementById("category-filter");

const minPriceInput =
    document.getElementById("min-price");

const maxPriceInput =
    document.getElementById("max-price");

const applyFilterButton =
    document.getElementById("apply-filter");


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
                <p>
                    Please log in again and refresh this page.
                </p>
                <p>
                    Check the browser console for details.
                </p>
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

        option.value =
            category.categoryId || category.id || "";

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

// =====================================
// ADD TO CART BUTTON
// =====================================

const addButton = document.createElement("button");

addButton.className = "btn";

addButton.type = "button";

addButton.textContent = "Add to Cart";

addButton.disabled = Number(product.qty || 0) <= 0;

if (addButton.disabled) {
    addButton.textContent = "Out of Stock";
}


// ADD PRODUCT TO FIRESTORE CART

addButton.addEventListener("click", async function () {

    const userId = sessionStorage.getItem("firebaseUserId");

    const token = sessionStorage.getItem("firebaseIdToken");

    // CHECK LOGIN STATUS

    if (!userId || !token) {

        alert("Please log in before adding products to your cart.");

        window.location.href = "login.html";

        return;

    }


    try {

        addButton.disabled = true;

        addButton.textContent = "Adding...";


        // SAVE PRODUCT TO FIRESTORE

        await addToCart(userId, product);


        // DISPLAY SUCCESS MESSAGE

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
// APPLY FILTERS
// =============================================

applyFilterButton.addEventListener("click", function () {

    applyProductFilters();

});


// =============================================
// FILTER AND SORT FUNCTION
// =============================================

function applyProductFilters() {

    let filteredProducts = allProducts.filter(function (product) {

        // ACTIVE PRODUCTS ONLY

        if (product.status !== "active") {
            return false;
        }


        // SEARCH FILTER

        const searchText =
            searchInput.value.toLowerCase().trim();

        const title =
            (product.title || "").toLowerCase();

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

        const minPrice =
            minPriceInput.value === ""
                ? 0
                : Number(minPriceInput.value);

        const maxPrice =
            maxPriceInput.value === ""
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
