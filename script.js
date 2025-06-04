const cardGrid = document.getElementById("cardGrid");
const modal = document.getElementById("modal");
const cardFront = document.getElementById("cardFront");
const cardInner = document.getElementById("cardInner");
const sortSelect = document.getElementById("sortSelect");

let page = 1;
const pageSize = 250;
let isLoading = false;
let hasMore = true;

let allCards = [];
let currentCardIndex = 0;

async function fetchCards() {
  if (isLoading || !hasMore) return;
  isLoading = true;

  try {
    const res = await fetch(`https://api.pokemontcg.io/v2/cards?page=${page}&pageSize=${pageSize}`);
    const data = await res.json();

    if (data.data.length === 0) {
      hasMore = false;
      return;
    }

    allCards = allCards.concat(data.data);
    applySort();
    page++;
  } catch (error) {
    console.error("Failed to fetch cards:", error);
  } finally {
    isLoading = false;
  }
}

function applySort() {
  const sortValue = sortSelect.value;

  if (sortValue === "name") {
    allCards.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortValue === "number") {
    allCards.sort((a, b) => {
      const numA = parseInt(a.nationalPokedexNumbers?.[0] || 0);
      const numB = parseInt(b.nationalPokedexNumbers?.[0] || 0);
      return numA - numB;
    });
  }

  renderGrid(allCards);
}

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

function openModal(index) {
  currentCardIndex = index;
  const card = allCards[currentCardIndex];
  cardFront.innerHTML = `<img src="${card.images.large}" alt="${card.name}">`;
  cardInner.classList.remove("flipped");
  modal.style.display = "block";
}

function closeModal() {
  modal.style.display = "none";
}

function showNextCard() {
  if (currentCardIndex < allCards.length - 1) {
    openModal(currentCardIndex + 1);
  }
}

function showPrevCard() {
  if (currentCardIndex > 0) {
    openModal(currentCardIndex - 1);
  }
}

document.querySelector(".card-flip").addEventListener("click", () => {
  cardInner.classList.toggle("flipped");
});

window.onclick = function(event) {
  if (event.target == modal) {
    closeModal();
  }
};

window.addEventListener("scroll", () => {
  if (
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 &&
    !isLoading
  ) {
    fetchCards();
  }
});

fetchCards();
