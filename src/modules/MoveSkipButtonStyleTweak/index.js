import Helpers from '../../common/Helpers'
import STModule from '../STModule'
import I18n from '../../i18n'

import styles from './styles.lazy.scss'

const MODULE_KEY = 'moveSkipButton'

class MoveSkipButtonStyleTweak extends STModule {
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
        return Helpers.isCurrentPage('battle') && !Helpers.isCurrentPage('pre-battle')
    }
}

export default MoveSkipButtonStyleTweak
