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
                    $('#filter_role').selectric({
                        optionsItemBuilder: (itemData) => {
                            const {element, text} = itemData
                            return element.val().length && element.val() !== 'all' ? `<span role-tooltip="${element.val()}" class="girl_role_${element.val()}_icn"></span>${text}` : text
                        }
                    })
                    $('#filter_sort').selectric({
                        optionsItemBuilder: (itemData) => {
                            const {element, text} = itemData
                            return `<span ${element.val().length && element.val() !== 'all' ? `carac="${element.val()}"` : 'class="girl-power-icon"'}></span>${text} &#9660`
                        }
                    })
                }
                const otherFields = ['skill_tier', 'aff_category', 'aff_lvl', 'blessed', 'level_cap']
                otherFields.forEach(field => $(`#filter_${field}`).selectric())
    
                this.updateFilterGirlData()
                $('h3.panel-title').append(`<span class="script-girl-count">(<span class="filtered-count"></span>${I18n.nThousand(this.arenaGirls.length)})</span>`)
                this.createFilterEvents()

                if (this.isLabyrinthMain) {
                    const observer = new MutationObserver(() => {
                        this.updateFilterGirlData()
                        $('.squad-container .text-title').append(`<span class="script-girl-count"><span class="filtered-count"></span>${I18n.nThousand(this.arenaGirls.length)}</span>`)
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
        $('#filter_name').get(0).oninput = doFilter
        $('#filter_element').on('change', doFilter)
        $('#filter_role').on('change', doFilter)
        $('#filter_rarity').on('change', doFilter)
        $('#filter_class').on('change', doFilter)
        $('#filter_blessed').on('change', doFilter)
        $('#filter_skill_tier').on('change', doFilter)
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
        const {availableGirls, owned_girls, girl_squad} = window
        const haremGirls = availableGirls || owned_girls || girl_squad.map(g => g.member_girl)
        const filterName = $('#filter_name').get(0).value
        const nameRegex = new RegExp(filterName, 'i')
        const filterElement = $('#filter_element').get(0).value
        const filterRole = $('#filter_role')?.get(0)?.value || 'all'
        const filterRarity = $('#filter_rarity').get(0).value
        const filterClass = $('#filter_class').get(0).value
        const filterBlessed = $('#filter_blessed').get(0).value
        const filterSkillTier = $('#filter_skill_tier').get(0).value
        const filterAffCategory = $('#filter_aff_category').get(0).value
        const filterAffLvl = $('#filter_aff_lvl').get(0).value
        const filterLevelCap = $('#filter_level_cap')?.get(0)?.value || 'all'

        let girlsFilteredCount = 0
        const girlsFiltered = $.map(this.girlsData, (girl, index) => {
            const {name, element_data, role_data, rarity, class: girl_class, blessed_attributes, caracs, blessed_caracs, skill_tiers_info, graded2} = girl
            const {level, level_cap} = haremGirls[index]
            const $grade = $(graded2)

            const matchesName = (name.search(nameRegex) > -1)
            const matchesElement = (filterElement === 'all') || (element_data.type === filterElement)
            const matchesRole = (filterRole === 'all') || (`${role_data?.id}` === filterRole)
            const matchesRarity = (filterRarity === 'all') || (rarity === filterRarity)
            const matchesClass = (filterClass === 'all') || (`${girl_class}` === filterClass)
            const matchesBlessed = (filterBlessed === 'all') || ((filterBlessed === 'blessed') === (!!blessed_attributes || (!!blessed_caracs && blessed_caracs.carac1 > caracs.carac1)))
            const matchesSkillTier = (filterSkillTier === 'all') || (skill_tiers_info[filterSkillTier]?.skill_points_used > 0)
            const matchesAffCategory = (filterAffCategory === 'all') || (`${$grade.length}` === filterAffCategory)
            const matchesAffLvl = (filterAffLvl === 'all') || (`${$grade.filter('g:not(.grey):not(.green)').length}` === filterAffLvl)
            const matchesLevelCap = (filterLevelCap === 'all') || ((filterLevelCap === 'capped') === (level === level_cap))

            if (matchesName && matchesElement && matchesRole && matchesRarity && matchesClass && matchesBlessed && matchesSkillTier && matchesAffCategory && matchesAffLvl && matchesLevelCap) {
                girlsFilteredCount++
                return index
            } else {
                return null
            }
        })

        $.each(this.arenaGirls, function(index, girlElem) {
            $.inArray(index, girlsFiltered) > -1 ? $(girlElem).show() : $(girlElem).hide()
        })
        $('.script-girl-count>.filtered-count').text(this.arenaGirls.length != girlsFilteredCount ? `${I18n.nThousand(girlsFilteredCount)}/` : '')
    }

    sortGirls() {
        let filterSort = $('#filter_sort').get(0).value
        if (filterSort === 'mana') {filterSort = 'mana_starting'}
        if (filterSort === 'mana-generation') {filterSort = 'mana_generation'}
        const {availableGirls, owned_girls, girl_squad} = window
        const haremGirls = availableGirls || owned_girls || girl_squad.map(({member_girl}) => member_girl)
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
        const {GT} = window
        let totalHTML = '<div id="arena_filter_box" class="form-wrapper" style="display: none;">'
        const affectionGradeOption = grade => ({ label: this.label(`grade${grade}`), value: grade })

        totalHTML += Snippets.textInput({
            id: 'filter_name',
            label: this.label('searchedName'),
            placeholder: this.label('girlName'),
            value: ''
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
        } else {
            totalHTML += '<div class="empty-form"></div>'
        }
        totalHTML += Snippets.selectInput({
            id: 'filter_element',
            label: this.label('searchedElement'),
            options: ELEMENTS.map(option => ({label: GT.design[`${option}_flavor_element`], value: option})),
            className: 'script-filter-element'
        })
        if (this.isLabyrinth) {
            totalHTML += Snippets.selectInput({
                id: 'filter_role',
                label: GT.design.girl_role,
                options: [4,10,9,3].map(option => ({label: GT.design[`girl_role_${option}_name`], value: option})),
                className: 'script-filter-role'
            })
        }
        totalHTML += Snippets.selectInput({
            id: 'filter_rarity',
            label: this.label('searchedRarity'),
            options: RARITIES.map(option => ({label: GT.design[`girls_rarity_${option}`], value: option})),
            className: 'script-filter-rarity rarity-styling'
        })
        totalHTML += Snippets.selectInput({
            id: 'filter_class',
            label: this.label('searchedClass'),
            options: [1,2,3].map(option => ({label: !this.isLabyrinth ? GT.caracs[option] : GT.design[`class_${CLASS_NAMES[option]}`], value: option})),
            className: 'script-filter-carac'
        })
        totalHTML += Snippets.selectInput({
            id: 'filter_blessed',
            label: this.label('searchedBlessed'),
            options: [{value: 'blessed', label: this.label('blessed')}, {value: 'non_blessed', label: this.label('nonBlessed')}],
            className: 'script-filter-blessing'
        })
        totalHTML += Snippets.selectInput({
            id: 'filter_skill_tier',
            label: this.label('searchedSkillTier'),
            options: [1,2,3,4,5].map(option => ({label: `${option<5 ? '≥ ' : ''}${GT.design.tier} ${option}`, value: option})),
            className: 'script-filter-skill_tier'
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
        if (!Helpers.isCurrentPage('labyrinth-pool-select')) {
            totalHTML += Snippets.selectInput({
                id: 'filter_level_cap',
                label: this.label('levelCap'),
                options: ['capped', 'uncapped'].map(option => ({label: this.label(`levelCap_${option}`), value: option})),
                className: 'script-filter-level-cap'
            })
        }

        totalHTML += '</div>'

        return totalHTML
    }
}

export default TeamsFilterModule
