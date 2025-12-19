async function getNews() {
  const symbol = document.getElementById("symbol").value.trim();
  const results = document.getElementById("results");
  const priceInfo = document.getElementById("priceInfo");
  const ctx = document.getElementById('priceChart').getContext('2d');

  results.innerHTML = "Laen...";
  priceInfo.innerHTML = "";
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  if (!symbol) {
    results.innerHTML = "Sisesta sümbol";
    return;
  }

  const API_KEY = "d52mdq9r01qggm5sldogd52mdq9r01qggm5sldp0"; // Finnhub API

  try {
    // --- Hetke hind + eelturu / järelturu ---
    const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`;
    const resQuote = await fetch(quoteUrl);
    const dataQuote = await resQuote.json();

    let currentPrice = dataQuote.c || dataQuote.pc; // kui turg suletud, näita eelmise sulgemishinda
    let marketStatus = dataQuote.c && dataQuote.c !== dataQuote.pc ? "Turg avatud" : "Turg suletud";

    priceInfo.innerHTML = `
      <strong>${symbol} hind:</strong> $${currentPrice} (${marketStatus})<br>
      Päeva H/L: $${dataQuote.h}/${dataQuote.l} | Eelmise sulgemishind: $${dataQuote.pc}
    `;

    // --- Turu sentiment ---
    const sentimentUrl = `https://finnhub.io/api/v1/news-sentiment?symbol=${symbol}&token=${API_KEY}`;
    const resSent = await fetch(sentimentUrl);
    const dataSent = await resSent.json();

    const bullish = dataSent.sentiment?.bullishPercent || 0.5;
    const bearish = dataSent.sentiment?.bearishPercent || 0.5;

    let marketSentiment = "Neutral";
    if(bullish > 0.75) marketSentiment = "Extreme Bullish";
    else if(bullish > 0.55) marketSentiment = "Bullish";
    else if(bearish > 0.75) marketSentiment = "Extreme Bearish";
    else if(bearish > 0.55) marketSentiment = "Bearish";

    let sentimentColor = "black";
    if(marketSentiment.includes("Bullish")) sentimentColor = "green";
    if(marketSentiment.includes("Bearish")) sentimentColor = "red";

    priceInfo.innerHTML += `<br><strong style="color:${sentimentColor}">Turu sentiment: ${marketSentiment}</strong>`;

    // --- Päevane graafik (5-min candles) ---
    const now = Math.floor(Date.now()/1000);
    const from = now - 24*60*60; // viimase 24h andmed
    const candleUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=5&from=${from}&to=${now}&token=${API_KEY}`;
    const resCandle = await fetch(candleUrl);
    const dataCandle = await resCandle.json();

    if(dataCandle.s === "ok") {
      const labels = dataCandle.t.map(t => new Date(t*1000).toLocaleTimeString());
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: `${symbol} hind`,
            data: dataCandle.c,
            borderColor: 'blue',
            fill: false
          }]
        },
        options: { responsive: true }
      });
    }

    // --- Finnhub uudised viimase 3 päeva ---
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 3);
    const fromStr = fromDate.toISOString().split("T")[0];
    const toStr = new Date().toISOString().split("T")[0];
    const finnUrl = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromStr}&to=${toStr}&token=${API_KEY}`;
    const resFinn = await fetch(finnUrl);
    const dataFinn = await resFinn.json();

    // --- Fintel RSS + CORS proxy ---
    const corsProxy = "https://api.allorigins.win/get?url=";
    const fintelUrl = `${corsProxy}${encodeURIComponent("https://www.fintel.io/news/rss?symbol=" + symbol)}`;
    const resFintel = await fetch(fintelUrl);
    const rawFintel = await resFintel.json();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(rawFintel.contents, "text/xml");
    const items = xmlDoc.querySelectorAll("item");

    const fintelNews = Array.from(items).map(item => {
      const headline = item.querySelector("title")?.textContent || "";
      const description = item.querySelector("description")?.textContent || "";
      const cleanSummary = description.replace(/<\/?[^>]+(>|$)/g, "");
      return {
        headline: headline,
        summary: cleanSummary,
        url: item.querySelector("link")?.textContent || "#",
        datetime: new Date(item.querySelector("pubDate")?.textContent || "").getTime() / 1000,
        source: "Fintel"
      };
    });

    // --- Koonda uudised ---
    const combinedNews = [...dataFinn.slice(0,3), ...fintelNews.slice(0,3)];
    if(!combinedNews.length) {
      results.innerHTML = "Uudiseid viimase 3 päeva jooksul ei leitud.";
      return;
    }

    combinedNews.sort((a,b) => b.datetime - a.datetime);
    results.innerHTML = "";

    // --- Kuvamine + sentiment värv ---
    combinedNews.slice(0,3).forEach(n => {
      const li = document.createElement("li");
      const text = (n.headline + " " + (n.summary||"")).toLowerCase();
      let color = "black";
      const positive = ["gain","profit","rise","up","record","increase","surge"];
      const negative = ["loss","drop","fall","down","decline","plunge"];
      if(positive.some(word => text.includes(word))) color = "green";
      if(negative.some(word => text.includes(word))) color = "red";

      li.innerHTML = `
        <strong style="color:${color}">${n.headline}</strong><br>
        ${n.summary ? n.summary : ""}<br>
        ${n.source} – ${new Date(n.datetime*1000).toLocaleString()}<br>
        <a href="${n.url}" target="_blank">Loe artiklit</a>
      `;
      results.appendChild(li);
    });

  } catch(e) {
    console.error(e);
    results.innerHTML = "Viga andmete laadimisel – võib olla CORS või API piirang";
    priceInfo.innerHTML = "";
  }
}
