import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

const MODULE_KEY = 'haremOptimization'

class HaremOptimizationModule extends CoreModule {
    constructor() {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun() {
        return Helpers.isCurrentPage('harem') && !Helpers.isCurrentPage('hero')
    }

    run() {
        if (this.hasRun || !this.shouldRun()) { return }

        Helpers.defer(() => {
            if (typeof $ !== 'function' || typeof jQuery !== 'function') return

            const handler = {
                get(target, prop) {
                    if (prop === 'niceScroll') {
                        if (document.contains(target.getNiceScroll()[0]?.rail[0])) {
                            return target.getNiceScroll
                        } else {
                            return target.niceScroll
                        }
                    }
                    if (prop === 'getNiceScroll') {
                        const f = target.getNiceScroll
                        return function (...args) {
                            return new Proxy(f.apply(this, args), handler)
                        }
                    }
                    if (prop === 'remove') {
                        if (document.contains(target[0]?.rail?.[0])) {
                            return target.resize
                        } else {
                            return target.remove
                        }
                    }
                    return target[prop]
                },
            }

            window.$ = Object.setPrototypeOf((...args) => {
                const r = window.jQuery(...args)
                return args[0] === '.girls_list' ? new Proxy(r, handler) : r
            }, jQuery)

            if (typeof window.Girl?.prototype?._getLeft !== 'function') return

            const map = new Map()
            const { _getLeft } = window.Girl.prototype
            window.Girl.prototype._getLeft = function (...args) {
                let cache = map.get(this.gId)
                if (!cache || !document.contains(cache[0])) {
                    cache = _getLeft.apply(this, args)
                    map.set(this.gId, cache)
                }
                return cache
            }
        })

        this.hasRun = true
    }
}

export default HaremOptimizationModule
