import I18n from '../i18n'

class Snippets {
    static selectInput ({id, label, options, value, className, default_text, have_default=true}) {
        return `
            <div class="form-control ${className}">
                <div class="select-group">
                    <label class="head-group" for="${id}">${label}</label>
                    <select name="${id}" id="${id}" icon="down-arrow">
                        ${have_default ? `<option value="all" ${value === 'all' ? 'selected="selected"' : ''}>${default_text ? default_text : I18n.getModuleLabel('common', 'all')}</option>` : ''}
                        ${options.map(({label, value: optValue}) => `<option value="${optValue}"${value === optValue ? ' selected="selected"' : ''}>${label}</option>`).join('')}
                    </select>
                </div>
            </div>
        `
    }
    static textInput ({id, label, placeholder, value}) {
        return `
            <div class="form-control">
                <div class="input-group">
                    <label class="head-group" for="${id}">${label}</label>
                    <input type="text" autocomplete="off" id="${id}" placeholder="${placeholder}" icon="search" value="${value}">
                </div>
            </div>
        `
    }
    static checkboxInput ({id, label, options, values, className, buttonClass}) {
        return `
            <div class="form-control ${className}">
                <label class="head-group" for="${id}">${label}</label>
                <div class="checkbox-group" id="${id}">
                    ${options.map(({value}) => `<button class="check-btn ${buttonClass}" value="${value}"${values.includes(value) ?  ' selected' : ''}${id === 'filter-class' ? ` carac="${value}"` : ''}>
                        ${id === 'filter-element' ? `<span class="element-icn ${value}_element_icn"></span>` : ''}
                    </button>`).join('')}
                </div>
            </div>
        `
    }
}

export default Snippets
