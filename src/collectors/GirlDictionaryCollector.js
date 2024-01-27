import Helpers from '../common/Helpers'

let girlDictionary

const upsert = (id, data) => {
    const existingEntry = girlDictionary.get(`${id}`)
    const upsert = Object.assign({}, existingEntry, data)
    girlDictionary.set(`${id}`, upsert)
}

const collectFromGirlList = (girl_list, all_owned=false) => {
    girlDictionary = Helpers.getGirlDictionary()
    let updated = false

    Object.values(girl_list).forEach((girl) => {
        const { id_girl, name, shards, class: girl_class, rarity, nb_grades, graded2, fav_graded, graded, own, is_owned } = girl
        const has_girl = own !== undefined ? own : (is_owned !== undefined ? is_owned : all_owned)

        const girl_data = {
            name,
            shards: has_girl ? 100 : shards || 0,
            class: parseInt(girl_class, 10),
            rarity,
            grade: nb_grades ? parseInt(nb_grades, 10) : (graded2 ? $(graded2).length : undefined),
            pose: !has_girl ? undefined : ((fav_graded == null || parseInt(fav_graded, 10) < 0) ? graded : parseInt(fav_graded, 10)),
            graded: !has_girl ? undefined : graded,
        }

        Object.keys(girl_data).forEach((key) => {
            if (girl_data[key] == null || girl_data[key] !== girl_data[key]) {
                delete girl_data[key]
            }
        })

        if (name) {
            upsert(id_girl, girl_data)
            updated = true
        }
    })

    if (updated) {
        Helpers.setGirlDictionary(girlDictionary)
    }
}
const collectFromRewards = (rewards) => {
    if (rewards && rewards.data && !rewards.data.draft && rewards.data.shards) {
        girlDictionary = Helpers.getGirlDictionary()
        rewards.data.shards.forEach(({ id_girl, value }) => {
            upsert(id_girl, { shards: Math.min(value, 100) })
        })
        Helpers.setGirlDictionary(girlDictionary)
    }
}

const collectFromAjaxResponseSingular = (response) => {
    const { rewards } = response
    collectFromRewards(rewards)
}
const collectFromAjaxResponsePlural = (response) => {
    const { rewards: rewardsSets } = response
    if (rewardsSets) {
        rewardsSets.forEach(collectFromRewards)
    }
}
const collectFromAjaxResponseLeagues = (response) => {
    const { rewards } = response
    if (!rewards) { return }
    const { list } = rewards
    if (list) {
        list.forEach(collectFromRewards)
    }
}

class GirlDictionaryCollector {
    static collect() {
        Helpers.defer(() => {
            if (Helpers.isCurrentPage('harem') && !Helpers.isCurrentPage('hero')) {
                GirlDictionaryCollector.collectFromHarem()
            }
            if (Helpers.isCurrentPage('/girl/')) {
                GirlDictionaryCollector.collectFromUpgrade()
            }
            if (Helpers.isCurrentPage('event')) {
                GirlDictionaryCollector.collectFromEventWidget()
            }
            if (Helpers.isCurrentPage('clubs')) {
                GirlDictionaryCollector.collectFromClubChamp()
            }
            if (Helpers.isCurrentPage('battle')) {
                GirlDictionaryCollector.collectFromBattleResult()
            }
            if (Helpers.isCurrentPage('pachinko')) {
                GirlDictionaryCollector.collectFromPachinkoRewards()
            }
            if (Helpers.isCurrentPage('activities')) {
                GirlDictionaryCollector.collectFromPoP()
                GirlDictionaryCollector.collectFromContestRewards()
            }
            if (Helpers.isCurrentPage('champion')) {
                GirlDictionaryCollector.collectFromChampions()
            }
            if (Helpers.isCurrentPage('home')) {
                GirlDictionaryCollector.collectFromRewardsQueue()
            }
            if (Helpers.isCurrentPage('season')) {
                GirlDictionaryCollector.collectFromSeasons()
            }
            if (Helpers.isCurrentPage('leagues.html')) {
                GirlDictionaryCollector.collectFromLeague()
            }
        })
    }

    static collectFromHarem() {
        Helpers.onAjaxResponse(/action=girls_get_list/i, ({girls_list}) => {
            collectFromGirlList(girls_list)
        })
    }

    static collectFromUpgrade() {
        const {girl} = window
        collectFromGirlList([girl])
    }

    static collectFromPoP() {
        const {pop_hero_girls} = window
        if (!pop_hero_girls) { return }

        collectFromGirlList(pop_hero_girls, true)
    }

    static collectFromEventWidget() {
        const {event_girls} = window
        collectFromGirlList(event_girls)
    }

    static collectFromClubChamp() {
        const {club_champion_data} = window
        if (!club_champion_data) { return }
        const { shards: rewardShards } = club_champion_data.reward
        if (!rewardShards || !rewardShards.length) { return }

        const {girl_class, previous_value} = rewardShards[0]
        const girl_data = Object.assign({class: girl_class, shards: previous_value}, rewardShards[0])

        collectFromGirlList([girl_data])
    }

    static collectFromBattleResult() {
        Helpers.onAjaxResponse(/action=do_battles_(leagues|seasons|troll)/i, collectFromAjaxResponseSingular)
    }

    static collectFromPachinkoRewards() {
        Helpers.onAjaxResponse(/action=play/i, collectFromAjaxResponseSingular)
        Helpers.onAjaxResponse(/action=claim/i, collectFromAjaxResponseSingular)
    }

    static collectFromContestRewards() {
        Helpers.onAjaxResponse(/action=give_reward/i, collectFromAjaxResponseSingular)
    }

    static collectFromChampions() {
        Helpers.onAjaxResponse(/class=TeamBattle/i, (response) => {
            const { end } = response
            if (end) {
                collectFromAjaxResponseSingular(end)
            }
        })
    }

    static collectFromRewardsQueue() {
        Helpers.onAjaxResponse(/action=process_rewards_queue/i, collectFromAjaxResponsePlural)
    }

    static collectFromSeasons() {
        Helpers.onAjaxResponse(/action=claim/i, collectFromAjaxResponseSingular)
    }

    static collectFromLeague() {
        Helpers.onAjaxResponse(/action=claim_rewards/i, collectFromAjaxResponseLeagues)
    }
}

export default GirlDictionaryCollector
