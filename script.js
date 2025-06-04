const cardGrid = document.getElementById("cardGrid");
const modal = document.getElementById("modal");
const cardFront = document.getElementById("cardFront");
const cardInner = document.getElementById("cardInner");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");

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

  try {
    const res = await fetch(
      `https://api.pokemontcg.io/v2/cards?page=${page}&pageSize=${pageSize}`
    );
    const data = await res.json();

    if (data.data.length === 0) {
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
  cards.forEach((card, index) => {
    const img = document.createElement("img");
    img.src = card.images.small;
    img.alt = card.name;
    img.onclick = () => openModal(index);
    cardGrid.appendChild(img);
  });
}

// Open modal to show flipped card
function openModal(index) {
  currentCardIndex = index;
  const card = filteredCards[currentCardIndex];
  cardFront.innerHTML = `<img src="${card.images.large}" alt="${card.name}">`;
  cardInner.classList.remove("flipped");
  modal.style.display = "block";
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