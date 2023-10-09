import STModule from '../STModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

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
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return true
    }

    run (props) {
        super.run(props)

        Helpers.defer(() => {
            Helpers.onAjaxResponse(/action=hero_get_resources/, (response) => {
                const observer = new MutationObserver(() => {
                    if ($('#hero_resources_popup').length) {

                        $('.hero-currency:has(.hudHC_mix_icn)>p').text(`x${I18n.nThousand(+response.currencies.hard_currency)}`)
                        $('.hero-currency:has(.frames_icn)>p').text(`x${I18n.nThousand(+response.currencies.frames)}`)
                        $('.hero-currency:has(.sultry_coins_icn)>p').text(`x${I18n.nThousand(+response.currencies.sultry_coins)}`)
                        $('.hero-currency:has(.ticket_icn)>p').text(`x${I18n.nThousand(+response.currencies.ticket)}`)
                        $('.hero-currency:has(.scrolls_common_icn)>p').text(`x${I18n.nThousand(+response.currencies.scrolls_common)}`)
                        $('.hero-currency:has(.scrolls_rare_icn)>p').text(`x${I18n.nThousand(+response.currencies.scrolls_rare)}`)
                        $('.hero-currency:has(.scrolls_epic_icn)>p').text(`x${I18n.nThousand(+response.currencies.scrolls_epic)}`)
                        $('.hero-currency:has(.scrolls_legendary_icn)>p').text(`x${I18n.nThousand(+response.currencies.scrolls_legendary)}`)
                        $('.hero-currency:has(.scrolls_mythic_icn)>p').text(`x${I18n.nThousand(+response.currencies.scrolls_mythic)}`)

                        let totalGems = 0;
                        Object.values(response.gems).forEach((gem, index) => {
                            $('.hero-gem>p').eq(index).text(`x${I18n.nThousand(+gem.amount)}`)
                            totalGems += +gem.amount;
                        })
                        $(".hero-gems-container>p").text(this.label('gemsTitle', {totalGems}))

                        let totalOrbs = 0
                        Object.values(response.orbs).forEach((orb, index) => {
                            $('.hero-orb>p').eq(index).text(`x${I18n.nThousand(+orb)}`)
                            totalOrbs += +orb;
                        })
                        $(".hero-orbs-container>p").text(this.label('orbsTitle', {totalOrbs}))

                        Object.values(response.progressions).forEach((progression, index) => {
                            $('.hero-progression>p').eq(index).text(`x${I18n.nThousand(+progression)}`)
                        })

                        observer.disconnect()
                    }
                })
                observer.observe($('#popups')[0], {childList: true})
            })
        })
    }
}

export default CompactResourceSummaryStyleTweak
