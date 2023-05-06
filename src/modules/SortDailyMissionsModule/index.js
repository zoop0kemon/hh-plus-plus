import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

const MODULE_KEY = 'sortDailyMissions'

class SortDailyMissionsModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return Helpers.isCurrentPage('activities')
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        Helpers.defer(() => {
            const missions = $('.mission_object:not(.legendary)').toArray().sort((a, b) => {
                const aDuration = parseInt(JSON.parse($(a).attr('data-d')).duration)
                const bDuration = parseInt(JSON.parse($(b).attr('data-d')).duration)
                return aDuration - bDuration
            })
            const $eventMissions = $('.mission_object.legendary')

            let $elToAfter = $eventMissions.length ? $eventMissions.last() : $('.mission_object').eq(0)

            missions.forEach(mission => {
                const $nextEl = mission
                $elToAfter.after($nextEl)
                $elToAfter = $nextEl
            })
        })

        this.hasRun = true
    }
}

export default SortDailyMissionsModule
