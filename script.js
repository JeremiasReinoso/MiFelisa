document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search");
  const chips = document.querySelectorAll(".chip");
  const productGrid = document.getElementById("productGrid");
  const products = [...document.querySelectorAll(".product")];
  const cartCount = document.getElementById("cartCount");
  const cartTotalMini = document.getElementById("cartTotalMini");
  const sendOrderTop = document.getElementById("sendOrderTop");
  const cartToggle = document.getElementById("cartToggle");
  const cartPanel = document.getElementById("cartPanel");
  const cartList = document.getElementById("cartList");
  const clearCart = document.getElementById("clearCart");
  const closeCart = document.getElementById("closeCart");
  const storeStatus = document.getElementById("storeStatus");

  if (!productGrid || !cartList || !cartCount || !cartTotalMini) return;

  const cart = new Map();
  let activeFilter = "all";

  const money = (value) => `$${value.toLocaleString("es-AR")}`;

  const getPriceFromText = (product) => {
    const priceEl = product.querySelector(".price");
    if (!priceEl) return 0;
    const numeric = Number(priceEl.textContent.replace(/[^\d]/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const hydratePrices = () => {
    products.forEach((product) => {
      const hasSelect = product.querySelector(".variant-select");
      if (hasSelect) return;
      const current = Number(product.dataset.price || 0);
      if (current > 0) return;
      const parsed = getPriceFromText(product);
      if (parsed > 0) {
        product.dataset.price = String(parsed);
      }
    });
  };

  const renderProducts = () => {
    const query = searchInput?.value.toLowerCase().trim() ?? "";
    products.forEach((item) => {
      const matchesFilter = activeFilter === "all" || item.dataset.category === activeFilter;
      const matchesSearch = item.dataset.name.toLowerCase().includes(query);
      item.style.display = matchesFilter && matchesSearch ? "flex" : "none";
    });
  };

  const renderCart = () => {
    cartList.innerHTML = "";
    if (cart.size === 0) {
      cartCount.textContent = "0";
      cartTotalMini.textContent = "$0";
      if (sendOrderTop) sendOrderTop.href = "https://wa.me/543815787398";
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "Todavía no agregaste productos.";
      cartList.appendChild(empty);
      return;
    }

    let total = 0;
    let count = 0;
    cart.forEach((item) => {
      total += item.price * item.qty;
      count += item.qty;
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <div>
          <strong>${item.name}</strong>
          <span>${money(item.price)} · x${item.qty} = ${money(item.price * item.qty)}</span>
        </div>
        <div class="cart-actions">
          <button class="qty-btn" data-action="dec" data-name="${item.name}">-</button>
          <button class="qty-btn" data-action="inc" data-name="${item.name}">+</button>
          <button class="qty-btn remove" data-action="remove" data-name="${item.name}">x</button>
        </div>
      `;
      cartList.appendChild(row);
    });
    cartCount.textContent = String(count);
    cartTotalMini.textContent = money(total);
    const message = encodeURIComponent(
      "Hola Mi Felisa! Quiero pedir:\n" +
      [...cart.values()]
        .map((item) => `- ${item.name} x${item.qty} (${money(item.price)})`)
        .join("\n") +
      `\nTotal aprox: ${money(total)}`
    );
    if (sendOrderTop) {
      sendOrderTop.href = `https://wa.me/543815787398?text=${message}`;
    }
  };

  searchInput?.addEventListener("input", renderProducts);

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      activeFilter = chip.dataset.filter;
      renderProducts();
    });
  });

  productGrid.addEventListener("change", (event) => {
    const select = event.target.closest(".variant-select");
    if (!select) return;
    const product = select.closest(".product");
    if (!product) return;
    const priceLabel = product.querySelector("[data-price-label]");
    const option = select.selectedOptions[0];
    const price = Number(option?.dataset.price || 0);
    if (priceLabel) priceLabel.textContent = price > 0 ? money(price) : "$--";
  });

  productGrid.addEventListener("click", (event) => {
    const button = event.target.closest(".add");
    if (!button) return;
    const product = button.closest(".product");
    if (!product) return;

    const baseName = product.dataset.name || "Producto";
    const select = product.querySelector(".variant-select");
    const option = select?.selectedOptions?.[0];
    const variant = option?.value;
    const priceFromSelect = Number(option?.dataset.price || 0);
    const priceFromProduct = Number(product.dataset.price || 0);
    let price = select ? priceFromSelect : priceFromProduct;

    if (select && (!variant || price <= 0)) return;
    if (!price) price = getPriceFromText(product);

    const brand = product.dataset.brand;
    const name = variant
      ? `${baseName} (${variant})`
      : brand
        ? `${baseName} (${brand})`
        : baseName;

    const current = cart.get(name) || { name, price, qty: 0 };
    current.qty += 1;
    cart.set(name, current);
    renderCart();
  });

  cartList.addEventListener("click", (event) => {
    const btn = event.target.closest(".qty-btn");
    if (!btn) return;
    const action = btn.dataset.action;
    const name = btn.dataset.name;
    const item = cart.get(name);
    if (!item) return;
    if (action === "inc") item.qty += 1;
    if (action === "dec") item.qty -= 1;
    if (action === "remove") item.qty = 0;
    if (item.qty <= 0) cart.delete(name);
    renderCart();
  });

  clearCart?.addEventListener("click", () => {
    cart.clear();
    renderCart();
  });

  const togglePanel = () => {
    const isOpen = cartPanel?.classList.toggle("open");
    cartPanel?.setAttribute("aria-hidden", String(!isOpen));
  };

  cartToggle?.addEventListener("click", togglePanel);
  cartToggle?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      togglePanel();
    }
  });

  cartPanel?.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  closeCart?.addEventListener("click", () => {
    cartPanel?.classList.remove("open");
    cartPanel?.setAttribute("aria-hidden", "true");
  });

  document.addEventListener("click", (event) => {
    if (!cartPanel?.classList.contains("open")) return;
    const inside = event.target.closest(".nav-cart");
    if (!inside) {
      cartPanel.classList.remove("open");
      cartPanel.setAttribute("aria-hidden", "true");
    }
  });

  const updateStoreStatus = () => {
    if (!storeStatus) return;
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = 8 * 60 + 30;
    const closeMinutes = 23 * 60;
    const isOpen = minutes >= openMinutes && minutes < closeMinutes;
    if (isOpen) {
      const remaining = closeMinutes - minutes;
      storeStatus.textContent = `Abierto ahora · Cierra en ${remaining} min`;
    } else {
      storeStatus.textContent = "Cerrado ahora";
    }
    storeStatus.classList.toggle("open", isOpen);
    storeStatus.classList.toggle("closed", !isOpen);
  };

  hydratePrices();
  renderProducts();
  renderCart();
  updateStoreStatus();
  setInterval(updateStoreStatus, 60000);
});
