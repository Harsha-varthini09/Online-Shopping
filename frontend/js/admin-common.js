
// =============================================
// ELEGANCE STORE - SHARED ADMIN HELPERS
// =============================================


// HIGHLIGHT THE CURRENT PAGE IN THE ADMIN MENU

(function () {

    const page = window.location.pathname.split("/").pop() || "admin.html";

    document.querySelectorAll(".nav-links a").forEach(function (link) {
        if (link.getAttribute("href") === page) {
            link.classList.add("active");
        }
    });

})();


// =============================================
// FORMATTING
// =============================================

function formatMoney(value) {

    return "₹" + Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDateTime(value) {

    if (!(value instanceof Date) || isNaN(value)) {
        return "-";
    }

    return value.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// YYYY-MM-DD FOR <input type="date">
function toInputDate(date) {

    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

    return local.toISOString().slice(0, 10);
}

// TURN TWO DATE INPUTS INTO A [start, end] RANGE (WHOLE DAYS)
function getDateRange(fromInput, toInput) {

    const from = fromInput.value
        ? new Date(fromInput.value + "T00:00:00")
        : new Date(0);

    const to = toInput.value
        ? new Date(toInput.value + "T23:59:59.999")
        : new Date(8640000000000000);

    return { from: from, to: to };
}


// =============================================
// FIRESTORE DOCUMENTS -> OBJECTS
// =============================================

// Adds _docId (the Firestore document ID) to every object
function documentsToObjects(documents) {

    return (documents || []).map(function (document) {

        const item = convertFromFirestoreDocument(document);

        item._docId = getDocumentId(document);

        return item;
    });
}

function getCategoryId(category) {
    return category.id || category.categoryId || category._docId;
}

function getCategoryLabel(category) {
    return category.name || category.categoryName || getCategoryId(category);
}

// Map of category id -> name
function buildCategoryMap(categories) {

    const map = {};

    categories.forEach(function (category) {
        map[getCategoryId(category)] = getCategoryLabel(category);
    });

    return map;
}

// Normalise an order read from Firestore
function normaliseOrder(order) {

    order.order_id = order.order_id || order._docId;

    order.total_amount = Number(order.total_amount || 0);

    order.payment_method = String(order.payment_method || "cash").toLowerCase();

    order.order_status = String(order.order_status || "pending").toLowerCase();

    order.items = order.items || [];

    return order;
}


// =============================================
// TOAST MESSAGES
// =============================================

let toastTimer = null;

function showToast(message, type) {

    let toast = document.getElementById("admin-toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "admin-toast";
        toast.setAttribute("role", "status");
        document.body.appendChild(toast);
    }

    toast.className = "toast show " + (type || "");

    toast.textContent = message;

    clearTimeout(toastTimer);

    toastTimer = setTimeout(function () {
        toast.className = "toast " + (type || "");
    }, 3200);
}

// Readable message from any error
function getErrorMessage(error) {

    if (!error) {
        return "Something went wrong.";
    }

    if (error.status === 403) {
        return "Permission denied by Firestore rules.";
    }

    return (
        (error.error && error.error.message) ||
        error.message ||
        "Something went wrong."
    );
}


// =============================================
// MODALS
// =============================================

function openModal(id) {

    const modal = document.getElementById(id);

    modal.classList.add("open");

    const firstField = modal.querySelector("input:not([readonly]):not([type=hidden]), select, textarea");

    if (firstField) {
        setTimeout(function () { firstField.focus(); }, 50);
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove("open");
}

// CLOSE ON BACKDROP CLICK / ESC
document.addEventListener("click", function (event) {
    if (event.target.classList && event.target.classList.contains("modal-backdrop")) {
        event.target.classList.remove("open");
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        document.querySelectorAll(".modal-backdrop.open").forEach(function (modal) {
            modal.classList.remove("open");
        });
    }
});


// YES / NO CONFIRMATION -> Promise<boolean>
function confirmAction(title, message) {

    return new Promise(function (resolve) {

        let backdrop = document.getElementById("confirm-modal");

        if (!backdrop) {

            backdrop = document.createElement("div");
            backdrop.id = "confirm-modal";
            backdrop.className = "modal-backdrop";

            backdrop.innerHTML = `
                <div class="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
                    <h3 id="confirm-title"></h3>
                    <p class="confirm-text" id="confirm-message"></p>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-outline" id="confirm-no">No</button>
                        <button type="button" class="btn btn-danger" id="confirm-yes">Yes</button>
                    </div>
                </div>`;

            document.body.appendChild(backdrop);
        }

        backdrop.querySelector("#confirm-title").textContent = title;
        backdrop.querySelector("#confirm-message").textContent = message;

        const yes = backdrop.querySelector("#confirm-yes");
        const no = backdrop.querySelector("#confirm-no");

        function finish(answer) {
            backdrop.classList.remove("open");
            yes.onclick = null;
            no.onclick = null;
            observer.disconnect();
            resolve(answer);
        }

        // Closing with Esc / backdrop counts as "No"
        const observer = new MutationObserver(function () {
            if (!backdrop.classList.contains("open")) {
                finish(false);
            }
        });

        yes.onclick = function () { finish(true); };
        no.onclick = function () { finish(false); };

        backdrop.classList.add("open");

        observer.observe(backdrop, { attributes: true, attributeFilter: ["class"] });

        no.focus();
    });
}


// =============================================
// TABLES
// =============================================
// columns: [{ label, value(row), num?, render?(row) -> Node|string }]

function renderDataTable(container, columns, rows, options) {

    options = options || {};

    container.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.className = "table-wrap";

    const table = document.createElement("table");
    table.className = "data-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");

    columns.forEach(function (column) {
        const th = document.createElement("th");
        th.textContent = column.label;
        if (column.num) th.className = "num";
        headRow.appendChild(th);
    });

    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    if (rows.length === 0) {

        const tr = document.createElement("tr");
        const td = document.createElement("td");

        td.colSpan = columns.length;
        td.className = "empty-row";
        td.textContent = options.emptyText || "No records found.";

        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    rows.forEach(function (row) {

        const tr = document.createElement("tr");

        columns.forEach(function (column) {

            const td = document.createElement("td");

            if (column.num) td.className = "num";

            const content = column.render
                ? column.render(row)
                : column.value(row);

            if (content instanceof Node) {
                td.appendChild(content);
            } else {
                td.textContent = content ?? "-";
            }

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);

    if (options.footer && rows.length > 0) {

        const tfoot = document.createElement("tfoot");
        const tr = document.createElement("tr");

        options.footer.forEach(function (value, index) {
            const td = document.createElement("td");
            td.textContent = value ?? "";
            if (columns[index] && columns[index].num) td.className = "num";
            tr.appendChild(td);
        });

        tfoot.appendChild(tr);
        table.appendChild(tfoot);
    }

    wrap.appendChild(table);
    container.appendChild(wrap);
}

// SMALL BADGE ELEMENT
function makeBadge(text, type) {

    const badge = document.createElement("span");

    badge.className = "badge" + (type ? " badge-" + type : "");

    badge.textContent = text;

    return badge;
}

// SMALL BUTTON ELEMENT
function makeButton(text, className, onClick) {

    const button = document.createElement("button");

    button.type = "button";
    button.className = "btn btn-sm " + (className || "");
    button.textContent = text;
    button.addEventListener("click", onClick);

    return button;
}


// =============================================
// CSV EXPORT
// =============================================

function downloadCsv(fileName, columns, rows, footer) {

    function cell(value) {
        const text = String(value ?? "");
        return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
    }

    const lines = [
        columns.map(function (column) { return cell(column.label); }).join(",")
    ];

    rows.forEach(function (row) {
        lines.push(columns.map(function (column) {
            return cell(column.value(row));
        }).join(","));
    });

    if (footer) {
        lines.push(footer.map(cell).join(","));
    }

    // BOM so Excel shows ₹ correctly
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
}
