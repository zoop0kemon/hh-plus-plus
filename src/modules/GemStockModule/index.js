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
        return (Helpers.isCurrentPage('characters') || Helpers.isCurrentPage('harem')) && !Helpers.isCurrentPage('hero')
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

            Helpers.onAjaxResponse(/action=get_girl&/i, (response) => {
                if (response.girl.is_owned) {
                    // wait for #harem_right to be built/updated and then attach
                    const haremObserver = new MutationObserver(() => {
                        if (!$('#gems-and-token-container .gemStock').length) {
                            $('#gems-and-token-container #gems-amount').text(I18n.nThousand(+$('#gems-and-token-container #gems-amount').text()))
                            $('#gems-and-token-container').prepend($gemStock)
                            haremObserver.disconnect()
                        }
                    })
                    haremObserver.observe($('#harem_right')[0], {childList: true, subtree: true})
                }
            })

            // Update for when harem view is toggled between grid and list
            Helpers.doWhenSelectorAvailable('#harem_left .girls_list', () => {
                const viewObserver = new MutationObserver(() => {
                    if (!$('#gems-and-token-container .gemStock').length && !$('#harem_right .middle_part.missing_girl').length) {
                        $('#gems-and-token-container #gems-amount').text(I18n.nThousand(+$('#gems-and-token-container #gems-amount').text()))
                        $('#gems-and-token-container').prepend($gemStock)
                    }
                })
                viewObserver.observe($('#harem_left .girls_list')[0], {attributes: true})
            })
        })

        this.hasRun = true
    }

    injectCSSVars() {
        Sheet.registerVar('gem-stock-icon', `url('${Helpers.getCDNHost()}/pictures/design/gems/all.png')`)
    }
}

export default GemStockModule
