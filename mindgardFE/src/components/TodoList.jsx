import { useEffect, useState } from "react";
import { getLocal, setLocal } from "../utils/chromeStorage";

const KEY = "todos";

export default function TodoList() {
  const [items, setItems] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    getLocal([KEY]).then((d) => setItems(Array.isArray(d[KEY]) ? d[KEY] : []));
    const sub = (changes, area) => {
      if (area !== "local" || !changes[KEY]) return;
      setItems(
        Array.isArray(changes[KEY].newValue) ? changes[KEY].newValue : []
      );
    };
    chrome.storage.onChanged.addListener(sub);
    return () => chrome.storage.onChanged.removeListener(sub);
  }, []);

  useEffect(() => {
    const h = setTimeout(() => setLocal({ [KEY]: items }), 200);
    return () => clearTimeout(h);
  }, [items]);

  function add() {
    if (!text.trim()) return;
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: text.trim(), done: false },
    ]);
    setText("");
  }
  function toggle(id) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, done: !it.done } : it))
    );
  }
  function remove(id) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  return (
    <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
      <div className="font-semibold mb-2">To-Do</div>
      <div className="flex gap-2 mb-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task"
          className="flex-1 text-black rounded px-3 py-2"
        />
        <button onClick={add} className="bg-green-600 text-white rounded px-3">
          Add
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((it) => (
          <li
            key={it.id}
            className="flex items-center justify-between bg-white/5 rounded px-2 py-1"
          >
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={it.done}
                onChange={() => toggle(it.id)}
              />
              <span className={it.done ? "line-through opacity-70" : ""}>
                {it.text}
              </span>
            </label>
            <button onClick={() => remove(it.id)} className="text-red-300">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
