import Helpers from '../../common/Helpers'
import STModule from '../STModule'
import I18n from '../../i18n'
import styles from './styles.lazy.scss'

class MoneyAnimationStyleTweak extends STModule {
    constructor() {
        const configSchema = {
            baseKey: 'collectMoneyAnimation',
            default: true,
            label: I18n.getModuleLabel('stConfig', 'collectMoneyAnimation')
        }
        super({
            configSchema,
            styles
        })
    }

    shouldRun () {
        return Helpers.isCurrentPage('home') || ((Helpers.isCurrentPage('characters') || Helpers.isCurrentPage('harem')) && !Helpers.isCurrentPage('hero'))
    }
}

export default MoneyAnimationStyleTweak
