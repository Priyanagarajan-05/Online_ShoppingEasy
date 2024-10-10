
// Firebase Configuration (Add your Firebase config here)
const apiUrl = 'https://firestore.googleapis.com/v1/projects/cusotmerdetails/databases/(default)/documents/customerDetails';

// Event listener for the Login button
document.getElementById('loginBtn').addEventListener('click', function() {
    document.getElementById('loginOptions').classList.toggle('hidden');
});

// Event listener for Proceed button
document.getElementById('proceedLoginBtn').addEventListener('click', function() {
    const adminLoginSelected = document.getElementById('adminLoginRadio').checked;
    const customerLoginSelected = document.getElementById('customerLoginRadio').checked;

    if (adminLoginSelected) {
        window.location.href = 'adminLogin.html'; // Redirect to the admin login page
    } else if (customerLoginSelected) {
        document.getElementById('customerLoginSection').classList.remove('hidden');
        document.getElementById('loginOptions').classList.add('hidden');
    } else {
        alert('Please select a login type.');
    }
});

// Show Customer Signup form and hide login form
document.getElementById('signupBtn').addEventListener('click', function() {
    document.getElementById('customerSignupSection').classList.remove('hidden');
    document.getElementById('customerLoginSection').classList.add('hidden');
});

// Switch to Customer Login from Signup
document.getElementById('switchToLoginBtn').addEventListener('click', function() {
    document.getElementById('customerLoginSection').classList.remove('hidden');
    document.getElementById('customerSignupSection').classList.add('hidden');
});

// Customer Signup
document.getElementById('customerSignupForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const name = document.getElementById('signupName').value;
    const mobile = document.getElementById('signupMobile').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    // Prepare the new customer data
    const customerData = {
        fields: {
            customer_id: { integerValue: 1 }, // Set to start at 1
            name: { stringValue: name },
            mobile: { stringValue: mobile },
            email: { stringValue: email },
            password: { stringValue: password },
            credit_limit: { integerValue: 0 } // Set default credit limit to 0
        }
    };

    try {
        // Add new customer record to customerDetails
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customerData)
        });

        if (response.ok) {
            document.getElementById('signupMessage').textContent = 'Signup successful! Redirecting to login...';
            document.getElementById('customerSignupForm').reset();

            // Redirect to Customer Login after signup
            setTimeout(() => {
                document.getElementById('customerSignupSection').classList.add('hidden');
                document.getElementById('customerLoginSection').classList.remove('hidden');
                document.getElementById('signupMessage').textContent = ''; // Clear message
            }, 2000); // Redirect after 2 seconds
        } else {
            document.getElementById('signupMessage').textContent = 'Error signing up.';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('signupMessage').textContent = 'Network error. Please try again later.';
    }
});

// Customer Login
document.getElementById('customerLoginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        let loginSuccess = false;

        // Loop through customers and check if credentials match
        for (let customer of data.documents) {
            const customerEmail = customer.fields.email.stringValue;
            const customerPassword = customer.fields.password.stringValue;

            if (email === customerEmail && password === customerPassword) {
                loginSuccess = true;
                break;
            }
        }

        if (loginSuccess) {
            document.getElementById('customerLoginMessage').textContent = 'Login successful! Redirecting to home...';
            // Redirect to customer home page after successful login
            setTimeout(() => {
                window.location.href = 'displayProduct.html'; // Redirect to your customer home page
            }, 2000); // Redirect after 2 seconds
        } else {
            document.getElementById('customerLoginMessage').textContent = 'Incorrect email or password.';
        }
    } catch (error) {
        document.getElementById('customerLoginMessage').textContent = 'Network error.';
    }
});



