/**
 * RUKYA PRO v2.1 — Валидатор UI компонентов
 * Проверяет работоспособность всех кнопок и элементов интерфейса
 */

const UIValidator = {
  results: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },

  /**
   * Запуск полной проверки UI
   */
  async runFullValidation() {
    console.log('🔍 Запуск валидации UI...');
    this.results = { total: 0, passed: 0, failed: 0, warnings: 0 };

    // Проверка кнопок навигации
    this.validateNavigation();

    // Проверка кнопок действий
    this.validateActionButtons();

    // Проверка форм
    this.validateForms();

    // Проверка модальных окон
    this.validateModals();

    // Проверка анимаций
    this.validateAnimations();

    // Отчет
    this.generateReport();

    return this.results;
  },

  /**
   * Проверка навигационных кнопок
   */
  validateNavigation() {
    const navButtons = document.querySelectorAll('[data-nav], .nav-link, [onclick*="navigate"]');
    
    navButtons.forEach(btn => {
      this.results.total++;
      
      if (btn.disabled) {
        this.results.warnings++;
        console.warn('⚠️ Кнопка отключена:', btn);
      } else {
        this.results.passed++;
        console.log('✅ Навигация OK:', btn.textContent?.trim() || btn.id);
      }
    });
  },

  /**
   * Проверка кнопок действий
   */
  validateActionButtons() {
    const actionButtons = document.querySelectorAll('.btn, button:not([type="submit"])');
    
    actionButtons.forEach(btn => {
      this.results.total++;
      
      const hasHandler = btn.onclick || btn.closest('form') || 
                         btn.classList.contains('btn-submit') ||
                         btn.getAttribute('data-action');
      
      if (hasHandler && !btn.disabled) {
        this.results.passed++;
        console.log('✅ Кнопка действия OK:', btn.textContent?.trim() || btn.id);
      } else if (btn.disabled) {
        this.results.warnings++;
        console.warn('⚠️ Кнопка отключена:', btn.textContent?.trim());
      } else {
        this.results.failed++;
        console.error('❌ Кнопка без обработчика:', btn);
      }
    });
  },

  /**
   * Проверка форм
   */
  validateForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      this.results.total++;
      
      const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
      let allValid = true;
      
      inputs.forEach(input => {
        if (!input.value && !input.checkValidity()) {
          allValid = false;
        }
      });
      
      if (allValid) {
        this.results.passed++;
        console.log('✅ Форма валидна:', form.id || 'без ID');
      } else {
        this.results.warnings++;
        console.warn('⚠️ Форма требует заполнения:', form.id);
      }
    });
  },

  /**
   * Проверка модальных окон
   */
  validateModals() {
    const modals = document.querySelectorAll('.modal, [role="dialog"]');
    
    modals.forEach(modal => {
      this.results.total++;
      
      const closeButton = modal.querySelector('[onclick*="closeModal"], .btn-close, button[type="button"]');
      
      if (closeButton) {
        this.results.passed++;
        console.log('✅ Модальное окно OK:', modal.id);
      } else {
        this.results.failed++;
        console.error('❌ Модальное окно без кнопки закрытия:', modal.id);
      }
    });
  },

  /**
   * Проверка анимаций
   */
  validateAnimations() {
    const animatedElements = document.querySelectorAll('[class*="animate"], [class*="transition"]');
    
    if (animatedElements.length > 0) {
      this.results.total += animatedElements.length;
      this.results.passed += animatedElements.length;
      console.log(`✅ Анимации найдены: ${animatedElements.length} элементов`);
    } else {
      this.results.warnings++;
      console.warn('⚠️ Анимации не обнаружены');
    }
  },

  /**
   * Генерация отчета
   */
  generateReport() {
    const report = `
╔═══════════════════════════════════════════╗
║   ОТЧЕТ ВАЛИДАЦИИ UI RUKYA PRO v2.1      ║
╠═══════════════════════════════════════════╣
║  Всего элементов:  ${String(this.results.total).padEnd(18)} ║
║  ✅ Успешно:       ${String(this.results.passed).padEnd(18)} ║
║  ❌ Ошибки:        ${String(this.results.failed).padEnd(18)} ║
║  ⚠️  Предупреждения: ${String(this.results.warnings).padEnd(17)} ║
╚═══════════════════════════════════════════╝
    `;

    console.log(report);

    // Показываем тост с результатом
    if (App && App.toast) {
      if (this.results.failed === 0) {
        App.toast(`✅ Валидация пройдена: ${this.results.passed}/${this.results.total}`, 'success');
      } else {
        App.toast(`⚠️ Найдено ошибок: ${this.results.failed}`, 'error');
      }
    }

    return report;
  },

  /**
   * Интерактивная проверка (клик-тест)
   */
  enableInteractiveTest() {
    console.log('🎮 Интерактивный тест включен. Кликайте на элементы!');
    
    document.addEventListener('click', (e) => {
      const target = e.target;
      
      if (target.closest('.btn, button, a, [data-nav]')) {
        console.log('🖱️ Клик:', {
          элемент: target.tagName,
          текст: target.textContent?.trim(),
          id: target.id,
          классы: target.className
        });
      }
    }, true);
  }
};

// Автозапуск при загрузке страницы
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      console.log('🚀 RUKYA PRO UI Validator готов');
      console.log('Выполните: UIValidator.runFullValidation() для проверки');
    }, 1000);
  });
}
