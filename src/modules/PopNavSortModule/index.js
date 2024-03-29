import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

import styles from './styles.lazy.scss'

const MODULE_KEY = 'popSort'

const IDEAL_ORDER = [
    '13', '14', '15',   // orb      / water
    '7', '8', '9',      // koban    / light
    '4', '5', '6',      // ymen     / darkness
    '16', '17', '18',   // booster  / fire
    '22', '23', '24',   // gift     / sun
    '19', '20', '21',   // ticket   / stone
    '10', '11', '12',   // gem      / nature & psychic
]

const sortPopIds = (popIds) => IDEAL_ORDER.filter(id => popIds.includes(id))

class PopNavSortModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true,
            restriction: {blacklist: ['HoH']}
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)

        this.sortedPopIds = []
    }

    shouldRun () {
        return Helpers.isCurrentPage('activities')
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            const {pop_data} = window
            if (pop_data) {
                this.sortPoPs()

                const {location} = window
                const searchParams = new URLSearchParams(location.search)
                const currentPoPId = searchParams.get('index')

                if (currentPoPId) {
                    this.addQuickNav(currentPoPId)
                    this.displayGirlClasses(currentPoPId)

                    new MutationObserver(() => {
                        this.displayGirlClasses(currentPoPId)
                    }).observe($('.pop_right_part .grid_view')[0], {childList: true})
                }
            }
        })

        this.hasRun = true
    }

    sortPoPs () {
        const {pop_data} = window
        const popIds = Object.keys(pop_data)
        const sortedPopIds = sortPopIds(popIds)
        this.sortedPopIds = sortedPopIds

        let $elToAfter = $('.pop_thumb_container:has([pop_id="3"])')

        sortedPopIds.forEach(id => {
            const $nextEl = $(`.pop_thumb_container:has([pop_id="${id}"])`)
            $elToAfter.after($nextEl)
            $elToAfter = $nextEl
        })
    }

    addQuickNav (currentPoPId) {
        if (!currentPoPId) {return}

        const {pop_data} = window
        const availablePerms = Object.values(pop_data).filter(({id_places_of_power, locked}) => id_places_of_power<=3 && !locked)

        const completeSortedIdList = [
            ...availablePerms.map(({id_places_of_power}) => `${id_places_of_power}`),
            ...this.sortedPopIds
        ]

        const currentIndex = completeSortedIdList.indexOf(currentPoPId)
        let prevIndex = currentIndex - 1
        if (prevIndex < 0) {
            prevIndex += completeSortedIdList.length
        }
        let nextIndex = currentIndex + 1
        if (nextIndex >= completeSortedIdList.length) {
            nextIndex -= completeSortedIdList.length
        }
        const spec = [
            {name: 'prev', id: completeSortedIdList[prevIndex]},
            {name: 'next', id: completeSortedIdList[nextIndex]}
        ]

        const $quickNavContainer = $('<div class="pop-quick-nav"></div>')

        spec.forEach(({name, id}) => {
            const href = Helpers.getHref(`/activities.html?tab=pop&index=${id}`)
            $quickNavContainer.append(`<a href="${href}" class="back_button"><span class="pop-quick-nav-${name} townForward_flat_icn"></span></a>`)
        })

        $('.pop_right_part').append($quickNavContainer)
    }

    displayGirlClasses (currentPoPId) {
        if (!currentPoPId) {return}

        const {pop_data, pop_hero_girls} = window
        const currentPoP = pop_data[currentPoPId]
        const {status, girls} = currentPoP
        let girlsToAnnotate = girls
        if (status !== 'can_start') {
            girlsToAnnotate = girls.filter(({assigned}) => `${assigned}` === currentPoPId)
        }

        const $girlsContainer = $('.pop_right_part .grid_view')

        girlsToAnnotate.forEach(({id_girl}) => {
            const {class: carac} = pop_hero_girls[id_girl]

            const $girl = $girlsContainer.find(`[girl=${id_girl}]`)
            $girl.append(`<span class="script-girl-class" carac="${carac}"></span>`)
        })
    }
}

export default PopNavSortModule
