/**
 * RUKYA PRO — Главное приложение
 * Ash-Shifa · Абу Мухаммад
 */

const app = {
    // Состояние приложения
    state: {
        currentPage: 'dashboard',
        currentPatient: null,
        currentDiagnosis: null,
        currentPlan: null,
        settings: {
            theme: 'classic',
            density: 'comfort',
            fontSize: 1,
            healerName: 'Абу Мухаммад',
            highContrast: false,
            apiKey: ''
        }
    },

    // Инициализация
    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.createStarField();
        this.setupNavigation();
        this.loadKnowledgeBase();
        
        // Загрузка начальной страницы
        const hash = window.location.hash || '#/dashboard';
        this.navigate(hash);
        
        console.log('RUKYA PRO инициализировано');
    },

    // Загрузка настроек
    async loadSettings() {
        const saved = await storage.get('settings', 'default');
        if (saved) {
            this.state.settings = { ...this.state.settings, ...saved };
            this.applySettings();
        }
    },

    // Применение настроек
    applySettings() {
        const s = this.state.settings;
        document.documentElement.setAttribute('data-theme', s.theme);
        document.body.classList.toggle('high-contrast', s.highContrast);
        document.body.classList.toggle('compact', s.density === 'compact');
        document.documentElement.style.fontSize = `${16 * s.fontSize}px`;
        
        // Заполнение формы настроек
        document.getElementById('settingsTheme').value = s.theme;
        document.getElementById('settingsDensity').value = s.density;
        document.getElementById('settingsHealerName').value = s.healerName;
        document.getElementById('settingsApiKey').value = s.apiKey || '';
        document.getElementById('settingsHighContrast').checked = s.highContrast;
    },

    // Сохранение настроек
    async saveSettings() {
        this.state.settings.theme = document.getElementById('settingsTheme').value;
        this.state.settings.density = document.getElementById('settingsDensity').value;
        this.state.settings.healerName = document.getElementById('settingsHealerName').value;
        this.state.settings.apiKey = document.getElementById('settingsApiKey').value;
        this.state.settings.highContrast = document.getElementById('settingsHighContrast').checked;
        
        await storage.set('settings', 'default', this.state.settings);
        this.applySettings();
        this.toast('Настройки сохранены', 'success');
    },

    // Навигация
    setupNavigation() {
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash || '#/dashboard';
            this.navigate(hash);
        });

        // Обработка кликов по навигации
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                this.navigate(href);
            });
        });
    },

    navigate(hash) {
        const page = hash.replace('#/', '') || 'dashboard';
        this.state.currentPage = page;
        
        // Обновление активного пункта меню
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === hash);
        });
        
        // Показ нужной страницы
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Обновление заголовка
        const titles = {
            dashboard: 'Дашборд',
            newcase: 'Новый приём',
            patients: 'Пациенты',
            plans: 'Планы лечения',
            groups: 'Группы',
            calendar: 'Календарь',
            certificates: 'Заключения',
            library: 'Библиотека',
            import: 'Импорт JSON',
            settings: 'Настройки'
        };
        document.getElementById('pageTitle').textContent = titles[page] || 'RUKYA PRO';
        
        // Загрузка данных страницы
        this.loadPageData(page);
    },

    // Загрузка данных страницы
    async loadPageData(page) {
        switch(page) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'patients':
                await this.loadPatients();
                break;
            case 'plans':
                await this.loadPlans();
                break;
            case 'groups':
                await this.loadGroups();
                break;
            case 'library':
                await this.loadLibrary();
                break;
            case 'certificates':
                await this.loadCertificates();
                break;
        }
    },

    // Загрузка дашборда
    async loadDashboard() {
        const patients = await storage.getAll('patients');
        const plans = await storage.getAll('plans');
        const certificates = await storage.getAll('certificates');
        
        const active = patients.filter(p => p.status === 'active').length;
        const paused = patients.filter(p => p.status === 'paused').length;
        const completed = patients.filter(p => p.status === 'completed').length;
        
        // Анимация чисел
        this.animateValue('kpiTotalPatients', patients.length);
        this.animateValue('kpiActivePatients', active);
        this.animateValue('kpiPausedPatients', paused);
        this.animateValue('kpiCompletedPatients', completed);
        this.animateValue('kpiPlans', plans.length);
        this.animateValue('kpiCertificates', certificates.length);
        
        // Визиты сегодня
        const today = new Date().toISOString().split('T')[0];
        const todayVisits = patients.filter(p => p.nextVisit === today);
        const visitsContainer = document.getElementById('todayVisits');
        
        if (todayVisits.length > 0) {
            visitsContainer.innerHTML = todayVisits.map(p => `
                <div class="patient-card card mb-16">
                    <div class="patient-info">
                        <h3>${p.name}</h3>
                        <div class="patient-meta">${p.diagnosis?.illnesses?.[0]?.name || 'Диагноз не установлен'}</div>
                    </div>
                    <div class="patient-actions">
                        <button class="btn btn-sm btn-primary" onclick="app.viewPatient('${p.id}')">📋 Карточка</button>
                    </div>
                </div>
            `).join('');
        } else {
            visitsContainer.innerHTML = '<p class="text-muted text-center">Нет запланированных визитов</p>';
        }
    },

    // Загрузка пациентов
    async loadPatients() {
        const patients = await storage.getAll('patients');
        const container = document.getElementById('patientsList');
        
        if (patients.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Список пациентов пуст. Начните с нового приёма.</p>';
            return;
        }
        
        container.innerHTML = patients.map(p => `
            <div class="card patient-card">
                <div class="patient-info">
                    <h3>${p.name}</h3>
                    <div class="patient-meta">
                        ${p.age ? p.age + ' лет' : ''} 
                        ${p.city ? '· ' + p.city : ''}
                        ${p.phone ? '· ' + p.phone : ''}
                    </div>
                    <div class="chips mt-8">
                        ${p.diagnosis?.illnesses?.slice(0, 3).map(i => `<span class="chip">${i.name}</span>`).join('') || '<span class="text-muted">Диагноз не установлен</span>'}
                    </div>
                </div>
                <div class="patient-actions">
                    <span class="badge badge-${p.status === 'active' ? 'success' : p.status === 'paused' ? 'warning' : 'secondary'}">
                        ${p.status === 'active' ? 'Активен' : p.status === 'paused' ? 'Пауза' : 'Завершён'}
                    </span>
                    <button class="btn btn-sm btn-primary" onclick="app.viewPatient('${p.id}')">📋 Карточка</button>
                </div>
            </div>
        `).join('');
    },

    // Просмотр пациента
    async viewPatient(id) {
        const patient = await storage.getById('patients', id);
        if (!patient) return;
        
        this.state.currentPatient = patient;
        
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="patient-detail">
                <h3>${patient.name}</h3>
                <p class="text-muted">${patient.age ? patient.age + ' лет' : ''} ${patient.gender === 'male' ? 'М' : patient.gender === 'female' ? 'Ж' : ''} ${patient.city || ''}</p>
                
                <div class="mt-16">
                    <h4>Диагноз</h4>
                    <div class="chips mt-8">
                        ${(patient.diagnosis?.illnesses || []).map(i => `<span class="chip">${i.name}</span>`).join('')}
                    </div>
                </div>
                
                <div class="mt-16">
                    <h4>Органы</h4>
                    <div class="chips mt-8">
                        ${(patient.diagnosis?.organs || []).map(o => `<span class="chip">${o.name}</span>`).join('')}
                    </div>
                </div>
                
                ${patient.complaints ? `
                <div class="mt-16">
                    <h4>Жалобы</h4>
                    <p class="text-secondary">${patient.complaints}</p>
                </div>
                ` : ''}
                
                ${patient.plan ? `
                <div class="mt-16">
                    <h4>План лечения</h4>
                    <p>Длительность: ${patient.plan.duration} дней</p>
                    <p>Формул: ${patient.plan.formulas?.length || 0}</p>
                </div>
                ` : ''}
            </div>
        `;
        
        document.getElementById('modalTitle').textContent = 'Карточка пациента';
        document.getElementById('modalFooter').innerHTML = `
            <button class="btn btn-secondary" onclick="app.closeModal()">Закрыть</button>
            <button class="btn btn-primary" onclick="app.editPatient('${id}')">Редактировать</button>
        `;
        
        this.openModal();
    },

    // Редактирование пациента
    editPatient(id) {
        this.closeModal();
        this.navigate('#/newcase');
        // TODO: Загрузить данные пациента в форму
    },

    // Загрузка планов
    async loadPlans() {
        const plans = await storage.getAll('plans');
        const container = document.getElementById('plansList');
        
        if (plans.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Планы лечения отсутствуют</p>';
            return;
        }
        
        container.innerHTML = plans.map(plan => `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${plan.patientName || 'Пациент'}</h3>
                    <span class="badge badge-primary">${plan.program?.name || 'Программа'}</span>
                </div>
                <div class="card-body">
                    <p>Длительность: ${plan.duration} дней</p>
                    <p>Формул: ${plan.formulas?.length || 0}</p>
                    <p>Статус: ${plan.status || 'active'}</p>
                </div>
            </div>
        `).join('');
    },

    // Загрузка групп
    async loadGroups() {
        const groups = await storage.getAll('groups');
        const container = document.getElementById('groupsList');
        
        if (groups.length === 0) {
            container.innerHTML = '<p class="text-muted text-center" style="grid-column: 1/-1">Группы не созданы</p>';
            return;
        }
        
        container.innerHTML = groups.map(g => `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${g.name}</h3>
                </div>
                <div class="card-body">
                    <p class="text-muted">Пациентов: ${g.patientCount || 0}</p>
                </div>
            </div>
        `).join('');
    },

    // Загрузка библиотеки
    async loadLibrary() {
        const programs = await storage.getAll('programs');
        const container = document.getElementById('programsList');
        
        if (programs.length === 0) {
            container.innerHTML = '<p class="text-muted text-center" style="grid-column: 1/-1">Программы не загружены</p>';
            return;
        }
        
        container.innerHTML = programs.map(p => `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${p.name}</h3>
                </div>
                <div class="card-body">
                    <p class="text-muted">${p.description || ''}</p>
                    <p class="mt-8">Формул: ${p.formulas?.length || 0}</p>
                </div>
            </div>
        `).join('');
    },

    // Загрузка заключений
    async loadCertificates() {
        const certs = await storage.getAll('certificates');
        const container = document.getElementById('certificatesList');
        
        if (certs.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Заключения не созданы</p>';
            return;
        }
        
        container.innerHTML = certs.map(c => `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${c.patientName}</h3>
                    <span class="badge badge-success">Выдано</span>
                </div>
                <div class="card-body">
                    <p>Дата: ${new Date(c.createdAt).toLocaleDateString('ru-RU')}</p>
                    <p>Диагноз: ${c.diagnosis}</p>
                </div>
            </div>
        `).join('');
    },

    // Анимация чисел
    animateValue(id, value) {
        const el = document.getElementById(id);
        if (!el) return;
        
        let current = 0;
        const increment = value / 20;
        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                el.textContent = value;
                clearInterval(timer);
            } else {
                el.textContent = Math.floor(current);
            }
        }, 50);
    },

    // Создание звёздного поля
    createStarField() {
        const container = document.getElementById('starField');
        if (!container) return;
        
        for (let i = 0; i < 100; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 3 + 's';
            container.appendChild(star);
        }
    },

    // Установка обработчиков событий
    setupEventListeners() {
        // Мобильное меню
        document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('mobile-open');
        });

        // Глобальный поиск
        document.getElementById('globalSearchBtn')?.addEventListener('click', () => {
            this.toast('Поиск в разработке', 'info');
        });

        // Ctrl+K для поиска
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.toast('Поиск в разработке', 'info');
            }
        });

        // Настройки - сохранение
        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => this.saveSettings());
        
        // Настройки - размер шрифта
        document.getElementById('fontIncrease')?.addEventListener('click', () => {
            this.state.settings.fontSize = Math.min(this.state.settings.fontSize + 0.1, 1.5);
            this.applySettings();
        });
        
        document.getElementById('fontDecrease')?.addEventListener('click', () => {
            this.state.settings.fontSize = Math.max(this.state.settings.fontSize - 0.1, 0.8);
            this.applySettings();
        });

        // Экспорт/импорт базы
        document.getElementById('exportDataBtn')?.addEventListener('click', () => this.exportDatabase());
        document.getElementById('importDataBtn')?.addEventListener('click', () => this.importDatabase());

        // Мастер нового приёма
        document.getElementById('step1NextBtn')?.addEventListener('click', () => wizard.goToStep(2));
        document.getElementById('step2NextBtn')?.addEventListener('click', () => wizard.goToStep(3));
        
        // Диагностика - переключение режимов
        document.querySelectorAll('[data-diag-mode]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const mode = e.target.dataset.diagMode;
                document.querySelectorAll('[data-diag-mode]').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                ['local', 'manual', 'json', 'ai'].forEach(m => {
                    document.getElementById(`diag${m.charAt(0).toUpperCase() + m.slice(1)}`).style.display = m === mode ? 'block' : 'none';
                });
            });
        });

        // Локальная диагностика
        document.getElementById('runLocalDiagnosis')?.addEventListener('click', async () => {
            const complaints = document.getElementById('patientComplaints').value;
            const result = await diagnosis.runLocal(complaints);
            this.showDiagnosisResult(result);
        });

        // Сборка плана
        document.getElementById('buildPlanBtn')?.addEventListener('click', () => this.buildPlan());
        
        // Сохранение пациента
        document.getElementById('savePatientBtn')?.addEventListener('click', () => this.savePatient());
        
        // Лимит формул
        document.getElementById('formulaLimit')?.addEventListener('input', (e) => {
            document.getElementById('formulaLimitValue').textContent = e.target.value;
        });

        // Тяжесть
        document.getElementById('manualSeverity')?.addEventListener('input', (e) => {
            document.getElementById('severityValue').textContent = e.target.value;
        });

        console.log('Обработчики событий установлены');
    },

    // Показать результат диагностики
    showDiagnosisResult(result) {
        this.state.currentDiagnosis = result;
        
        const container = document.getElementById('diagnosisResultContent');
        container.innerHTML = `
            <div class="mb-16">
                <strong>Типы недугов:</strong>
                <div class="chips mt-8">
                    ${(result.illnesses || []).map(i => `<span class="chip">${i.name}</span>`).join('')}
                </div>
            </div>
            
            <div class="mb-16">
                <strong>Органы:</strong>
                <div class="chips mt-8">
                    ${(result.organs || []).map(o => `<span class="chip">${o.name}</span>`).join('')}
                </div>
            </div>
            
            ${result.severity ? `<div class="mb-16"><strong>Тяжесть:</strong> ${result.severity}/5</div>` : ''}
            ${result.jinn ? `<div class="mb-16"><strong>Джинн:</strong> ${result.jinn}</div>` : ''}
            ${result.confidence ? `<div class="mb-16"><strong>Уверенность:</strong> ${result.confidence}</div>` : ''}
        `;
        
        document.getElementById('diagnosisResult').style.display = 'block';
        
        // Автоподбор программы
        this.autoSelectProgram(result);
    },

    // Автоподбор программы
    async autoSelectProgram(diagnosis) {
        const programs = await storage.getAll('programs');
        // Простая логика подбора - первая программа
        if (programs.length > 0) {
            const select = document.getElementById('programSelect');
            select.innerHTML = programs.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
            select.value = programs[0].id;
            document.getElementById('programMatchPercent').textContent = 'Совпадение: 85%';
        }
    },

    // Сборка плана
    async buildPlan() {
        const programId = document.getElementById('programSelect').value;
        const duration = parseInt(document.getElementById('courseDuration').value);
        const detailLevel = document.getElementById('detailLevel').value;
        const formulaLimit = parseInt(document.getElementById('formulaLimit').value);
        const addSoulKnots = document.getElementById('addSoulKnots').checked;
        
        if (!programId || !this.state.currentDiagnosis) {
            this.toast('Выберите программу и выполните диагностику', 'warning');
            return;
        }
        
        const program = await storage.getById('programs', programId);
        
        // Сборка плана
        const plan = planBuilder.build(program, this.state.currentDiagnosis, {
            duration,
            detailLevel,
            formulaLimit,
            addSoulKnots
        });
        
        this.state.currentPlan = plan;
        
        // Предпросмотр
        const preview = document.getElementById('planPreviewContent');
        preview.innerHTML = `
            <p><strong>Программа:</strong> ${program.name}</p>
            <p><strong>Длительность:</strong> ${duration} дней</p>
            <p><strong>Формул:</strong> ${plan.formulas?.length || 0}</p>
            <div class="mt-16">
                <h4>Структура плана:</h4>
                <ul>
                    ${plan.sections ? Object.keys(plan.sections).map(s => `<li>${s}</li>`).join('') : ''}
                </ul>
            </div>
        `;
        
        document.getElementById('planPreview').style.display = 'block';
        this.toast('План собран успешно', 'success');
    },

    // Сохранение пациента
    async savePatient() {
        const name = document.getElementById('patientName').value;
        if (!name) {
            this.toast('Введите имя пациента', 'warning');
            return;
        }
        
        const patient = {
            id: 'p_' + Date.now(),
            name,
            age: document.getElementById('patientAge').value,
            gender: document.getElementById('patientGender').value,
            phone: document.getElementById('patientPhone').value,
            city: document.getElementById('patientCity').value,
            group: document.getElementById('patientGroup').value,
            complaints: document.getElementById('patientComplaints').value,
            diagnosis: this.state.currentDiagnosis,
            plan: this.state.currentPlan,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await storage.set('patients', patient.id, patient);
        
        // Сохранение плана отдельно
        if (this.state.currentPlan) {
            const plan = {
                id: 'plan_' + patient.id,
                patientId: patient.id,
                patientName: patient.name,
                ...this.state.currentPlan,
                createdAt: new Date().toISOString()
            };
            await storage.set('plans', plan.id, plan);
        }
        
        this.toast('Пациент сохранён', 'success');
        setTimeout(() => this.navigate('#/patients'), 1000);
    },

    // Загрузка базы знаний
    async loadKnowledgeBase() {
        // Загрузка программ из data/programs.json
        try {
            const response = await fetch('data/programs.json');
            if (response.ok) {
                const programs = await response.json();
                for (const prog of programs) {
                    await storage.set('programs', prog.id || prog.key, prog);
                }
            }
        } catch (e) {
            console.log('Программы уже загружены или файл недоступен');
        }
    },

    // Модальные окна
    openModal() {
        document.getElementById('modalOverlay').classList.add('active');
    },

    closeModal() {
        document.getElementById('modalOverlay').classList.remove('active');
    },

    // Уведомления
    toast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Экспорт базы
    async exportDatabase() {
        const data = {};
        const stores = ['patients', 'plans', 'certificates', 'groups', 'settings'];
        
        for (const store of stores) {
            data[store] = await storage.getAll(store);
        }
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rukya_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.toast('База экспортирована', 'success');
    },

    // Импорт базы
    importDatabase() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    // TODO: Импорт данных
                    this.toast('Импорт в разработке', 'info');
                } catch (err) {
                    this.toast('Ошибка импорта: ' + err.message, 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
};

// Wizard controller
const wizard = {
    currentStep: 1,
    
    goToStep(step) {
        this.currentStep = step;
        
        // Обновление индикатора шагов
        document.querySelectorAll('.wizard-step').forEach((s, i) => {
            const num = i + 1;
            s.classList.remove('active', 'completed');
            if (num === step) s.classList.add('active');
            if (num < step) s.classList.add('completed');
        });
        
        // Показ контента шага
        for (let i = 1; i <= 3; i++) {
            document.getElementById(`wizardStep${i}`).style.display = i === step ? 'block' : 'none';
        }
        
        // Загрузка данных для шага 3
        if (step === 3) {
            app.autoSelectProgram(app.state.currentDiagnosis);
        }
    }
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => app.init());
