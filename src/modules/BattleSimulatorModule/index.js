import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import Sheet from '../../common/Sheet'
import I18n from '../../i18n'

import styles from './styles.lazy.scss'
import League from './League'
import Simulator from './Simulator'
import Season from './Season'
import BDSMPvE from './BDSMPvE'

const MODULE_KEY = 'simFight'

class BattleSimulatorModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true,
            subSettings: [
                {
                    key: 'logging',
                    label: I18n.getModuleLabel('config', `${MODULE_KEY}_logging`),
                    default: false
                }
            ]
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)

        this.simManagers = []
        this.logging = false
    }

    shouldRun () {
        return ['pre-battle', 'tower-of-fame', 'season-arena'].some(page=>Helpers.isCurrentPage(page))
    }

    run ({logging}) {
        if (this.hasRun || !this.shouldRun()) {return}
        this.logging = logging

        styles.use()

        Helpers.defer(() => {
            this.injectCSSVars()
            if ((Helpers.isCurrentPage('tower-of-fame') && window.opponent_fighter) || Helpers.isCurrentPage('leagues-pre-battle')) {
                this.simManagers = [new League()]
            } else if (Helpers.isCurrentPage('season-arena')) {
                this.preSim = true
                this.simManagers = [
                    new Season(1),
                    new Season(2),
                    new Season(3),
                ]
            } else if (Helpers.isCurrentPage('pre-battle')) {
                this.preSim = true
                this.simManagers = [new BDSMPvE({label: this.label})]
            }

            this.runManagedSim()


            if (Helpers.isCurrentPage('tower-of-fame') && window.opponent_fighter) {
                new MutationObserver(() => this.runManagedSim()).observe(document.getElementById('leagues_right'), {childList: true})
            }
        })

        this.hasRun = true
    }

    injectCSSVars () {
        Sheet.registerVar('mojo-icon-s', `url(${Helpers.getCDNHost()}/pictures/design/ic_mojo_white.svg)`)
    }

    runManagedSim () {
        this.simManagers.forEach(simManager => {
            const {player, opponent} = simManager.extract()
            const {logging, preSim} = this

            const simulator = new Simulator({player, opponent, logging, preSim})
            const result = simulator.run()

            if (!Helpers.isCurrentPage('tower-of-fame')) {
                const waitOpnt = () => {
                    setTimeout(function() {
                        if ($('.average-lvl')) {
                            simManager.display(result)
                        } else {
                            waitOpnt()
                        }
                    }, 50)
                }
                waitOpnt()
            } else {
                simManager.display(result)
            }
        })
    }
}

export default BattleSimulatorModule
