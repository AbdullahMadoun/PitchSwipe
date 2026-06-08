import { mockStartups, Startup } from "./mock-data";

const STORAGE_KEY = "pitchswipe-startups";
const SAVED_KEY = "pitchswipe-saved";
const UNLOCKED_KEY = "pitchswipe-unlocked";
const INVESTED_KEY = "pitchswipe-invested";

type StoredStartup = Startup & { embedding?: number[]; createdAt?: number };

const safeParse = <T>(raw: string | null, fallback: T): T => {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const readArray = <T>(key: string): T[] => {
  if (typeof window === "undefined") return [];
  return safeParse<T[]>(localStorage.getItem(key), []);
};

const writeArray = <T>(key: string, value: T[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
};

export const loadCustomStartups = (): StoredStartup[] => readArray<StoredStartup>(STORAGE_KEY);

export const saveCustomStartup = (startup: StoredStartup) => {
  const current = loadCustomStartups();
  writeArray(STORAGE_KEY, [...current, { ...startup, createdAt: Date.now() }]);
};

export const getAllStartups = (): StoredStartup[] => {
  const custom = loadCustomStartups();
  return [...mockStartups, ...custom];
};

export const getSavedIds = (): string[] => readArray<string>(SAVED_KEY);

export const saveStartupId = (id: string) => {
  const ids = getSavedIds();
  if (!ids.includes(id)) {
    writeArray(SAVED_KEY, [...ids, id]);
  }
};

export const removeSavedId = (id: string) => {
  const ids = getSavedIds().filter((savedId) => savedId !== id);
  writeArray(SAVED_KEY, ids);
};

export const getSavedStartups = (): StoredStartup[] => {
  const ids = new Set(getSavedIds());
  return getAllStartups().filter((startup) => ids.has(startup.id));
};

export const getUnlockedIds = (): string[] => readArray<string>(UNLOCKED_KEY);

export const addUnlockedId = (id: string) => {
  const ids = getUnlockedIds();
  if (!ids.includes(id)) {
    writeArray(UNLOCKED_KEY, [...ids, id]);
  }
};

export const getUnlockedStartups = (): StoredStartup[] => {
  const ids = new Set(getUnlockedIds());
  return getAllStartups().filter((startup) => ids.has(startup.id));
};

export const getInvestedIds = (): string[] => readArray<string>(INVESTED_KEY);

export const addInvestedId = (id: string) => {
  const ids = getInvestedIds();
  if (!ids.includes(id)) {
    writeArray(INVESTED_KEY, [...ids, id]);
  }
};

export const getInvestedStartups = (): StoredStartup[] => {
  const ids = new Set(getInvestedIds());
  return getAllStartups().filter((startup) => ids.has(startup.id));
};

export const getLatestCustomStartup = (): StoredStartup | undefined => {
  const custom = loadCustomStartups();
  if (custom.length === 0) return undefined;
  return custom[custom.length - 1];
};

