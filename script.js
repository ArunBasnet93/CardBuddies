let cards = [];
let currentIndex = 0;

async function fetchCards() {
  const res = await fetch("https://api.pokemontcg.io/v2/cards?pageSize=100");
  const data = await res.json();
  cards = data.data;
  showCard(currentIndex);
}

function showCard(index) {
  const cardContainer = document.getElementById("cardContainer");
  if (cards.length === 0) {
    cardContainer.innerHTML = "<p>No cards loaded.</p>";
    return;
  }

  const card = cards[index];
  cardContainer.innerHTML = `
    <img src="${card.images.large}" alt="${card.name}" />
    <p><strong>${card.name}</strong> (#${card.number})</p>
  `;
}

function nextCard() {
  if (currentIndex < cards.length - 1) {
    currentIndex++;
    showCard(currentIndex);
  }
}

function previousCard() {
  if (currentIndex > 0) {
    currentIndex--;
    showCard(currentIndex);
  }
}

function sortCards(by) {
  if (by === "name") {
    cards.sort((a, b) => a.name.localeCompare(b.name));
  } else if (by === "number") {
    cards.sort((a, b) => parseInt(a.number) - parseInt(b.number));
  }
  currentIndex = 0;
  showCard(currentIndex);
}

fetchCards();