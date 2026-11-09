
const products = [
  {
    id: 1,
    name: "Men's White Shirt",
    price: 799,
    image: "https://images.unsplash.com/photo-1603252110481-7ba873bf42ab?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 2,
    name: "Women's Floral Dress",
    price: 1199,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 3,
    name: "Blue Denim Jeans",
    price: 1499,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 4,
    name: "Black Hoodie",
    price: 999,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 5,
    name: "Cotton T-Shirt",
    price: 499,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80"
  }
];

const productList = document.getElementById('productList');
const cartItems = document.getElementById('cartItems');
const totalSpan = document.getElementById('total');

let total = 0;

// Display products
function showProducts() {
  productList.innerHTML = "";

  products.forEach(product => {
    const div = document.createElement('div');
    div.classList.add('product');

    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.name;
    img.loading = 'lazy';

    img.onerror = function () {
      this.onerror = null;
      this.alt = `${product.name} image unavailable`;
      this.style.visibility = 'hidden';
      this.parentElement.classList.add('image-unavailable');
    };

    const heading = document.createElement('h3');
    heading.textContent = product.name;

    const price = document.createElement('p');
    price.textContent = `Price: ₹${product.price}`;

    const button = document.createElement('button');
    button.textContent = 'Add to Cart';
    button.addEventListener('click', () => addToCart(product.id));

    div.appendChild(img);
    div.appendChild(heading);
    div.appendChild(price);
    div.appendChild(button);

    productList.appendChild(div);
  });
}

// Add to Cart
function addToCart(id) {
  const item = products.find(product => product.id === id);

  if (!item) {
    return;
  }

  const li = document.createElement('li');
  li.textContent = `${item.name} - ₹${item.price}`;

  cartItems.appendChild(li);

  total += item.price;
  totalSpan.textContent = total;
}

// Payment
function proceedToPayment() {
  const name = document.getElementById('custName').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const method = document.getElementById('paymentMethod').value;

  if (!name || !address || !method) {
    alert("Please fill in all payment details!");
    return;
  }

  if (cartItems.children.length === 0) {
    alert("Your shopping cart is empty!");
    return;
  }

  if (method === "gpay") {
    window.open("https://pay.google.com/", "_blank");
  } else if (method === "paytm") {
    window.open("https://paytm.com/", "_blank");
  } else if (method === "phonepe") {
    window.open("https://www.phonepe.com/", "_blank");
  } else {
    alert("Order placed successfully! Pay with cash on delivery.");
  }

  alert("✅ Payment Processed Successfully!\nThank you for shopping with us!");

  cartItems.innerHTML = "";
  total = 0;
  totalSpan.textContent = total;
}

// Signup
function signup() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;

  if (!name || !email || !password) {
    alert("Please fill all fields!");
    return;
  }

  localStorage.setItem(
    "user",
    JSON.stringify({ name, email, password })
  );

  alert("Account created successfully!");
  showLogin();
}

// Login
function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  const user = JSON.parse(localStorage.getItem("user"));

  if (user && user.email === email && user.password === password) {
    alert("Login successful!");
    showStore();
  } else {
    alert("Invalid email or password!");
  }
}

// Logout
function logout() {
  alert("Logged out successfully!");
  showLogin();
}

// Navigation
function showSignup() {
  document.getElementById('loginPage').style.display = "none";
  document.getElementById('signupPage').style.display = "block";
  document.getElementById('storePage').style.display = "none";
}

function showLogin() {
  document.getElementById('loginPage').style.display = "block";
  document.getElementById('signupPage').style.display = "none";
  document.getElementById('storePage').style.display = "none";
}

function showStore() {
  document.getElementById('loginPage').style.display = "none";
  document.getElementById('signupPage').style.display = "none";
  document.getElementById('storePage').style.display = "block";

  showProducts();
}
