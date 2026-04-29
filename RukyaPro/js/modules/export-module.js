/**
 * RUKYA PRO - Export Module v2.0
 * Advanced export functionality: PNG, HTML, PDF with theme preservation
 */

const ExportModule = {
    /**
     * Export patient card or plan as PNG with current theme
     */
    async exportToPNG(elementId, filename = 'rukya-export.png') {
        try {
            // Dynamically load html2canvas if not available
            if (typeof html2canvas === 'undefined') {
                await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
            }

            const element = document.getElementById(elementId);
            if (!element) {
                throw new Error(`Element with ID "${elementId}" not found`);
            }

            // Capture current theme styles
            const computedStyles = window.getComputedStyle(document.documentElement);
            const themeColors = {
                primary: computedStyles.getPropertyValue('--primary').trim(),
                secondary: computedStyles.getPropertyValue('--secondary').trim(),
                background: computedStyles.getPropertyValue('--bg-primary').trim(),
                text: computedStyles.getPropertyValue('--text-primary').trim()
            };

            // Create canvas with high resolution
            const canvas = await html2canvas(element, {
                scale: 2, // Retina quality
                backgroundColor: themeColors.background,
                logging: false,
                useCORS: true,
                allowTaint: true,
                onclone: (clonedDoc) => {
                    // Ensure all styles are preserved in clone
                    this.preserveStylesInClone(clonedDoc, themeColors);
                }
            });

            // Convert to blob and download
            canvas.toBlob((blob) => {
                if (!blob) throw new Error('Failed to create image blob');
                
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                this.showNotification('Экспорт в PNG выполнен успешно!', 'success');
            }, 'image/png', 1.0);

        } catch (error) {
            console.error('PNG Export Error:', error);
            this.showNotification(`Ошибка экспорта: ${error.message}`, 'error');
            throw error;
        }
    },

    /**
     * Export as styled HTML file with embedded theme
     */
    exportToHTML(elementId, filename = 'rukya-export.html') {
        try {
            const element = document.getElementById(elementId);
            if (!element) {
                throw new Error(`Element with ID "${elementId}" not found`);
            }

            // Get current theme variables
            const themeVars = this.getCurrentThemeVariables();
            const content = element.outerHTML;
            
            // Create complete HTML document with embedded styles
            const htmlDocument = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RUKYA PRO - Экспорт</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {
            ${themeVars}
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
            padding: 2rem;
        }
        
        .arabic {
            font-family: 'Amiri', serif;
            direction: rtl;
            font-size: 1.5rem;
        }
        
        /* Preserve all original styles */
        ${this.extractInlineStyles(element)}
        
        /* Print optimization */
        @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="exported-content">
        ${content}
    </div>
    
    <script>
        // Auto-print option
        window.addEventListener('load', () => {
            console.log('RUKYA PRO HTML Export loaded');
        });
    </script>
</body>
</html>`;

            // Download HTML file
            this.downloadFile(htmlDocument, filename, 'text/html');
            this.showNotification('Экспорт в HTML выполнен успешно!', 'success');

        } catch (error) {
            console.error('HTML Export Error:', error);
            this.showNotification(`Ошибка экспорта: ${error.message}`, 'error');
            throw error;
        }
    },

    /**
     * Export as PDF using browser print dialog with optimized styling
     */
    async exportToPDF(elementId, filename = 'rukya-export.pdf') {
        try {
            const element = document.getElementById(elementId);
            if (!element) {
                throw new Error(`Element with ID "${elementId}" not found`);
            }

            // Create print-optimized version
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                throw new Error('Не удалось открыть окно печати. Проверьте настройки блокировки всплывающих окон.');
            }

            // Get theme variables
            const themeVars = this.getCurrentThemeVariables();
            
            // Create print-optimized HTML
            const printHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>RUKYA PRO - Печать</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {
            ${themeVars}
        }
        
        @page {
            size: A4;
            margin: 1.5cm;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            background: white;
            color: #1a1a1a;
            line-height: 1.6;
            font-size: 11pt;
        }
        
        .arabic {
            font-family: 'Amiri', serif;
            direction: rtl;
            font-size: 16pt;
            line-height: 2;
        }
        
        .section {
            margin-bottom: 1.5cm;
            page-break-inside: avoid;
        }
        
        .section-title {
            color: var(--primary, #1e40af);
            font-size: 14pt;
            font-weight: 600;
            margin-bottom: 0.5cm;
            border-bottom: 2px solid var(--primary, #1e40af);
            padding-bottom: 0.3cm;
        }
        
        .formula {
            background: #f8fafc;
            border-left: 4px solid var(--primary, #1e40af);
            padding: 0.5cm;
            margin: 0.3cm 0;
        }
        
        .formula-arabic {
            font-size: 18pt;
            margin-bottom: 0.3cm;
        }
        
        .formula-translit {
            font-style: italic;
            color: #64748b;
            font-size: 10pt;
        }
        
        .formula-translation {
            margin-top: 0.2cm;
            font-size: 10pt;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 0.5cm 0;
        }
        
        th, td {
            border: 1px solid #e2e8f0;
            padding: 0.3cm;
            text-align: left;
        }
        
        th {
            background: #f1f5f9;
            font-weight: 600;
        }
        
        .header {
            text-align: center;
            margin-bottom: 1cm;
        }
        
        .header h1 {
            color: var(--primary, #1e40af);
            font-size: 18pt;
            margin-bottom: 0.2cm;
        }
        
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 9pt;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 0.3cm;
        }
        
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>RUKYA PRO</h1>
        <p>Система исламской терапии</p>
    </div>
    
    ${element.innerHTML}
    
    <div class="footer">
        Сгенерировано RUKYA PRO • ${new Date().toLocaleDateString('ru-RU')}
    </div>
    
    <script>
        window.onload = function() {
            window.print();
            // Auto-close after print (optional)
            // window.onafterprint = function() { window.close(); };
        };
    </script>
</body>
</html>`;

            printWindow.document.write(printHTML);
            printWindow.document.close();
            
            this.showNotification('Открыто окно печати. Выберите "Сохранить как PDF"', 'info');

        } catch (error) {
            console.error('PDF Export Error:', error);
            this.showNotification(`Ошибка экспорта: ${error.message}`, 'error');
            throw error;
        }
    },

    /**
     * Export treatment plan with full formatting
     */
    exportTreatmentPlan(planData, format = 'pdf') {
        const elementId = 'plan-export-container';
        
        // Create temporary container
        const container = document.createElement('div');
        container.id = elementId;
        container.innerHTML = this.generatePlanHTML(planData);
        container.style.display = 'none';
        document.body.appendChild(container);

        const filename = `plan-${planData.patientName}-${new Date().toISOString().split('T')[0]}`;

        return this[format === 'png' ? 'exportToPNG' : format === 'html' ? 'exportToHTML' : 'exportToPDF'](elementId, filename)
            .finally(() => {
                document.body.removeChild(container);
            });
    },

    /**
     * Generate formatted HTML for treatment plan
     */
    generatePlanHTML(planData) {
        const sections = planData.sections || [];
        
        let html = `
            <div class="plan-document">
                <div class="patient-info">
                    <h2>Пациент: ${planData.patientName}</h2>
                    <p>Диагноз: ${planData.diagnosis}</p>
                    <p>Дата начала: ${planData.startDate}</p>
                    <p>Длительность: ${planData.duration} дней</p>
                </div>
        `;

        sections.forEach(section => {
            html += `
                <div class="section">
                    <h3 class="section-title">${section.name}</h3>
                    ${section.formulas.map(formula => `
                        <div class="formula">
                            <div class="formula-arabic arabic">${formula.arabic}</div>
                            <div class="formula-translit">${formula.transliteration}</div>
                            <div class="formula-translation">${formula.translation}</div>
                            <div class="formula-repeats">Повторов: ${formula.repeats}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        });

        html += '</div>';
        return html;
    },

    /**
     * Load external script dynamically
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    /**
     * Preserve styles in cloned document for PNG export
     */
    preserveStylesInClone(clonedDoc, themeColors) {
        // Copy all stylesheets
        const stylesheets = document.styleSheets;
        for (let i = 0; i < stylesheets.length; i++) {
            try {
                const rules = stylesheets[i].cssRules;
                if (rules) {
                    const styleEl = clonedDoc.createElement('style');
                    for (let j = 0; j < rules.length; j++) {
                        styleEl.textContent += rules[j].cssText;
                    }
                    clonedDoc.head.appendChild(styleEl);
                }
            } catch (e) {
                console.warn('Could not copy stylesheet:', e);
            }
        }
    },

    /**
     * Get current CSS custom properties (theme variables)
     */
    getCurrentThemeVariables() {
        const styles = getComputedStyle(document.documentElement);
        const vars = [];
        
        // Common theme variables
        const varNames = [
            '--primary', '--secondary', '--accent',
            '--bg-primary', '--bg-secondary', '--bg-tertiary',
            '--text-primary', '--text-secondary', '--text-muted',
            '--border-color', '--shadow-color'
        ];
        
        varNames.forEach(name => {
            const value = styles.getPropertyValue(name).trim();
            if (value) {
                vars.push(`${name}: ${value};`);
            }
        });
        
        return vars.join('\n');
    },

    /**
     * Extract inline styles from element
     */
    extractInlineStyles(element) {
        // Basic implementation - can be enhanced
        return '';
    },

    /**
     * Download file helper
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Show notification toast
     */
    showNotification(message, type = 'info') {
        // Simple notification implementation
        const toast = document.createElement('div');
        toast.className = `notification notification-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#dc2626' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    },

    /**
     * Batch export multiple items
     */
    async batchExport(items, format = 'pdf') {
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (const item of items) {
            try {
                await this.exportTreatmentPlan(item, format);
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({ item, error: error.message });
            }
        }

        return results;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportModule;
}
