import Helpers from '../common/Helpers'
import { RARITIES } from '../data/Rarities'

const ID_FROM_URL_REGEX = /(?<id>[0-9]+)\/ico(?<level>[0-9])(-[0-9]+x)?\.[a-z]+(\?v=[0-9]+)?$/i
const ELEMENT_FROM_URL_REGEX = /(?<element>[A-Z][a-z]+)\.[a-z]+(\?v=[0-9]+)?$/i

const extractIdFromUrl = (url) => {
    const matches = url.match(ID_FROM_URL_REGEX)
    if (!matches || !matches.groups) {
        return {}
    }

    const {groups: {id, level}} = matches
    return {id, level}
}
const extractElementFromUrl = (url) => {
    const matches = url.match(ELEMENT_FROM_URL_REGEX)
    if (!matches || !matches.groups) {
        return
    }

    const {groups: {element}} = matches
    return element
}

class TeamsCollector {
    static collect() {
        if (Helpers.isCurrentPage('teams')) {
            Helpers.defer(() => {
                const {teams_data} = window
                const team_list = Object.keys(teams_data).map((key) => teams_data[key])
                const teamsDict = {}
                const teamIds = []

                $('.team-slot-container[data-is-empty!="1"]').each((i, slot) => {
                    const teamId = $(slot).data('id-team')
                    const icon = $(slot).find('img').attr('girl-ico-src')
                    const {id: iconId, level: iconLevel} = extractIdFromUrl(icon)

                    const themeIcons = $(slot).find('.team-slot-themes-container img').map((i,el)=>$(el).attr('src')).toArray()
                    const themeElements = themeIcons.map(extractElementFromUrl)

                    const classes = $(slot).attr('class').replace(/\s+/g, ' ').split(' ')
                    const iconRarity = RARITIES.find(rarity => classes.includes(rarity))

                    teamsDict[teamId] = {
                        teamId,
                        iconId,
                        iconLevel,
                        iconRarity,
                        themeElements,
                    }
                    teamIds.push(teamId)
                })

                teamIds.forEach(teamId => {
                    teamsDict[teamId].girls = team_list.find((team) => team.id_team == teamId).girls_ids
                })

                const teams = {
                    teamsDict,
                    teamIds
                }
                Helpers.setTeamsDictionary(teams)
            })
        }
    }
}

export default TeamsCollector
