import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import filterIcon from '../../assets/filter.svg'

import styles from './styles.lazy.scss'
import Sheet from '../../common/Sheet'
import EquipManager from './EquipManager'

const {$} = Helpers
const MODULE_KEY = 'marketEquipsFilter'

class MarketEquipsFilterModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return Helpers.isCurrentPage('shop') || Helpers.isCurrentPage('mythic-equipment-upgrade')
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            this.injectCSSVars()

            let containers = []

            if (Helpers.isCurrentPage('shop')) {
                containers = [
                    {
                        $container: $('#my-hero-equipement-tab-container'),
                        name: 'equippable'
                    },
                    {
                        $container: $('#equipement-tab-container .right-container'),
                        name: 'sellable'
                    }
                ]

            } else if (Helpers.isCurrentPage('mythic-equipment-upgrade')) {
                containers = [
                    {
                        $container: $('.inventory-section'),
                        name: 'upgrade',
                        skipFilter: true,
                    },
                ]
            }
            containers.forEach(({$container, name, skipFilter}) => {
                const manager = new EquipManager($container, name, skipFilter)
                manager.init()
            })
        })

        this.hasRun = true
    }

    injectCSSVars() {
        Sheet.registerVar('filter-icon', `url('${filterIcon}')`)
        Sheet.registerVar('star-icon-white', `url('${Helpers.getCDNHost()}/design/ic_star_white.svg')`)
        Sheet.registerVar('star-icon-orange', `url('${Helpers.getCDNHost()}/design/ic_star_orange.svg')`)
    }
}

export default MarketEquipsFilterModule
