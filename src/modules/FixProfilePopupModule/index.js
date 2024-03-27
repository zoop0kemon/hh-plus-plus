import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

const MODULE_KEY = 'fixProfilePopup'

class FixProfilePopupModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return true
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        Helpers.defer(() => {
            this.overrideAPI()
        })

        this.hasRun = true
    }

    overrideAPI () {
        const default_hero_page_popup = window.shared.general.hero_page_popup
        window.shared = {
            ...window.shared,
            general: {
                ...window.shared.general,
                hero_page_popup: (info) => {
                    if (info && !info.page) {
                        info.page = 'profile'
                    }
                    return default_hero_page_popup(info)
                }
            }
        }
    }
}

export default FixProfilePopupModule
