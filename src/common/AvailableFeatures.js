// Pantheon - level 15
// Champs - 10 girls at 3-grade and above and world 3 scroll 5
// Leagues - level 20
// Seasons - world 1 scroll 4
// PoPs - world 3
// Clubs - 15 girls

import Helpers from './Helpers'

const countGirls = () => {
    const girlDictionary = Helpers.getGirlDictionary()
    if (!girlDictionary) {
        return 0
    }

    let totalGirls = 0
    girlDictionary.forEach(girl => {
        const {shards, grade} = girl
        if (shards === 100 && grade > 1) {
            totalGirls++
        }
    })

    return totalGirls
}

class AvailableFeatures {
    get pantheon () {
        return !Helpers.isHoH() && window.Hero.infos.level >= 15
    }

    get leagues () {
        return window.Hero.infos.level >= 20
    }

    get seasons () {
        const {Hero: {infos: {questing: {id_quest, id_world}}}} = window
        return id_world > 1 || id_quest > 4
    }

    get pop () {
        const {Hero: {infos: {questing: {id_world}}}} = window
        return !Helpers.isHoH() && (Helpers.isCxH() || Helpers.isPSH() ? id_world >= 2 : id_world >= 3)
    }

    get champs () {
        if (Helpers.isHoH()) {return false}
        const {Hero: {infos: {questing: {id_quest}}}} = window
        if ((Helpers.isCxH() && id_quest < 3060) || (Helpers.isPSH() && id_quest < 2040) || (!Helpers.isCxH() && id_quest < 320)) {
            return false
        }

        return countGirls() >= 10
    }

    get clubs () {
        if (Helpers.isCxH() || Helpers.isHoH()) {
            return false
        }
        return countGirls() >= 15
    }
}

export default new AvailableFeatures()
