(function () {
  "use strict";

  const DATABASE_NAME = "catalogo-v1-assets";
  const DATABASE_VERSION = 1;
  const STORE_NAME = "blobs";

  class AssetStorage {
    constructor(options = {}) {
      this.databaseName = options.databaseName || DATABASE_NAME;
      this.memory = new Map();
      this.databasePromise = null;
    }

    usesIndexedDB() {
      return typeof window.indexedDB !== "undefined";
    }

    open() {
      if (!this.usesIndexedDB()) return Promise.resolve(null);
      if (this.databasePromise) return this.databasePromise;
      this.databasePromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(this.databaseName, DATABASE_VERSION);
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: "id" });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("Não foi possível abrir o armazenamento de artes."));
      });
      return this.databasePromise;
    }

    async request(mode, operation) {
      const database = await this.open();
      if (!database) return operation(null);
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        const request = operation(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || transaction.error || new Error("Falha no armazenamento de artes."));
      });
    }

    async put(id, blob) {
      if (!id || !blob) throw new Error("ID e arquivo são obrigatórios para salvar uma arte.");
      const record = { id: String(id), blob, updatedAt: new Date().toISOString() };
      if (!this.usesIndexedDB()) {
        this.memory.set(record.id, record);
        return record;
      }
      await this.request("readwrite", store => store.put(record));
      return record;
    }

    async putMany(entries) {
      const records = (entries || []).map(entry => {
        if (!entry?.id || !entry?.blob) throw new Error("Cada asset do lote precisa de ID e arquivo.");
        return { id: String(entry.id), blob: entry.blob, updatedAt: new Date().toISOString() };
      });
      if (!records.length) return [];
      if (!this.usesIndexedDB()) {
        const previous = new Map(records.map(record => [record.id, this.memory.get(record.id)]));
        try {
          records.forEach(record => this.memory.set(record.id, record));
        } catch (error) {
          previous.forEach((value, key) => { if (value) this.memory.set(key, value); else this.memory.delete(key); });
          throw error;
        }
        return records;
      }
      const database = await this.open();
      await new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        records.forEach(record => store.put(record));
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(transaction.error || new Error("O lote de assets foi cancelado."));
        transaction.onerror = () => reject(transaction.error || new Error("Falha ao persistir o lote de assets."));
      });
      return records;
    }

    async get(id) {
      if (!id) return null;
      if (!this.usesIndexedDB()) return this.memory.get(String(id))?.blob || null;
      const record = await this.request("readonly", store => store.get(String(id)));
      return record?.blob || null;
    }

    async has(id) {
      return Boolean(await this.get(id));
    }

    async delete(id) {
      if (!id) return false;
      if (!this.usesIndexedDB()) return this.memory.delete(String(id));
      await this.request("readwrite", store => store.delete(String(id)));
      return true;
    }

    async deleteMany(ids) {
      const keys = Array.from(new Set((ids || []).filter(Boolean).map(String)));
      if (!keys.length) return true;
      if (!this.usesIndexedDB()) {
        keys.forEach(key => this.memory.delete(key));
        return true;
      }
      const database = await this.open();
      await new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        keys.forEach(key => store.delete(key));
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(transaction.error || new Error("A limpeza do lote de assets foi cancelada."));
        transaction.onerror = () => reject(transaction.error || new Error("Falha ao limpar o lote de assets."));
      });
      return true;
    }
  }

  window.CatalogAssetStorage = AssetStorage;
  window.CATALOG_ASSET_DATABASE = { name: DATABASE_NAME, version: DATABASE_VERSION, store: STORE_NAME };
})();
