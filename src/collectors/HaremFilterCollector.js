import { lsKeys } from '../common/Constants'
import Helpers from '../common/Helpers'

class HaremFilterCollector {
    static collect() {
        Helpers.defer(() => {
            if (Helpers.isCurrentPage('harem') && !Helpers.isCurrentPage('hero')) {
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
            }
            if (Helpers.isCurrentPage('teams')) {
                const {teams_data} = window
                const collectTeamList = () => {
                    const team_id = parseInt($('.team-slot-container.selected-team').attr('data-id-team'))
                    if (!team_id) {return}
                    const {girls_ids} = Object.values(teams_data).find(team => parseInt(team.id_team) === team_id)

                    Helpers.lsSet(lsKeys.HAREM_FILTER_IDS, girls_ids.map(girl_id => parseInt(girl_id)))
                }

                Helpers.doWhenSelectorAvailable('.team-slot-container.selected-team', () => {
                    collectTeamList()
                    const observer = new MutationObserver(collectTeamList)
                    observer.observe($('.teams-grid-container')[0], {attributes: true, attributeFilter: ['class'], subtree: true})
                })
            }
            if (Helpers.isCurrentPage('champions/') || Helpers.isCurrentPage('club-champion')) {
                const {championData: {team}} = window
                const girl_ids = team.map(girl => parseInt(girl.id_girl))

                Helpers.lsSet(lsKeys.HAREM_FILTER_IDS, girl_ids)

                const onDraft = (response) => {
                    const {teamArray} = response
                    const girl_ids = teamArray.map(girl => parseInt(girl.id_girl))
                    
                    Helpers.lsSet(lsKeys.HAREM_FILTER_IDS, girl_ids)
                }
                Helpers.onAjaxResponse(/action=team_draft/, onDraft)
                Helpers.onAjaxResponse(/action=champion_team_draft/, onDraft)

                const onReorder = (response, opt) => {
                    const searchParams = new URLSearchParams(opt.data)
                    const girl_ids = searchParams.getAll('team_order[]').map(girl_id => parseInt(girl_id))

                    Helpers.lsSet(lsKeys.HAREM_FILTER_IDS, girl_ids)
                }
                Helpers.onAjaxResponse(/action=team_reorder/, onReorder)
                Helpers.onAjaxResponse(/action=champion_team_reorder/, onReorder)
            }
        })
    }
}

export default HaremFilterCollector
