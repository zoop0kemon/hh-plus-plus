import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import Sheet from '../../common/Sheet'

import styles from './styles.lazy.scss'
import { lsKeys } from '../../common/Constants'

const MODULE_KEY = 'leagueQuickNav'

class LeagueQuckNavModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return Helpers.isCurrentPage('leagues-pre-battle')
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            this.injectCSSVars()
            this.addQuickNav()
        })

        this.hasRun = true
    }

    injectCSSVars () {
        Sheet.registerVar('forwards', `url("${Helpers.getCDNHost()}/design/menu/forward.svg")`)
    }

    addQuickNav () {
        const avaliable_opponents = Helpers.lsGet(lsKeys.AVAILABLE_OPPONENTS) || []
        if (avaliable_opponents.length) {
            const {opponent_fighter} = window
            const currentID = parseInt(opponent_fighter.player.id_fighter)
            const currentIndex = avaliable_opponents.indexOf(currentID)
            let prevIndex = currentIndex - 1
            if (prevIndex < 0) {
                prevIndex += avaliable_opponents.length
            }
            let nextIndex = currentIndex + 1
            if (nextIndex >= avaliable_opponents.length) {
                nextIndex -= avaliable_opponents.length
            }

            const $prev = $(`<a href="${Helpers.getHref(`/leagues-pre-battle.html?id_opponent=${avaliable_opponents[prevIndex]}`)}" class="back_button_s prev"></a>`)
            const $next = $(`<a href="${Helpers.getHref(`/leagues-pre-battle.html?id_opponent=${avaliable_opponents[nextIndex]}`)}" class="back_button_s next"></a>`)

            Helpers.doWhenSelectorAvailable('.green_button_L', () => {
                $('.battle-buttons-row').prepend($prev).append($next)
            })
        }
    }
}

export default LeagueQuckNavModule
