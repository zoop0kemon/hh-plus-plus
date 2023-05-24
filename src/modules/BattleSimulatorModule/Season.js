import I18n from '../../i18n'
import SimHelpers from './SimHelpers'

class Season {
    constructor(idOpponent) {
        this.idOpponent = idOpponent
    }

    extract() {
        const { opponents, hero_data, caracs_per_opponent } = window
        const opponent_data = opponents[this.idOpponent - 1].player
        const opponentId = opponent_data.id_fighter
        const {
            chance: playerCrit,
            damage: playerAtk,
            defense: playerDef,
            remaining_ego: playerRemainingEgo,
            total_ego: playerTotalEgo,
        } = caracs_per_opponent[opponentId]
        const playerEgo = playerRemainingEgo || playerTotalEgo
        const {
            team: playerTeam
        } = hero_data
        let normalisedElements = playerTeam.theme_elements
        let normalisedSynergies = playerTeam.synergies

        if (!normalisedElements) {
            normalisedElements = []
            const teamElementCounts = SimHelpers.countElementsInTeam([0,1,2,3,4,5,6].map(key => playerTeam.girls[key].element_data.type))
            Object.entries(teamElementCounts).forEach(([type, count]) => {
                if (count >= 3) {
                    normalisedElements.push({type})
                }
            })
        }

        if (!normalisedSynergies) {
            normalisedSynergies = JSON.parse($('#leagues_left .hexa .icon-area').attr('synergy-data'))
        }

        const playerElements = normalisedElements.map(({type}) => type)
        const playerSynergies = normalisedSynergies
        const playerBonuses = {
            critDamage: SimHelpers.findBonusFromSynergies(playerSynergies, 'fire'),
            critChance: SimHelpers.findBonusFromSynergies(playerSynergies, 'stone'),
            healOnHit: SimHelpers.findBonusFromSynergies(playerSynergies, 'water'),
        }

        const {
            chance: opponentCrit,
            damage: opponentAtk,
            defense: opponentDef,
            remaining_ego: opponentRemainingEgo,
            total_ego: opponentTotalEgo,
            nickname: name
        } = opponent_data
        const opponentEgo = opponentRemainingEgo || opponentTotalEgo
        const {
            team: opponentTeam
        } = opponent_data
        const opponentTeamMemberElements = [];
        [0,1,2,3,4,5,6].forEach(key => {
            const teamMember = opponentTeam.girls[key]
            if (teamMember && teamMember.element) {
                opponentTeamMemberElements.push(teamMember.element)
            }
        })
        const opponentElements = opponentTeam.theme_elements.map(({type}) => type)

        const opponentSynergies = opponentTeam.synergies
        const teamGirlSynergyBonusesMissing = opponentSynergies.every(({team_girls_count}) => !team_girls_count)
        let counts
        if (teamGirlSynergyBonusesMissing) {
            // Open bug, sometimes opponent syergy data is missing team bonuses, so we need to rebuild it from the team
            counts = opponentTeamMemberElements.reduce((a,b)=>{a[b]++;return a}, {
                fire: 0,
                stone: 0,
                sun: 0,
                water: 0,
                nature: 0,
                darkness: 0,
                light: 0,
                psychic: 0
            })
        }

        const opponentBonuses = {
            critDamage: SimHelpers.findBonusFromSynergies(opponentSynergies, 'fire', teamGirlSynergyBonusesMissing, counts),
            critChance: SimHelpers.findBonusFromSynergies(opponentSynergies, 'stone', teamGirlSynergyBonusesMissing, counts),
            healOnHit: SimHelpers.findBonusFromSynergies(opponentSynergies, 'water', teamGirlSynergyBonusesMissing, counts),
        }


        const dominanceBonuses = SimHelpers.calculateDominationBonuses(playerElements, opponentElements)

        const player = {
            hp: playerEgo,
            dmg: playerAtk - opponentDef,
            critchance: SimHelpers.calculateCritChanceShare(playerCrit, opponentCrit) + dominanceBonuses.player.chance + playerBonuses.critChance,
            bonuses: {...playerBonuses, dominance: dominanceBonuses.player},
            theme: playerElements,
        }
        const opponent = {
            hp: opponentEgo,
            dmg: opponentAtk - playerDef,
            critchance: SimHelpers.calculateCritChanceShare(opponentCrit, playerCrit) + dominanceBonuses.opponent.chance + opponentBonuses.critChance,
            name,
            bonuses: {...opponentBonuses, dominance: dominanceBonuses.opponent},
            theme: opponentElements,
        }

        return { player, opponent }
    }

    display(result) {
        const $opponentData = $(`#season-arena .opponents_arena .season_arena_opponent_container.opponent-${this.idOpponent - 1}`)
        let $gridWrapper = $opponentData.find('.gridWrapper')
        if (!$gridWrapper.length) {
            $opponentData.find('.average-lvl').wrap('<div class="gridWrapper"></div>')
            $gridWrapper = $opponentData.find('.gridWrapper')
        }

        $gridWrapper.find('.matchRating').remove()
        const { rewards } = opponents[this.idOpponent - 1].rewards
        const pointsReward = rewards.find(({ type }) => type === 'victory_points')
        const points = parseInt($(pointsReward.value).text()) || parseInt(pointsReward.value)
        const expected = result.win * points - (1 - result.win) * (40 - points)
        const pointClass = expected > 15 ? 'plus' : expected < 0 ? 'minus' : 'close'
        $gridWrapper.append(`<span class="matchRating"><span class="${result.scoreClass}">${I18n.nRounding(100 * result.win, 2, -1)}%</span><br/><span class="${pointClass}">E[<span cur="victory_points"></span>]=${I18n.nRounding(expected, 1, -1)}</span></span>`)
    }
}

export default Season
