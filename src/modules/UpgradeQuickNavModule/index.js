import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import filterIcon from '../../assets/filter.svg'
import { ELEMENTS } from '../../data/Elements'
import { RARITIES } from '../../data/Rarities'

import styles from './styles.lazy.scss'
import Sheet from '../../common/Sheet'
import Snippets from '../../common/Snippets'
import { lsKeys } from '../../common/Constants'

const MODULE_KEY = 'upgradeQuickNav'

const RESOURCE_TYPES = ['experience', 'affection', 'equipment', 'skills', 'teams']
const SORT_LABELS = ['haremdex_date_recruited', 'Level', 'caracs_sum', 'Grade', 'Name']
const ZODIAC_SIGNS = {
    'aries': '♈︎',
    'taurus': '♉︎',
    'gemini': '♊︎',
    'cancer': '♋︎',
    'leo': '♌︎',
    'virgo': '♍︎',
    'libra': '♎︎',
    'scorpio': '♏︎',
    'sagittarius': '♐︎',
    'capricorn': '♑︎',
    'aquarius': '♒︎',
    'pisces': '♓︎'
}

class UpgradeQuickNavModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return Helpers.isCurrentPage('/girl/')
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(async () => {
            this.injectCSSVars()

            this.filters = Helpers.lsGet('filters') || {}
            this.sort_by = Helpers.lsGetRaw('sort_by') || 'date_recruited'
            this.sort_by_direction = Helpers.lsGetRaw('sort_by_direction') || 'asc'
            this.girlDictionary = await Helpers.getGirlDictionary()

            let filteredGirlIds = Helpers.lsGet(lsKeys.HAREM_FILTER_IDS)
            if (!filteredGirlIds.length) {
                filteredGirlIds = this.getFilteredGirlList()
            }

            $('#skills .girl-skills-avatar').wrap('<div class="script-girl-avatar"></div>')
            // Move equipment buttons out of the way
            const $unequip = $('.equipment-left-controls #girl-equipment-unequip')
            const $levelup = $('.equipment-left-controls #girl-equipment-level-up')
            $('#equipment .inventory-controls').prepend($levelup).prepend($unequip)

            this.addQuickNavGirls(filteredGirlIds)
            this.addHaremFilter()
        })

        this.hasRun = true
    }

    injectCSSVars () {
        Sheet.registerVar('filter-icon', `url('${filterIcon}')`)
    }

    addQuickNavGirls (filteredGirlIds) {
        $('.script-quicknav-prev, .script-quicknav-next').remove()
        const {girl: {id_girl}} = window
        if (!filteredGirlIds.length || (filteredGirlIds.length === 1 && filteredGirlIds[0] === id_girl)) {return}
        const {replaceImageSources} = window.shared ? window.shared.webp_utilities : window

        const currentIndex = filteredGirlIds.indexOf(id_girl)
        const previousGirlId = filteredGirlIds.at(currentIndex > -1 ? (currentIndex-1) % filteredGirlIds.length : -1)
        const nextGirlId = filteredGirlIds.at(currentIndex > -1 ? (currentIndex+1) % filteredGirlIds.length : 0)

        const previousGirl = this.girlDictionary.get(`${previousGirlId}`)
        const nextGirl = this.girlDictionary.get(`${nextGirlId}`)

        const buildAvatarHtml = (id, {pose}, className, resource) => {
            const imgType = resource == 'equipment' ? 'ico' : 'ava'
            const girlImage = `<img girl-${imgType}-src="${Helpers.getCDNHost()}/pictures/girls/${id}/${imgType}${pose}.png"/>`
            return $(`<a class="script-quicknav-${className}" resource="${resource}" href="${Helpers.getHref(`/girl/${id}?resource=${resource}`)}">${girlImage}</a>`)
        }
        RESOURCE_TYPES.forEach((resource) => {
            const $prev = buildAvatarHtml(previousGirlId, previousGirl, 'prev', resource)
            const $next = buildAvatarHtml(nextGirlId, nextGirl, 'next', resource)

            switch (resource) {
            case 'skills':
                $(`#${resource} .girl-skills-avatar`).before($prev).after($next)
                break
            case 'teams':
                $(`#${resource}`).append($prev).append($next)
                break
            default:
                $(`#${resource} .girl-avatar`).prepend($prev).append($next)
            }
        })

        replaceImageSources()
    }

    getFilteredGirlList () {
        const filters = this.filters
        const {level_range} = filters
        const min_level = parseInt(level_range?.match(/^\d+/)?.[0] || 1)
        const max_level = parseInt(level_range?.match(/-(\d+)/)?.[1] || min_level)

        const girls = []
        this.girlDictionary.forEach((girl, girl_id) => {
            const {shards} = girl
            if (shards === 100) {
                const {name, element, class: carac, rarity, grade, role, equips, figure, zodiac, eye_colors, hair_colors, skill_tiers} = girl
                let {level, level_cap, graded} = girl
                level = level || 1
                level_cap = level_cap || 250
                graded = graded || 0

                let girlMaches = true
                girlMaches &= !filters.name || name.search(new RegExp(filters.name, 'i')) > -1
                girlMaches &= !filters.element?.length || filters.element.includes(element)
                girlMaches &= !filters.class?.length || filters.class.map(carac => parseInt(carac)).includes(carac)
                girlMaches &= !filters.level_range || (level >= min_level && level <= max_level)
                girlMaches &= !filters.level_cap || filters.level_cap === 'all' || (filters.level_cap === 'capped') === (level === level_cap)
                girlMaches &= !filters.rarity || filters.rarity === 'all' || filters.rarity === rarity
                girlMaches &= !filters.affection_cap || filters.affection_cap === 'all' || (filters.affection_cap === 'capped') === (grade === graded)
                girlMaches &= !filters.max_affection_grade || filters.max_affection_grade === 'all' || parseInt(filters.max_affection_grade) === grade
                girlMaches &= !filters.current_affection_grade || filters.current_affection_grade === 'all' || parseInt(filters.current_affection_grade) === graded
                girlMaches &= !filters.role || filters.role === 'all' || parseInt(filters.role) === role
                girlMaches &= !filters.equipment || filters.equipment === 'all' || (filters.equipment === 'equipped') === (!!equips?.length)
                girlMaches &= !filters.pose || filters.pose === 'all' || parseInt(filters.pose) === figure
                girlMaches &= !filters.zodiac || filters.zodiac === 'all' || filters.zodiac === zodiac
                girlMaches &= !filters.eye_color || filters.eye_color === 'all' || eye_colors?.includes(filters.eye_color)
                girlMaches &= !filters.hair_color || filters.hair_color === 'all' || hair_colors?.includes(filters.hair_color)
                girlMaches &= !filters.skill_tier || filters.skill_tier === 'all' || parseInt(filters.skill_tier) === skill_tiers?.reduce((a, tier) => a + (+tier>0), 0)

                if (girlMaches) {
                    const {date_added} = girl
                    girls.push({
                        girl_id: parseInt(girl_id),
                        date_added: date_added || 0,
                        level,
                        power: Helpers.calculateGirlStats(girl),
                        grade: grade || 3,
                        graded,
                        name
                    })
                }
            }
        })
        girls.sort((a, b) => {
            const direction = this.sort_by_direction === 'asc' ? 1 : -1
            let delta
            switch (this.sort_by) {
            case 'date_recruited':
                delta = a.date_added - b.date_added
                break
            case 'level':
                delta = a.level - b.level
                break
            case 'power':
                delta = a.power - b.power
                break
            case 'grade':
                delta = a.graded - b.graded || a.grade - b.grade
                break
            case 'name':
                delta = a.name.localeCompare(b.name)
                break
            default:
                delta = a.date_added - b.date_added
            }
            return direction * delta || (a.girl_id - b.girl_id)
        })

        // to switch back to harem filter list if filters are touched
        Helpers.lsSet(lsKeys.HAREM_FILTER_IDS, [])

        return girls.map(({girl_id}) => girl_id)
    }

    addHaremFilter () {
        const $haremFilter = $('<button id="harem_filter" class="blue_button_L"><span class="filter_mix_icn"></span></button>')
        $('.girl-leveler-header').append($haremFilter).append(this.createFilterBox())

        $('#filter-rarity').selectric({
            optionsItemBuilder: (itemData) => {
                const {element, text} = itemData
                return element.val().length && element.val() !== 'all' ? `<span class="${element.val()}-text">${text}</span>` : text
            }
        })
        $('#filter-pose').selectric({
            optionsItemBuilder: (itemData) => {
                const {element, text} = itemData
                return element.val().length && element.val() !== 'all' ? `<span style="background-image: url(${Helpers.getCDNHost()}/pictures/design/battle_positions/${element.val()}.png)"></span>${text}` : text
            }
        })
        $('#filter-eye_color').selectric({
            optionsItemBuilder: (itemData) => {
                const {element, text} = itemData
                return element.val().length && element.val() !== 'all' ? `<span class="hh_colors c${element.val()}">${text}</span>` : text
            }
        })
        $('#filter-hair_color').selectric({
            optionsItemBuilder: (itemData) => {
                const {element, text} = itemData
                return element.val().length && element.val() !== 'all' ? `<span class="hh_colors c${element.val()}">${text}</span>` : text
            }
        })
        const otherFields = ['sort', 'level_cap', 'max_affection_grade', 'current_affection_grade', 'affection_cap', 'skill_tier', 'role', 'equipment', 'zodiac']
        otherFields.forEach(field => $(`#filter-${field}`).selectric())
        $('#harem_filter_box .selectric-scroll').addClass('hh-scroll')

        this.createFilterEvents()
    }

    createFilterBox () {
        const {GT, GIRL_MAX_LEVEL} = window
        const filters = this.filters
        const {eye_colors, hair_colors} = Helpers.lsGet(lsKeys.HAREM_FILTER_COLORS) || ({eye_colors: Object.keys(GT.colors), hair_colors: Object.keys(GT.colors)})
        const affectionGradeOption = grade => ({label: `${grade} ★`, value: grade})
        let totalHTML = '<div id="harem_filter_box" class="form-wrapper" style="display: none;">'
        totalHTML += `<div class="reset-filters-container"><button id="reset-filters" class="blue_button_L">${GT.design.reset_filters}</button></div>`

        totalHTML += Snippets.textInput({
            id: 'filter-name',
            label: GT.design.haremdex_search,
            placeholder: GT.design.haremdex_girl_name,
            value: filters.name || ''
        })
        totalHTML += Snippets.selectInput({
            id: 'filter-sort',
            label: GT.design.haremdex_sort_by,
            options: ['date_recruited', 'level', 'power', 'grade', 'name'].flatMap((option, index) => 
                ['asc', 'desc'].map(direction => ({label: `${GT.design[SORT_LABELS[index]]} ${direction === 'asc' ? '▲' : '▼'}`, value: `${option}__${direction}`}))
            ),
            className: 'script-filter-sort',
            have_default: false,
            value: `${this.sort_by}__${this.sort_by_direction}`
        })
        totalHTML += Snippets.checkboxInput({
            id: 'filter-element',
            label: GT.design.element,
            options: ELEMENTS.map(option => ({value: option})),
            className: 'filter-by-element-form',
            buttonClass: 'element-state',
            values: filters.element || []
        })
        totalHTML += Snippets.checkboxInput({
            id: 'filter-class',
            label: GT.design.mythic_equipment_class,
            options: [1,2,3].map(option => ({value: `${option}`})),
            className: 'filter-by-class-form',
            buttonClass: 'carac-state',
            values: filters.class || []
        })
        totalHTML += Snippets.selectInput({
            id: 'filter-rarity',
            label: GT.design.selectors_Rarity,
            options: RARITIES.map(option => ({label: GT.design[`girls_rarity_${option}`], value: option})),
            className: 'script-filter-rarity rarity-styling',
            value: filters.rarity || 'all'
        })
        totalHTML += Snippets.textInput({
            id: 'filter-level_range',
            label: GT.design.level_range,
            placeholder: `1 - ${GIRL_MAX_LEVEL}`,
            value: filters.level_range || ''
        })
        totalHTML += Snippets.selectInput({
            id: 'filter-level_cap',
            label: GT.design.level_cap,
            options: ['capped', 'uncapped'].map(option => ({label: GT.design[option], value: option})),
            className: 'script-filter-level-cap',
            value: filters.level_cap || 'all'
        })
        totalHTML += Snippets.selectInput({
            id: 'filter-max_affection_grade',
            label: GT.design.affection_category,
            options: ['1','3','5','6'].map(affectionGradeOption),
            className: 'script-filter-aff-category',
            value: filters.max_affection_grade || 'all'
        })
        totalHTML += Snippets.selectInput({
            id: 'filter-current_affection_grade',
            label: GT.design.affection_grades,
            options: ['0','1','2','3','4','5','6'].map(affectionGradeOption),
            className: 'script-filter-aff-level',
            value: filters.current_affection_grade || 'all'
        })
        totalHTML += Snippets.selectInput({
            id: 'filter-affection_cap',
            label: GT.design.affection_cap,
            options: ['capped', 'uncapped'].map(option => ({label: GT.design[option], value: option})),
            className: 'script-filter-aff-cap',
            value: filters.affection_cap || 'all'
        })
        totalHTML += Snippets.selectInput({
            id: 'filter-skill_tier',
            label: GT.design.girl_skills,
            options: [0,1,2,3,4,5].map(option => ({label: `${GT.design.season_tier} ${option}`, value: `${option}`})),
            className: 'script-filter-skill_tier',
            value: filters.skill_tier || 'all'
        })
        totalHTML += Snippets.selectInput({
            id: 'filter-role',
            label: GT.design.girl_role,
            options: [4,10,9,3].map(option => ({label: GT.design[`girl_role_${option}_name`], value: `${option}`})),
            className: 'script-filter-role',
            value: filters.role || 'all'
        })
        totalHTML += Snippets.selectInput({
            id: 'filter-equipment',
            label: GT.design.shop_armor,
            options: ['equipped', 'unequipped'].map(option => ({label: GT.design[`girl_equipment_${option}`], value: option})),
            className: 'script-filter-equips',
            value: filters.equipment || 'all'
        })
        totalHTML += Snippets.selectInput({
            id: 'filter-pose',
            label: GT.design.filter_pose,
            options: [1,2,3,4,5,6,7,8,9,10,11,12].map(option => ({label: GT.figures[option], value: `${option}`})),
            className: 'script-filter-pose',
            value: filters.pose || 'all'
        })
        totalHTML += Snippets.selectInput({
            id: 'filter-zodiac',
            label: GT.design.haremdex_zodiac_sign,
            options: Object.keys(GT.zodiac).map(option => ({label: `${ZODIAC_SIGNS[option]} ${GT.zodiac[option]}`, value: option})),
            className: 'script-filter-zodiac',
            value: filters.zodiac || 'all'
        })
        totalHTML += Snippets.selectInput({
            id: 'filter-eye_color',
            label: GT.design.haremdex_eye_color,
            options: eye_colors.map(option => ({label: GT.colors[option], value: option})),
            className: 'script-filter-eye-color',
            value: filters.eye_color || 'all'
        })
        totalHTML += Snippets.selectInput({
            id: 'filter-hair_color',
            label: GT.design.haremdex_hair_color,
            options: hair_colors.map(option => ({label: GT.colors[option], value: option})),
            className: 'script-filter-hair-color',
            value: filters.hair_color || 'all'
        })

        totalHTML += '</div>'
        return totalHTML
    }

    createFilterEvents () {
        $('#harem_filter').on('click', () => {
            const currentBoxDisplay = $('#harem_filter_box').css('display')
            $('#harem_filter_box').css('display', currentBoxDisplay === 'none' ? 'grid' : 'none')
        })

        const doFilter = ({target}) => {
            const filter = $(target).attr('id').split('-')[1]
            const value = $(target).val()

            this.filters[filter] = value
            Helpers.lsSet('filters', this.filters)

            this.addQuickNavGirls(this.getFilteredGirlList())
        }
        const doCheckboxFilter = ({currentTarget}) => {
            const $check_btn = $(currentTarget)
            $check_btn.attr('selected', (_, attr) => attr ? null : '')
            const $checkbox = $check_btn.parent('.checkbox-group')
            const filter = $checkbox.attr('id').split('-')[1]
            const value = $checkbox.find('.check-btn[selected]').map((_, element) => $(element).val()).get()

            this.filters[filter] = value
            Helpers.lsSet('filters', this.filters)

            this.addQuickNavGirls(this.getFilteredGirlList())
        }
        const doSort = ({target}) => {
            const value = $(target).val().split('__')

            this.sort_by = value[0]
            this.sort_by_direction = value[1]
            Helpers.lsSetRaw('sort_by', this.sort_by)
            Helpers.lsSetRaw('sort_by_direction', this.sort_by_direction)

            this.addQuickNavGirls(this.getFilteredGirlList())
        }
        const resetFilter = () => {
            this.filters = {}
            this.sort_by = 'date_recruited'
            this.sort_by_direction = 'asc'
            Helpers.lsSet('filters', this.filters)
            Helpers.lsSetRaw('sort_by', this.sort_by)
            Helpers.lsSetRaw('sort_by_direction', this.sort_by_direction)

            $('#filter-name').val('')
            $('#filter-sort').val('date_recruited__asc').selectric('refresh')
            $('#filter-element .check-btn').removeAttr('selected')
            $('#filter-class .check-btn').removeAttr('selected')
            $('#filter-rarity').val('all').selectric('refresh')
            $('#filter-level_range').val('')
            $('#filter-level_cap').val('all').selectric('refresh')
            $('#filter-max_affection_grade').val('all').selectric('refresh')
            $('#filter-current_affection_grade').val('all').selectric('refresh')
            $('#filter-affection_cap').val('all').selectric('refresh')
            $('#filter-skill_tier').val('all').selectric('refresh')
            $('#filter-role').val('all').selectric('refresh')
            $('#filter-equipment').val('all').selectric('refresh')
            $('#filter-pose').val('all').selectric('refresh')
            $('#filter-zodiac').val('all').selectric('refresh')
            $('#filter-eye_color').val('all').selectric('refresh')
            $('#filter-hair_color').val('all').selectric('refresh')

            this.addQuickNavGirls(this.getFilteredGirlList())
        }

        $('#reset-filters').on('click', resetFilter)
        $('#filter-name').get(0).oninput = doFilter
        $('#filter-sort').on('change', doSort)
        $('#filter-element .check-btn').on('click', doCheckboxFilter)
        $('#filter-class .check-btn').on('click', doCheckboxFilter)
        $('#filter-rarity').on('change', doFilter)
        $('#filter-level_range').get(0).oninput = doFilter
        $('#filter-level_cap').on('change', doFilter)
        $('#filter-max_affection_grade').on('change', doFilter)
        $('#filter-current_affection_grade').on('change', doFilter)
        $('#filter-affection_cap').on('change', doFilter)
        $('#filter-skill_tier').on('change', doFilter)
        $('#filter-role').on('change', doFilter)
        $('#filter-equipment').on('change', doFilter)
        $('#filter-pose').on('change', doFilter)
        $('#filter-zodiac').on('change', doFilter)
        $('#filter-eye_color').on('change', doFilter)
        $('#filter-hair_color').on('change', doFilter)
    }
}

export default UpgradeQuickNavModule
