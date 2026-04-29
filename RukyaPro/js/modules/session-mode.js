/**
 * RUKYA PRO - Session Mode Module v2.0
 * Specialized interface for healers during ruqya sessions
 * Voice control, quick actions, timer, and real-time notes
 */

const SessionMode = {
    isActive: false,
    currentPatient: null,
    sessionData: {
        startTime: null,
        formulas: [],
        reactions: [],
        notes: [],
        voiceCommands: []
    },

    // Voice command mappings (Russian)
    voiceCommands: {
        'начать формулу': 'start_formula',
        'следующая формула': 'next_formula',
        'повторить': 'repeat_formula',
        'пауза': 'pause',
        'продолжить': 'resume',
        'завершить сеанс': 'end_session',
        'добавить заметку': 'add_note',
        'отметить реакцию': 'mark_reaction',
        'таймер 5 минут': 'timer_5min',
        'таймер 10 минут': 'timer_10min',
        'остановить таймер': 'stop_timer'
    },

    /**
     * Initialize session mode for a patient
     */
    startSession(patientId) {
        this.isActive = true;
        this.currentPatient = patientId;
        this.sessionData = {
            startTime: new Date(),
            formulas: [],
            reactions: [],
            notes: [],
            voiceCommands: [],
            timer: null
        };

        // Create session UI overlay
        this.createSessionUI();
        
        // Initialize voice recognition
        this.initVoiceControl();
        
        // Load patient treatment plan
        this.loadTreatmentPlan(patientId);
        
        console.log('Session started for patient:', patientId);
        return true;
    },

    /**
     * Create floating session control panel
     */
    createSessionUI() {
        const container = document.createElement('div');
        container.id = 'session-mode-container';
        container.className = 'session-mode-active';
        
        container.innerHTML = `
            <div class="session-header">
                <h3>🕌 Сеанс рукьи</h3>
                <button class="btn-close" onclick="SessionMode.endSession()">✕</button>
            </div>
            
            <div class="session-timer">
                <span id="session-elapsed">00:00:00</span>
                <button class="btn-icon" onclick="SessionMode.toggleTimer()">⏱</button>
            </div>
            
            <div class="quick-actions">
                <button class="btn-action" data-action="prev_formula">◀ Пред.</button>
                <button class="btn-action btn-primary" data-action="start_formula">▶ Старт</button>
                <button class="btn-action" data-action="next_formula">След. ▶</button>
                <button class="btn-action" data-action="repeat">🔁 Повтор</button>
            </div>
            
            <div class="current-formula">
                <div class="formula-arabic arabic" id="current-formula-text">
                    Выберите формулу для начала
                </div>
                <div class="formula-info">
                    <span id="formula-counter">0/0</span>
                    <span id="formula-name">-</span>
                </div>
            </div>
            
            <div class="reaction-buttons">
                <button class="btn-reaction" data-reaction="calm">😌 Спокойствие</button>
                <button class="btn-reaction" data-reaction="tension">😰 Напряжение</button>
                <button class="btn-reaction" data-reaction="pain">🤕 Боль</button>
                <button class="btn-reaction" data-reaction="heat">🔥 Жар</button>
                <button class="btn-reaction" data-reaction="cold">❄️ Холод</button>
                <button class="btn-reaction" data-reaction="yawning">🥱 Зевота</button>
                <button class="btn-reaction" data-reaction="tears">😢 Слезы</button>
                <button class="btn-reaction" data-reaction="other">📝 Другое</button>
            </div>
            
            <div class="voice-control">
                <button class="btn-voice" id="voice-toggle" onclick="SessionMode.toggleVoiceControl()">
                    🎙 Голосовое управление
                </button>
                <span id="voice-status" class="voice-status">Выключено</span>
            </div>
            
            <div class="quick-notes">
                <textarea id="session-note" placeholder="Быстрая заметка..."></textarea>
                <button class="btn-save-note" onclick="SessionMode.addNote()">Сохранить</button>
            </div>
            
            <div class="session-progress">
                <div class="progress-bar">
                    <div class="progress-fill" id="session-progress-fill" style="width: 0%"></div>
                </div>
                <span id="session-progress-text">0%</span>
            </div>
        `;
        
        document.body.appendChild(container);
        
        // Add event listeners
        this.attachEventListeners();
        
        // Start timer
        this.startTimer();
    },

    /**
     * Attach event listeners to session controls
     */
    attachEventListeners() {
        // Quick action buttons
        document.querySelectorAll('.btn-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });
        
        // Reaction buttons
        document.querySelectorAll('.btn-reaction').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reaction = e.target.dataset.reaction;
                this.markReaction(reaction);
            });
        });
    },

    /**
     * Handle quick action buttons
     */
    handleQuickAction(action) {
        switch(action) {
            case 'start_formula':
                this.startCurrentFormula();
                break;
            case 'next_formula':
                this.nextFormula();
                break;
            case 'prev_formula':
                this.prevFormula();
                break;
            case 'repeat':
                this.repeatFormula();
                break;
        }
    },

    /**
     * Initialize voice recognition
     */
    initVoiceControl() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Voice recognition not supported in this browser');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'ru-RU';

        this.recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            
            this.processVoiceCommand(transcript.toLowerCase());
        };

        this.recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            this.updateVoiceStatus('Ошибка: ' + event.error);
        };
    },

    /**
     * Toggle voice control on/off
     */
    toggleVoiceControl() {
        if (!this.recognition) {
            alert('Голосовое управление не поддерживается вашим браузером');
            return;
        }

        if (this.isVoiceActive) {
            this.recognition.stop();
            this.isVoiceActive = false;
            this.updateVoiceStatus('Выключено');
            document.getElementById('voice-toggle').classList.remove('active');
        } else {
            this.recognition.start();
            this.isVoiceActive = true;
            this.updateVoiceStatus('Слушаю...');
            document.getElementById('voice-toggle').classList.add('active');
        }
    },

    /**
     * Process voice command
     */
    processVoiceCommand(command) {
        // Map spoken command to action
        for (const [phrase, action] of Object.entries(this.voiceCommands)) {
            if (command.includes(phrase)) {
                this.handleQuickAction(action.replace('_', ' '));
                this.sessionData.voiceCommands.push({
                    timestamp: new Date(),
                    command: phrase,
                    action: action
                });
                break;
            }
        }
    },

    /**
     * Update voice status display
     */
    updateVoiceStatus(status) {
        const statusEl = document.getElementById('voice-status');
        if (statusEl) {
            statusEl.textContent = status;
        }
    },

    /**
     * Mark patient reaction
     */
    markReaction(reactionType) {
        const reaction = {
            type: reactionType,
            timestamp: new Date(),
            formulaIndex: this.currentFormulaIndex,
            intensity: 3 // Default, could add intensity selector
        };
        
        this.sessionData.reactions.push(reaction);
        
        // Visual feedback
        this.showReactionFeedback(reactionType);
        
        console.log('Reaction marked:', reaction);
    },

    /**
     * Show visual feedback for reaction
     */
    showReactionFeedback(reactionType) {
        const feedback = document.createElement('div');
        feedback.className = 'reaction-feedback';
        feedback.textContent = this.getReactionEmoji(reactionType);
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 4rem;
            animation: fadeOut 1s ease forwards;
            z-index: 10001;
            pointer-events: none;
        `;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => feedback.remove(), 1000);
    },

    getReactionEmoji(reactionType) {
        const emojis = {
            calm: '😌',
            tension: '😰',
            pain: '🤕',
            heat: '🔥',
            cold: '❄️',
            yawning: '🥱',
            tears: '😢',
            other: '📝'
        };
        return emojis[reactionType] || '📋';
    },

    /**
     * Add quick note
     */
    addNote() {
        const noteText = document.getElementById('session-note').value.trim();
        if (!noteText) return;
        
        const note = {
            timestamp: new Date(),
            text: noteText,
            formulaIndex: this.currentFormulaIndex
        };
        
        this.sessionData.notes.push(note);
        document.getElementById('session-note').value = '';
        
        console.log('Note added:', note);
    },

    /**
     * Start session timer
     */
    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = new Date() - this.sessionData.startTime;
            const hours = Math.floor(elapsed / 3600000);
            const minutes = Math.floor((elapsed % 3600000) / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            const timeString = [
                hours.toString().padStart(2, '0'),
                minutes.toString().padStart(2, '0'),
                seconds.toString().padStart(2, '0')
            ].join(':');
            
            document.getElementById('session-elapsed').textContent = timeString;
        }, 1000);
    },

    /**
     * Toggle timer pause/resume
     */
    toggleTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        } else {
            this.startTimer();
        }
    },

    /**
     * Load patient treatment plan
     */
    async loadTreatmentPlan(patientId) {
        // Fetch from storage
        const patient = await Storage.get('patients', patientId);
        const plan = await Storage.get('plans', patient.activePlanId);
        
        if (plan) {
            this.treatmentPlan = plan;
            this.currentFormulaIndex = 0;
            this.updateCurrentFormulaDisplay();
        }
    },

    /**
     * Update current formula display
     */
    updateCurrentFormulaDisplay() {
        if (!this.treatmentPlan || !this.treatmentPlan.formulas) return;
        
        const formula = this.treatmentPlan.formulas[this.currentFormulaIndex];
        document.getElementById('current-formula-text').textContent = formula.arabic || 'Нет текста';
        document.getElementById('formula-name').textContent = formula.name || 'Формула';
        document.getElementById('formula-counter').textContent = 
            `${this.currentFormulaIndex + 1}/${this.treatmentPlan.formulas.length}`;
        
        // Update progress bar
        const progress = ((this.currentFormulaIndex + 1) / this.treatmentPlan.formulas.length) * 100;
        document.getElementById('session-progress-fill').style.width = `${progress}%`;
        document.getElementById('session-progress-text').textContent = `${Math.round(progress)}%`;
    },

    /**
     * Navigate to next formula
     */
    nextFormula() {
        if (this.currentFormulaIndex < this.treatmentPlan.formulas.length - 1) {
            this.currentFormulaIndex++;
            this.updateCurrentFormulaDisplay();
        }
    },

    /**
     * Navigate to previous formula
     */
    prevFormula() {
        if (this.currentFormulaIndex > 0) {
            this.currentFormulaIndex--;
            this.updateCurrentFormulaDisplay();
        }
    },

    /**
     * Repeat current formula
     */
    repeatFormula() {
        // Reset counter for current formula
        console.log('Repeating formula:', this.currentFormulaIndex);
    },

    /**
     * Start current formula reading
     */
    startCurrentFormula() {
        const formula = this.treatmentPlan.formulas[this.currentFormulaIndex];
        this.sessionData.formulas.push({
            formula: formula,
            startTime: new Date(),
            reactions: []
        });
        console.log('Started formula:', formula.name);
    },

    /**
     * End session and save data
     */
    async endSession() {
        if (!this.isActive) return;
        
        // Confirm end
        if (!confirm('Завершить сеанс и сохранить данные?')) return;
        
        this.isActive = false;
        this.sessionData.endTime = new Date();
        this.sessionData.duration = this.sessionData.endTime - this.sessionData.startTime;
        
        // Save session to database
        await this.saveSessionData();
        
        // Remove UI
        const container = document.getElementById('session-mode-container');
        if (container) container.remove();
        
        // Stop timer
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        // Stop voice recognition
        if (this.recognition && this.isVoiceActive) {
            this.recognition.stop();
        }
        
        console.log('Session ended and saved');
        alert('Сеанс завершен. Данные сохранены.');
    },

    /**
     * Save session data to storage
     */
    async saveSessionData() {
        const sessionRecord = {
            patientId: this.currentPatient,
            startTime: this.sessionData.startTime,
            endTime: this.sessionData.endTime,
            duration: this.sessionData.duration,
            formulas: this.sessionData.formulas,
            reactions: this.sessionData.reactions,
            notes: this.sessionData.notes,
            voiceCommands: this.sessionData.voiceCommands
        };
        
        await Storage.add('sessions', sessionRecord);
        
        // Update patient history
        await this.updatePatientHistory(sessionRecord);
    },

    /**
     * Update patient history with session
     */
    async updatePatientHistory(sessionRecord) {
        const patient = await Storage.get('patients', this.currentPatient);
        if (patient) {
            if (!patient.sessionHistory) patient.sessionHistory = [];
            patient.sessionHistory.push(sessionRecord);
            patient.lastSession = sessionRecord.endTime;
            await Storage.update('patients', this.currentPatient, patient);
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionMode;
}
