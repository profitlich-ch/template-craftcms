import config from '../../config.json' with { type: "json" };
/**
 * FormieFillIn – Füllt Formie-Formulare in der Entwicklungsumgebung automatisch aus.
 *
 * Konfiguration in config.json (zwei Ebenen: Form-Handle → Feld-Handle → Wert):
 *   "formie": {
 *     "kontaktformular": {
 *       "vorname": "Max",
 *       "email": "max@example.com",
 *       "nachricht": "Testanfrage"
 *     }
 *   }
 */
export class FormieFillIn {
    #formConfig;

    constructor() {
        let formConfig = config.formie;
        if (!formConfig || typeof formConfig !== 'object') return;

        this.#formConfig = formConfig;
        document.addEventListener('onFormieInit', this.#onFormieInit);
    }

    #onFormieInit = (e) => {
        const Formie = e.detail?.formie;
        if (!Formie) return;

        for (const [handle, fields] of Object.entries(this.#formConfig)) {
            const form = Formie.getFormByHandle(handle);
            if (!form?.$form) continue;

            this.#fillForm(form.$form, fields);
            console.info(`FormieFillIn: "${handle}" ausgefüllt.`);
        }
    };

    #fillForm(formElement, fields) {
        for (const [fieldHandle, value] of Object.entries(fields)) {
            const name = `fields[${fieldHandle}]`;
            const inputs = formElement.querySelectorAll(`[name="${name}"], [name="${name}[]"]`);

            if (!inputs.length) {
                console.warn(`FormieFillIn: Feld "${fieldHandle}" nicht gefunden.`);
                continue;
            }

            this.#setFieldValue(inputs, value);
        }
    }

    #setFieldValue(inputs, value) {
        const first = inputs[0];
        const type = first.type?.toLowerCase();

        if (type === 'radio') {
            inputs.forEach((radio) => {
                radio.checked = radio.value === String(value);
                if (radio.checked) radio.dispatchEvent(new Event('change', { bubbles: true }));
            });
        } else if (type === 'checkbox') {
            if (inputs.length === 1) {
                first.checked = Boolean(value);
            } else {
                // Checkbox-Gruppe: value ist Array mit den gewünschten Werten
                const selected = Array.isArray(value) ? value.map(String) : [String(value)];
                inputs.forEach((checkbox) => {
                    checkbox.checked = selected.includes(checkbox.value);
                });
            }
            inputs.forEach((cb) => cb.dispatchEvent(new Event('change', { bubbles: true })));
        } else {
            first.value = value;
            first.dispatchEvent(new Event('input', { bubbles: true }));
            first.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}
