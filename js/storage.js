/**
 * RUKYA PRO - Storage Module (IndexedDB)
 * Handles all data persistence for patients, plans, certificates, settings
 */

const DB_NAME = 'rukya_pro_db';
const DB_VERSION = 1;

const STORES = {
  PATIENTS: 'patients',
  PLANS: 'plans',
  CERTIFICATES: 'certificates',
  SETTINGS: 'settings',
  HISTORY: 'history',
  GROUPS: 'groups',
  APPOINTMENTS: 'appointments',
  QUESTIONNAIRES: 'questionnaires'
};

let dbInstance = null;

async function openDB() {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Patients store
      if (!db.objectStoreNames.contains(STORES.PATIENTS)) {
        const patientStore = db.createObjectStore(STORES.PATIENTS, { keyPath: 'id' });
        patientStore.createIndex('name', 'name', { unique: false });
        patientStore.createIndex('status', 'status', { unique: false });
        patientStore.createIndex('group', 'group', { unique: false });
        patientStore.createIndex('deletedAt', 'deletedAt', { unique: false });
        patientStore.createIndex('archivedAt', 'archivedAt', { unique: false });
      }

      // Plans store
      if (!db.objectStoreNames.contains(STORES.PLANS)) {
        const planStore = db.createObjectStore(STORES.PLANS, { keyPath: 'id' });
        planStore.createIndex('patientId', 'patientId', { unique: false });
        planStore.createIndex('status', 'status', { unique: false });
      }

      // Certificates store
      if (!db.objectStoreNames.contains(STORES.CERTIFICATES)) {
        const certStore = db.createObjectStore(STORES.CERTIFICATES, { keyPath: 'id' });
        certStore.createIndex('patientId', 'patientId', { unique: false });
      }

      // Settings store
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }

      // History store (audit log)
      if (!db.objectStoreNames.contains(STORES.HISTORY)) {
        const historyStore = db.createObjectStore(STORES.HISTORY, { keyPath: 'id', autoIncrement: true });
        historyStore.createIndex('entityType', 'entityType', { unique: false });
        historyStore.createIndex('entityId', 'entityId', { unique: false });
        historyStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Groups store
      if (!db.objectStoreNames.contains(STORES.GROUPS)) {
        const groupStore = db.createObjectStore(STORES.GROUPS, { keyPath: 'id' });
        groupStore.createIndex('name', 'name', { unique: false });
      }

      // Appointments store
      if (!db.objectStoreNames.contains(STORES.APPOINTMENTS)) {
        const apptStore = db.createObjectStore(STORES.APPOINTMENTS, { keyPath: 'id' });
        apptStore.createIndex('patientId', 'patientId', { unique: false });
        apptStore.createIndex('date', 'date', { unique: false });
      }

      // Questionnaires store
      if (!db.objectStoreNames.contains(STORES.QUESTIONNAIRES)) {
        const qStore = db.createObjectStore(STORES.QUESTIONNAIRES, { keyPath: 'id' });
        qStore.createIndex('patientId', 'patientId', { unique: false });
        qStore.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

async function getStore(storeName, mode = 'readonly') {
  const db = await openDB();
  return db.transaction(storeName, mode).objectStore(storeName);
}

// Generic CRUD operations
async function add(storeName, item) {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.add(item);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function get(storeName, key) {
  const store = await getStore(storeName);
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAll(storeName, indexName = null, value = null) {
  const store = await getStore(storeName);
  return new Promise((resolve, reject) => {
    let request;
    if (indexName && value !== null) {
      request = store.index(indexName).getAll(value);
    } else {
      request = store.getAll();
    }
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function update(storeName, item) {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put(item);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function remove(storeName, key) {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Soft delete with audit
async function softDelete(storeName, id, entityType) {
  const item = await get(storeName, id);
  if (!item) throw new Error('Item not found');
  
  item.deletedAt = Date.now();
  await update(storeName, item);
  
  // Log to history
  await logHistory(entityType, id, 'delete', item);
  
  return item;
}

// Restore from soft delete
async function restore(storeName, id, entityType) {
  const item = await get(storeName, id);
  if (!item) throw new Error('Item not found');
  
  delete item.deletedAt;
  await update(storeName, item);
  
  await logHistory(entityType, id, 'restore', item);
  
  return item;
}

// Archive functionality
async function archive(storeName, id, entityType) {
  const item = await get(storeName, id);
  if (!item) throw new Error('Item not found');
  
  item.archivedAt = Date.now();
  await update(storeName, item);
  
  await logHistory(entityType, id, 'archive', item);
  
  return item;
}

// History logging
async function logHistory(entityType, entityId, action, data) {
  const historyEntry = {
    entityType,
    entityId,
    action,
    data: JSON.parse(JSON.stringify(data)),
    timestamp: Date.now(),
    userAgent: navigator.userAgent
  };
  await add(STORES.HISTORY, historyEntry);
}

// Export entire database
async function exportDatabase() {
  const exportData = {};
  for (const storeName of Object.values(STORES)) {
    exportData[storeName] = await getAll(storeName);
  }
  return exportData;
}

// Import database
async function importDatabase(data) {
  for (const [storeName, items] of Object.entries(data)) {
    for (const item of items) {
      await update(storeName, item);
    }
  }
}

// Settings helpers
async function getSetting(key, defaultValue = null) {
  const setting = await get(STORES.SETTINGS, key);
  return setting ? setting.value : defaultValue;
}

async function setSetting(key, value) {
  await update(STORES.SETTINGS, { key, value, updatedAt: Date.now() });
}

// Patient-specific operations
async function getPatientWithPlan(patientId) {
  const patient = await get(STORES.PATIENTS, patientId);
  if (!patient) return null;
  
  const plans = await getAll(STORES.PLANS, 'patientId', patientId);
  patient.plans = plans || [];
  
  const questionnaires = await getAll(STORES.QUESTIONNAIRES, 'patientId', patientId);
  patient.questionnaires = questionnaires || [];
  
  return patient;
}

async function getActivePatients() {
  const all = await getAll(STORES.PATIENTS);
  return all.filter(p => !p.deletedAt && !p.archivedAt && p.status === 'active');
}

async function getPatientsByGroup(groupId) {
  const all = await getAll(STORES.PATIENTS);
  return all.filter(p => !p.deletedAt && !p.archivedAt && p.group === groupId);
}

// Make storage available globally for non-module scripts
window.storage = {
  openDB,
  STORES,
  add,
  get,
  getAll,
  update,
  remove,
  softDelete,
  restore,
  archive,
  logHistory,
  exportDatabase,
  importDatabase,
  getSetting,
  setSetting,
  getPatientWithPlan,
  getActivePatients,
  getPatientsByGroup
};
