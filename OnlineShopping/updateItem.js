// API endpoints
const CATEGORY_API = 'https://firestore.googleapis.com/v1/projects/inventory-46f20/databases/(default)/documents/categories';
const INVENTORY_API = 'https://firestore.googleapis.com/v1/projects/inventory-46f20/databases/(default)/documents:runQuery';

// Function to fetch category suggestions while typing
function searchCategories() {
    const query = document.getElementById('categorySearch').value;
    if (query.length < 2) {
        // Clear suggestions if the input is less than 2 characters
        document.getElementById('categorySuggestions').innerHTML = '';
        return;
    }

    // Fetch categories based on the search query
    fetch(`${CATEGORY_API}`)
        .then(response => response.json())
        .then(data => {
            const categories = data.documents;
            const filteredCategories = categories.filter(category => 
                category.fields.name.stringValue.toLowerCase().includes(query.toLowerCase())
            );
            displayCategorySuggestions(filteredCategories);
        })
        .catch(error => console.error('Error fetching categories:', error));
}

// Display category suggestions in the dropdown
function displayCategorySuggestions(categories) {
    const suggestionBox = document.getElementById('categorySuggestions');
    suggestionBox.innerHTML = '';  // Clear existing suggestions

    categories.forEach(category => {
        const suggestion = document.createElement('div');
        suggestion.textContent = category.fields.name.stringValue;
        suggestion.classList.add('suggestion');
        suggestion.onclick = () => selectCategory(category.fields.name.stringValue);
        suggestionBox.appendChild(suggestion);
    });

    // Hide suggestions box if there are no results
    if (categories.length === 0) {
        suggestionBox.innerHTML = '<div>No categories found</div>';
    }
}

// Fetch items based on the selected category using structured Firestore query
function selectCategory(category) {
    document.getElementById('categorySearch').value = category;
    document.getElementById('categorySuggestions').innerHTML = '';  // Clear suggestions

    // Query Firestore for items in the selected category using structured query
    const requestBody = {
        structuredQuery: {
            where: {
                fieldFilter: {
                    field: { fieldPath: 'category' },
                    op: 'EQUAL',
                    value: { stringValue: category }
                }
            },
            from: [{ collectionId: 'InventoryRecord' }]
        }
    };

    fetch(INVENTORY_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Response Data:', data);  // Debug: log the data
        const items = data.filter(doc => doc.document);  // Filter valid documents
        displayItems(items.map(doc => doc.document));
    })
    .catch(error => {
        console.error('Error fetching items:', error);
        alert('Error fetching items, please check the console for more details.');
    });
}

// Display items in table form
function displayItems(items) {
    const itemTable = document.getElementById('itemTable');
    const itemBody = document.getElementById('itemBody');
    itemTable.classList.remove('hidden');  // Show the table
    itemBody.innerHTML = '';  // Clear previous table rows

    if (!items || items.length === 0) {
        itemBody.innerHTML = '<tr><td colspan="7">No items found for this category</td></tr>';
        return;
    }

    items.forEach(item => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td><input type="text" value="${item.fields.title.stringValue}" id="title_${item.name}"></td>
            <td><input type="text" value="${item.fields.description.stringValue}" id="description_${item.name}"></td>
            <td><input type="number" value="${item.fields.price.integerValue}" id="price_${item.name}"></td>
            <td><input type="number" value="${item.fields.quantity.integerValue}" id="quantity_${item.name}"></td>
            <td><input type="checkbox" ${item.fields.isActive.booleanValue ? 'checked' : ''} id="active_${item.name}"></td>
            <td><input type="file" onchange="uploadImage(event, '${item.name}')"></td>
            <td><button onclick="updateItem('${item.name}')">Update</button></td>
        `;
        itemBody.appendChild(row);
    });
}

// Function to upload image and convert to URL
function uploadImage(event, itemId) {
    const file = event.target.files[0];
    if (!file) return;

    // Convert image to URL (use any suitable image storage API, here mocked for Firebase)
    const reader = new FileReader();
    reader.onload = function (e) {
        const imageUrl = e.target.result;  // Get image data as base64 URL
        // Optional: display uploaded image
        // document.getElementById(`image_${itemId}`).src = imageUrl;  
    };
    reader.readAsDataURL(file);
}

// Function to update item details in Firestore
function updateItem(itemId) {
    const title = document.getElementById(`title_${itemId}`).value;
    const description = document.getElementById(`description_${itemId}`).value;
    const price = document.getElementById(`price_${itemId}`).value;
    const quantity = document.getElementById(`quantity_${itemId}`).value;
    const isActive = document.getElementById(`active_${itemId}`).checked;

    const updatedData = {
        fields: {
            title: { stringValue: title },
            description: { stringValue: description },
            price: { integerValue: Number(price) },
            quantity: { integerValue: Number(quantity) },
            isActive: { booleanValue: isActive }
        }
    };

    fetch(`https://firestore.googleapis.com/v1/projects/inventory-46f20/databases/(default)/documents/InventoryRecord/${itemId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
    })
    .then(response => {
        if (response.ok) {
            alert('Item updated successfully!');
        } else {
            alert('Failed to update item.');
        }
    })
    .catch(error => console.error('Error updating item:', error));
}
