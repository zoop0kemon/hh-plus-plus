/* global girlsDataList, event_girls, club_champions_data */
import Helpers from '../common/Helpers'

let girlDictionary
let updated

const upsert = (id, data) => {
    const existingEntry = girlDictionary.get(id)
    const upsert = Object.assign({}, existingEntry, data)
    girlDictionary.set(id, upsert)
}

const collectFromRewards = (rewards) => {
    if (rewards && rewards.data && !rewards.data.draft && rewards.data.shards) {
        girlDictionary = Helpers.getGirlDictionary()
        rewards.data.shards.forEach(({ id_girl, value }) => {
            const girlId = `${id_girl}`
            upsert(girlId, { shards: Math.min(value, 100) })
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
            updated = false
            girlDictionary = Helpers.getGirlDictionary()
            if (Helpers.isCurrentPage('harem')) {
                GirlDictionaryCollector.collectFromHarem()
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
            if (Helpers.isCurrentPage('tower-of-fame')) {
                GirlDictionaryCollector.collectFromLeague()
            }
            if (updated) {
                Helpers.setGirlDictionary(girlDictionary)
            }
        })
    }

    static collectFromHarem() {
        if (!$('#harem_whole').length) { return }
        Object.entries(girlsDataList).forEach(([girlId, girl]) => {
            const { name, shards: girlShards, class: carac, rarity, nb_grades, fav_graded, graded } = girl
            const shards = (girlShards !== undefined) ? girlShards : 100
            const girlClass = parseInt(carac, 10)
            const grade = parseInt(nb_grades, 10)
            let pose = parseInt(fav_graded, 10)
            if (pose < 0) {
                pose = graded
            }
            const girlData = {
                name,
                shards,
                class: girlClass,
                rarity,
                grade,
                pose,
                graded,
            }
            if (name) {
                upsert(girlId, girlData)
                updated = true
            }
        })
    }

    static collectFromEventWidget() {
        event_girls.forEach(({ id_girl: id, name, shards, class: girlClass, rarity }) => {
            if (shards === undefined) {
                shards = 100
            }
            if (name) {
                upsert(`${id}`, { name, shards, class: parseInt(girlClass, 10), rarity })
                updated = true
            }
        })
    }

    static collectFromClubChamp() {
        if (!window.club_champions_data) {
            return
        }

        const { shards: rewardShards } = club_champions_data.reward

        if (!rewardShards || !rewardShards.length) {
            return
        }

        const { id_girl, name, previous_value: shards, girl_class, rarity } = rewardShards[0]

        upsert(`${id_girl}`, { name, shards, class: parseInt(girl_class, 10), rarity })
        updated = true
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
