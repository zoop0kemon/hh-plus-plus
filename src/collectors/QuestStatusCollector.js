import { lsKeys } from '../common/Constants'
import Helpers from '../common/Helpers'

class QuestStatusCollector {
    static collect () {
        Helpers.defer(() => {
            Helpers.doWhenSelectorAvailable('nav', () => {
                const queststatus = Helpers.lsGet(lsKeys.QUEST_STATUS) || {}
                const {Hero: {infos: {questing}}} = window.shared

                const has_parallel_adventures = $('nav [href^="/adventures.html"]').length > 0
                queststatus.has_parallel_adventures = has_parallel_adventures

                if (has_parallel_adventures) {
                    // get start/end world IDs
                    if (Helpers.isCurrentPage('adventures.html')) {
                        const {adventures_data} = window
                        queststatus.adventures = queststatus?.adventures || {}
                        adventures_data.forEach(({id_adventure, name, id_world_first, id_world_last}) => {
                            queststatus.adventures[id_adventure] = queststatus.adventures?.[id_adventure] || {}
                            const worlds = queststatus.adventures[id_adventure]?.worlds || []
                            queststatus.adventures[id_adventure].worlds = [...new Set([id_world_first, id_world_last, ...worlds])]
                            queststatus.adventures[id_adventure].name = name
                        })
                    }
                    // get the rest of the world IDs
                    if (Helpers.isCurrentPage('map.html') && queststatus?.adventures) {
                        const worlds = $('.ico-world img:first-child').map((_, world) => parseInt($(world).attr('src').match(/gallery\/66\/\d+x\/(\d+)-/)[1])).get()
                        Object.values(queststatus.adventures).forEach(adventure => {
                            if (worlds.some(world => adventure.worlds.includes(world))) {
                                adventure.worlds = worlds
                            }
                        })
                    }
                    // failsafe, just assume your in the main adventure
                    if (queststatus?.adventures === undefined) {
                        queststatus.adventures = {1: {worlds: []}}
                    }

                    const current_adventure = Object.keys(queststatus.adventures).find(adventure => queststatus.adventures[adventure].worlds.includes(questing.id_world)) || 1
                    queststatus.current_adventure = parseInt(current_adventure)
                    queststatus.adventures[current_adventure].questing = questing
                } else {
                    queststatus.current_adventure = 1
                    queststatus.adventures = {1: {questing}}
                }

                Helpers.lsSet(lsKeys.QUEST_STATUS, queststatus)
            })
        })
    }
}

export default QuestStatusCollector
