/**
 * RUKYA PRO — Главное приложение
 */

// Состояние приложения
const AppState = {
    currentRoute: 'dashboard',
    currentPatient: null,
    newCaseData: {
        step: 1,
        patient: {},
        symptoms: [],
        diagnosis: null,
        program: null,
        duration: 14,
        detailLevel: 'medium',
        limitFormulas: 50,
        includeSoulKnots: false
    }
};

// Инициализация приложения
async function initApp() {
    await RukyaStorage.initDB();
    
    // Загрузка настроек
    const theme = await RukyaStorage.getSetting('theme') || 'classic';
    applyTheme(theme);
    
    const healerName = await RukyaStorage.getSetting('healerName');
    if (healerName) {
        document.getElementById('healerNameDisplay').textContent = healerName;
    }
    
    // Обработка маршрутов
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
    
    // Навигация
    setupNavigation();
    
    // Глобальный поиск
    document.getElementById('globalSearch').addEventListener('click', () => {
        showToast('Поиск в разработке', 'warning');
    });
    
    // Переключение темы
    document.getElementById('themeToggle').addEventListener('click', cycleTheme);
    
    // Мобильное меню
    document.getElementById('menuToggle').addEventListener('click', toggleMobileMenu);
    
    // Уведомления
    window.showToast = showToast;
    
    console.log('RUKYA PRO запущен');
}

// Обработка маршрутов
function handleRoute() {
    const hash = window.location.hash || '#/dashboard';
    const route = hash.replace('#/', '');
    
    AppState.currentRoute = route;
    
    // Обновление активной навигации
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.route === route);
    });
    
    // Рендеринг страницы
    renderPage(route);
}

// Настройка навигации
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const route = item.dataset.route;
            window.location.hash = `#/${route}`;
            
            // Закрытие мобильного меню
            document.getElementById('sidebar').classList.remove('active');
        });
    });
}

// Переключение темы
let themeIndex = 0;
const themes = ['classic', 'emerald', 'night', 'royal', 'desert', 'pearl', 'marine', 'sage', 'sky', 'obsidian'];

function applyTheme(theme) {
    document.body.className = '';
    if (theme !== 'classic') {
        document.body.classList.add(`theme-${theme}`);
    }
    RukyaStorage.setSetting('theme', theme);
}

function cycleTheme() {
    themeIndex = (themeIndex + 1) % themes.length;
    applyTheme(themes[themeIndex]);
    showToast(`Тема: ${themes[themeIndex]}`, 'success');
}

// Мобильное меню
function toggleMobileMenu() {
    document.getElementById('sidebar').classList.toggle('active');
}

// Уведомления
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Рендеринг страниц
async function renderPage(route) {
    const container = document.getElementById('pageContainer');
    const pageTitle = document.getElementById('pageTitle');
    
    container.innerHTML = '<div class="dot-loader"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
    
    switch (route) {
        case 'dashboard':
            pageTitle.textContent = 'Дашборд';
            await renderDashboard(container);
            break;
            
        case 'newcase':
            pageTitle.textContent = 'Новый приём';
            renderNewCase(container);
            break;
            
        case 'patients':
            pageTitle.textContent = 'Пациенты';
            await renderPatients(container);
            break;
            
        case 'plans':
            pageTitle.textContent = 'Планы лечения';
            await renderPlans(container);
            break;
            
        case 'groups':
            pageTitle.textContent = 'Группы';
            await renderGroups(container);
            break;
            
        case 'calendar':
            pageTitle.textContent = 'Календарь';
            await renderCalendar(container);
            break;
            
        case 'certificates':
            pageTitle.textContent = 'Заключения';
            await renderCertificates(container);
            break;
            
        case 'library':
            pageTitle.textContent = 'Библиотека программ';
            await renderLibrary(container);
            break;
            
        case 'import':
            pageTitle.textContent = 'Импорт данных';
            await renderImport(container);
            break;
            
        case 'settings':
            pageTitle.textContent = 'Настройки';
            await renderSettings(container);
            break;
            
        default:
            container.innerHTML = '<p>Страница не найдена</p>';
    }
}

// Дашборд
async function renderDashboard(container) {
    const patients = await RukyaStorage.getPatients();
    const plans = await RukyaStorage.getAll(RukyaStorage.STORES.PLANS);
    const certs = await RukyaStorage.getAll(RukyaStorage.STORES.CERTIFICATES);
    
    const activePatients = patients.filter(p => p.status === 'active').length;
    const pausedPatients = patients.filter(p => p.status === 'paused').length;
    const completedPatients = patients.filter(p => p.status === 'completed').length;
    const activePlans = plans.filter(p => p.status === 'active' && !p.deletedAt).length;
    
    container.innerHTML = `
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-value">${patients.length}</div>
                <div class="kpi-label">Всего пациентов</div>
                <div class="kpi-delta up">↑ 12% за месяц</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${activePatients}</div>
                <div class="kpi-label">Активных</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${pausedPatients}</div>
                <div class="kpi-label">На паузе</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${completedPatients}</div>
                <div class="kpi-label">Завершённых</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${activePlans}</div>
                <div class="kpi-label">Активных планов</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${certs.length}</div>
                <div class="kpi-label">Заключений</div>
            </div>
        </div>
        
        <div class="grid grid-2">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Быстрые действия</h3>
                </div>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <a href="#/newcase" class="btn btn-primary">➕ Новый приём</a>
                    <a href="#/patients" class="btn btn-secondary">👥 Пациенты</a>
                    <a href="#/plans" class="btn btn-secondary">📋 Планы</a>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Статистика</h3>
                </div>
                <p>Средний прогресс лечения: ${Math.round((activePlans > 0 ? 65 : 0))}%</p>
                <div class="progress-bar" style="margin-top: 12px;">
                    <div class="progress-fill" style="width: 65%"></div>
                </div>
            </div>
        </div>
    `;
}

// Новый приём (мастер)
function renderNewCase(container) {
    const data = AppState.newCaseData;
    
    container.innerHTML = `
        <div class="wizard">
            <div class="wizard-steps">
                <div class="step ${data.step >= 1 ? 'active' : ''} ${data.step > 1 ? 'completed' : ''}">
                    <div class="step-number">${data.step > 1 ? '✓' : '1'}</div>
                    <div class="step-label">Пациент</div>
                </div>
                <div class="step ${data.step >= 2 ? 'active' : ''} ${data.step > 2 ? 'completed' : ''}">
                    <div class="step-number">${data.step > 2 ? '✓' : '2'}</div>
                    <div class="step-label">Диагностика</div>
                </div>
                <div class="step ${data.step >= 3 ? 'active' : ''}">
                    <div class="step-number">3</div>
                    <div class="step-label">План</div>
                </div>
            </div>
            
            <div id="wizardContent"></div>
        </div>
    `;
    
    renderWizardStep(data.step);
}

function renderWizardStep(step) {
    const content = document.getElementById('wizardContent');
    
    if (step === 1) {
        content.innerHTML = `
            <div class="card">
                <h3>Данные пациента</h3>
                <div class="grid grid-2" style="margin-top: 20px;">
                    <div class="form-group">
                        <label class="form-label">Имя *</label>
                        <input type="text" class="form-input" id="patientName" placeholder="Имя пациента">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Возраст</label>
                        <input type="number" class="form-input" id="patientAge" placeholder="Лет">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Пол</label>
                        <select class="form-select" id="patientGender">
                            <option value="male">Мужской</option>
                            <option value="female">Женский</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Телефон</label>
                        <input type="tel" class="form-input" id="patientPhone" placeholder="+7...">
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Жалобы</label>
                    <textarea class="form-textarea" id="patientComplaints" rows="4" placeholder="Опишите симптомы..."></textarea>
                </div>
                
                <button class="btn btn-primary" onclick="nextWizardStep(2)">Далее →</button>
            </div>
        `;
    } else if (step === 2) {
        const symptomsHtml = KnowledgeBase.symptoms.map(s => `
            <label class="symptom-item">
                <input type="checkbox" value="${s.id}" data-label="${s.label}">
                <span>${s.label}</span>
            </label>
        `).join('');
        
        content.innerHTML = `
            <div class="card">
                <h3>Симптомы</h3>
                <div class="symptoms-grid" style="margin: 20px 0;">
                    ${symptomsHtml}
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 12px;">
                    <button class="btn btn-secondary" onclick="renderWizardStep(1)">← Назад</button>
                    <button class="btn btn-primary" onclick="runLocalDiagnosis()">Диагностировать</button>
                </div>
                
                <div id="diagnosisResult" style="margin-top: 20px;"></div>
            </div>
        `;
    } else if (step === 3) {
        const programs = KnowledgeBase.programs;
        const options = programs.map(p => `<option value="${p.id}">${p.name} (${p.duration} дн.)</option>`).join('');
        
        content.innerHTML = `
            <div class="card">
                <h3>Программа лечения</h3>
                
                <div class="form-group" style="margin-top: 20px;">
                    <label class="form-label">Выберите программу</label>
                    <select class="form-select" id="treatmentProgram">
                        ${options}
                    </select>
                </div>
                
                <div class="grid grid-2">
                    <div class="form-group">
                        <label class="form-label">Длительность (дней)</label>
                        <input type="number" class="form-input" id="treatmentDuration" value="14" min="3" max="120">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Детализация</label>
                        <select class="form-select" id="treatmentDetail">
                            <option value="short">Краткий</option>
                            <option value="medium" selected>Средний</option>
                            <option value="full">Полный</option>
                        </select>
                    </div>
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 12px;">
                    <button class="btn btn-secondary" onclick="renderWizardStep(2)">← Назад</button>
                    <button class="btn btn-success" onclick="completeNewCase()">✓ Сохранить пациента и план</button>
                </div>
            </div>
        `;
    }
}

async function nextWizardStep(step) {
    if (step === 2) {
        const name = document.getElementById('patientName').value;
        if (!name) {
            showToast('Введите имя пациента', 'error');
            return;
        }
        AppState.newCaseData.patient = {
            name,
            age: document.getElementById('patientAge').value,
            gender: document.getElementById('patientGender').value,
            phone: document.getElementById('patientPhone').value,
            complaints: document.getElementById('patientComplaints').value
        };
    }
    
    AppState.newCaseData.step = step;
    renderWizardStep(step);
}

async function runLocalDiagnosis() {
    const checkboxes = document.querySelectorAll('.symptom-item input:checked');
    const symptoms = Array.from(checkboxes).map(cb => ({
        id: cb.value,
        label: cb.dataset.label,
        checked: true
    }));
    
    const complaints = document.getElementById('patientComplaints').value;
    
    const diagnosis = DiagnosisEngine.mockDiagnose(complaints, symptoms);
    AppState.newCaseData.diagnosis = diagnosis;
    
    const resultDiv = document.getElementById('diagnosisResult');
    
    const illnessTags = diagnosis.illnesses.map(i => 
        `<span class="badge badge-info">${i.name}</span>`
    ).join('');
    
    const organTags = diagnosis.organs.map(o => 
        `<span class="badge badge-warning">${o.name}</span>`
    ).join('');
    
    resultDiv.innerHTML = `
        <div class="diagnosis-preview">
            <h4>Предварительный диагноз</h4>
            <div class="diagnosis-tags">${illnessTags}</div>
            <div class="diagnosis-tags">${organTags}</div>
            <p>Тяжесть: ${'★'.repeat(diagnosis.severity)}${'☆'.repeat(5-diagnosis.severity)}</p>
            <p>Уверенность: ${Math.round(diagnosis.confidence * 100)}%</p>
        </div>
        <button class="btn btn-primary" style="margin-top: 12px;" onclick="nextWizardStep(3)">Перейти к плану →</button>
    `;
}

async function completeNewCase() {
    const patientData = AppState.newCaseData.patient;
    const diagnosis = AppState.newCaseData.diagnosis;
    const programId = document.getElementById('treatmentProgram').value;
    const duration = parseInt(document.getElementById('treatmentDuration').value);
    const detailLevel = document.getElementById('treatmentDetail').value;
    
    try {
        // Создание пациента
        const patient = await RukyaStorage.add(RukyaStorage.STORES.PATIENTS, {
            ...patientData,
            status: 'active',
            diagnosis: diagnosis,
            group: 'default'
        });
        
        // Создание плана
        await PlanBuilder.createTreatmentPlan(
            patient.id,
            diagnosis,
            programId,
            duration,
            detailLevel,
            50,
            false
        );
        
        showToast('Пациент и план созданы', 'success');
        
        // Сброс
        AppState.newCaseData = {
            step: 1,
            patient: {},
            symptoms: [],
            diagnosis: null,
            program: null,
            duration: 14,
            detailLevel: 'medium',
            limitFormulas: 50,
            includeSoulKnots: false
        };
        
        window.location.hash = '#/patients';
    } catch (error) {
        console.error(error);
        showToast('Ошибка при сохранении', 'error');
    }
}

// Пациенты
async function renderPatients(container) {
    const patients = await RukyaStorage.getPatients();
    
    let html = '<div class="patients-list">';
    
    if (patients.length === 0) {
        html += '<div class="card"><p>Нет пациентов. Создайте первого!</p></div>';
    } else {
        for (const patient of patients) {
            const avatar = patient.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const diagnosisNames = patient.diagnosis?.illnesses?.map(i => i.name).join(', ') || 'Нет диагноза';
            
            html += `
                <div class="card patient-card">
                    <div class="patient-avatar">${avatar}</div>
                    <div class="patient-info">
                        <h3>${patient.name}</h3>
                        <p>${diagnosisNames}</p>
                        <p>${patient.age ? patient.age + ' лет' : ''} ${patient.city || ''}</p>
                    </div>
                    <div class="patient-actions">
                        <button class="btn btn-secondary" onclick="viewPatient('${patient.id}')">📄</button>
                        <a href="#/newcase" class="btn btn-primary">План</a>
                    </div>
                </div>
            `;
        }
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Планы
async function renderPlans(container) {
    const plans = await RukyaStorage.getAll(RukyaStorage.STORES.PLANS);
    const activePlans = plans.filter(p => !p.deletedAt);
    
    let html = '<div class="patients-list">';
    
    if (activePlans.length === 0) {
        html += '<div class="card"><p>Нет активных планов</p></div>';
    } else {
        for (const plan of activePlans) {
            const progress = plan.progress || 0;
            const statusClass = plan.status === 'completed' ? 'badge-success' : plan.status === 'paused' ? 'badge-warning' : 'badge-info';
            const statusName = plan.status === 'completed' ? 'Завершён' : plan.status === 'paused' ? 'Пауза' : 'Активен';
            
            html += `
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">${plan.programName}</h3>
                        <span class="badge ${statusClass}">${statusName}</span>
                    </div>
                    <p>Длительность: ${plan.duration} дней</p>
                    <p>Прогресс: ${progress}%</p>
                    <div class="progress-bar" style="margin: 12px 0;">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary" onclick="printPlanById('${plan.id}')">🖨 Печать</button>
                        <button class="btn btn-secondary" onclick="togglePlanStatus('${plan.id}')">${plan.status === 'paused' ? '▶ Возобновить' : '⏸ Пауза'}</button>
                    </div>
                </div>
            `;
        }
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Группы
async function renderGroups(container) {
    const groups = await RukyaStorage.getGroups();
    
    let html = '<div class="grid grid-3">';
    
    for (const group of groups) {
        const patients = await RukyaStorage.getPatients({ group: group.id });
        
        html += `
            <div class="card">
                <h3>${group.name}</h3>
                <p>Пациентов: ${patients.length}</p>
                <button class="btn btn-secondary" style="margin-top: 12px;">Открыть</button>
            </div>
        `;
    }
    
    if (groups.length === 0) {
        html += '<div class="card"><p>Нет групп</p></div>';
    }
    
    html += '</div>';
    html += '<button class="btn btn-primary" style="margin-top: 20px;">+ Создать группу</button>';
    
    container.innerHTML = html;
}

// Календарь
async function renderCalendar(container) {
    const today = new Date().toISOString().split('T')[0];
    
    container.innerHTML = `
        <div class="card">
            <h3>Визиты на сегодня</h3>
            <p style="margin-top: 12px; color: var(--text-secondary);">Функционал календаря в разработке</p>
            <p>Дата: ${new Date().toLocaleDateString('ru-RU')}</p>
        </div>
    `;
}

// Заключения
async function renderCertificates(container) {
    const certs = await RukyaStorage.getAll(RukyaStorage.STORES.CERTIFICATES);
    
    container.innerHTML = `
        <div class="card">
            <h3>Заключения</h3>
            <p style="margin-top: 12px;">Выдано заключений: ${certs.length}</p>
            <button class="btn btn-primary" style="margin-top: 20px;">+ Создать заключение</button>
        </div>
    `;
}

// Библиотека
async function renderLibrary(container) {
    const programs = KnowledgeBase.programs;
    
    let html = '<div class="grid grid-2">';
    
    for (const program of programs) {
        html += `
            <div class="card">
                <h3>${program.name}</h3>
                <p>Длительность: ${program.duration} дней</p>
                <p>Тип: ${program.illness}</p>
                <button class="btn btn-secondary" style="margin-top: 12px;">Применить</button>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Импорт
async function renderImport(container) {
    container.innerHTML = `
        <div class="card">
            <h3>Импорт данных</h3>
            <div class="form-group" style="margin-top: 20px;">
                <label class="form-label">JSON файл или данные</label>
                <textarea class="form-textarea" id="importData" rows="6" placeholder='{"name": "...", "complaints": "..."}'></textarea>
            </div>
            <div style="display: flex; gap: 12px;">
                <button class="btn btn-primary" onclick="processImport()">Импортировать</button>
                <button class="btn btn-secondary" onclick="document.getElementById('importFile').click()">📁 Загрузить файл</button>
                <input type="file" id="importFile" accept=".json" style="display: none;" onchange="handleFileImport(this)">
            </div>
        </div>
    `;
}

// Настройки
async function renderSettings(container) {
    const healerName = await RukyaStorage.getSetting('healerName') || 'Абу Мухаммад';
    const apiKey = await RukyaStorage.getSetting('deepseekApiKey') || '';
    
    container.innerHTML = `
        <div class="grid grid-2">
            <div class="card">
                <h3>Основные настройки</h3>
                
                <div class="form-group" style="margin-top: 20px;">
                    <label class="form-label">Имя лекаря</label>
                    <input type="text" class="form-input" id="settingHealerName" value="${healerName}">
                </div>
                
                <button class="btn btn-primary" onclick="saveSettings()">Сохранить</button>
            </div>
            
            <div class="card">
                <h3>DeepSeek API</h3>
                
                <div class="form-group" style="margin-top: 20px;">
                    <label class="form-label">API ключ</label>
                    <input type="password" class="form-input" id="settingApiKey" value="${apiKey}" placeholder="sk-...">
                </div>
                
                <button class="btn btn-secondary" onclick="saveApiKey()">Сохранить ключ</button>
            </div>
            
            <div class="card">
                <h3>Данные</h3>
                <button class="btn btn-secondary" onclick="exportDatabase()">📥 Экспорт базы</button>
                <button class="btn btn-secondary" style="margin-left: 12px;" onclick="document.getElementById('importDbFile').click()">📤 Импорт базы</button>
                <input type="file" id="importDbFile" accept=".json" style="display: none;" onchange="handleDbImport(this)">
            </div>
        </div>
    `;
}

// Вспомогательные функции
window.viewPatient = (id) => {
    showToast('Просмотр пациента: ' + id, 'info');
};

window.printPlanById = async (id) => {
    const plan = await RukyaStorage.get(RukyaStorage.STORES.PLANS, id);
    const patient = await RukyaStorage.get(RukyaStorage.STORES.PATIENTS, plan.patientId);
    PlanBuilder.printPlan(plan, patient);
};

window.togglePlanStatus = async (id) => {
    const newStatus = await PlanBuilder.togglePlanPause(id);
    showToast(`Статус: ${newStatus === 'paused' ? 'Пауза' : 'Активен'}`, 'success');
    renderPage('plans');
};

window.processImport = () => {
    const data = document.getElementById('importData').value;
    try {
        const parsed = JSON.parse(data);
        showToast('Данные загружены', 'success');
    } catch {
        showToast('Неверный формат JSON', 'error');
    }
};

window.handleFileImport = (input) => {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('importData').value = e.target.result;
        };
        reader.readAsText(file);
    }
};

window.saveSettings = async () => {
    const healerName = document.getElementById('settingHealerName').value;
    await RukyaStorage.setSetting('healerName', healerName);
    document.getElementById('healerNameDisplay').textContent = healerName;
    showToast('Настройки сохранены', 'success');
};

window.saveApiKey = async () => {
    const apiKey = document.getElementById('settingApiKey').value;
    await RukyaStorage.setSetting('deepseekApiKey', apiKey);
    showToast('API ключ сохранён', 'success');
};

window.exportDatabase = async () => {
    const data = await RukyaStorage.exportDB();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rukya_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('База экспортирована', 'success');
};

window.handleDbImport = (input) => {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            await RukyaStorage.importDB(e.target.result);
            showToast('База импортирована', 'success');
        };
        reader.readAsText(file);
    }
};

// Запуск приложения
initApp().catch(console.error);
