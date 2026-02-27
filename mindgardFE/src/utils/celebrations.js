// Enhanced celebration utilities

export function showConfetti(options = {}) {
  const {
    particleCount = 50,
    spread = 45,
    originY = 0.6,
    colors = [
      "#ff6b6b",
      "#4ecdc4",
      "#45b7d1",
      "#96ceb4",
      "#feca57",
      "#ff9ff3",
      "#54a0ff",
    ],
    duration = 3000,
  } = options;

  for (let i = 0; i < particleCount; i++) {
    setTimeout(() => {
      const confetti = document.createElement("div");
      confetti.style.position = "fixed";
      confetti.style.left = Math.random() * 100 + "vw";
      confetti.style.top = originY * 100 + "vh";
      confetti.style.width = "10px";
      confetti.style.height = "10px";
      confetti.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "0";
      confetti.style.pointerEvents = "none";
      confetti.style.zIndex = "9999";
      confetti.style.animation = `confetti-fall ${duration}ms linear forwards`;

      // Add some rotation and spread
      const angle = (Math.random() - 0.5) * spread;
      const velocity = 2 + Math.random() * 3;
      const rotation = Math.random() * 360;

      confetti.style.setProperty("--angle", `${angle}deg`);
      confetti.style.setProperty("--velocity", `${velocity}`);
      confetti.style.setProperty("--rotation", `${rotation}deg`);

      document.body.appendChild(confetti);

      setTimeout(() => confetti.remove(), duration);
    }, i * 20);
  }
}

export function showStreakCelebration(streak) {
  if (streak < 3) return;

  const messages = {
    3: "🔥 3-day streak! You're on fire!",
    7: "🌟 Week streak! Incredible dedication!",
    14: "💎 Two weeks strong! You're unstoppable!",
    30: "🏆 Monthly master! Legendary focus!",
    100: "👑 Century streak! You're a productivity god!",
  };

  const message = messages[streak] || `🎉 ${streak} days strong! Keep it up!`;

  // Show notification
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Streak Milestone! 🎉", {
      body: message,
      icon: "/vite.svg",
    });
  }

  // Show confetti for milestone streaks
  if ([3, 7, 14, 30, 50, 100].includes(streak)) {
    showConfetti({ particleCount: 100, duration: 4000 });
  }
}

export function showSessionCompleteCelebration() {
  showConfetti({ particleCount: 30, duration: 2000 });

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Focus Session Complete! 🎯", {
      body: "Great work! Time for a well-deserved break.",
      icon: "/vite.svg",
    });
  }
}

export function showGoalCompleteCelebration() {
  showConfetti({ particleCount: 80, duration: 3000 });

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Daily Goal Achieved! ✅", {
      body: "You completed your focus goal for today. Amazing work!",
      icon: "/vite.svg",
    });
  }
}

// Add CSS animations
export function addCelebrationStyles() {
  if (document.getElementById("celebration-styles")) return;

  const style = document.createElement("style");
  style.id = "celebration-styles";
  style.textContent = `
    @keyframes confetti-fall {
      0% { 
        transform: translateY(0) translateX(0) rotate(0deg) scale(1);
        opacity: 1;
      }
      50% {
        transform: translateY(50vh) translateX(calc(var(--angle, 0) * 0.5)) rotate(var(--rotation, 0deg)) scale(1.2);
        opacity: 0.8;
      }
      100% { 
        transform: translateY(100vh) translateX(var(--angle, 0)) rotate(var(--rotation, 360deg)) scale(0.5);
        opacity: 0;
      }
    }
    
    @keyframes goal-celebration {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    
    .goal-celebration {
      animation: goal-celebration 0.6s ease-in-out;
    }
  `;
  document.head.appendChild(style);
}
