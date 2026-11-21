
// =====================================
// REPORT MANAGEMENT API
// =====================================


// GET DATA REQUIRED FOR CUSTOMER REPORTS
async function getCustomerReportData() {

    const results = await Promise.all([
        getCustomers(),
        getAllOrders()
    ]);

    return {
        customers: results[0],
        orders: results[1]
    };
}


// GET DATA REQUIRED FOR INVENTORY REPORTS
async function getInventoryReportData() {

    const results = await Promise.all([
        getProducts(),
        getCategories()
    ]);

    return {
        products: results[0],
        categories: results[1]
    };
}


// GET DATA REQUIRED FOR SALES REPORTS
async function getSalesReportData() {

    const results = await Promise.all([
        getProducts(),
        getCategories(),
        getAllOrders()
    ]);

    return {
        products: results[0],
        categories: results[1],
        orders: results[2]
    };
}
