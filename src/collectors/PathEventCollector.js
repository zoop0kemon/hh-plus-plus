import Helpers from '../common/Helpers'
import {lsKeys} from '../common/Constants'

const LSKEYS = {
    pov: lsKeys.PATH_TIME_POV,
    pog: lsKeys.PATH_TIME_POG,
}

class PathEventCollector {
    static collect() {

        Helpers.doWhenSelectorAvailable('.potions-paths-timer', () => {
            if (Helpers.isCurrentPage('path-of-valor')) {
                PathEventCollector.collectEndTime('pov')
            }
            if (Helpers.isCurrentPage('path-of-glory')) {
                PathEventCollector.collectEndTime('pog')
            }
        })
    }

    static collectEndTime (type) {
        const {server_now_ts} = window
        const $timer = $('.potions-paths-timer')
        let timeleft = $timer.data('time-stamp')

        const persist = () => {
            const endTime = server_now_ts + timeleft
            const lskey = LSKEYS[type]
            Helpers.lsSet(lskey, endTime)
        }

        if (timeleft) {
            persist()
        } else {
            const observer = new MutationObserver(() => {
                if (timeleft) {
                    persist()
                    observer.disconnect()
                }
            })
            observer.observe($timer[0], {attributes: true})
        }
    }
}

export default PathEventCollector
