import I18n from '../i18n'

class Snippets {
    static selectInput ({id, label, options, value, className, default_text}) {
        return `
            <div class="form-control ${className}">
                <div class="select-group">
                    <label class="head-group" for="${id}">${label}</label>
                    <select name="${id}" id="${id}" icon="down-arrow">
                        <option value="all" ${value === 'all' ? 'selected="selected"' : ''}>${default_text ? default_text : I18n.getModuleLabel('common', 'all')}</option>
                        ${options.map(({label, value: optValue}) => `<option value="${optValue}" ${value === optValue ? 'selected="selected"' : ''}>${label}</option>`).join('')}
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
}

export default Snippets
