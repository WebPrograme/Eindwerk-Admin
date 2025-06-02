function CheckSubmit(config) {
    CheckInputs(Object.assign(Object.assign({}, config), { showErrors: false, update: false }));
}
function CheckInputs(config) {
    var _a;
    let submit = null;
    let unValidInputs = [];
    let abortController = new AbortController();
    let allListenersAndObservers = { inputs: [], abortController: abortController };
    if (config.submit) {
        submit = document.querySelector(config.submit);
        submit.setAttribute('disabled', 'true');
        submit.classList.add('disabled');
        allListenersAndObservers.submit = config.submit;
    }
    config.inputs.forEach((input) => {
        const hasHidden = input.checkHidden;
        const isValid = validateInput(input, config.showErrors);
        if (!isValid) {
            unValidInputs.push(input);
        }
        if (config.update && hasHidden) {
            const hiddenElement = input.selector + '-hidden';
            const inputElement = document.querySelector(hiddenElement);
            inputElement.dataset.config = JSON.stringify(config);
            const observer = new MutationObserver(() => {
                CheckInputs(Object.assign(Object.assign({}, config), { update: null }));
            });
            observer.observe(inputElement, { attributes: true });
            allListenersAndObservers.inputs.push({ selector: hiddenElement, event: 'input', observer: observer });
        }
    });
    if (unValidInputs.length == 0) {
        if (submit) {
            submit.removeAttribute('disabled');
            submit.classList.remove('disabled');
        }
    }
    else {
        if (submit) {
            submit.setAttribute('disabled', 'true');
            submit.classList.add('disabled');
        }
    }
    if (config.update) {
        (_a = config.additionalTriggers) === null || _a === void 0 ? void 0 : _a.forEach((trigger) => {
            if (document.querySelector(trigger.selector).nodeName == 'TEXTAREA') {
                document.querySelector(trigger.selector).addEventListener('keypress', () => {
                    CheckInputs(Object.assign(Object.assign({}, config), { update: null }));
                }, { signal: abortController.signal });
                allListenersAndObservers.inputs.push({ selector: trigger.selector, event: 'keypress' });
            }
            else {
                document.querySelector(trigger.selector).addEventListener(trigger.event, () => {
                    CheckInputs(Object.assign(Object.assign({}, config), { update: null }));
                }, { signal: abortController.signal });
                allListenersAndObservers.inputs.push({ selector: trigger.selector, event: trigger.event });
            }
        });
        config.inputs.forEach((input) => {
            if (document.querySelector(input.selector).nodeName == 'TEXTAREA') {
                document.querySelector(input.selector).addEventListener('keypress', () => {
                    CheckInputs(Object.assign(Object.assign({}, config), { update: null }));
                }, { signal: abortController.signal });
                allListenersAndObservers.inputs.push({ selector: input.selector, event: 'keypress' });
            }
            else {
                document.querySelector(input.selector).addEventListener('input', () => {
                    CheckInputs(Object.assign(Object.assign({}, config), { update: null }));
                }, { signal: abortController.signal });
                allListenersAndObservers.inputs.push({ selector: input.selector, event: 'input' });
            }
            if (input.requirements && input.requirements.type == 'select') {
                const requirements = input.requirements;
                const options = requirements.options;
                Object.keys(options).forEach((select) => {
                    const selectRequirement = options[select];
                    const inputs = selectRequirement.inputs;
                    inputs.forEach((input) => {
                        if (document.querySelector(input.selector).nodeName == 'TEXTAREA') {
                            document.querySelector(input.selector).addEventListener('keydown', () => {
                                CheckInputs(Object.assign(Object.assign({}, config), { update: null }));
                            }, { signal: abortController.signal });
                            allListenersAndObservers.inputs.push({ selector: input.selector, event: 'keydown' });
                        }
                        else {
                            document.querySelector(input.selector).addEventListener('input', () => {
                                CheckInputs(Object.assign(Object.assign({}, config), { update: null }));
                            }, { signal: abortController.signal });
                            allListenersAndObservers.inputs.push({ selector: input.selector, event: 'input' });
                        }
                    });
                });
            }
        });
    }
    return [unValidInputs, allListenersAndObservers];
}
function TriggerUpdateEvents(config, update = false) {
    CheckInputs(Object.assign(Object.assign({}, config), { update: update }));
}
function getValue(selector) {
    const element = document.querySelector(selector);
    if (!element)
        return null;
    if (element.nodeName == 'INPUT' && element.type == 'file') {
        return element.files[0] ? element.files[0].name : element.dataset.src;
    }
    else if (element.nodeName == 'INPUT' || element.nodeName == 'TEXTAREA' || (element.nodeName == 'BUTTON' && element.classList.contains('datepicker'))) {
        return element.value;
    }
    else if (element.classList.contains('input-select')) {
        return element.dataset.value;
    }
}
function validateInput(input, showErrors) {
    const hasRequirements = input.requirements ? true : false;
    const hasHidden = input.checkHidden;
    const hiddenElement = input.selector + '-hidden';
    const inputElement = document.querySelector(hasHidden ? hiddenElement : input.selector);
    const value = getValue(hasHidden ? hiddenElement : input.selector);
    let valid = true;
    if (hasRequirements) {
        const requirement = input.requirements;
        valid = checkRequirments(requirement, value, inputElement);
    }
    else {
        if (value == '' || value == null) {
            valid = false;
        }
    }
    if (showErrors) {
        if (!valid) {
            document.querySelector(input.selector).classList.add('error');
            if (input.requirements && input.requirements.type == 'select') {
                const requirements = input.requirements;
                const options = requirements.options;
                Object.keys(options).forEach((select) => {
                    const selectRequirement = options[select];
                    const inputs = selectRequirement.inputs;
                    inputs.forEach((input) => {
                        const element = document.querySelector(input.selector);
                        const value = getValue(input.selector);
                        if (element && !checkRequirments(input.requirements, value, element)) {
                            element.classList.add('error');
                        }
                        else if (element) {
                            element.classList.remove('error');
                        }
                    });
                });
            }
        }
        else {
            document.querySelector(input.selector).classList.remove('error');
            if (input.requirements && input.requirements.type == 'select') {
                const requirements = input.requirements;
                const options = requirements.options;
                Object.keys(options).forEach((select) => {
                    const selectRequirement = options[select];
                    const inputs = selectRequirement.inputs;
                    inputs.forEach((input) => {
                        const element = document.querySelector(input.selector);
                        const value = getValue(input.selector);
                        if (element && !checkRequirments(input.requirements, value, element)) {
                            element.classList.add('error');
                        }
                        else if (element) {
                            element.classList.remove('error');
                        }
                    });
                });
            }
        }
    }
    return valid;
}
function checkRequirments(requirements, value, inputElement) {
    let valid = true;
    value = value || typeof value == 'number' ? value : value ? value.trim() : value;
    if (requirements.type == 'any') {
        if (!value) {
            valid = false;
        }
    }
    else if (requirements.type == 'inputs') {
        const inputs = requirements.inputs;
        const validInputs = [];
        inputs.forEach((input) => {
            const requirement = input.requirements;
            const value = getValue(input.selector);
            const element = document.querySelector(input.selector);
            validInputs.push(checkRequirments(requirement, value, element));
        });
        if (validInputs.filter((select) => select == true).length != validInputs.length) {
            valid = false;
        }
        if (!value) {
            valid = false;
        }
    }
    else if (requirements.type == 'email' && /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value) == false) {
        valid = false;
    }
    else if (requirements.type == 'tel') {
        value = value.replace(/\s/g, '');
        value = value.replace(/-/g, '');
        value = value.replace(/\(/g, '');
        value = value.replace(/\)/g, '');
        value = value.replace(/\+/g, '');
        value = value.replace(/\./g, '');
        value = value.replace(/\,/g, '');
        value = value.replace(/\//g, '');
        if (!value.match(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)) {
            valid = false;
        }
    }
    else if (requirements.type == 'string') {
        if (requirements.regex) {
            if (!value.match(requirements.regex)) {
                valid = false;
            }
        }
        else if (value.length < requirements.min || value.length > requirements.max) {
            valid = false;
        }
    }
    else if (requirements.type == 'children') {
        const symbol = requirements.symbol;
        const number = requirements.number;
        const children = document.querySelector(requirements.selector).children;
        if (symbol == '>') {
            if (children.length <= number) {
                valid = false;
            }
        }
        else if (symbol == '<') {
            if (children.length >= number) {
                valid = false;
            }
        }
        else if (symbol == '=') {
            if (children.length != number) {
                valid = false;
            }
        }
    }
    else if (requirements.type == 'amount') {
        const symbol = requirements.symbol;
        const number = requirements.number;
        const elements = document.querySelectorAll(requirements.selector);
        if (symbol == '>') {
            if (elements.length <= number) {
                valid = false;
            }
        }
        else if (symbol == '<') {
            if (elements.length >= number) {
                valid = false;
            }
        }
        else if (symbol == '=') {
            if (elements.length != number) {
                valid = false;
            }
        }
    }
    else if (requirements.type == 'select') {
        const options = requirements.options;
        let optionsValid = [];
        Object.keys(options).forEach((select) => {
            if (select == value) {
                const inputs = options[select].inputs;
                inputs.forEach((input) => {
                    const requirement = input.requirements;
                    const value = getValue(input.selector);
                    const element = document.querySelector(input.selector);
                    optionsValid.push(checkRequirments(requirement, value, element));
                });
            }
        });
        if (optionsValid.filter((select) => select == true).length != optionsValid.length) {
            valid = false;
        }
        if (!value) {
            valid = false;
        }
    }
    else if (requirements.type == 'number' && (isNaN(value) || value < requirements.min || value > requirements.max)) {
        valid = false;
    }
    else if (requirements.type == 'choices') {
        if (requirements.choices.indexOf(value) == -1) {
            valid = false;
        }
    }
    else if (requirements.type == 'function') {
        const func = requirements.function;
        valid = func(value);
    }
    else if (requirements.type == 'none') {
        if (requirements.hasToBeEmpty && value) {
            valid = false;
        }
    }
    return valid;
}
// Get the value of the input elements
function GetInputValues(config) {
    let values = {};
    config.inputs.forEach((input) => {
        const inputElement = document.querySelector(input.selector);
        if (inputElement.type == 'checkbox') {
            values[input.selector] = inputElement.checked;
        }
        else {
            values[input.selector] = getValue(input.selector);
        }
    });
    return values;
}
// Stop updating the input elements
function StopUpdate(allListenersAndObservers) {
    allListenersAndObservers.inputs.forEach((listener) => {
        if (listener.observer) {
            listener.observer.disconnect();
        }
    });
    allListenersAndObservers.abortController.abort();
    if (allListenersAndObservers.submit) {
        document.querySelector(allListenersAndObservers.submit).removeAttribute('disabled');
        document.querySelector(allListenersAndObservers.submit).classList.remove('disabled');
    }
}
export default { CheckSubmit, CheckInputs, TriggerUpdateEvents, GetInputValues, StopUpdate };
