const cardNames = [
  "The Fool",
  "The Magician",
  "The High Priestess",
  "The Empress",
  "The Emperor",
  "The Hierophant",
  "The Lovers",
  "The Chariot",
  "Strength",
  "The Hermit",
  "Wheel of Fortune",
  "Justice",
  "The Hanged Man",
  "Death",
  "Temperance",
  "The Devil",
  "The Tower",
  "The Star",
  "The Moon",
  "The Sun",
  "Judgement",
  "The World",
];

const keywords = {
  "The Fool": "Beginnings • Leap • Trust",
  "The Magician": "Skill • Will • Manifest",
  "The High Priestess": "Intuition • Mystery • Inner voice",
  "The Empress": "Abundance • Nurture • Creation",
  "The Emperor": "Structure • Authority • Stability",
};

const revealBtn = document.querySelector(".card .btn-small");
const cardName = document.querySelector(".card-name");
const cardKeywords = document.querySelector(".card-keywords");

if (revealBtn) {
  revealBtn.addEventListener("click", () => {
    const next = cardNames[Math.floor(Math.random() * cardNames.length)];
    cardName.textContent = next;
    cardKeywords.textContent = keywords[next] || "Meaning unlocks with practice";
  });
}
