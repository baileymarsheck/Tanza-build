// Every read/write to browser storage in the app goes through here. A future
// native port swaps just this module (e.g. for AsyncStorage) — nothing else
// in lib/ or components/ touches `window.localStorage` directly.
export function getStoredItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setStoredItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures — in-memory state still updates.
  }
}
