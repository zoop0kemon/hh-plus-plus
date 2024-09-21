import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import { BLESSINGS, MAINTAINERS } from '../../data/Spreadsheets'

import styles from './styles.lazy.scss'

const MODULE_KEY = 'blessingSpreadsheetLink'

class BlessingSpreadsheetLinkModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true,
            restriction: {blacklist: ['PSH', 'HoH', 'TPSH']}
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return true
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            const href = BLESSINGS[Helpers.getGameKey()]
            const maintainer = MAINTAINERS[Helpers.getGameKey()]

            if (href) {
                const $sheet_link = $(`<a class="script-blessing-spreadsheet-link" target="_blank" href="${href}"><span class="nav_grid_icn"></span><span>${this.label('name', {maintainer})}</span></a>`)

                Helpers.onAjaxResponse(/action=get_girls_blessings/i, () => {
                    Helpers.doWhenSelectorAvailable('#blessings_popup .blessings_wrapper', () => {
                        $('#blessings_popup .blessings_wrapper').append($sheet_link)
                    })
                })
            }
        })

        this.hasRun = true
    }
}

export default BlessingSpreadsheetLinkModule
