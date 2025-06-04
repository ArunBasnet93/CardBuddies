const cardGrid = document.getElementById("cardGrid");
const modal = document.getElementById("modal");
const cardFront = document.getElementById("cardFront");
const cardInner = document.getElementById("cardInner");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");
const priceContainer = document.getElementById("priceContainer");
const progress = document.getElementById("progress");
const progressText = document.getElementById("progressText");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let page = 1;
const pageSize = 250;
let totalCards = 17000; // Approximate
let allCards = [];
let filteredCards = [];
let currentCardIndex = 0;

/** --- IndexedDB Setup --- */
const DB_NAME = 'CardImagesDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = e => resolve(e.target.result);
    request.onerror = e => reject(e.target.error);
  });
}

async function getImageFromDB(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveImageToDB(key, blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(blob, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function loadImageWithCache(url) {
  try {
    const cachedBlob = await getImageFromDB(url);
    if (cachedBlob) {
      return URL.createObjectURL(cachedBlob);
    } else {
      const response = await fetch(url);
      const blob = await response.blob();
      await saveImageToDB(url, blob);
      return URL.createObjectURL(blob);
    }
  } catch {
    // fallback to direct URL if any error occurs
    return url;
  }
}

/** --- Data fetching --- */
async function fetchCardsContinuously() {
  while (true) {
    try {
      const res = await fetch(
        `https://api.pokemontcg.io/v2/cards?page=${page}&pageSize=${pageSize}`
      );
      const data = await res.json();

      if (!data.data || data.data.length === 0) break;

      if (page === 1 && data.totalCount) {
        totalCards = data.totalCount; // use actual count from API
      }

      allCards = allCards.concat(data.data);
      applyFilters();
      updateProgressBar();

      if (allCards.length >= totalCards) break;

      page++;
    } catch (err) {
      console.error("Failed to fetch cards:", err);
      break;
    }
  }
  updateProgressBar(true);
}

function updateProgressBar(finished = false) {
  const loaded = allCards.length;
  const percent = Math.min(100, (loaded / totalCards) * 100).toFixed(1);

  progress.style.width = `${percent}%`;
  progressText.textContent = finished
    ? `Loaded ${loaded} cards!`
    : `Loading: ${loaded} / ${totalCards} (${percent}%)`;
}

function applyFilters() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const sortValue = sortSelect.value;

  filteredCards = allCards.filter(card =>
    card.name.toLowerCase().includes(searchTerm)
  );

  if (sortValue === "name") {
    filteredCards.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortValue === "number") {
    filteredCards.sort((a, b) => {
      const numA = parseInt(a.nationalPokedexNumbers?.[0] || 0);
      const numB = parseInt(b.nationalPokedexNumbers?.[0] || 0);
      return numA - numB;
    });
  }

  renderGrid(filteredCards);
}

async function renderGrid(cards) {
  cardGrid.innerHTML = "";
  if (cards.length === 0) {
    cardGrid.innerHTML = "<p>No Pokémon found.</p>";
    return;
  }

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const img = document.createElement("img");
    img.src = "assets/fallback-image.png";
    img.alt = card.name;
    img.style.cursor = "pointer";

    loadImageWithCache(card.images?.small || "assets/fallback-image.png").then(
      (blobUrl) => {
        img.src = blobUrl;
      }
    ).catch(() => {
      img.src = card.images?.small || "assets/fallback-image.png";
    });

    img.onclick = () => openModal(i);
    cardGrid.appendChild(img);
  }
}

/** --- Modal Logic --- */

async function openModal(index) {
  currentCardIndex = index;
  const card = filteredCards[currentCardIndex];
  cardInner.classList.remove("flipped");
  modal.style.display = "flex";
  modal.focus();

  try {
    const blobUrl = await loadImageWithCache(card.images.large);
    cardFront.innerHTML = `<img src="${blobUrl}" alt="${card.name}">`;
  } catch {
    cardFront.innerHTML = `<img src="${card.images.large}" alt="${card.name}">`;
  }

  if (card.tcgplayer?.prices) {
    const prices = card.tcgplayer.prices;
    let price = prices.normal?.mid || prices.holofoil?.mid || null;
    priceContainer.textContent =
      price !== null ? `Price: $${price.toFixed(2)}` : "Price: N/A";
  } else {
    priceContainer.textContent = "Price: N/A";
  }

  updateNavButtons();
}

function closeModal() {
  modal.style.display = "none";
  cardFront.innerHTML = "";
}

function toggleFlip() {
  cardInner.classList.toggle("flipped");
}

function showPrevCard() {
  if (currentCardIndex > 0) {
    openModal(currentCardIndex - 1);
  }
}

function showNextCard() {
  if (currentCardIndex < filteredCards.length - 1) {
    openModal(currentCardIndex + 1);
  }
}

function updateNavButtons() {
  prevBtn.disabled = currentCardIndex <= 0;
  nextBtn.disabled = currentCardIndex >= filteredCards.length - 1;
}

/** --- Keyboard shortcuts --- */
document.addEventListener("keydown", (e) => {
  if (modal.style.display === "flex") {
    if (e.key === "Escape") {
      closeModal();
    } else if (e.key === "ArrowLeft") {
      showPrevCard();
    } else if (e.key === "ArrowRight") {
      showNextCard();
    } else if (e.key.toLowerCase() === "f") {
      toggleFlip();
    }
  }
});

/** --- Close modal by clicking outside content --- */
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

/** --- Start fetching --- */
fetchCardsContinuously();
