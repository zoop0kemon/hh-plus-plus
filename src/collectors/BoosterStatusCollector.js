import { lsKeys } from '../common/Constants'
import Helpers from '../common/Helpers'

const DEFAULT_BOOSTERS = {normal: [], mythic:[]}

const getClubXPBonus = () => {
    const clubStatus = Helpers.lsGet(lsKeys.CLUB_STATUS)

    if (clubStatus) {
        return clubStatus.upgrades.experience_gain.bonus
    } else if (Helpers.isInClub()) {
        return 0.1
    } else {
        return 0
    }
}

class BoosterStatusCollector {

    static collect () {

        Helpers.defer(() => {
            if (Helpers.isCurrentPage('shop')) {
                BoosterStatusCollector.collectFromMarket()
            }

            BoosterStatusCollector.collectFromAjaxResponses()
            BoosterStatusCollector.collectFromHeroUpdate()
        })
    }

    static collectFromAjaxResponses () {
        Helpers.onAjaxResponse(/(action|class)/, (response, opt) => {
            const boosterStatus = Helpers.lsGet(lsKeys.BOOSTER_STATUS) || DEFAULT_BOOSTERS

            const searchParams = new URLSearchParams(opt.data)
            const mappedParams = ['action', 'class', 'type', 'id_item', 'number_of_battles', 'battles_amount'].map(key => ({[key]: searchParams.get(key)})).reduce((a,b)=>Object.assign(a,b),{})
            const {action, class: className, type, id_item, number_of_battles, battles_amount} = mappedParams
            const {success, equipped_booster} = response

            if (!success) {
                return
            }

            if (action === 'market_equip_booster' && type === 'booster') {
                const {item: {rarity}} = equipped_booster
                const isMythic = rarity === 'mythic'

                const boosterData = equipped_booster

                if (boosterData) {
                    const clonedData = {...boosterData}

                    if (isMythic) {
                        boosterStatus.mythic.push(clonedData)
                    } else {
                        boosterStatus.normal.push({...clonedData, endAt: clonedData.lifetime})
                    }

                    Helpers.lsSet(lsKeys.BOOSTER_STATUS, boosterStatus)
                    $(document).trigger('boosters:equipped', {id_item, isMythic, new_id: clonedData.id_member_booster_equipped})
                }
                return
            }

            let mythicUpdated = false

            let sandalwood, allMastery, headband, watch, cinnamon, perfume, leaguesMastery, seasonsMastery
            boosterStatus.mythic.forEach(booster => {
                switch (booster.item.identifier){
                case 'MB1':
                    sandalwood = booster
                    break
                case 'MB2':
                    allMastery = booster
                    break
                case 'MB3':
                    headband = booster
                    break
                case 'MB4':
                    watch = booster
                    break
                case 'MB5':
                    cinnamon = booster
                    break
                case 'MB7':
                    perfume = booster
                    break
                case 'MB8':
                    leaguesMastery = booster
                    break
                case 'MB9':
                    seasonsMastery = booster
                    break
                }
            })

            if (sandalwood && action === 'do_battles_trolls') {
                const isMultibattle = parseInt(number_of_battles) > 1
                const {rewards} = response
                if (rewards && rewards.data && rewards.data.shards) {
                    let drops = 0
                    rewards.data.shards.forEach(({previous_value, value}) => {
                        if (isMultibattle) {
                            // Can't reliably determine how many drops, assume MD where each drop would be 1 shard.
                            const shardsDropped = value - previous_value
                            drops += Math.floor(shardsDropped/2)
                        } else {
                            drops++
                        }
                    })
                    sandalwood.usages_remaining -= drops
                    mythicUpdated = true
                }
            }

            if (allMastery && (action === 'do_battles_leagues' || action === 'do_battles_seasons')) {
                allMastery.usages_remaining -= parseInt(number_of_battles)
                mythicUpdated = true
            }

            if (headband && (action === 'do_battles_pantheon' || action === 'do_battles_trolls')) {
                headband.usages_remaining -= parseInt(number_of_battles)
                mythicUpdated = true
            }

            if (watch && className === 'TeamBattle') {
                watch.usages_remaining -= parseInt(battles_amount)
                mythicUpdated = true
            }

            if (cinnamon && action === 'do_battles_seasons') {
                cinnamon.usages_remaining -= parseInt(number_of_battles)
                mythicUpdated = true
            }

            if (perfume && action === 'start' && className === 'TempPlaceOfPower') {
                perfume.usages_remaining--
                mythicUpdated = true
            }

            if (leaguesMastery && action == 'do_battles_leagues') {
                leaguesMastery.usages_remaining -= parseInt(number_of_battles)
                mythicUpdated = true
            }

            if (seasonsMastery && action == 'do_battles_seasons') {
                seasonsMastery.usages_remaining -= parseInt(number_of_battles)
                mythicUpdated = true
            }

            boosterStatus.mythic = boosterStatus.mythic.filter(({usages_remaining}) => usages_remaining > 0)

            Helpers.lsSet(lsKeys.BOOSTER_STATUS, boosterStatus)

            if (mythicUpdated) {
                $(document).trigger('boosters:updated-mythic')
            }
        })
    }

    static collectFromHeroUpdate() {
        const originalHeroUpdate = window.Hero.update.bind(window.Hero)
        const hookedUpdate = (field, value, add) => {
            if (field === 'xp') {
                const boosterStatus = Helpers.lsGet(lsKeys.BOOSTER_STATUS) || DEFAULT_BOOSTERS

                const travelMemories = boosterStatus.mythic.find(({item: {identifier}}) => identifier==='MB6')

                if (travelMemories) {
                    const {cur: oldValue, level} = window.Hero.infos.Xp

                    let atmBonus = 0.05
                    if (level < 300) {
                        atmBonus = 0.2
                    }
                    const clubBonus = getClubXPBonus()

                    const diff = value - oldValue
                    const extra = Math.ceil(Math.floor(diff/(1+clubBonus+atmBonus))*atmBonus)

                    travelMemories.usages_remaining -= extra

                    boosterStatus.mythic = boosterStatus.mythic.filter(({usages_remaining}) => usages_remaining > 0)
                    Helpers.lsSet(lsKeys.BOOSTER_STATUS, boosterStatus)
                    $(document).trigger('boosters:updated-mythic')
                }
            }

            return originalHeroUpdate(field, value, add)
        }
        window.Hero.update = hookedUpdate
    }

    static collectFromMarket () {
        const {equipped_booster, server_now_ts} = window
        const boosterStatus = {
            normal: equipped_booster.normal.map((data) => ({...data, endAt: server_now_ts + data.expiration})),
            mythic: equipped_booster.mythic,
        }

        Helpers.lsSet(lsKeys.BOOSTER_STATUS, boosterStatus)
    }

}

export default BoosterStatusCollector
