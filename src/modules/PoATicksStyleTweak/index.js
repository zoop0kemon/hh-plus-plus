import STModule from '../STModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import Sheet from '../../common/Sheet'

import styles from './styles.lazy.scss'

const MODULE_KEY = 'poaTicks'

const DARK_COLOR = {
    HH: '#300912',
    GH: '#1b0d37',
    CxH: '#0f0b1d',
    PSH: '#3d072b',
    TPSH: '#3d072b',
    GPSH: '#3d072b'
}

class PoATicksStyleTweak extends STModule {
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
        return Helpers.isCurrentPage('event.html')
    }

    run () {
        super.run()
        Helpers.defer(() => {
            this.injectCSSVars()
        })
    }

    injectCSSVars() {
        const darkColor = DARK_COLOR[Helpers.getGameKey()] || DARK_COLOR.HH
        Sheet.registerVar('dark-color', darkColor)
    }
}

export default PoATicksStyleTweak
