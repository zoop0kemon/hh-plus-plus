import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

const MODULE_KEY = 'leaderboardProfilePopups'

class LeaderboardProfilePopupsModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return ['pantheon', 'season.html', 'path-of-valor', 'path-of-glory', 'seasonal'].some(page => Helpers.isCurrentPage(page))
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        Helpers.defer(() => {
            const {shared: {general: {hero_page_popup}}} = window
            $(document.body).on('click', '[sorting_id]', (e) => {
                const id = $(e.currentTarget).attr('sorting_id')
                hero_page_popup({id})
            })
        })

        this.hasRun = true
    }
}

export default LeaderboardProfilePopupsModule
