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
                //WIP Relics collection
                //pass girl id to trimed relic data

                const unclaimed_relics_data = []
                Helpers.onAjaxResponse(/action=labyrinth_get_member_relics/i, (response) => {
                    const {unclaimed_relics, relics} = response
                    if (unclaimed_relics) {
                        unclaimed_relics_data.push(...unclaimed_relics)
                    }
                    if (relics) {
                        const relic_data = []
                        relics.forEach((relic) => {
                            const {identifier, rarity, bonus} = relic
                            relic_data.push({identifier, rarity, bonus})
                        })
                        Helpers.lsSet(lsKeys.LABYRINTH_RELICS, relic_data)
                    }
                })
                Helpers.onAjaxResponse(/action=labyrinth_pick_unclaimed_relic/i, (response, opt) => {
                    if (unclaimed_relics_data.length) {
                        const searchParams = new URLSearchParams(opt.data)
                        const relic_id = parseInt(searchParams.get('id_relic_unclaimed'))
                        const claimed_relic = unclaimed_relics_data.find(({id_member_relic_unclaimed}) => id_member_relic_unclaimed === relic_id)

                        if (claimed_relic) {
                            const relics = Helpers.lsGet(lsKeys.LABYRINTH_RELICS) || []
                            const {identifier, rarity, bonus} = claimed_relic

                            relics.push({identifier, rarity, bonus})
                            Helpers.lsSet(lsKeys.LABYRINTH_RELICS, relics)
                        }
                    }
                })
            }
        })
    }
}

export default LabyrinthInfoCollector
