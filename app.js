async function getNews() {
  const symbol = document.getElementById("symbol").value.trim();
  const results = document.getElementById("results");
  results.innerHTML = "Laen...";

  if (!symbol) {
    results.innerHTML = "Sisesta sümbol";
    return;
  }

  const API_KEY = "d52lk91r01qggm5sh1g0d52lk91r01qggm5sh1gg"; // Pane siia oma Finnhub API key

  // Viimase 3 päeva uudised Finnhubist
  const from = new Date();
  from.setDate(from.getDate() - 3); 
  const fromStr = from.toISOString().split("T")[0];
  const toStr = new Date().toISOString().split("T")[0];

  const finnUrl = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromStr}&to=${toStr}&token=${API_KEY}`;
  
  // Finteli RSS feed kaudu rss2json API
  const fintelUrl = `https://api.rss2json.com/v1/api.json?rss_url=https://www.fintel.io/news/rss?symbol=${symbol}`;

  try {
    // Finnhub uudised
    const resFinn = await fetch(finnUrl);
    const dataFinn = await resFinn.json();

    // Finteli uudised
    const resFintel = await fetch(fintelUrl);
    const dataFintel = await resFintel.json();

    const fintelNews = dataFintel.items.map(item => ({
      headline: item.title,
      summary: item.description,
      url: item.link,
      datetime: new Date(item.pubDate).getTime() / 1000,
      source: "Fintel"
    }));

    // Koonda uudised
    const combinedNews = [...dataFinn.slice(0,3), ...fintelNews.slice(0,3)];

    if (!combinedNews.length) {
      results.innerHTML = "Uudiseid viimase 3 päeva jooksul ei leitud.";
      return;
    }

    // Sorteeri viimase aja järgi
    combinedNews.sort((a,b) => b.datetime - a.datetime);

    // Näita kuni 3 viimast
    results.innerHTML = "";
    combinedNews.slice(0,3).forEach(n => {
      const li = document.createElement("li");

      // Lihtne sentiment värvikood
      let color = "black";
      const headline = n.headline.toLowerCase();
      if (headline.includes("gain") || headline.includes("profit") || headline.includes("rise")) color = "green";
      if (headline.includes("loss") || headline.includes("drop") || headline.includes("fall")) color = "red";

      li.innerHTML = `
        <strong style="color:${color}">${n.headline}</strong><br>
        ${n.summary ? n.summary : ""}<br>
        ${n.source} – ${new Date(n.datetime * 1000).toLocaleString()}<br>
        <a href="${n.url}" target="_blank">Loe artiklit</a>
      `;
      results.appendChild(li);
    });

  } catch(e) {
    console.error(e);
    results.innerHTML = "Viga andmete laadimisel";
  }
}


