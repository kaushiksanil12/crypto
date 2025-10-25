/**
 * Form Validator - Client-side form validation
 * Validates form inputs with customizable rules
 */

class FormValidator {
    constructor() {
        this.forms = new Map();
        this.rules = {
            required: (value) => value.trim() !== '',
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            minLength: (value, length) => value.length >= length,
            maxLength: (value, length) => value.length <= length,
            pattern: (value, regex) => new RegExp(regex).test(value),
            number: (value) => !isNaN(value) && value.trim() !== '',
            url: (value) => {
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            }
        };

        this.messages = {
            required: 'This field is required',
            email: 'Please enter a valid email address',
            minLength: 'Minimum length is {0} characters',
            maxLength: 'Maximum length is {0} characters',
            pattern: 'Please match the requested format',
            number: 'Please enter a valid number',
            url: 'Please enter a valid URL'
        };

        this.addStyles();
    }

    /**
     * Initialize form validation
     */
    initForm(formElement, options = {}) {
        const formId = formElement.id || 'form-' + Date.now();
        
        const config = {
            onSubmit: null,
            onValidate: null,
            liveValidation: true,
            ...options
        };

        this.forms.set(formId, {
            element: formElement,
            config: config,
            fields: new Map()
        });

        // Prevent default form submission
        formElement.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleSubmit(formId);
        });

        // Setup live validation
        if (config.liveValidation) {
            formElement.addEventListener('blur', (event) => {
                if (event.target.matches('input, textarea, select')) {
                    this.validateField(formId, event.target);
                }
            }, true);

            formElement.addEventListener('input', (event) => {
                if (event.target.matches('input, textarea')) {
                    // Clear error on input
                    this.clearFieldError(event.target);
                }
            });
        }

        return formId;
    }

    /**
     * Add validation rule to field
     */
    addFieldRule(formId, fieldName, rule, params = null, message = null) {
        const formData = this.forms.get(formId);
        if (!formData) return;

        if (!formData.fields.has(fieldName)) {
            formData.fields.set(fieldName, []);
        }

        formData.fields.get(fieldName).push({
            rule: rule,
            params: params,
            message: message
        });
    }

    /**
     * Validate single field
     */
    validateField(formId, field) {
        const formData = this.forms.get(formId);
        if (!formData) return true;

        const fieldName = field.name || field.id;
        const rules = formData.fields.get(fieldName);

        if (!rules || rules.length === 0) return true;

        this.clearFieldError(field);

        for (const ruleConfig of rules) {
            const validator = this.rules[ruleConfig.rule];
            if (!validator) continue;

            const isValid = ruleConfig.params !== null
                ? validator(field.value, ruleConfig.params)
                : validator(field.value);

            if (!isValid) {
                const message = ruleConfig.message || 
                    this.formatMessage(this.messages[ruleConfig.rule], ruleConfig.params);
                this.showFieldError(field, message);
                return false;
            }
        }

        this.showFieldSuccess(field);
        return true;
    }

    /**
     * Validate entire form
     */
    validateForm(formId) {
        const formData = this.forms.get(formId);
        if (!formData) return false;

        let isValid = true;
        const form = formData.element;

        formData.fields.forEach((rules, fieldName) => {
            const field = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
            if (field) {
                if (!this.validateField(formId, field)) {
                    isValid = false;
                }
            }
        });

        return isValid;
    }

    /**
     * Handle form submission
     */
    handleSubmit(formId) {
        const formData = this.forms.get(formId);
        if (!formData) return;

        const isValid = this.validateForm(formId);

        if (isValid && formData.config.onSubmit) {
            const form = formData.element;
            const data = new FormData(form);
            const values = Object.fromEntries(data.entries());
            formData.config.onSubmit(values, form);
        }

        if (formData.config.onValidate) {
            formData.config.onValidate(isValid);
        }
    }

    /**
     * Show field error
     */
    showFieldError(field, message) {
        field.classList.add('field-error');
        field.classList.remove('field-success');

        let errorElement = field.parentElement.querySelector('.field-error-message');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error-message';
            field.parentElement.appendChild(errorElement);
        }

        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    /**
     * Show field success
     */
    showFieldSuccess(field) {
        field.classList.remove('field-error');
        field.classList.add('field-success');
        this.clearFieldError(field);
    }

    /**
     * Clear field error
     */
    clearFieldError(field) {
        field.classList.remove('field-error');
        field.classList.remove('field-success');

        const errorElement = field.parentElement.querySelector('.field-error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    /**
     * Format validation message
     */
    formatMessage(template, params) {
        if (!params) return template;
        
        if (Array.isArray(params)) {
            return template.replace(/\{(\d+)\}/g, (match, index) => params[index]);
        }
        
        return template.replace('{0}', params);
    }

    /**
     * Add custom validation rule
     */
    addRule(name, validator, message) {
        this.rules[name] = validator;
        this.messages[name] = message;
    }

    /**
     * Reset form validation
     */
    reset(formId) {
        const formData = this.forms.get(formId);
        if (!formData) return;

        const form = formData.element;
        const fields = form.querySelectorAll('input, textarea, select');

        fields.forEach(field => {
            this.clearFieldError(field);
        });

        form.reset();
    }

    /**
     * Add validation styles
     */
    addStyles() {
        if (document.getElementById('form-validator-styles')) return;

        const style = document.createElement('style');
        style.id = 'form-validator-styles';
        style.textContent = `
            .field-error {
                border-color: #ef4444 !important;
            }

            .field-success {
                border-color: #10b981 !important;
            }

            .field-error-message {
                display: none;
                color: #ef4444;
                font-size: 0.875rem;
                margin-top: 0.25rem;
            }

            .field-error-message::before {
                content: '⚠ ';
            }
        `;
        document.head.appendChild(style);
    }
}

// Create global validator instance
const formValidator = new FormValidator();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormValidator;
}
