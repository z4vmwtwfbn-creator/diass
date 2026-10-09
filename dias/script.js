const books = [
  {id:1,title:"Ұлы дала тарихы",author:"Қ. Сейітов",price:4990,category:"Көркем әдебиет",cover:"cover-green"},
  {id:2,title:"Python негіздері",author:"А. Нұрлан",price:6500,category:"IT",cover:"cover-blue"},
  {id:3,title:"Ойлау күші",author:"М. Әлиев",price:5200,category:"Даму",cover:"cover-brown"},
  {id:4,title:"Жасанды интеллект",author:"Д. Қасым",price:7900,category:"IT",cover:"cover-purple"},
  {id:5,title:"Ғылым әлемі",author:"Е. Сәрсен",price:6200,category:"Ғылым",cover:"cover-red"},
  {id:6,title:"Бай болудың жолы",author:"А. Бек",price:5800,category:"Даму",cover:"cover-orange"},
  {id:7,title:"Қазақ әдебиеті",author:"С. Омаров",price:4500,category:"Көркем әдебиет",cover:"cover-green"},
  {id:8,title:"JavaScript Pro",author:"Н. Айдар",price:7200,category:"IT",cover:"cover-blue"}
];

const $ = id => document.getElementById(id);
const getJSON = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};

let currentUser = getJSON("kitapUser", null);
let cart = getJSON("kitapCart", []);
let favorites = getJSON("kitapFavorites", []);
let orders = getJSON("kitapOrders", []);

function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function formatPrice(n) { return Number(n).toLocaleString("kk-KZ"); }

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  renderAll();
  if (currentUser) openApplication(); else showAuth();
});

function bindEvents() {
  $("showRegister").addEventListener("click", () => {
    $("loginBox").classList.add("hidden");
    $("registerBox").classList.remove("hidden");
  });

  $("showLogin").addEventListener("click", () => {
    $("registerBox").classList.add("hidden");
    $("loginBox").classList.remove("hidden");
  });

  $("registerForm").addEventListener("submit", register);
  $("loginForm").addEventListener("submit", login);
  $("logoutBtn").addEventListener("click", logout);
  $("checkoutBtn").addEventListener("click", checkout);

  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.addEventListener("click", () => openPage(btn.dataset.page));
  });

  document.querySelectorAll("[data-category]").forEach(btn => {
    btn.addEventListener("click", () => {
      const category = btn.dataset.category;
      openPage("books");
      setFilter(category);
    });
  });

  $("dashboardSearchBtn").addEventListener("click", () => {
    openPage("books");
    setTimeout(() => $("bookSearch").focus(), 50);
  });

  $("bookSearch").addEventListener("input", applyFilters);

  document.querySelectorAll(".filter").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
      applyFilters();
    });
  });
}

function showAuth() {
  $("authPage").classList.remove("hidden");
  $("app").classList.add("hidden");
}

function openApplication() {
  $("authPage").classList.add("hidden");
  $("app").classList.remove("hidden");
  updateUserInfo();
  updateCartCount();
  openPage("dashboard");
}

function register(e) {
  e.preventDefault();
  const name = $("registerName").value.trim();
  const email = $("registerEmail").value.trim().toLowerCase();
  const phone = $("registerPhone").value.trim();
  const password = $("registerPassword").value;
  const password2 = $("registerPassword2").value;

  if (password.length < 6) return authMessage("registerMessage","Құпия сөз кемінде 6 таңба болуы керек!","error");
  if (password !== password2) return authMessage("registerMessage","Құпия сөздер сәйкес емес!","error");

  const old = getJSON("registeredUser", null);
  if (old && old.email === email) {
    return authMessage("registerMessage","Бұл email бұрын тіркелген. Кіру бөлімін қолданыңыз.","error");
  }

  const user = {name,email,phone,password};
  save("registeredUser", user);
  save("kitapUser", user);
  currentUser = user;

  authMessage("registerMessage","Тіркелу сәтті аяқталды! 🎉","success");
  setTimeout(openApplication, 400);
}

function login(e) {
  e.preventDefault();

  const email = $("loginEmail").value.trim().toLowerCase();
  const password = $("loginPassword").value;
  const user = getJSON("registeredUser", null);

  if (!user) return authMessage("loginMessage","Алдымен «Тіркелу» арқылы аккаунт жасаңыз.","error");

  if (user.email !== email || user.password !== password) {
    return authMessage("loginMessage","Email немесе құпия сөз қате!","error");
  }

  currentUser = user;
  save("kitapUser", user);
  authMessage("loginMessage","Сәтті кірдіңіз! 👋","success");
  setTimeout(openApplication, 350);
}

function logout() {
  localStorage.removeItem("kitapUser");
  currentUser = null;
  showAuth();
  $("loginForm").reset();
  toast("Аккаунттан шықтыңыз");
}

function authMessage(id,text,type) {
  const el = $(id);
  el.textContent = text;
  el.className = "message " + type;
}

function updateUserInfo() {
  if (!currentUser) return;
  $("topUserName").textContent = currentUser.name;
  $("profileName").textContent = currentUser.name;
  $("profileEmail").textContent = currentUser.email;
  $("profilePhone").textContent = currentUser.phone;
}

function openPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
  const target = $(page + "Page");
  if (target) target.classList.add("active-page");

  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });
  window.scrollTo({top:0,behavior:"smooth"});
}

function createBookCard(book) {
  const fav = favorites.includes(book.id);
  return `
    <article class="book-card">
      <div class="book-cover ${book.cover}">${book.title}</div>
      <div class="book-info">
        <h3>${book.title}</h3>
        <p class="book-author">${book.author}</p>
        <small>${book.category}</small>
        <div class="book-bottom">
          <span class="price">${formatPrice(book.price)} ₸</span>
          <div class="book-actions">
            <button class="favorite-btn" onclick="toggleFavorite(${book.id})">${fav ? "❤️" : "♡"}</button>
            <button class="buy-btn" onclick="addToCart(${book.id})">🛒</button>
          </div>
        </div>
      </div>
    </article>`;
}

function renderAll() {
  renderBooks();
  renderFavorites();
  renderCart();
  renderOrders();
  updateCartCount();
}

function renderBooks(filter="all", search="") {
  const query = search.toLowerCase().trim();
  const filtered = books.filter(b =>
    (filter === "all" || b.category === filter) &&
    (b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query))
  );

  $("dashboardBooks").innerHTML = books.slice(0,4).map(createBookCard).join("");
  $("allBooks").innerHTML = filtered.length
    ? filtered.map(createBookCard).join("")
    : `<div class="empty-state"><div>🔎</div><h2>Кітап табылмады</h2><p>Басқа атау немесе автор енгізіңіз.</p></div>`;
}

function applyFilters() {
  const active = document.querySelector(".filter.active");
  renderBooks(active ? active.dataset.filter : "all", $("bookSearch").value);
}

function setFilter(category) {
  document.querySelectorAll(".filter").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === category);
  });
  $("bookSearch").value = "";
  renderBooks(category, "");
}

function addToCart(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;
  const item = cart.find(x => x.id === id);
  if (item) item.quantity++;
  else cart.push({id,quantity:1});
  save("kitapCart",cart);
  renderCart();
  updateCartCount();
  toast(`«${book.title}» себетке қосылды 🛒`);
}

function removeFromCart(id) {
  cart = cart.filter(x => x.id !== id);
  save("kitapCart",cart);
  renderCart();
  updateCartCount();
}

function renderCart() {
  let total = 0;

  if (!cart.length) {
    $("cartContainer").innerHTML = `<div class="empty-state"><div>🛒</div><h2>Себет бос</h2><p>Ұнаған кітаптарды себетке қосыңыз.</p></div>`;
  } else {
    $("cartContainer").innerHTML = cart.map(item => {
      const book = books.find(b => b.id === item.id);
      if (!book) return "";
      total += book.price * item.quantity;
      return `<div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-mini-cover">${book.title}</div>
          <div><h3>${book.title}</h3><p>${book.author}</p><p>${formatPrice(book.price)} ₸ × ${item.quantity}</p></div>
        </div>
        <button class="remove-btn" onclick="removeFromCart(${book.id})">Өшіру</button>
      </div>`;
    }).join("");
  }

  $("cartTotal").textContent = formatPrice(total) + " ₸";
  $("finalTotal").textContent = formatPrice(total) + " ₸";
}

function updateCartCount() {
  $("cartCount").textContent = cart.reduce((sum,x) => sum + x.quantity, 0);
}

function toggleFavorite(id) {
  if (favorites.includes(id)) favorites = favorites.filter(x => x !== id);
  else favorites.push(id);
  save("kitapFavorites",favorites);
  renderBooks();
  renderFavorites();
}

function renderFavorites() {
  const list = books.filter(b => favorites.includes(b.id));
  $("favoritesContainer").innerHTML = list.length
    ? list.map(createBookCard).join("")
    : `<div class="empty-state"><div>❤️</div><h2>Таңдаулылар бос</h2><p>Ұнаған кітаптарға ❤️ басыңыз.</p></div>`;
}

function checkout() {
  if (!cart.length) return toast("Себет бос!");

  let total = 0;
  cart.forEach(item => {
    const book = books.find(b => b.id === item.id);
    if (book) total += book.price * item.quantity;
  });

  orders.unshift({
    id: Math.floor(10000 + Math.random()*90000),
    date: new Date().toLocaleDateString("kk-KZ"),
    items: [...cart],
    total
  });

  save("kitapOrders",orders);
  cart = [];
  save("kitapCart",cart);
  renderCart();
  renderOrders();
  updateCartCount();
  toast("Тапсырыс қабылданды! 🎉");
  setTimeout(() => openPage("orders"), 500);
}

function renderOrders() {
  if (!orders.length) {
    $("ordersContainer").innerHTML = `<div class="empty-state"><div>📦</div><h2>Тапсырыс жоқ</h2><p>Кітап сатып алған кезде тапсырыстарыңыз осында көрінеді.</p></div>`;
    return;
  }

  $("ordersContainer").innerHTML = orders.map(o => `
    <div class="cart-item">
      <div><h3>Тапсырыс #${o.id}</h3><p>${o.date}</p><p>${o.items.length} кітап</p></div>
      <strong class="price">${formatPrice(o.total)} ₸</strong>
    </div>`).join("");
}

function toast(text) {
  const el = $("toast");
  el.textContent = text;
  el.style.display = "block";
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.style.display = "none", 2300);
}

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.toggleFavorite = toggleFavorite;
