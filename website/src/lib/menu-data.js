// Real Lobsteria menu structure and confirmed pricing (from the on-site
// sandwich-board menu). Items without a confirmed price show "MP" — fill in
// the real number as soon as you have it, don't guess.
export const menu = [
  {
    category: "Lobster Rolls",
    banner: "/images/connecticut-lobster-roll.webp",
    items: [
      {
        name: "Connecticut Roll",
        price: "$24.95",
        description:
          "Hand-cleaned wild-caught Maine lobster, tossed warm in brown butter, toasted split-top bun.",
        featured: true,
        image: "/images/connecticut-lobster-roll.webp",
      },
      {
        name: "Maine Roll",
        price: "$24.95",
        description:
          "Hand-cleaned wild-caught Maine lobster, served cold with our secret Old Bay mayo.",
        featured: true,
        image: "/images/connecticut.png",
      },
      {
        name: "Prawns Roll",
        price: "$17.95",
        description: "Chilled or warm prawns, brown butter or Old Bay mayo, toasted bun.",
      },
    ],
  },
  {
    category: "Caviar Add-On",
    banner: "/images/lobster-caviar.png",
    items: [
      {
        name: "Sturgeon Caviar, on anything",
        price: "from $30",
        description:
          "Add sturgeon caviar to nearly any roll, oyster, or ceviche on the menu.",
        image: "/images/lobster-caviar.png",
      },
    ],
  },
  {
    category: "Raw Oyster Bar",
    banner: "/images/oyster-platter.jpg",
    items: [
      {
        name: "Oysters on the Half Shell",
        price: "MP",
        description: "Daily selection, five preparations available.",
        image: "/images/oyster-platter.jpg",
      },
      {
        name: "Chargrilled Oysters",
        price: "MP",
        description: "Garlic herb butter, grilled to order.",
      },
    ],
  },
  {
    category: "Peruvian & Nikkei Ceviche",
    banner: "/images/nikkei-ceviche-roll.png",
    items: [
      {
        name: "Corvina Ceviche",
        price: "$15.95",
        description:
          "Peruvian-style, leche de tigre made from a recipe passed down by a close friend's grandmother in Peru — \"Tía Tati's\" recipe.",
        featured: true,
        image: "/images/ceviche.webp",
      },
      {
        name: "Nikkei Ceviche Roll",
        price: "MP",
        description: "Peruvian-Japanese style, crispy nori, citrus.",
        image: "/images/nikkei-ceviche-roll.png",
      },
    ],
  },
];
