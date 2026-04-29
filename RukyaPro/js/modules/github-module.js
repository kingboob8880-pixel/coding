/**
 * RUKYA PRO v2.1 — Интеграция с GitHub API
 * Полное управление репозиторием: добавление, удаление, экспорт, синхронизация
 */

const GitHubModule = {
  token: null,
  owner: null,
  repo: null,
  branch: 'main',

  /**
   * Инициализация с токеном
   */
  init(token, owner, repo, branch = 'main') {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
    
    // Сохраняем в localStorage
    localStorage.setItem('github_token', token);
    localStorage.setItem('github_owner', owner);
    localStorage.setItem('github_repo', repo);
    localStorage.setItem('github_branch', branch);
    
    App.toast('✅ GitHub подключен', 'success');
  },

  /**
   * Загрузка настроек из localStorage
   */
  loadFromStorage() {
    this.token = localStorage.getItem('github_token');
    this.owner = localStorage.getItem('github_owner');
    this.repo = localStorage.getItem('github_repo');
    this.branch = localStorage.getItem('github_branch') || 'main';
    
    return !!(this.token && this.owner && this.repo);
  },

  /**
   * Базовый запрос к GitHub API
   */
  async request(endpoint, method = 'GET', data = null) {
    if (!this.token) throw new Error('GitHub токен не установлен');

    const url = `https://api.github.com/${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `GitHub API error: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Проверка подключения
   */
  async testConnection() {
    try {
      await this.request(`repos/${this.owner}/${this.repo}`);
      App.toast('✅ Соединение с GitHub установлено', 'success');
      return true;
    } catch (error) {
      App.toast(`❌ Ошибка подключения: ${error.message}`, 'error');
      return false;
    }
  },

  /**
   * Получить список файлов в репозитории
   */
  async getFiles(path = '') {
    try {
      const data = await this.request(`repos/${this.owner}/${this.repo}/contents/${path}`);
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      console.error('Get Files Error:', error);
      throw error;
    }
  },

  /**
   * Читать файл из репозитория
   */
  async readFile(path) {
    try {
      const data = await this.request(`repos/${this.owner}/${this.repo}/contents/${path}`);
      const content = atob(data.content); // Base64 decode
      return {
        content,
        sha: data.sha,
        size: data.size
      };
    } catch (error) {
      console.error('Read File Error:', error);
      throw error;
    }
  },

  /**
   * Создать/обновить файл в репозитории
   */
  async writeFile(path, content, message = 'Update via RUKYA PRO') {
    try {
      let sha = null;
      
      // Проверяем существует ли файл
      try {
        const existing = await this.readFile(path);
        sha = existing.sha;
      } catch (e) {
        // Файл не существует, создаем новый
      }

      const data = {
        message,
        content: btoa(content), // Base64 encode
        branch: this.branch
      };

      if (sha) {
        data.sha = sha;
      }

      await this.request(
        `repos/${this.owner}/${this.repo}/contents/${path}`,
        'PUT',
        data
      );

      App.toast(`✅ Файл ${path} сохранен`, 'success');
      return true;
    } catch (error) {
      console.error('Write File Error:', error);
      App.toast(`❌ Ошибка записи: ${error.message}`, 'error');
      return false;
    }
  },

  /**
   * Удалить файл из репозитория
   */
  async deleteFile(path, message = 'Delete via RUKYA PRO') {
    try {
      const file = await this.readFile(path);
      
      await this.request(
        `repos/${this.owner}/${this.repo}/contents/${path}`,
        'DELETE',
        {
          message,
          sha: file.sha,
          branch: this.branch
        }
      );

      App.toast(`✅ Файл ${path} удален`, 'success');
      return true;
    } catch (error) {
      console.error('Delete File Error:', error);
      App.toast(`❌ Ошибка удаления: ${error.message}`, 'error');
      return false;
    }
  },

  /**
   * Экспорт всей базы данных в GitHub
   */
  async exportToGitHub() {
    try {
      App.toast('⏳ Начало экспорта в GitHub...', 'info');

      // Экспорт пациентов
      const patients = await Storage.getAll('patients');
      await this.writeFile(
        'data/patients.json',
        JSON.stringify(patients, null, 2),
        'Export patients from RUKYA PRO'
      );

      // Экспорт планов
      const plans = await Storage.getAll('plans');
      await this.writeFile(
        'data/plans.json',
        JSON.stringify(plans, null, 2),
        'Export plans from RUKYA PRO'
      );

      // Экспорт сертификатов
      const certs = await Storage.getAll('certificates');
      await this.writeFile(
        'data/certificates.json',
        JSON.stringify(certs, null, 2),
        'Export certificates from RUKYA PRO'
      );

      // Экспорт настроек
      const settings = localStorage.getItem('rukya_settings');
      if (settings) {
        await this.writeFile(
          'data/settings.json',
          settings,
          'Export settings from RUKYA PRO'
        );
      }

      App.toast('✅ Экспорт в GitHub завершен', 'success');
      return true;
    } catch (error) {
      console.error('Export to GitHub Error:', error);
      App.toast(`❌ Ошибка экспорта: ${error.message}`, 'error');
      return false;
    }
  },

  /**
   * Импорт базы данных из GitHub
   */
  async importFromGitHub() {
    try {
      App.toast('⏳ Начало импорта из GitHub...', 'info');

      // Импорт пациентов
      try {
        const patientsData = await this.readFile('data/patients.json');
        const patients = JSON.parse(patientsData.content);
        for (const patient of patients) {
          await Storage.save('patients', patient);
        }
        App.toast(`✅ Импортировано пациентов: ${patients.length}`, 'success');
      } catch (e) {
        console.log('No patients file found');
      }

      // Импорт планов
      try {
        const plansData = await this.readFile('data/plans.json');
        const plans = JSON.parse(plansData.content);
        for (const plan of plans) {
          await Storage.save('plans', plan);
        }
        App.toast(`✅ Импортировано планов: ${plans.length}`, 'success');
      } catch (e) {
        console.log('No plans file found');
      }

      // Импорт сертификатов
      try {
        const certsData = await this.readFile('data/certificates.json');
        const certs = JSON.parse(certsData.content);
        for (const cert of certs) {
          await Storage.save('certificates', cert);
        }
        App.toast(`✅ Импортировано сертификатов: ${certs.length}`, 'success');
      } catch (e) {
        console.log('No certificates file found');
      }

      // Импорт настроек
      try {
        const settingsData = await this.readFile('data/settings.json');
        localStorage.setItem('rukya_settings', settingsData.content);
        App.toast('✅ Настройки импортированы', 'success');
      } catch (e) {
        console.log('No settings file found');
      }

      App.toast('✅ Импорт из GitHub завершен', 'success');
      return true;
    } catch (error) {
      console.error('Import from GitHub Error:', error);
      App.toast(`❌ Ошибка импорта: ${error.message}`, 'error');
      return false;
    }
  },

  /**
   * Синхронизация (двусторонняя)
   */
  async sync() {
    try {
      App.toast('🔄 Начало синхронизации...', 'info');
      
      // Сначала экспорт локальных данных
      await this.exportToGitHub();
      
      // Затем импорт удаленных изменений
      await this.importFromGitHub();
      
      App.toast('✅ Синхронизация завершена', 'success');
      return true;
    } catch (error) {
      console.error('Sync Error:', error);
      App.toast(`❌ Ошибка синхронизации: ${error.message}`, 'error');
      return false;
    }
  },

  /**
   * Создать коммит с сообщением
   */
  async createCommit(message, files = []) {
    try {
      for (const file of files) {
        await this.writeFile(file.path, file.content, message);
      }
      
      App.toast('✅ Коммит создан', 'success');
      return true;
    } catch (error) {
      console.error('Create Commit Error:', error);
      App.toast(`❌ Ошибка коммита: ${error.message}`, 'error');
      return false;
    }
  },

  /**
   * Получить историю коммитов
   */
  async getCommits(limit = 10) {
    try {
      const commits = await this.request(
        `repos/${this.owner}/${this.repo}/commits?per_page=${limit}`
      );
      return commits.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date
      }));
    } catch (error) {
      console.error('Get Commits Error:', error);
      return [];
    }
  },

  /**
   * Отключиться от GitHub
   */
  disconnect() {
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_owner');
    localStorage.removeItem('github_repo');
    localStorage.removeItem('github_branch');
    
    this.token = null;
    this.owner = null;
    this.repo = null;
    this.branch = 'main';
    
    App.toast('🔌 GitHub отключен', 'info');
  }
};
