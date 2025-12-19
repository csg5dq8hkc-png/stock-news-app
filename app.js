async function getNews() {
  const symbol = document.getElementById("symbol").value.trim();
  const results = document.getElementById("results");
  results.innerHTML = "Laen...";

  if (!symbol) {
    results.innerHTML = "Sisesta sümbol";
    return;
  }

  const API_KEY = "SINU_PÄRIS_API_KEY";

  // Finnhub viimase 3 päeva uudised
  const from = new Date();
  from.setDate(from.getDate() - 3); 
  const fromStr = from.toISOString().split("T")[0];
  const toStr = new Date().toISOString().split("T")[0];
  const finnUrl = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromStr}&to=${toStr}&token=${API_KEY}`;

  // Fintel RSS koos CORS proxyga
  const corsProxy = "https://api.allorigins.win/get?url=";
  const fintelUrl = `${corsProxy}${encodeURIComponent("https://www.fintel.io/news/rss?symbol=" + symbol)}`;

  try {
    // Finnhub
    const resFinn = await fetch(finnUrl);
    const dataFinn = await resFinn.json();

    // Fintel RSS
    const resFintel = await fetch(fintelUrl);
    const rawFintel = await resFintel.json(); 
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(rawFintel.contents, "text/xml");
    const items = xmlDoc.querySelectorAll("item");

    const fintelNews = Array.from(items).map(item => {
      const headline = item.querySelector("title")?.textContent || "";
      const description = item.querySelector("description")?.textContent || "";
      const cleanSummary = description.replace(/<\/?[^>]+(>|$)/g, ""); // eemalda HTML
      return {
        headline: headline,
        summary: cleanSummary,
        url: item.querySelector("link")?.textContent || "#",
        datetime: new Date(item.querySelector("pubDate")?.textContent || "").getTime() / 1000,
        source: "Fintel"
      };
    });

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

      // Täiustatud sentiment
      const text = (n.headline + " " + (n.summary || "")).toLowerCase();
      let color = "black";
      const positive = ["gain","profit","rise","up","record","increase","surge"];
      const negative = ["loss","drop","fall","down","decline","plunge"];
      if (positive.some(word => text.includes(word))) color = "green";
      if (negative.some(word => text.includes(word))) color = "red";

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
    results.innerHTML = "Viga andmete laadimisel – võib olla iPhone CORS piirang";
  }
}
