
// =============================================
// ELEGANCE STORE - PRODUCT IMAGES
// =============================================
// Picks an image for every product:
// 1. The product's own image field (image_url / imageUrl / image), if set
// 2. Otherwise a photo matched from keywords in the title / description / category
// 3. Otherwise a stable photo from a general pool (same product -> same image)


const UNSPLASH = "https://images.unsplash.com/";
const IMAGE_SIZE = "?auto=format&fit=crop&w=600&q=70";


// KEYWORD -> IMAGE (FIRST MATCH WINS, SO SPECIFIC WORDS COME FIRST)

const PRODUCT_IMAGE_KEYWORDS = [
    { words: ["headphone", "headset", "earphone", "earbud", "airpod"], photo: "photo-1505740420928-5e560c06d30e" },
    { words: ["speaker", "sound", "audio"], photo: "photo-1608043152269-423dbba4e7e1" },
    { words: ["watch", "smartwatch", "clock"], photo: "photo-1523275335684-37898b6baf30" },
    { words: ["sunglass", "glasses", "eyewear", "goggle"], photo: "photo-1572635196237-14b3f281503f" },
    { words: ["shoe", "sneaker", "footwear", "boot", "sandal", "slipper", "heel"], photo: "photo-1542291026-7eec264c27ff" },
    { words: ["camera", "lens", "dslr"], photo: "photo-1526170375885-4d8ecf77b99f" },
    { words: ["laptop", "notebook pc", "computer", "macbook"], photo: "photo-1496181133206-80ce9b88a853" },
    { words: ["keyboard", "mouse"], photo: "photo-1587829741301-dc798b83add3" },
    { words: ["phone", "mobile", "smartphone", "iphone", "android"], photo: "photo-1511707171634-5f897ff02aa9" },
    { words: ["backpack", "rucksack"], photo: "photo-1553062407-98eeb64c6a62" },
    { words: ["bag", "handbag", "purse", "wallet", "tote", "clutch"], photo: "photo-1584917865442-de89df76afd3" },
    { words: ["perfume", "fragrance", "cologne", "scent"], photo: "photo-1541643600914-78b084683601" },
    { words: ["cream", "skincare", "lotion", "serum", "cosmetic", "makeup", "lipstick", "beauty"], photo: "photo-1556228578-8c89e6adf883" },
    { words: ["necklace", "ring", "earring", "bracelet", "jewel", "pendant"], photo: "photo-1515562141207-7a88fb7ce338" },
    { words: ["dress", "gown", "saree", "kurti", "skirt"], photo: "photo-1595777457583-95e059d581b8" },
    { words: ["jacket", "coat", "hoodie", "sweater", "blazer"], photo: "photo-1551028719-00167b16eac5" },
    { words: ["jean", "denim", "trouser", "pant"], photo: "photo-1542272604-787c3835535d" },
    { words: ["t-shirt", "tshirt", "tee"], photo: "photo-1521572163474-6864f9cf17ab" },
    { words: ["shirt", "top", "blouse"], photo: "photo-1596755094514-f87e34085b2c" },
    { words: ["book", "novel", "diary"], photo: "photo-1544947950-fa07a98d237f" },
    { words: ["mug", "cup", "coffee", "tea"], photo: "photo-1514228742587-6b1558fcca3d" },
    { words: ["bottle", "flask", "tumbler"], photo: "photo-1602143407151-7111542de6e8" },
    { words: ["lamp", "light", "candle"], photo: "photo-1507473885765-e6ed057f782c" },
    { words: ["chair", "sofa", "table", "furniture", "desk"], photo: "photo-1567538096630-e0c55bd6374c" },
    { words: ["plant", "pot", "garden", "flower"], photo: "photo-1485955900006-10f4d324d411" },
    { words: ["electronic", "gadget", "device"], photo: "photo-1498049794561-7780e7231661" },
    { words: ["fashion", "cloth", "apparel", "wear"], photo: "photo-1489987707025-afc232f7ea0f" },
    { words: ["accessor"], photo: "photo-1523275335684-37898b6baf30" },
    { words: ["home", "living", "decor", "kitchen"], photo: "photo-1556228453-efd6c1ff04f6" }
];


// GENERAL POOL FOR PRODUCTS WITH NO KEYWORD MATCH

const PRODUCT_IMAGE_POOL = [
    "photo-1441986300917-64674bd600d8",
    "photo-1483985988355-763728e1935b",
    "photo-1523275335684-37898b6baf30",
    "photo-1505740420928-5e560c06d30e",
    "photo-1542291026-7eec264c27ff",
    "photo-1572635196237-14b3f281503f",
    "photo-1584917865442-de89df76afd3",
    "photo-1541643600914-78b084683601"
];


function getProductImageUrl(product, categoryName) {

    const ownImage =
        product.image_url ||
        product.imageUrl ||
        product.image;

    if (ownImage) {
        return ownImage;
    }

    const searchText = [
        product.title,
        categoryName,
        product.description
    ].join(" ").toLowerCase();

    const match = PRODUCT_IMAGE_KEYWORDS.find(function (entry) {
        return entry.words.some(function (word) {
            return searchText.includes(word);
        });
    });

    if (match) {
        return UNSPLASH + match.photo + IMAGE_SIZE;
    }

    // STABLE PICK BASED ON PRODUCT ID / TITLE

    const key = String(product.id || product.title || "product");

    let hash = 0;

    for (let i = 0; i < key.length; i++) {
        hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }

    return UNSPLASH +
        PRODUCT_IMAGE_POOL[hash % PRODUCT_IMAGE_POOL.length] +
        IMAGE_SIZE;
}


// SET IMAGE ON AN <img> WITH A SAFE FALLBACK

function setProductImage(imageElement, product, categoryName) {

    imageElement.loading = "lazy";

    imageElement.src = getProductImageUrl(product, categoryName);

    imageElement.onerror = function () {

        imageElement.onerror = null;

        imageElement.src =
            "https://placehold.co/600x450/EDE5F7/493B59?text=" +
            encodeURIComponent(product.title || "Product");
    };
}
