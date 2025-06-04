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

async function fetchCardsContinuously() {
  while (allCards.length < totalCards) {
    try {
      const res = await fetch(
        `https://api.pokemontcg.io/v2/cards?page=${page}&pageSize=${pageSize}`
      );
      const data = await res.json();

      if (!data.data || data.data.length === 0) break;

      allCards = allCards.concat(data.data);
      applyFilters();
      updateProgressBar();

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

function openModal(index) {
  currentCardIndex = index;
  const card = filteredCards[currentCardIndex];
  cardFront.innerHTML = `<img src="${card.images.large}" alt="${card.name}">`;
  cardInner.classList.remove("flipped");
  modal.style.display = "block";
  modal.focus();

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
}

function showNextCard() {
  if (currentCardIndex < filteredCards.length - 1) {
    openModal(currentCardIndex + 1);
  }
}

function showPrevCard() {
  if (currentCardIndex > 0) {
    openModal(currentCardIndex - 1);
  }
}

function updateNavButtons() {
  prevBtn.disabled = currentCardIndex === 0;
  nextBtn.disabled = currentCardIndex === filteredCards.length - 1;
}

function toggleFlip() {
  cardInner.classList.toggle("flipped");
}

window.onclick = function (event) {
  if (event.target == modal) closeModal();
};

window.addEventListener("keydown", e => {
  if (modal.style.display === "block") {
    if (e.key === "ArrowRight") showNextCard();
    else if (e.key === "ArrowLeft") showPrevCard();
    else if (e.key === "Escape") closeModal();
  }
});

fetchCardsContinuously();
