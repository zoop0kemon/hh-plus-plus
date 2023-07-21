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
                        $('.hero-currency>p').eq(0).text(`x${I18n.nThousand(+response.currencies.hard_currency)}`)
                        $('.hero-currency>p').eq(2).text(`x${I18n.nThousand(+response.currencies.frames)}`)
                        $('.hero-currency>p').eq(3).text(`x${I18n.nThousand(+response.currencies.sultry_coins)}`)
                        $('.hero-currency>p').eq(4).text(`x${I18n.nThousand(+response.currencies.ticket)}`)
                        
                        Object.values(response.gems).forEach((gem, index) => {
                            $('.hero-gem>p').eq(index).text(`x${I18n.nThousand(+gem.amount)}`)
                        })

                        Object.values(response.gems).forEach((gem, index) => {
                            $('.hero-gem>p').eq(index).text(`x${I18n.nThousand(+gem.amount)}`)
                        })

                        Object.values(response.orbs).forEach((orb, index) => {
                            $('.hero-orb>p').eq(index).text(`x${I18n.nThousand(+orb)}`)
                        })

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
