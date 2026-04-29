/**
 * RUKYA PRO — Хранилище данных (IndexedDB)
 */

const DB_NAME = 'RukyaProDB';
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

let db = null;

// Инициализация базы данных
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Хранилище пациентов
            if (!database.objectStoreNames.contains(STORES.PATIENTS)) {
                const patientStore = database.createObjectStore(STORES.PATIENTS, { keyPath: 'id' });
                patientStore.createIndex('name', 'name', { unique: false });
                patientStore.createIndex('status', 'status', { unique: false });
                patientStore.createIndex('group', 'group', { unique: false });
                patientStore.createIndex('createdAt', 'createdAt', { unique: false });
            }

            // Хранилище планов
            if (!database.objectStoreNames.contains(STORES.PLANS)) {
                const planStore = database.createObjectStore(STORES.PLANS, { keyPath: 'id' });
                planStore.createIndex('patientId', 'patientId', { unique: false });
                planStore.createIndex('status', 'status', { unique: false });
            }

            // Хранилище заключений
            if (!database.objectStoreNames.contains(STORES.CERTIFICATES)) {
                const certStore = database.createObjectStore(STORES.CERTIFICATES, { keyPath: 'id' });
                certStore.createIndex('patientId', 'patientId', { unique: false });
            }

            // Хранилище настроек
            if (!database.objectStoreNames.contains(STORES.SETTINGS)) {
                database.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
            }

            // Хранилище истории
            if (!database.objectStoreNames.contains(STORES.HISTORY)) {
                const historyStore = database.createObjectStore(STORES.HISTORY, { keyPath: 'id' });
                historyStore.createIndex('entityType', 'entityType', { unique: false });
                historyStore.createIndex('entityId', 'entityId', { unique: false });
            }

            // Хранилище групп
            if (!database.objectStoreNames.contains(STORES.GROUPS)) {
                const groupStore = database.createObjectStore(STORES.GROUPS, { keyPath: 'id' });
                groupStore.createIndex('name', 'name', { unique: false });
            }

            // Хранилище визитов
            if (!database.objectStoreNames.contains(STORES.APPOINTMENTS)) {
                const apptStore = database.createObjectStore(STORES.APPOINTMENTS, { keyPath: 'id' });
                apptStore.createIndex('patientId', 'patientId', { unique: false });
                apptStore.createIndex('date', 'date', { unique: false });
            }

            // Хранилище анкет
            if (!database.objectStoreNames.contains(STORES.QUESTIONNAIRES)) {
                const qStore = database.createObjectStore(STORES.QUESTIONNAIRES, { keyPath: 'id' });
                qStore.createIndex('patientId', 'patientId', { unique: false });
            }
        };
    });
}

// Генерация уникального ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// CRUD операции
async function add(storeName, data) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const item = { ...data, id: data.id || generateId(), createdAt: new Date().toISOString() };
        const request = store.add(item);
        
        request.onsuccess = () => resolve(item);
        request.onerror = () => reject(request.error);
        
        // Запись в историю
        if (storeName !== STORES.HISTORY) {
            logHistory('CREATE', storeName, item.id, item);
        }
    });
}

async function get(storeName, id) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getAll(storeName, indexName = null, value = null) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        let request;
        if (indexName && value) {
            const index = store.index(indexName);
            request = index.getAll(value);
        } else {
            request = store.getAll();
        }
        
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

async function update(storeName, data) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const item = { ...data, updatedAt: new Date().toISOString() };
        const request = store.put(item);
        
        request.onsuccess = () => resolve(item);
        request.onerror = () => reject(request.error);
        
        // Запись в историю
        if (storeName !== STORES.HISTORY) {
            logHistory('UPDATE', storeName, item.id, item);
        }
    });
}

async function remove(storeName, id) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        
        request.onsuccess = () => {
            // Мягкое удаление для пациентов
            if (storeName === STORES.PATIENTS) {
                get(storeName, id).then(item => {
                    if (item) {
                        item.deletedAt = new Date().toISOString();
                        update(storeName, item);
                    }
                });
            }
            resolve();
        };
        request.onerror = () => reject(request.error);
        
        // Запись в историю
        if (storeName !== STORES.HISTORY) {
            logHistory('DELETE', storeName, id, null);
        }
    });
}

// Журнал истории
async function logHistory(action, entityType, entityId, data) {
    const entry = {
        action,
        entityType,
        entityId,
        data,
        timestamp: new Date().toISOString()
    };
    await add(STORES.HISTORY, entry);
}

// Экспорт всей базы
async function exportDB() {
    if (!db) await initDB();
    
    const exportData = {};
    
    for (const storeName of Object.values(STORES)) {
        if (db.objectStoreNames.contains(storeName)) {
            exportData[storeName] = await getAll(storeName);
        }
    }
    
    return JSON.stringify(exportData, null, 2);
}

// Импорт базы
async function importDB(jsonData) {
    if (!db) await initDB();
    
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    
    for (const [storeName, items] of Object.entries(data)) {
        if (STORES[storeName.toUpperCase()] && Array.isArray(items)) {
            for (const item of items) {
                await update(storeName, item);
            }
        }
    }
}

// Настройки
async function getSetting(key) {
    const setting = await get(STORES.SETTINGS, key);
    return setting ? setting.value : null;
}

async function setSetting(key, value) {
    await update(STORES.SETTINGS, { key, value });
}

// Пациенты
async function getPatients(filters = {}) {
    let patients = await getAll(STORES.PATIENTS);
    
    // Фильтрация удалённых
    patients = patients.filter(p => !p.deletedAt);
    
    if (filters.status) {
        patients = patients.filter(p => p.status === filters.status);
    }
    
    if (filters.group) {
        patients = patients.filter(p => p.group === filters.group);
    }
    
    if (filters.search) {
        const search = filters.search.toLowerCase();
        patients = patients.filter(p => 
            p.name.toLowerCase().includes(search) ||
            (p.phone && p.phone.includes(search))
        );
    }
    
    return patients;
}

// Планы
async function getPlansByPatient(patientId) {
    const plans = await getAll(STORES.PLANS, 'patientId', patientId);
    return plans.filter(p => !p.deletedAt);
}

// Группы
async function getGroups() {
    return await getAll(STORES.GROUPS);
}

async function createGroup(name) {
    return await add(STORES.GROUPS, { name, createdAt: new Date().toISOString() });
}

// Визиты
async function getAppointments(date) {
    const appointments = await getAll(STORES.APPOINTMENTS);
    if (date) {
        return appointments.filter(a => a.date === date && !a.deletedAt);
    }
    return appointments.filter(a => !a.deletedAt);
}

async function createAppointment(patientId, date, notes = '') {
    return await add(STORES.APPOINTMENTS, {
        patientId,
        date,
        notes,
        status: 'scheduled'
    });
}

// Анкеты
async function getQuestionnaires(patientId) {
    const questionnaires = await getAll(STORES.QUESTIONNAIRES, 'patientId', patientId);
    return questionnaires.filter(q => !q.deletedAt);
}

async function saveQuestionnaire(data) {
    return await add(STORES.QUESTIONNAIRES, {
        ...data,
        createdAt: new Date().toISOString()
    });
}

// Инициализация при загрузке
initDB().catch(console.error);

// Экспорт API
window.RukyaStorage = {
    initDB,
    generateId,
    add,
    get,
    getAll,
    update,
    remove,
    exportDB,
    importDB,
    getSetting,
    setSetting,
    getPatients,
    getPlansByPatient,
    getGroups,
    createGroup,
    getAppointments,
    createAppointment,
    getQuestionnaires,
    saveQuestionnaire,
    STORES
};
