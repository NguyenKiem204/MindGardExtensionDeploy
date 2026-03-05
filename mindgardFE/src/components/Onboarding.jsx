import { useEffect, useState } from "react";
import { getLocal, setLocal } from "../utils/chromeStorage";

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [backgroundStyle, setBackgroundStyle] = useState("gradient");
  const [weatherEffect, setWeatherEffect] = useState("rain");
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkIfFirstTime();
  }, []);

  async function checkIfFirstTime() {
    const data = await getLocal(["hasCompletedOnboarding"]);
    if (!data.hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }

  async function completeOnboarding() {
    await setLocal({
      hasCompletedOnboarding: true,
      userName: name,
      workMin: workDuration,
      breakMin: breakDuration,
      background: backgroundStyle === "auto" ? "auto" : "",
      autoBackground: backgroundStyle === "auto",
      defaultEffect: weatherEffect,
    });
    setShowOnboarding(false);
    if (onComplete) onComplete();
  }

  function nextStep() {
    if (step < 4) {
      setStep(step + 1);
    } else {
      completeOnboarding();
    }
  }

  function prevStep() {
    if (step > 0) {
      setStep(step - 1);
    }
  }

  function skipOnboarding() {
    setShowOnboarding(false);
    if (onComplete) onComplete();
  }

  if (!showOnboarding) return null;

  const steps = [
    {
      title: "Welcome to Focus Dashboard! 🎯",
      content: (
        <div className="text-center">
          <div className="text-6xl mb-4">🚀</div>
          <p className="text-lg opacity-90 mb-6">
            Transform your new tab into a productivity powerhouse with Pomodoro
            timers, weather ambiance, and AI-powered focus blocking.
          </p>
          <p className="text-sm opacity-70">
            Let's set up your personalized experience in just a few steps.
          </p>
        </div>
      ),
    },
    {
      title: "What should we call you? 👋",
      content: (
        <div className="text-center">
          <div className="text-4xl mb-4">👤</div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full max-w-md bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 text-center text-lg"
            autoFocus
          />
          <p className="text-sm opacity-70 mt-4">
            We'll use this for personalized greetings throughout your day.
          </p>
        </div>
      ),
    },
    {
      title: "Set your focus rhythm ⏰",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🍅</div>
            <p className="text-sm opacity-70 mb-6">
              Configure your Pomodoro timer for optimal productivity
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Work Duration
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={workDuration}
                onChange={(e) => setWorkDuration(Number(e.target.value) || 25)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-center"
              />
              <div className="text-xs opacity-60 mt-1">minutes</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Break Duration
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={breakDuration}
                onChange={(e) => setBreakDuration(Number(e.target.value) || 5)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-center"
              />
              <div className="text-xs opacity-60 mt-1">minutes</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Choose your ambiance 🌟",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🎨</div>
            <p className="text-sm opacity-70 mb-6">
              Pick your preferred background and weather effects
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-3">
                Background Style
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setBackgroundStyle("gradient")}
                  className={`p-3 rounded-lg border transition-colors ${
                    backgroundStyle === "gradient"
                      ? "bg-blue-500/20 border-blue-400"
                      : "bg-white/10 border-white/20 hover:bg-white/20"
                  }`}
                >
                  <div className="text-2xl mb-1">🌈</div>
                  <div className="text-sm">Gradient</div>
                </button>
                <button
                  onClick={() => setBackgroundStyle("auto")}
                  className={`p-3 rounded-lg border transition-colors ${
                    backgroundStyle === "auto"
                      ? "bg-blue-500/20 border-blue-400"
                      : "bg-white/10 border-white/20 hover:bg-white/20"
                  }`}
                >
                  <div className="text-2xl mb-1">🔄</div>
                  <div className="text-sm">Daily Auto</div>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-3">
                Weather Effect
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["rain", "snow", "sunny"].map((effect) => (
                  <button
                    key={effect}
                    onClick={() => setWeatherEffect(effect)}
                    className={`p-3 rounded-lg border transition-colors ${
                      weatherEffect === effect
                        ? "bg-blue-500/20 border-blue-400"
                        : "bg-white/10 border-white/20 hover:bg-white/20"
                    }`}
                  >
                    <div className="text-2xl mb-1">
                      {effect === "rain"
                        ? "🌧️"
                        : effect === "snow"
                        ? "❄️"
                        : "☀️"}
                    </div>
                    <div className="text-xs capitalize">{effect}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "You're all set! 🎉",
      content: (
        <div className="text-center">
          <div className="text-6xl mb-4">✨</div>
          <p className="text-lg opacity-90 mb-6">
            Your Focus Dashboard is ready to boost your productivity!
          </p>
          <div className="space-y-2 text-sm opacity-70">
            <p>• Start focus sessions with the Pomodoro timer</p>
            <p>• Get daily inspirational quotes</p>
            <p>• Set and track your daily focus goals</p>
            <p>• Use quick notes and links for efficiency</p>
            <p>• Enjoy weather ambiance and beautiful backgrounds</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">{steps[step].title}</h2>
          <div className="flex items-center justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= step ? "bg-blue-400" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mb-8">{steps[step].content}</div>

        <div className="flex items-center justify-between">
          <button
            onClick={skipOnboarding}
            className="text-sm opacity-60 hover:opacity-100 transition-opacity"
          >
            Skip setup
          </button>

          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={prevStep}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={nextStep}
              disabled={step === 1 && !name.trim()}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {step === 4 ? "Get Started!" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
