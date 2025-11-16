import STModule from '../STModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import Sheet from '../../common/Sheet'

import exchangeIcon from '../../assets/exchange.svg'

import styles from './styles.lazy.scss'

const MODULE_KEY = 'compactResourceSummary'

class CompactResourceSummaryStyleTweak extends STModule {
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
        return true
    }

    run () {
        super.run()
        Helpers.defer(() => {
            this.injectCSSVars()
        })
    }

    injectCSSVars() {
        Sheet.registerVar('exchange-icon', `url('${exchangeIcon}')`)
    }

    runExtra () {
        Helpers.defer(() => {
            Helpers.onAjaxResponse(/action=hero_get_resources/, (response) => {
                if (!this.hasRun) {return}
                const observer = new MutationObserver(() => {
                    if ($('#hero_resources_popup').length) {

                        Object.entries(response.currencies).forEach(([currency, {amount}]) => {
                            switch (currency) {
                            case 'soft_currency':
                                $('.hero-currency:has(.hudSC_mix_icn)>p').text(`x${+amount >= 1e6 ? I18n.nRounding(+amount, 3, 0) : I18n.nThousand(+amount)}`)
                                    .attr('hh_title', I18n.nThousand(+amount)).attr('tooltip', '')
                                break
                            default:
                                $(`.hero-currency span[name="${currency}"]`).next().text(`x${I18n.nThousand(+amount)}`)
                            }
                        })
                        $('.hero-currency:has(.ticket_icn)').after('<div class="line-break" style="order: -1"></div>')
                        // Move and minify scroll exchange button
                        $('#hero-scroll-currencies').siblings('p').wrap(`<div id='hero-scroll-currencies-title'></div>`)
                        $('#hero-scroll-currencies #scrolls-exchange').attr('class', 'round_blue_button').html('<span class="exchange_icn"></span>').appendTo('#hero-scroll-currencies-title')

                        Object.entries(response.progressions).forEach(([progression, {amount}]) => {
                            $(`.hero-progression span[hero-progression="${progression}"]`).next().text(`x${I18n.nThousand(+amount)}`)
                        })

                        let total_gems = 0
                        Object.values(response.gems).forEach((gem, index) => {
                            $('.hero-gem>p').eq(index).text(`x${I18n.nThousand(+gem.amount)}`)
                            total_gems += +gem.amount
                        })
                        $('.hero-gems-container>p').append(`<span class="total-gems"><span class="gem_all_icn"></span>x${I18n.nThousand(total_gems)}</span>`)

                        let total_orbs = 0
                        Object.entries(response.orbs).forEach(([orb, {amount}]) => {
                            $(`.hero-orb span[orb-name="${orb}"]`).next().text(`x${I18n.nThousand(+amount)}`)
                            total_orbs += +amount
                        })
                        $('.hero-orbs-container>p').append(`<span class="total-orbs">x${I18n.nThousand(total_orbs)}</span>`)

                        observer.disconnect()
                    }
                })
                observer.observe($('#common-popups')[0], {childList: true})
            })
        })
    }
}

export default CompactResourceSummaryStyleTweak
