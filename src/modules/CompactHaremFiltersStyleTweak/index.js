import STModule from '../STModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

import styles from './styles.lazy.scss'

const MODULE_KEY = 'compactHaremFilters'

class CompactHaremFiltersStyleTweak extends STModule {
    constructor () {
        const configSchema = ({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('stConfig', MODULE_KEY),
            default: true
        })
        super({
            configSchema,
            styles
        })
    }

    shouldRun () {
        return (Helpers.isCurrentPage('characters') || Helpers.isCurrentPage('harem')) && !Helpers.isCurrentPage('hero')
    }

    runExtra () {
        if (!this.shouldRun()) {return}

        Helpers.defer(() => {
            const getDropdown = (selector_class) => {
                return $(`.form-control:has([for="${selector_class}"])`).eq(0)
            }

            Helpers.doWhenSelectorAvailable('.form-control', () => {
                $('.form-control').last().addClass('filter-by-checkbox').insertAfter('.form-control.filter-by-element-form')
                getDropdown('level_cap').after(getDropdown('affection_cap')).after(getDropdown('rarity'))
                getDropdown('pose').before(getDropdown('role')).before(getDropdown('equipment')).after(getDropdown('zodiac'))
                getDropdown('origin').before(getDropdown('lively_scenes'))
            })
        })
    }
}

export default CompactHaremFiltersStyleTweak
