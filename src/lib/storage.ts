import "expo-sqlite/localStorage/install";

/**
 * Key-value storage on the device (the signed-in session and the guest cart).
 * On phones this is expo-sqlite's localStorage; storage.web.ts is the browser
 * version, used only for previewing the app on the web.
 */
export const storage: Storage = globalThis.localStorage;
