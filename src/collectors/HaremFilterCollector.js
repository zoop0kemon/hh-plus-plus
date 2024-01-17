import { lsKeys } from '../common/Constants'
import Helpers from '../common/Helpers'

class HaremFilterCollector {
    static collect() {
        if (Helpers.isCurrentPage('harem') && !Helpers.isCurrentPage('hero')) {
            Helpers.defer(() => {
                const hook = (actual, ...args) => {
                    const ret = actual(...args)
                    const { harem: { sortedGirls, filteredGirlsIds } } = window
                    if (sortedGirls && filteredGirlsIds) {
                        setTimeout(() => {Helpers.lsSet(lsKeys.HAREM_FILTER_IDS, sortedGirls.filter(({ id_girl, own }) => own && filteredGirlsIds.includes(id_girl)).map(({ id_girl }) => `${id_girl}`))})
                    }
                    return ret
                }

                const methodsToHook = [
                    'resetGirlsList',
                    'initFiltersAndSorting',
                ]

                methodsToHook.forEach(method => {
                    const actual = window.harem[method].bind(window.harem)
                    window.harem[method] = hook.bind(this, actual)
                })
            })
        }
    }
}

export default HaremFilterCollector
