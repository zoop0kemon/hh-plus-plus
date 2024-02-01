import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

import styles from './styles.lazy.scss'
import { lsKeys } from '../../common/Constants'

const MODULE_KEY = 'eventEndIndicators'

const THRESHOLD = 12 * 60 * 60

const LSKEYS = {
    pov: lsKeys.PATH_TIME_POV,
    pog: lsKeys.PATH_TIME_POG,
}
const RELS = {
    pov: 'path-of-valor',
    pog: 'path-of-glory',
}

class EventEndIndicatorsModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return Helpers.isCurrentPage('home')
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            this.annotateEventWidget()
            this.annotateSeason()
            this.annotatePathEvents()
        })

        this.hasRun = true
    }

    annotateEventWidget () {
        const $eventTimers = $('.event-widget .timer.ongoing, .mega-event .timer.ongoing')

        $eventTimers.each((i, el) => {
            const $el = $(el)

            const timeleft = $el.data('seconds-left')

            if (timeleft < THRESHOLD) {
                $el.addClass('script-ending-soon')
            }
        })
    }

    annotateSeason () {
        const endTime = Helpers.lsGet(lsKeys.SEASON_END_TIME)
        const {server_now_ts} = window

        if (endTime && endTime > server_now_ts && endTime - THRESHOLD < server_now_ts) {
            $('.season-button').addClass('script-ending-soon')
        }
    }

    annotatePathEvents () {
        ['pov', 'pog'].forEach(this.annotatePathEvent)
    }

    annotatePathEvent (type) {
        const endTime = Helpers.lsGet(LSKEYS[type])
        const {server_now_ts} = window

        if (endTime && endTime > server_now_ts && endTime - THRESHOLD < server_now_ts) {
            $(`.pov-button [rel=${RELS[type]}]`).addClass('script-ending-soon')
        }
    }
}

export default EventEndIndicatorsModule
