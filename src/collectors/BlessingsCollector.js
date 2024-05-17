import { lsKeys } from '../common/Constants'
import Helpers from '../common/Helpers'
import { ELEMENTS } from '../data/Elements'
import { RARITIES } from '../data/Rarities'

const WEEK_OF_THE = ['Week of the', 'Woche der/des', 'Semaine du', 'Settimana del', 'Week van de']
const CATEGORY_KEYS = {
    'eye_colors': 'haremdex_eye_color',
    'hair_colors': 'haremdex_hair_color',
    'zodiac': 'haremdex_zodiac_sign',
    'rarity': 'selectors_Rarity',
    'element': 'element'
}
const GIRL_FAV_POS = ['Favorite position', 'Lieblingsstellung', 'Posición favorita', 'Position préférée', 'Posizione preferita', 'お気に入りの体位', 'Favoriete positie', 'Любимая поза', 'Favorite competence']

const collectWeekInfo = (week, time) => {
    if (!week?.length) {return {}}
    const {GT} = window
    const blessings = []
    const ends_at = Math.round((time + week[0].remaining_time) / 60) * 60

    week.forEach(({description, title}) => {
        const $description = $(`<p>${description}</p>`)

        const week_of_raw = WEEK_OF_THE.find(translation => title.match(new RegExp(`^${translation} `, 'i')))
        const attribute_raw = title.match(new RegExp(`^${week_of_raw} (.*)`, 'i'))?.at(1)
        const category_raw = $description.find('.blessing-condition').text().match(new RegExp(`^(.*) ${attribute_raw}`, 'i'))?.at(1)

        let key = Object.entries(CATEGORY_KEYS).find(category => GT.design[category[1]] === category_raw)?.at(0)
        if (!key && GIRL_FAV_POS.some(transltion => transltion === category_raw)) {
            key = 'figure'
        }
        let value
        switch (key) {
        case 'eye_colors':
        case 'hair_colors':
            value = Object.entries(GT.colors).find(color => color[1] === attribute_raw)?.at(0)
            break
        case 'zodiac':
            value = Object.entries(GT.zodiac).find(zodiac => zodiac[1] === attribute_raw)?.at(0)
            break
        case 'figure':
            const fig_index = GT.figures.indexOf(attribute_raw)
            if (fig_index > -1) {
                value = fig_index
            }
            break
        case 'rarity':
            value = RARITIES.find(rarity => GT.design[`girls_rarity_${rarity}`] === attribute_raw)
            break
        case 'element':
            value = ELEMENTS.find(element => GT.design[`${element}_flavor_element`] === attribute_raw)
            break
        }
        const bonus = parseInt($description.find('.blessing-bonus').text().match(/\d+/)?.at(0))

        if (key && value && bonus) {
            blessings.push({
                key,
                value,
                bonus
            })
        }
    })

    return {
        blessings,
        ends_at
    }
}

class BlessingsCollector {
    static collect() {
        const start = performance.now()

        Helpers.defer(() => {
            const blessings = Helpers.lsGet(lsKeys.BLESSINGS) || {}
            const {server_now_ts} = window
            // handle rollover
            if (server_now_ts > blessings?.next?.ends_at) {
                blessings.current = blessings.next
                blessings.next = {}

                Helpers.lsSet(lsKeys.BLESSINGS, blessings)
            }
            if (server_now_ts > blessings?.current?.ends_at) {
                blessings.current = {}

                Helpers.lsSet(lsKeys.BLESSINGS, blessings)
            }

            Helpers.onAjaxResponse(/action=get_girls_blessings/i, (response) => {
                const delay = server_now_ts + Math.round((performance.now() - start)/1000)
                const {active, upcoming} = response
                blessings.current = collectWeekInfo(active, delay)
                blessings.next = collectWeekInfo(upcoming, delay)

                Helpers.lsSet(lsKeys.BLESSINGS, blessings)
            })
        })
    }
}

export default BlessingsCollector
