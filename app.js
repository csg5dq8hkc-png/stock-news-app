async function getNews() {
  const symbol = document.getElementById("symbol").value.trim();
  const results = document.getElementById("results");
  results.innerHTML = "Laen...";

  if (!symbol) {
    results.innerHTML = "Sisesta sümbol";
    return;
  }

  const API_KEY = "SIIN_PANED_OMA_API_KEY";
  const today = new Date().toISOString().split("T")[0];

  const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${today}&to=${today}&token=${API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    results.innerHTML = "";

    if (!data.length) {
      results.innerHTML = "Täna uudiseid ei ole.";
      return;
    }

    data.slice(0, 3).forEach(n => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${n.headline}</strong><br>
        ${n.source} – ${new Date(n.datetime * 1000).toLocaleTimeString()}
      `;
      results.appendChild(li);
    });

  } catch {
    results.innerHTML = "Viga andmete laadimisel";
  }
}
