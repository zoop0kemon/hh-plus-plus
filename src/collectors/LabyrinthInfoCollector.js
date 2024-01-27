import { lsKeys } from '../common/Constants'
import Helpers from '../common/Helpers'

class LabyrinthInfoCollector {
    static collect() {
        Helpers.defer(() => {
            if (Helpers.isCurrentPage('labyrinth-pool-select')) {
                Helpers.lsSet(lsKeys.LABYRINTH_SPEEDS, [])
                Helpers.lsSet(lsKeys.LABYRINTH_RELICS, [])
            }
            if (Helpers.isCurrentPage('labyrinth-pre-battle')) {
                // init opponent speeds
                const opponent_speeds = opponent_fighter.fighters.map(({speed, id_girl, position}) => {
                    return {speed: speed, girl_id: id_girl, position: position+7}
                })
                Helpers.lsSet(lsKeys.LABYRINTH_SPEEDS, opponent_speeds)
            }
            if (Helpers.isCurrentPage('labyrinth-battle')) {
                // update opponent speeds, removing defeated opponent girls
                Helpers.onAjaxResponse(/action=do_battles_labyrinth/i, (response) => {
                    const {battle_result, rounds} = response
                    if (battle_result === 'opponent_won') {
                        const opponent_speeds = Helpers.lsGet(lsKeys.LABYRINTH_SPEEDS) || []
                        const {changes: {opponent}} = rounds[rounds.length - 1]

                        Object.values(opponent).forEach((phase) => {
                            Object.entries(phase).forEach(([girl_id, changes]) => {
                                if (changes.is_defeated) {
                                    const index = opponent_speeds.findIndex((g) => g.girl_id === parseInt(girl_id) && g.position >= 7)
                                    if (index > -1) {
                                        opponent_speeds.splice(index, 1)
                                    }
                                }
                            })
                        })

                        Helpers.lsSet(lsKeys.LABYRINTH_SPEEDS, opponent_speeds)
                    }
                })
            }
            if (Helpers.isCurrentPage('labyrinth.html')) {
                const unclaimed_relics_data = []

                const trimRelicData = (relic) => {
                    const {identifier, rarity, bonus} = relic
                    const relic_data = {identifier, rarity, bonus}
                    if (relic.girl) {
                        const {id_girl, remaining_ego_percent, member_girl: {level, girl: {class: g_class, rarity, name, element_data: {type}}, battle_caracs, graded2, ico, skill_tiers_info: skill_tiers_temp}} = relic.girl
                        const skill_tiers_info = [{}, ...Object.values(skill_tiers_temp).slice(-1)]

                        relic_data.girl = {
                            id_girl,
                            remaining_ego_percent,
                            member_girl: {
                                level,
                                battle_caracs,
                                graded2,
                                ico,
                                skill_tiers_info,
                                girl: {
                                    class: g_class,
                                    rarity,
                                    name,
                                    element_data: {type}
                                }
                            }
                        }
                    }

                    return relic_data
                }
                const relicSort = (a, b) => {
                    if (a.identifier === b.identifier) {
                        return b.bonus - a.bonus
                    }
                    return a.identifier > b.identifier ? -1 : 1
                }

                Helpers.onAjaxResponse(/action=labyrinth_get_member_relics/i, (response) => {
                    const {unclaimed_relics, relics} = response
                    // choice of 3 relics
                    if (unclaimed_relics) {
                        unclaimed_relics_data.push(...unclaimed_relics)
                    }
                    // default relics menu
                    if (relics) {
                        const relics_data = []
                        relics.forEach((relic) => {
                            relics_data.push(trimRelicData(relic))
                        })
                        Helpers.lsSet(lsKeys.LABYRINTH_RELICS, relics_data.sort(relicSort))
                    }
                })
                // choosing 1 of 3 relics
                Helpers.onAjaxResponse(/action=labyrinth_pick_unclaimed_relic/i, (response, opt) => {
                    if (unclaimed_relics_data.length) {
                        const searchParams = new URLSearchParams(opt.data)
                        const relic_id = parseInt(searchParams.get('id_relic_unclaimed'))
                        const claimed_relic = unclaimed_relics_data.find(({id_member_relic_unclaimed}) => id_member_relic_unclaimed === relic_id)

                        if (claimed_relic) {
                            const relics = Helpers.lsGet(lsKeys.LABYRINTH_RELICS) || []

                            relics.push(trimRelicData(claimed_relic))
                            Helpers.lsSet(lsKeys.LABYRINTH_RELICS, relics.sort(relicSort))
                        }
                    }
                })
            }
        })
    }
}

export default LabyrinthInfoCollector
