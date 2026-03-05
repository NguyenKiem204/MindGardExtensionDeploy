import { useEffect, useState } from "react";
import { getLocal, setLocal } from "../utils/chromeStorage";

export default function DailyQuote() {
  const [quote, setQuote] = useState({ text: "", author: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadQuote();
  }, []);

  async function loadQuote() {
    const today = new Date().toDateString();
    const cached = await getLocal(["lastQuoteDate", "cachedQuote"]);

    if (cached.lastQuoteDate === today && cached.cachedQuote?.text) {
      setQuote(cached.cachedQuote);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("https://zenquotes.io/api/random");
      const data = await response.json();
      const newQuote = { text: data[0].q, author: data[0].a };

      setQuote(newQuote);
      await setLocal({
        lastQuoteDate: today,
        cachedQuote: newQuote,
      });
    } catch (error) {
      console.error("Failed to fetch quote:", error);
      setQuote({
        text: "The way to get started is to quit talking and begin doing.",
        author: "Walt Disney",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleRefresh() {
    setLocal({ lastQuoteDate: "", cachedQuote: null });
    loadQuote();
  }

  if (loading) {
    return (
      <div className="text-center mb-8">
        <div className="text-sm opacity-60">Loading inspiration...</div>
      </div>
    );
  }

  return (
    <div className="text-center mb-8 max-w-2xl mx-auto">
      <div className="text-lg opacity-90 mb-2 italic">"{quote.text}"</div>
      <div className="text-sm opacity-70 mb-4">— {quote.author}</div>
      <button
        onClick={handleRefresh}
        className="text-xs opacity-60 hover:opacity-100 transition-opacity px-3 py-1 rounded bg-white/10 hover:bg-white/20"
      >
        New quote
      </button>
    </div>
  );
}
