import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import {ICON_NAMES as ELEMENTS_ICON_NAMES} from '../../data/Elements'

import styles from './styles.lazy.scss'
import Sheet from '../../common/Sheet'

const MODULE_KEY = 'gemStock'

class GemStockModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return (Helpers.isCurrentPage('harem') && !Helpers.isCurrentPage('hero'))
    }

    buildGemsTable () {
        const {player_gems_amount} = window
        const elements = Object.keys(ELEMENTS_ICON_NAMES)
        return `
        <table class="gemStock-table">
            <tbody>
                ${elements.map(element => `
                    <tr>
                        <td><img src="${Helpers.getCDNHost()}/pictures/design/gems/${element}.png"></td>
                        <td>${I18n.nThousand(+player_gems_amount[element].amount)}</td>
                    </tr>
                `).join('')}
            </tody>
        </table>
        <table class="gemStock-table">
            <hr>
            <tbody>
                <tr class="sum">
                    <td><img src="${Helpers.getCDNHost()}/pictures/design/gems/all.png"></td>
                    <td>${I18n.nThousand(Object.values(player_gems_amount).reduce((a,g) => +g.amount+a, 0))}</td>
                </tr>
            </tbody>
        </table>
    `.replace(/(\n| {4})/g, '')
    }

    buildGemsStockElem () {
        return $('<div class="gemStock" tooltip></div>').attr('tooltip', this.buildGemsTable())
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            this.injectCSSVars()

            const $gemStock = this.buildGemsStockElem()
            const $container = $('#harem_left')

            $container.prepend($gemStock)
        })

        this.hasRun = true
    }

    injectCSSVars() {
        Sheet.registerVar('gem-stock-icon', `url('${Helpers.getCDNHost()}/pictures/design/gems/all.png')`)
    }
}

export default GemStockModule
