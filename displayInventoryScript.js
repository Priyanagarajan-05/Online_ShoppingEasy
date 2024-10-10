/* -- without pagination ---
let cart = []; // Initialize the cart as an empty array

// Function to fetch inventory data from Firestore
async function fetchInventory(isAdmin = false) {
    try {
        const response = await fetch(`https://firestore.googleapis.com/v1/projects/inventory-46f20/databases/(default)/documents/inventoryDetails`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${data.error.message}`);
        }

        if (!data.documents || data.documents.length === 0) {
            document.getElementById('inventoryList').innerText = 'No items found.';
            return;
        }

        displayInventory(data.documents, isAdmin);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        document.getElementById('inventoryList').innerText = 'Error fetching inventory: ' + error.message;
    }
}

// Function to display inventory items, filter deactivated items for customer view
function displayInventory(items, isAdmin = false) {
    const inventoryList = document.getElementById('inventoryList');
    inventoryList.innerHTML = ''; // Clear existing items

    // Arrays to hold limited stock and regular stock items
    const limitedStockItems = [];
    const regularStockItems = [];

    // Categorize items based on stock quantity
    items.forEach(item => {
        const id = item.name.split('/').pop(); // Get the document ID
        const fields = item.fields;

        // Check if the item is active
        const isActive = fields.IsActive ? fields.IsActive.booleanValue : true; // Default to active

        // If not an admin and the item is inactive, skip rendering it
        if (!isAdmin && !isActive) {
            return;
        }

        // Get the quantity of the item
        const quantity = fields.Quantity ? fields.Quantity.integerValue : 0;

        // Check if the item has limited stock (quantity < 20)
        if (quantity > 0 && quantity < 20) {
            limitedStockItems.push(item);
        } else {
            regularStockItems.push(item);
        }
    });

    // Function to create item cards
    const createItemCard = (item) => {
        const id = item.name.split('/').pop(); // Get the document ID
        const fields = item.fields;

        const quantity = fields.Quantity ? fields.Quantity.integerValue : 0;
        const isActive = fields.IsActive ? fields.IsActive.booleanValue : true;

        // Create an item card
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('item');

        // Create image element if exists
        const img = document.createElement('img');
        img.src = fields.ImageUrl ? fields.ImageUrl.stringValue : 'placeholder.jpg'; // Default placeholder image
        img.alt = fields.Title ? fields.Title.stringValue : 'No Title';
        itemDiv.appendChild(img);

        // Create other item details
        itemDiv.innerHTML += `<h3>${fields.Title ? fields.Title.stringValue : 'No Title'}</h3>`;
        itemDiv.innerHTML += `<p>${fields.Description ? fields.Description.stringValue : 'No Description'}</p>`;
        itemDiv.innerHTML += `<p>Price: $${fields.Price ? fields.Price.doubleValue.toFixed(2) : '0.00'}</p>`;

        // Check quantity and display accordingly
        if (quantity > 0) {
            // Create "Add to Cart" button if the item is in stock
            const addToCartButton = document.createElement('button');
            addToCartButton.classList.add('add-to-cart');
            addToCartButton.innerText = 'Add to Cart';
            addToCartButton.onclick = () => {
                addToCart(id, fields.Title.stringValue, fields.Price.doubleValue, fields.ImageUrl ? fields.ImageUrl.stringValue : 'placeholder.jpg'); // Pass document ID and other details to add to cart
            };
            itemDiv.appendChild(addToCartButton);
        } else {
            // Display "Out of Stock" message if the item is not in stock
            const outOfStockMessage = document.createElement('p');
            outOfStockMessage.innerText = 'Out of Stock';
            outOfStockMessage.classList.add('out-of-stock');
            itemDiv.appendChild(outOfStockMessage);
        }

        return itemDiv;
    };

    // Display limited stock items first
    if (limitedStockItems.length > 0) {
        const limitedStockHeader = document.createElement('h2');
        limitedStockHeader.innerText = 'Limited Stock: Hurry Up!';
        limitedStockHeader.style.color = 'red'; // Set text color to red
        inventoryList.appendChild(limitedStockHeader);

        limitedStockItems.forEach(item => {
            const itemCard = createItemCard(item);
            inventoryList.appendChild(itemCard);
        });
    }

    // Add a horizontal line to separate limited stock from other items
    if (limitedStockItems.length > 0 && regularStockItems.length > 0) {
        const separator = document.createElement('hr');
        inventoryList.appendChild(separator); // Add the line
    }

    // Display other items
    if (regularStockItems.length > 0) {
        regularStockItems.forEach(item => {
            const itemCard = createItemCard(item);
            inventoryList.appendChild(itemCard);
        });
    }
}

// Add this function in your existing inventory script
async function addToCart(itemId, title, price, imageUrl) {
    // Retrieve existing cart from session storage
    let cart = JSON.parse(sessionStorage.getItem('cart')) || [];

    const item = cart.find(i => i.id === itemId);
    if (item) {
        item.quantity += 1; // Increment quantity if item already in cart
    } else {
        cart.push({ id: itemId, title: title, price: price, quantity: 1, imageUrl: imageUrl }); // Add new item to cart
    }

    // Save updated cart to session storage
    sessionStorage.setItem('cart', JSON.stringify(cart));

    // Calculate total price
    const totalPrice = calculateTotalPrice(cart);

    // Optionally, you can also save the total price in session storage
    sessionStorage.setItem('totalPrice', totalPrice.toFixed(2));

    // Redirect to cart.html
    window.location.href = 'cart.html'; // Redirect to the cart page
}

// Function to calculate total price of items in the cart
function calculateTotalPrice(cart) {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Function to display the cart in cart.html
function displayCart() {
    const cartItems = JSON.parse(sessionStorage.getItem('cart')) || [];
    const cartList = document.getElementById('cartList');
    cartList.innerHTML = ''; // Clear existing items

    if (cartItems.length === 0) {
        cartList.innerHTML = '<p>Your cart is empty.</p>';
        return;
    }

    // Display cart items
    let totalPrice = 0;
    cartItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('cart-item');

        // Display item image
        const img = document.createElement('img');
        img.src = item.imageUrl; // Image URL from cart
        img.alt = item.title;
        img.classList.add('cart-item-image');

        itemDiv.innerHTML += `<h3>${item.title}</h3>`;
        itemDiv.innerHTML += `<p>Price: $${item.price.toFixed(2)}</p>`;
        itemDiv.innerHTML += `<p>Quantity: ${item.quantity}</p>`;
        
        // Calculate total price for this item
        const itemTotalPrice = item.price * item.quantity;
        totalPrice += itemTotalPrice;

        itemDiv.innerHTML += `<p>Total: $${itemTotalPrice.toFixed(2)}</p>`;
        cartList.appendChild(itemDiv);
    });

    // Display grand total price
    const totalDiv = document.createElement('div');
    totalDiv.innerHTML = `<h2>Grand Total: $${totalPrice.toFixed(2)}</h2>`;
    cartList.appendChild(totalDiv);
}

// Function to save cart to the server
async function saveCartToServer(cart) {
    try {
        const response = await fetch('YOUR_SERVER_ENDPOINT_HERE', {
            method: 'POST', // Assuming you use POST to save cart
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cart }), // Send the cart data
        });

        if (!response.ok) {
            throw new Error('Failed to save cart to server');
        }
        console.log('Cart saved to server successfully');
    } catch (error) {
        console.error('Error saving cart to server:', error);
    }
}

// Function to load cart from the server when the user logs in
async function loadCartFromServer() {
    try {
        const response = await fetch('YOUR_SERVER_GET_CART_ENDPOINT_HERE');
        const data = await response.json();

        if (data.cart) {
            cart = data.cart; // Update the local cart variable
            localStorage.setItem('cart', JSON.stringify(cart)); // Optionally save to local storage for quick access
        }
    } catch (error) {
        console.error('Error loading cart from server:', error);
    }
}

// Call fetchInventory when the page loads for the customer (only active items)
fetchInventory(false); // Pass 'false' for customer view where only active items should be shown

// Call loadCartFromServer when the user logs in (ensure the user is authenticated)
loadCartFromServer();
*/
let cart = JSON.parse(sessionStorage.getItem('cart')) || []; // Retrieve cart from session storage
let currentPage = 1;
const itemsPerPage = 10; // Number of items to display per page
let allItems = []; // Store all items fetched from Firestore

// Function to fetch inventory data from Firestore
async function fetchInventory(isAdmin = false) {
    try {
        const response = await fetch(`https://firestore.googleapis.com/v1/projects/inventory-46f20/databases/(default)/documents/inventoryDetails`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${data.error.message}`);
        }

        if (!data.documents || data.documents.length === 0) {
            document.getElementById('inventoryList').innerText = 'No items found.';
            return;
        }

        allItems = data.documents; // Store all items for pagination
        displayInventory(allItems, isAdmin);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        document.getElementById('inventoryList').innerText = 'Error fetching inventory: ' + error.message;
    }
}

// Function to display inventory items, filter deactivated items for customer view
function displayInventory(items, isAdmin = false) {
    const inventoryList = document.getElementById('inventoryList');
    inventoryList.innerHTML = ''; // Clear existing items

    // Calculate start and end index for pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, items.length);
    const paginatedItems = items.slice(startIndex, endIndex); // Get the items for the current page

    // Arrays to hold limited stock and regular stock items
    const limitedStockItems = [];
    const regularStockItems = [];

    // Categorize items based on stock quantity
    paginatedItems.forEach(item => {
        const id = item.name.split('/').pop(); // Get the document ID
        const fields = item.fields;

        // Check if the item is active
        const isActive = fields.IsActive ? fields.IsActive.booleanValue : true; // Default to active

        // If not an admin and the item is inactive, skip rendering it
        if (!isAdmin && !isActive) {
            return;
        }

        // Get the quantity of the item
        const quantity = fields.Quantity ? fields.Quantity.integerValue : 0;

        // Check if the item has limited stock (quantity < 20)
        if (quantity > 0 && quantity < 20) {
            limitedStockItems.push(item);
        } else {
            regularStockItems.push(item);
        }
    });

    // Function to create item cards
    const createItemCard = (item) => {
        const id = item.name.split('/').pop(); // Get the document ID
        const fields = item.fields;

        const quantity = fields.Quantity ? fields.Quantity.integerValue : 0;
        const isActive = fields.IsActive ? fields.IsActive.booleanValue : true;

        // Create an item card
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('item');

        // Create image element if exists
        const img = document.createElement('img');
        img.src = fields.ImageUrl ? fields.ImageUrl.stringValue : 'placeholder.jpg'; // Default placeholder image
        img.alt = fields.Title ? fields.Title.stringValue : 'No Title';
        itemDiv.appendChild(img);

        // Create other item details
        itemDiv.innerHTML += `<h3>${fields.Title ? fields.Title.stringValue : 'No Title'}</h3>`;
        itemDiv.innerHTML += `<p>${fields.Description ? fields.Description.stringValue : 'No Description'}</p>`;
        itemDiv.innerHTML += `<p>Price: $${fields.Price ? fields.Price.doubleValue.toFixed(2) : '0.00'}</p>`;

        // Check quantity and display accordingly
        if (quantity > 0) {
            // Create "Add to Cart" button if the item is in stock
            const addToCartButton = document.createElement('button');
            addToCartButton.classList.add('add-to-cart');
            addToCartButton.innerText = 'Add to Cart';
            addToCartButton.onclick = () => {
                addToCart(id, fields.Title.stringValue, fields.Price.doubleValue, fields.ImageUrl ? fields.ImageUrl.stringValue : 'placeholder.jpg'); // Pass document ID and other details to add to cart
            };
            itemDiv.appendChild(addToCartButton);
        } else {
            // Display "Out of Stock" message if the item is not in stock
            const outOfStockMessage = document.createElement('p');
            outOfStockMessage.innerText = 'Out of Stock';
            outOfStockMessage.classList.add('out-of-stock');
            itemDiv.appendChild(outOfStockMessage);
        }

        return itemDiv;
    };

    // Display limited stock items first
    if (limitedStockItems.length > 0) {
        const limitedStockHeader = document.createElement('h2');
        limitedStockHeader.innerText = 'Limited Stock: Hurry Up!';
        limitedStockHeader.style.color = 'red'; // Set text color to red
        inventoryList.appendChild(limitedStockHeader);

        limitedStockItems.forEach(item => {
            const itemCard = createItemCard(item);
            inventoryList.appendChild(itemCard);
        });
    }

    // Add a horizontal line to separate limited stock from other items
    if (limitedStockItems.length > 0 && regularStockItems.length > 0) {
        const separator = document.createElement('hr');
        inventoryList.appendChild(separator); // Add the line
    }

    // Display other items
    if (regularStockItems.length > 0) {
        regularStockItems.forEach(item => {
            const itemCard = createItemCard(item);
            inventoryList.appendChild(itemCard);
        });
    }

    // Update pagination button visibility
    document.getElementById('prevPageBtn').style.display = currentPage === 1 ? 'none' : 'inline-block';
    document.getElementById('nextPageBtn').style.display = endIndex >= items.length ? 'none' : 'inline-block';
}

// Add event listeners for pagination buttons
document.getElementById('prevPageBtn').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        displayInventory(allItems); // Pass all items to display
    }
});

document.getElementById('nextPageBtn').addEventListener('click', () => {
    if (currentPage * itemsPerPage < allItems.length) {
        currentPage++;
        displayInventory(allItems); // Pass all items to display
    }
});

// Function to add items to the cart
async function addToCart(itemId, title, price, imageUrl) {
    // Check if the cart is already in session storage
    let cart = JSON.parse(sessionStorage.getItem('cart')) || []; // Retrieve existing cart from session storage

    const item = cart.find(i => i.id === itemId);
    if (item) {
        item.quantity += 1; // Increment quantity if item already in cart
    } else {
        cart.push({ id: itemId, title: title, price: price, quantity: 1, imageUrl: imageUrl }); // Add new item to cart
    }

    // Save updated cart to session storage
    sessionStorage.setItem('cart', JSON.stringify(cart));

    // Redirect to cart.html
    window.location.href = 'cart.html'; // Redirect to the cart page
}

// Call fetchInventory when the page loads for the customer (only active items)
fetchInventory(false); // Pass 'false' for customer view where only active items should be shown
