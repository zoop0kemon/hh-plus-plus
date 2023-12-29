// Pantheon - level 15
// Champs - 10 girls at 3-grade and above and world 3 scroll 5
// Leagues - level 20
// Seasons - world 1 scroll 4
// PoPs - world 4
// Clubs - 15 girls
// Labyrinth - 14 girls (all grades)

import Helpers from './Helpers'

const countGirls = (allGrades=false) => {
    const girlDictionary = Helpers.getGirlDictionary()
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
        if (Helpers.isHoH() || Helpers.isTPSH() || Helpers.isGPSH()) {
            return false
        }
        return window.Hero.infos.level >= 15
    }

    get leagues () {
        return window.Hero.infos.level >= 20
    }

    get seasons () {
        const {Hero: {infos: {questing: {id_quest, id_world}}}} = window
        return id_world > 1 || id_quest > ((Helpers.isCxH() || Helpers.isTPSH() ||  Helpers.isGPSH()) ? 1030 : (Helpers.isPSH() ? 1060 : 4))
    }

    get pop () {
        const {Hero: {infos: {questing: {id_world}}}} = window
        return !Helpers.isHoH() && ((Helpers.isHH() || Helpers.isGH()) ? id_world >= 4 : id_world >= 3)
    }

    get champs () {
        if (Helpers.isHoH()) {return false}
        const {Hero: {infos: {questing: {id_quest}}}} = window
        if (id_quest < (Helpers.isCxH() ? 3060 : ((Helpers.isPSH() || Helpers.isTPSH()) ? 2040 : (Helpers.isGPSH() ? 2010 : 320)))) {
            return false
        }

        return countGirls() >= 10
    }

    get clubs () {
        if (Helpers.isHoH() || Helpers.isTPSH() || Helpers.isGPSH()) {
            return false
        }
        return countGirls() >= 15
    }

    get labyrinth () {
        if (Helpers.isHoH() || Helpers.isTPSH() || Helpers.isGPSH()) {
            return false
        }
        return countGirls(true) >= 14
    }
}

export default new AvailableFeatures()
