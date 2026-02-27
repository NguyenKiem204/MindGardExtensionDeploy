import { getLocal, setLocal } from "./chromeStorage";

const BACKGROUND_CATEGORIES = {
  nature: ["forest", "mountain", "ocean", "sunset", "landscape"],
  minimal: ["minimal", "abstract", "geometric", "gradient"],
  workspace: ["office", "desk", "workspace", "study"],
  urban: ["city", "architecture", "urban", "skyline"],
};

export async function getDailyBackground() {
  const today = new Date().toDateString();
  const cached = await getLocal([
    "lastBackgroundDate",
    "cachedBackground",
    "backgroundCategory",
  ]);

  // Return cached background if it's from today
  if (cached.lastBackgroundDate === today && cached.cachedBackground) {
    return cached.cachedBackground;
  }

  // Fetch new background
  try {
    const category = cached.backgroundCategory || "nature";
    const keywords =
      BACKGROUND_CATEGORIES[category] || BACKGROUND_CATEGORIES.nature;
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];

    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${randomKeyword}&orientation=landscape&w=1920&h=1080&client_id=${
        process.env.REACT_APP_UNSPLASH_ACCESS_KEY || "YOUR_UNSPLASH_ACCESS_KEY"
      }`,
      {
        headers: {
          "User-Agent":
            "Focus Dashboard Chrome Extension (https://github.com/yourusername/focus-dashboard)",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Unsplash API error:", response.status, errorText);
      throw new Error(`Unsplash API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const backgroundUrl = data.urls.full;

    // Cache the new background
    await setLocal({
      lastBackgroundDate: today,
      cachedBackground: backgroundUrl,
      backgroundCategory: category,
    });

    return backgroundUrl;
  } catch (error) {
    console.error("Failed to fetch background:", error);
    // Return fallback gradient
    return null;
  }
}

export async function setBackgroundCategory(category) {
  await setLocal({ backgroundCategory: category });
  // Clear cached background to force refresh
  await setLocal({ lastBackgroundDate: "", cachedBackground: null });
}
