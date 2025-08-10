import STModule from '../STModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import Sheet from '../../common/Sheet'

import styles from './styles.lazy.scss'

const MODULE_KEY = 'eventGirlTicks'

class EventGirlTicksStyleTweak extends STModule {
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
        return Helpers.isCurrentPage('event.html') && !Helpers.isCurrentPage('world-boss-event')
    }

    run () {
        super.run()
        Helpers.defer(() => {
            this.injectCSSVars()
        })
    }

    injectCSSVars() {
        Sheet.registerVar('girl-tick-icon', `url('${Helpers.getCDNHost()}/clubs/ic_Tick.png')`)
    }
}

export default EventGirlTicksStyleTweak
