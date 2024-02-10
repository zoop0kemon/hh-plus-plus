/* global GT */
import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import filterIcon from '../../assets/filter.svg'
import { ELEMENTS } from '../../data/Elements'
import { RARITIES } from '../../data/Rarities'
import { RELIC_BONUSES } from '../../data/Relics'

import styles from './styles.lazy.scss'
import Sheet from '../../common/Sheet'
import Snippets from '../../common/Snippets'
import { lsKeys } from '../../common/Constants'

const MODULE_KEY = 'teamsFilter'
const CLASS_NAMES = {
    1: 'hardcore',
    2: 'charm',
    3: 'knowhow'
}

class TeamsFilterModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
        this.all = I18n.getModuleLabel('common', 'all')
    }

    shouldRun () {
        return ['edit-team', 'add-boss-bang-team', 'edit-labyrinth-team', 'labyrinth-pool-select', 'labyrinth.html'].some(page => Helpers.isCurrentPage(page))
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            this.injectCSSVars()

            this.isLabyrinth = Helpers.isCurrentPage('labyrinth')
            if (this.isLabyrinth) {
                const RELIC_KEYS = Object.keys(RELIC_BONUSES)
                this.relics = Helpers.lsGet(lsKeys.LABYRINTH_RELICS)?.filter(({identifier}) => RELIC_KEYS.includes(identifier)).map(relic => Object.assign(relic, RELIC_BONUSES[relic.identifier])) || []
            }
            this.isLabyrinthMain = Helpers.isCurrentPage('labyrinth.html')
            const selector = Helpers.isCurrentPage('team') ? 'h3.panel-title' : (this.isLabyrinthMain ? '.squad-container' : '#filter_girls')
            Helpers.doWhenSelectorAvailable(selector, () => {
                $(selector).before('<button id="arena_filter" class="blue_button_L"><span class="filter_mix_icn"></span></button>')
                if (!this.isLabyrinthMain) {
                    $(selector).after(this.createFilterBox())
                } else {
                    $(selector).before(this.createFilterBox())
                }

                $('#filter_element').selectric({
                    optionsItemBuilder: (itemData) => {
                        const {element, text} = itemData
                        return element.val().length && element.val() !== 'all' ? `<span class="element-icon ${element.val()}_element_icn"></span>${text}` : text
                    },
                    maxHeight: 320
                })
                $('#filter_class').selectric({
                    optionsItemBuilder: (itemData) => {
                        const {element, text} = itemData
                        return element.val().length && element.val() !== 'all' ? `<span carac="${element.val()}"></span>${text}` : text
                    }
                })
                $('#filter_rarity').selectric({
                    optionsItemBuilder: (itemData) => {
                        const {element, text} = itemData
                        return element.val().length && element.val() !== 'all' ? `<span class="${element.val()}-text">${text}</span>` : text
                    }
                })
                if (this.isLabyrinth) {
                    $('#filter_sort').selectric({
                        optionsItemBuilder: (itemData) => {
                            const {element, text} = itemData
                            return `<span ${element.val().length && element.val() !== 'all' ? `carac="${element.val()}"` : 'class="girl-power-icon"'}></span>${text} &#9660`
                        }
                    })
                }
                const otherFields = ['aff_category', 'aff_lvl', 'blessed_attributes', 'level_cap']
                otherFields.forEach(field => $(`#filter_${field}`).selectric())
    
                this.updateFilterGirlData()
                this.createFilterEvents()
                if (this.isLabyrinthMain) {
                    const observer = new MutationObserver(() => {
                        this.updateFilterGirlData()
                        this.filterGirls()
                    })
                    observer.observe($(selector)[0], {childList: true})
                }
            })
        })

        this.hasRun = true
    }

    injectCSSVars() {
        Sheet.registerVar('filter-icon', `url('${filterIcon}')`)
    }

    updateFilterGirlData() {
        this.arenaGirls = Helpers.isCurrentPage('team') ?  $('.harem-panel div.harem-girl-container') : ($(`${this.isLabyrinthMain ? '.squad-container' : '.girl-grid'} .girl-container`))

        this.girlsData = $.map(this.arenaGirls, function(girl) {
            return JSON.parse($(girl).find('.girl_img, .girl-image').attr('data-new-girl-tooltip'))
        })
    }

    createFilterEvents() {
        $('#arena_filter').on('click', () => {
            if (typeof this.arenaGirls === 'undefined' || typeof this.girlsData === 'undefined') return
            let currentBoxDisplay = $('#arena_filter_box').css('display')
            $('#arena_filter_box').css('display', currentBoxDisplay === 'none' ? 'grid' : 'none')
        })

        const doFilter = () => {
            this.filterGirls()
        }
        $('#filter_class').on('change', doFilter)
        $('#filter_element').on('change', doFilter)
        $('#filter_rarity').on('change', doFilter)
        $('#filter_name').get(0).oninput = doFilter
        $('#filter_blessed_attributes').on('change', doFilter)
        $('#filter_aff_category').on('change', doFilter)
        $('#filter_aff_lvl').on('change', doFilter)
        $('#filter_level_cap').on('change', doFilter)

        if (this.isLabyrinth) {
            const doSort = () => {
                this.sortGirls()
            }
            $('#filter_sort').on('change', doSort)
        }
    }

    filterGirls() {
        let filterClass = $('#filter_class').get(0).value
        let filterElement = $('#filter_element').get(0).value
        let filterRarity = $('#filter_rarity').get(0).value
        let filterName = $('#filter_name').get(0).value
        let nameRegex = new RegExp(filterName, 'i')
        let filterBlessedAttributes = $('#filter_blessed_attributes').get(0).value
        let filterAffCategory = $('#filter_aff_category').get(0).value
        let filterAffLvl = $('#filter_aff_lvl').get(0).value
        let filterLevelCap = $('#filter_level_cap').get(0).value
        const haremGirls = window.availableGirls || window.owned_girls || window.girl_squad.map(g => g.member_girl)

        let girlsFiltered = $.map(this.girlsData, (girl, index) => {
            let matchesClass = (`${girl.class}` === filterClass) || (filterClass === 'all')
            const {element_data} = girl
            let matchesElement = (element_data.type === filterElement) || filterElement === 'all'
            let matchesRarity = (girl.rarity === filterRarity) || (filterRarity === 'all')
            const {name} = girl
            let matchesName = (name.search(nameRegex) > -1)
            let matchesBlessedAttributes
            switch (filterBlessedAttributes) {
            case 'blessed_attributes':
                matchesBlessedAttributes = !!girl.blessed_attributes
                break
            case 'non_blessed_attributes':
                matchesBlessedAttributes = !girl.blessed_attributes
                break
            case 'all':
                matchesBlessedAttributes = (filterBlessedAttributes === 'all')
                break
            }

            const $grade = $(girl.graded2)
            const affectionCategory = `${$grade.length}`
            const affectionLvl = `${$grade.filter('g:not(.grey):not(.green)').length}`
            let matchesAffCategory = (affectionCategory === filterAffCategory) || (filterAffCategory === 'all')
            let matchesAffLvl = (affectionLvl === filterAffLvl) || (filterAffLvl === 'all')
            const isCapped = haremGirls[index].level === haremGirls[index].level_cap
            let matchesLevelCap = (filterLevelCap === 'all') || (filterLevelCap === 'capped' && isCapped) || (filterLevelCap === 'uncapped' && !isCapped)

            return (matchesClass && matchesElement && matchesRarity && matchesName && matchesBlessedAttributes && matchesAffCategory && matchesAffLvl && matchesLevelCap) ? index : null
        })

        $.each(this.arenaGirls, function(index, girlElem) {
            $.inArray(index, girlsFiltered) > -1 ? $(girlElem).show() : $(girlElem).hide()
        })

        //update scroll display
        $('.panel-body').getNiceScroll().resize()
    }

    sortGirls() {
        let filterSort = $('#filter_sort').get(0).value
        if (filterSort === 'mana') {filterSort = 'mana_starting'}
        if (filterSort === 'mana-generation') {filterSort = 'mana_generation'}
        const haremGirls = window.availableGirls || window.owned_girls || window.girl_squad.map(({member_girl}) => member_girl)
        const relics = this.relics.filter(({carac}) => carac === filterSort)

        const sorted_caracs = []
        haremGirls.forEach((girl) => {
            const {id_girl, battle_caracs, power_display, element} = girl
            const girl_element = element || girl.girl.element_data.type

            const base_carac = filterSort !== 'all' ? battle_caracs[filterSort] : 0
            let bonus_carac = 0
            relics.forEach(({identifier, bonus, girl, element: relic_element}) => {
                const type = identifier.match(/[a-z]+/g)[0]
                const element_matches = relic_element ? relic_element === girl_element : true
                const girl_matches = type === 'girl' ? girl.id_girl === id_girl : true
                bonus_carac += (element_matches && girl_matches) ? Math.ceil(base_carac * (bonus/100)) : 0
            })
            const carac = filterSort === 'all' ? power_display : base_carac + bonus_carac

            sorted_caracs.push({id_girl, carac})
        })
        sorted_caracs.sort((a, b) => b.carac - a.carac)

        sorted_caracs.forEach(({id_girl}, index) => {
            this.arenaGirls.filter(`[${this.isLabyrinthMain ? 'id' : 'id_girl'}="${id_girl}"]`).css('order', index)
        })
    }

    createFilterBox() {
        let totalHTML = '<div id="arena_filter_box" class="form-wrapper" style="display: none;">'
        const affectionGradeOption = grade => ({ label: this.label(`grade${grade}`), value: grade })

        totalHTML += Snippets.textInput({
            id: 'filter_name',
            label: this.label('searchedName'),
            placeholder: this.label('girlName'),
            value: ''
        })
        totalHTML += Snippets.selectInput({
            id: 'filter_class',
            label: this.label('searchedClass'),
            options: [1,2,3].map(option => ({label: !Helpers.isCurrentPage('labyrinth') ? GT.caracs[option] : GT.design[`class_${CLASS_NAMES[option]}`], value: option})),
            className: 'script-filter-carac'
        })
        totalHTML += Snippets.selectInput({
            id: 'filter_element',
            label: this.label('searchedElement'),
            options: ELEMENTS.map(option => ({label: GT.design[`${option}_flavor_element`], value: option})),
            className: 'script-filter-element'
        })
        totalHTML += Snippets.selectInput({
            id: 'filter_rarity',
            label: this.label('searchedRarity'),
            options: RARITIES.map(option => ({label: GT.design[`girls_rarity_${option}`], value: option})),
            className: 'script-filter-rarity rarity-styling'
        })
        totalHTML += Snippets.selectInput({
            id: 'filter_aff_category',
            label: this.label('searchedAffCategory'),
            options: ['1','3','5','6'].map(affectionGradeOption),
            className: 'script-filter-aff-category'
        })
        totalHTML += Snippets.selectInput({
            id: 'filter_aff_lvl',
            label: this.label('searchedAffLevel'),
            options: ['0','1','2','3','4','5','6'].map(affectionGradeOption),
            className: 'script-filter-aff-level'
        })
        totalHTML += Snippets.selectInput({
            id: 'filter_blessed_attributes',
            label: this.label('searchedBlessedAttributes'),
            options: [{value: 'blessed_attributes', label: this.label('blessedAttributes')}, {value: 'non_blessed_attributes', label: this.label('nonBlessedAttributes')}],
            className: 'script-filter-blessing'
        })
        totalHTML += Snippets.selectInput({
            id: 'filter_level_cap',
            label: this.label('levelCap'),
            options: ['capped', 'uncapped'].map(option => ({label: this.label(`levelCap_${option}`), value: option})),
            className: 'script-filter-level-cap'
        })
        if (this.isLabyrinth) {
            const LABELS = ['carac_ego', 'carac_harmony', 'damage', 'carac_def', 'carac_starting_mana', 'carac_mana_generation', 'pvp_battle_speed']

            totalHTML += Snippets.selectInput({
                id: 'filter_sort',
                label: GT.design.haremdex_sort_by,
                options: ['ego', 'chance', 'damage', 'defense', 'mana', 'mana-generation', 'speed'].map((option, index) => ({label: GT.design[LABELS[index]], value: option})),
                className: 'script-filter-sort',
                default_text: GT.design.caracs_sum
            })
        }

        totalHTML += '</div>'

        return totalHTML
    }
}

export default TeamsFilterModule
