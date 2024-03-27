import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import OverriddenPachinkoConfirm from './OverriddenPachinkoConfirm'

const MODULE_KEY = 'overridePachinkoConfirm'

class OverridePachinkoConfirmModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: false
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return Helpers.isCurrentPage('pachinko')
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        //FIX LATTER
        const override = () => {
            if (window.HHPachinkoConfirm) {
                window.HHPachinkoConfirm = OverriddenPachinkoConfirm
            } else {
                setTimeout(override, 100)
            }
        }
        override()

        this.hasRun = true
    }
}

export default OverridePachinkoConfirmModule
