export async function getLocal(keys) {
  if (!window.chrome?.storage?.local?.get) return {};
  return await window.chrome.storage.local.get(keys);
}

export async function setLocal(obj) {
  if (!window.chrome?.storage?.local?.set) return;
  return await window.chrome.storage.local.set(obj);
}

export async function getSession(keys) {
  if (!window.chrome?.storage?.session?.get) return {};
  return await window.chrome.storage.session.get(keys);
}

export async function setSession(obj) {
  if (!window.chrome?.storage?.session?.set) return;
  return await window.chrome.storage.session.set(obj);
}
