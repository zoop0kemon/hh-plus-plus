import { lsKeys } from '../common/Constants'
import Helpers from '../common/Helpers'

class HaremFilterCollector {
    static collect() {
        if (Helpers.isCurrentPage('harem') && !Helpers.isCurrentPage('hero')) {
            Helpers.defer(() => {
                const girlDictionary = Helpers.getGirlDictionary()
                const default_list = []
                girlDictionary.forEach(({shards}, girl_id) => {
                    if (shards === 100 && typeof girl_id === 'string') {
                        default_list.push(parseInt(girl_id))
                    }
                })
                Helpers.lsSet(lsKeys.HAREM_FILTER_IDS, default_list)

                let girl_ids = []
                let filters = {}
                let top = false
                let bottom = false

                Helpers.onAjaxResponse(/action=girls_get_list/i, (response, opt) => {
                    const {girls_list, reached_top, reached_bottom} = response
                    const searchParams = new URLSearchParams(opt.data)
                    let new_filters = false
                    searchParams.forEach((value, key) => {
                        if (key.includes('filters') || ['sort_by', 'sort_direction'].includes(key)) {
                            const is_checkbox = key.includes('[]')
                            if (filters.hasOwnProperty(key)) {
                                if (is_checkbox ? !(value in filters[key]) : value !== filters[key]) {
                                    new_filters = true
                                    if (is_checkbox) {
                                        filters[key].push(value)
                                    } else {
                                        filters[key] = value
                                    }
                                }
                            } else {
                                new_filters = true
                                filters[key] = is_checkbox ? [value] : value
                            }
                        }
                    })

                    if (new_filters) {
                        top = reached_top
                        bottom = reached_bottom
                        girl_ids = []
                    } else {
                        top = top || reached_top
                        bottom = bottom || reached_bottom
                    }

                    girls_list.forEach(({id_girl, is_owned}) => {
                        if (is_owned && !girl_ids.includes(id_girl)) {
                            girl_ids.push(id_girl)
                        }
                    })

                    if (top && bottom) {
                        Helpers.lsSet(lsKeys.HAREM_FILTER_IDS, girl_ids)
                    }
                })
            })
        }
    }
}

export default HaremFilterCollector
