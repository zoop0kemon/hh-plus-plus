import STModule from '../STModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

import styles from './styles.lazy.scss'

const MODULE_KEY = 'salaryTimers'

class GirlSalaryTimersStyleTweak extends STModule {
    constructor () {
        const configSchema = ({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('stConfig', MODULE_KEY),
            default: true,
            restriction: {whitelist: ['CxH']}
        })
        super({
            configSchema,
            styles
        })
    }

    shouldRun () {
        return (Helpers.isCurrentPage('characters') || Helpers.isCurrentPage('harem')) && !Helpers.isCurrentPage('hero')
    }
}

export default GirlSalaryTimersStyleTweak
