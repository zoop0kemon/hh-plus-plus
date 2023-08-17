import I18n from '../../i18n'
import SimHelpers from './SimHelpers'

class League {
    constructor(isMainLeague, playerData, opponentData) {
        this.isMainLeague = isMainLeague
        this.playerData = playerData
        this.opponentData = opponentData
    }

    extract () {
        const {opponent_fighter, hero_data} = window
        const isMainLeague = this.isMainLeague
        const opponent_data = isMainLeague ? this.opponentData.player : opponent_fighter.player
        const player_data = isMainLeague ? this.playerData : hero_data

        let {
            chance: playerCrit,
            damage: playerAtk,
            defense: playerDef,
            remaining_ego: playerRemainingEgo,
            total_ego: playerTotalEgo,
            ego: playerRawEgo
        } = isMainLeague ? player_data.team.caracs : player_data
        let playerEgo = isMainLeague ? playerRawEgo : playerRemainingEgo || playerTotalEgo
        const {
            team: playerTeam,
            hasAME
        } = player_data
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
            // Bug should be fixed now
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

        // test used to used to see how to get player stats from normalized data
        const testPlayer = () => {
            const {damage, defense, remaining_ego, chance, team: {caracs}} = hero_data

            let re_damage = Math.round(caracs.damage * (1+dominanceBonuses.player.attack))
            // check if AME/LME is being used
            if (Math.round(damage/re_damage * 100) === 115) {
                re_damage *= 1.15
            }
            const defDecrease = SimHelpers.findBonusFromSynergies(opponentSynergies, 'sun', teamGirlSynergyBonusesMissing, counts)
            const re_defense = Math.floor(caracs.defense * (1-defDecrease))
            const re_ego = Math.round(caracs.ego * (1+dominanceBonuses.player.ego))
            const re_chance = caracs.chance

            if (damage === re_damage && defense === re_defense && remaining_ego === re_ego && chance === re_chance) {
                console.log("Pass")
            } else {
                console.log(damage, defense, remaining_ego, chance)
                console.log(re_damage, re_defense, re_ego, re_chance)
            }
        }
        // testPlayer()

        if (isMainLeague) {
            playerAtk = Math.round(playerAtk * (1+dominanceBonuses.player.attack))
            if (hasAME) {
                playerAtk *= 1.15
            }
            playerEgo = Math.round(playerEgo * (1+dominanceBonuses.player.ego))
            const defDecrease = SimHelpers.findBonusFromSynergies(opponentSynergies, 'sun', teamGirlSynergyBonusesMissing, counts)
            playerDef = Math.floor(playerDef * (1-defDecrease))
        }

        const player = {
            hp: playerEgo,
            atk: playerAtk,
            def: opponentDef,
            critchance: SimHelpers.calculateCritChanceShare(playerCrit, opponentCrit) + dominanceBonuses.player.chance + playerBonuses.critChance,
            bonuses: {...playerBonuses, dominance: dominanceBonuses.player},
            theme: playerElements,
            atkMult: SimHelpers.getSkillPercentage(playerTeam, 9),
            defMult: SimHelpers.getSkillPercentage(playerTeam, 10)
        }
        const opponent = {
            hp: opponentEgo,
            atk: opponentAtk,
            def: playerDef,
            critchance: SimHelpers.calculateCritChanceShare(opponentCrit, playerCrit) + dominanceBonuses.opponent.chance + opponentBonuses.critChance,
            name,
            bonuses: {...opponentBonuses, dominance: dominanceBonuses.opponent},
            theme: opponentElements,
            atkMult: SimHelpers.getSkillPercentage(opponentTeam, 9),
            defMult: SimHelpers.getSkillPercentage(opponentTeam, 10)
        }

        return {player, opponent}
    }

    display (result) {
        const {GT} = window
        const {points: calc, win, scoreClass} = result
        let probabilityTooltip = '<table class=\'probabilityTable\'>'
        let expectedValue = 0
        const pointGrade=['#fff','#fff','#fff','#ff2f2f','#fe3c25','#fb4719','#f95107','#f65b00','#f26400','#ed6c00','#e97400','#e37c00','#de8400','#d88b00','#d19100','#ca9800','#c39e00','#bba400','#b3aa00','#aab000','#a1b500','#97ba00','#8cbf00','#81c400','#74c900','#66cd00']
        for (let i=25; i>=3; i--) {
            if (calc[i]) {
                const isW = i>=15
                probabilityTooltip += `<tr style='color:${isW?pointGrade[25]:pointGrade[3]};' data-tint='${isW?'w':'l'}'><td>${i}</td><td>${I18n.nRounding(100*calc[i], 2, 0)}%</td></tr>`
                expectedValue += i*calc[i]
            }
        }
        probabilityTooltip += `<tr class='${scoreClass}'><td>${GT.design.leagues_won_letter}</td><td>${I18n.nRounding(100*win, 2, -1)}%</td></tr>`
        probabilityTooltip += '</table>'

        const matchRatingParts = {
            expected: {
                label: 'E[X]',
                value: I18n.nRounding(expectedValue, 2, 0),
                className: '',
                tooltip: probabilityTooltip
            },
            'win-chance': {
                label: `P[${GT.design.leagues_won_letter}]`,
                value: `${I18n.nRounding(100*win, 0, -1)}%`,
                className: scoreClass,
                tooltip: ''
            }
        }

        const matchRatingHtml = Object
            .entries(matchRatingParts)
            .map(([key, {label, value, className, tooltip}]) =>
                `<div class="matchRating-${key} ${className}" tooltip="${tooltip}"><span class="matchRating-label">${label}:</span><span class="matchRating-value">${value}</span></div>`
            ).join('')
        const $rating = $(`<div class="matchRating" style="color:${pointGrade[Math.round(expectedValue)]};">${matchRatingHtml}</div>`)

        if (this.isMainLeague) {
            const addRating = (isFirst) => {
                const {opponents_list} = window
                const index = opponents_list.findIndex(e => e.player.id_fighter === this.opponentData.player.id_fighter)
                if (isFirst) {
                    opponents_list[index].power = expectedValue
                    opponents_list[index].sim = result
                }
                $('.data-row.body-row').eq(index).find('.data-column[column=power]').empty().append($rating)
            }

            addRating(true)
            $(document).on('league:table-sorted', () => {
                addRating(false)
            })
        } else {
            $('.player_team_block.opponent .average-lvl').wrap('<div class="gridWrapper"></div>').after($rating)
        }
    }
}

export default League
window.HHPlusPlus.League = League
