import Helpers from '../../common/Helpers'

/**
 * ELEMENTS ASSUMPTIONS
 *
 * 1) Girl and Harem synergy bonuses for Attack, Defense, Ego and Harmony are already included in the shown stats for league and seasons
 * 2) Girl and Harem synergy bonuses for Crit damage, Heal-on-hit, and Crit chance are not shown at all for league and seasons for opponents and must be built from team and an estimate of harem
 * 3) Countering bonuses for ego and attack are included in the shown stats, but crit chance bonus is not
 *
 * ELEMENTS FACTS
 *
 * 1) Crit damage and chance bonuses are additive; Ego and damage bonuses are multiplicative
 * 2) Opponent harem synergies are completely unavailable to the player for seasons, they are available in league
 */
const ELEMENTS = {
    chance: {
        darkness: 'light',
        light: 'psychic',
        psychic: 'darkness'
    },
    egoDamage: {
        fire: 'nature',
        nature: 'stone',
        stone: 'sun',
        sun: 'water',
        water: 'fire'
    }
}


class SimHelpers {
    static calculateDominationBonuses(playerElements, opponentElements) {
        const bonuses = {
            player: {
                ego: 0,
                attack: 0,
                chance: 0
            },
            opponent: {
                ego: 0,
                attack: 0,
                chance: 0
            }
        };

        [
            {a: playerElements, b: opponentElements, k: 'player'},
            {a: opponentElements, b: playerElements, k: 'opponent'}
        ].forEach(({a,b,k})=>{
            a.forEach(element => {
                if (ELEMENTS.egoDamage[element] && b.includes(ELEMENTS.egoDamage[element])) {
                    bonuses[k].ego += 0.1
                    bonuses[k].attack += 0.1
                }
                if (ELEMENTS.chance[element] && b.includes(ELEMENTS.chance[element])) {
                    bonuses[k].chance += 0.2
                }
            })
        })

        return bonuses
    }

    static countElementsInTeam(elements) {
        return elements.reduce((a,b)=>{a[b]++;return a}, {
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

    static findBonusFromSynergies(synergies, element, teamGirlSynergyBonusesMissing, counts) {
        const {bonus_multiplier, team_bonus_per_girl} = synergies.find(({element: {type}})=>type===element)

        return bonus_multiplier + (teamGirlSynergyBonusesMissing ? counts[element]*team_bonus_per_girl : 0)
    }

    static async calculateSynergiesFromTeamMemberElements(elements, ignorePassives) {
        const counts = SimHelpers.countElementsInTeam(elements)

        // Only care about those not included in the stats already: fire, stone and water
        // Assume max harem synergy
        const girlDictionary = await Helpers.getGirlDictionary()
        const girlCount = girlDictionary.size || 800
        const girlsPerElement = Math.min(girlCount / 8, 100)

        return {
            critDamage: (ignorePassives ? 0 : (0.0035 * girlsPerElement)) + (0.1  * counts.fire),
            critChance: (ignorePassives ? 0 : (0.0007 * girlsPerElement)) + (0.02 * counts.stone),
            healOnHit:  (ignorePassives ? 0 : (0.001  * girlsPerElement)) + (0.03 * counts.water)
        }
    }

    static calculateThemeFromElements(elements) {
        const counts = SimHelpers.countElementsInTeam(elements)

        const theme = []
        Object.entries(counts).forEach(([element, count]) => {
            if (count >= 3) {
                theme.push(element)
            }
        })
        return theme
    }

    static calculateCritChanceShare(ownHarmony, otherHarmony) {
        return 0.3*ownHarmony/(ownHarmony+otherHarmony)
    }

    static getSkillPercentage(team, id) {
        return 1 + (team.girls.map(e => e.skills[id]?.skill.percentage_value ?? 0).reduce((a, b) => a+b, 0) / 100);
    }
}

export default SimHelpers
window.HHPlusPlus.SimHelpers = SimHelpers
