// Pantheon - level 15
// Champs - 10 girls at 3-grade
// Leagues - level 20
// Seasons - world 1 scroll 4
// PoPs - world 4
// Clubs - 15 girls
// Labyrinth - 7 girls (all grades)

import Helpers from './Helpers'

const countGirls = async (allGrades=false) => {
    const girlDictionary = await Helpers.getGirlDictionary()
    if (!girlDictionary) {
        return 0
    }

    let totalGirls = 0
    girlDictionary.forEach(girl => {
        const {shards, grade} = girl
        if (shards === 100 && (grade > 1 || allGrades)) {
            totalGirls++
        }
    })

    return totalGirls
}

class AvailableFeatures {
    get pantheon () {
        if (Helpers.isHoH() || Helpers.isTPSH() || Helpers.isGPSH()) {return false}
        const {Hero: {infos: {level}}} = window.shared ? window.shared : window
        return level >= 15
    }

    get leagues () {
        const {Hero: {infos: {level}}} = window.shared ? window.shared : window
        return level >= 20
    }

    get seasons () {
        const {Hero: {infos: {questing: {id_quest, id_world}}}} = window.shared ? window.shared : window
        return id_world > 1 || id_quest > ((Helpers.isCxH() || Helpers.isTPSH() ||  Helpers.isGPSH()) ? 1030 : (Helpers.isPSH() ? 1060 : 4))
    }

    get pop () {
        const {Hero: {infos: {questing: {id_world}}}} = window.shared ? window.shared : window
        return !Helpers.isHoH() && ((Helpers.isHH() || Helpers.isGH()) ? id_world >= 4 : id_world >= 3)
    }

    async champs () {
        if (Helpers.isHoH()) {return false}
        return await countGirls() >= 10
    }

    async clubs () {
        if (Helpers.isHoH()) {return false}
        return await countGirls() >= 15
    }

    async labyrinth () {
        if (Helpers.isHoH()) {return false}
        return await countGirls(true) >= 7
    }
}

export default new AvailableFeatures()
