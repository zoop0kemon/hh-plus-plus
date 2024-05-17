import { lsKeys } from '../common/Constants'
import Helpers from '../common/Helpers'

class HaremFilterCollector {
    static collect() {
        Helpers.defer(() => {
            if ((Helpers.isCurrentPage('characters') || Helpers.isCurrentPage('harem')) && !Helpers.isCurrentPage('hero')) {
                Helpers.lsSet(lsKeys.HAREM_FILTER_IDS, [])
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
