const cardGrid = document.getElementById("cardGrid");
const modal = document.getElementById("modal");
const cardFront = document.getElementById("cardFront");
const cardInner = document.getElementById("cardInner");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");
const priceContainer = document.getElementById("priceContainer");
const loadingIndicator = document.getElementById("loadingIndicator");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let page = 1;
const pageSize = 250;
let isLoading = false;
let hasMore = true;

let allCards = [];
let filteredCards = [];
let currentCardIndex = 0;

// Fetch cards from API with pagination
async function fetchCards() {
  if (isLoading || !hasMore) return;
  isLoading = true;
  loadingIndicator.style.display = "block";

  try {
    const res = await fetch(
      `https://api.pokemontcg.io/v2/cards?page=${page}&pageSize=${pageSize}`
    );
    const data = await res.json();

    if (!data.data || data.data.length === 0) {
      hasMore = false;
      return;
    }

    allCards = allCards.concat(data.data);
    applyFilters();
    page++;
  } catch (error) {
    console.error("Failed to fetch cards:", error);
  } finally {
    isLoading = false;
    loadingIndicator.style.display = "none";
  }
}

// Apply sorting and filtering
function applyFilters() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const sortValue = sortSelect.value;

  // Filter by search term
  filteredCards = allCards.filter(card =>
    card.name.toLowerCase().includes(searchTerm)
  );

  // Sort filtered cards
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

// Render the cards grid
function renderGrid(cards) {
  cardGrid.innerHTML = "";
  if (cards.length === 0) {
    cardGrid.innerHTML = "<p>No Pokémon found.</p>";
    return;
  }
  cards.forEach((card, index) => {
    const img = document.createElement("img");
    img.src = card.images?.small || "assets/fallback-image.png";
    img.alt = card.name;
    img.onclick = () => openModal(index);
    cardGrid.appendChild(img);
  });
}

// Open modal to show flipped card and price
function openModal(index) {
  currentCardIndex = index;
  const card = filteredCards[currentCardIndex];
  cardFront.innerHTML = `<img src="${card.images.large}" alt="${card.name}">`;
  cardInner.classList.remove("flipped");
  modal.style.display = "block";
  modal.focus();

  // Show price if available
  if (card.tcgplayer && card.tcgplayer.prices) {
    const prices = card.tcgplayer.prices;
    let price = null;

    if (prices.normal && prices.normal.mid) {
      price = prices.normal.mid;
    } else if (prices.holofoil && prices.holofoil.mid) {
      price = prices.holofoil.mid;
    }

    priceContainer.textContent = price !== null ? `Price: $${price.toFixed(2)}` : "Price: N/A";
  } else {
    priceContainer.textContent = "Price: N/A";
  }

  updateNavButtons();
}

// Close modal
function closeModal() {
  modal.style.display = "none";
}

// Show next card in modal
function showNextCard() {
  if (currentCardIndex < filteredCards.length - 1) {
    openModal(currentCardIndex + 1);
  }
}

// Show previous card in modal
function showPrevCard() {
  if (currentCardIndex > 0) {
    openModal(currentCardIndex - 1);
  }
}

// Update previous/next button state
function updateNavButtons() {
  prevBtn.disabled = currentCardIndex === 0;
  nextBtn.disabled = currentCardIndex === filteredCards.length - 1;
}

// Toggle flip on modal card
function toggleFlip() {
  cardInner.classList.toggle("flipped");
}

// Close modal when clicking outside the content
window.onclick = function (event) {
  if (event.target == modal) {
    closeModal();
  }
};

// Keyboard navigation in modal (optional)
window.addEventListener("keydown", (e) => {
  if (modal.style.display === "block") {
    if (e.key === "ArrowRight") {
      showNextCard();
    } else if (e.key === "ArrowLeft") {
      showPrevCard();
    } else if (e.key === "Escape") {
      closeModal();
    }
  }
});

// Infinite scroll fetch more cards
window.addEventListener("scroll", () => {
  if (
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 &&
    !isLoading &&
    hasMore
  ) {
    fetchCards();
  }
});

// Initial fetch
fetchCards();
