/* global GT */
import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import filterIcon from '../../assets/filter.svg'

import styles from './styles.lazy.scss'
import Sheet from '../../common/Sheet'
import Snippets from '../../common/Snippets'

const MODULE_KEY = 'teamsFilter'

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
        return ['edit-team', 'add-boss-bang-team'].some(page => Helpers.isCurrentPage(page))
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            this.injectCSSVars()
            this.updateFilterGirlData()
            $('h3.panel-title').before('<button id="arena_filter" class="blue_button_L"><span class="filter_mix_icn"></span></button>')
            $('h3.panel-title').after(this.createFilterBox())

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
            const otherFields = ['aff_category', 'aff_lvl', 'blessed_attributes', 'level_cap']
            otherFields.forEach(field => $(`#filter_${field}`).selectric())
            this.createFilterEvents()
        })

        this.hasRun = true
    }

    injectCSSVars() {
        Sheet.registerVar('filter-icon', `url('${filterIcon}')`)
    }

    updateFilterGirlData() {
        this.arenaGirls = $('.harem-panel div.harem-girl-container')

        this.girlsData = $.map(this.arenaGirls, function(girl) {
            // CxH still uses 'new-girl-tooltip-data' and is broken in the UI
            return JSON.parse($(girl).find('.girl_img').attr('data-new-girl-tooltip') || $(girl).find('.girl_img').attr('new-girl-tooltip-data'))
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
        const haremGirls = window.haremGirls

        let girlsFiltered = $.map(this.girlsData, (girl, index) => {
            let matchesClass = (girl.class === filterClass) || (filterClass === 'all')
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
            let matchesLevelCap = (filterLevelCap === 'all') || (filterLevelCap === 'capped' && haremGirls[index].Xp.maxed) || (filterLevelCap === 'uncapped' && !haremGirls[index].Xp.maxed)

            return (matchesClass && matchesElement && matchesRarity && matchesName && matchesBlessedAttributes && matchesAffCategory && matchesAffLvl && matchesLevelCap) ? index : null
        })

        $.each(this.arenaGirls, function(index, girlElem) {
            $(girlElem).css('display', $.inArray(index, girlsFiltered) > -1 ? 'flex' : 'none')
        })

        //update scroll display
        $('.panel-body').getNiceScroll().resize()
    }

    createFilterBox() {
        let totalHTML = '<div id="arena_filter_box" class="form-wrapper" style="display: none;">'
        const affectionGradeOption = grade => ({ label: this.label(`grade${grade}`), value: grade })

        totalHTML += Snippets.textInput({id: 'filter_name', label: this.label('searchedName'), placeholder: this.label('girlName'), value: ''})
        totalHTML += Snippets.selectInput({id: 'filter_class', label: this.label('searchedClass'), options: [1,2,3].map(option => ({label: GT.caracs[option], value: option})), className: 'script-filter-carac'})
        totalHTML += Snippets.selectInput({id: 'filter_element', label: this.label('searchedElement'), options: ['fire', 'nature', 'stone', 'sun', 'water', 'darkness', 'light', 'psychic'].map(option => ({label: GT.design[`${option}_flavor_element`], value: option})), className: 'script-filter-element'})
        totalHTML += Snippets.selectInput({id: 'filter_rarity', label: this.label('searchedRarity'), options: ['starting', 'common', 'rare', 'epic', 'legendary', 'mythic'].map(option => ({label: GT.design[`girls_rarity_${option}`], value: option})), className: 'script-filter-rarity rarity-styling'})
        totalHTML += Snippets.selectInput({id: 'filter_aff_category', label: this.label('searchedAffCategory'), options: ['1','3','5','6'].map(affectionGradeOption), className: 'script-filter-aff-category'})
        totalHTML += Snippets.selectInput({id: 'filter_aff_lvl', label: this.label('searchedAffLevel'), options: ['0','1','2','3','4','5','6'].map(affectionGradeOption), className: 'script-filter-aff-level'})
        totalHTML += Snippets.selectInput({id: 'filter_blessed_attributes', label: this.label('searchedBlessedAttributes'), options: [{value: 'blessed_attributes', label: this.label('blessedAttributes')}, {value: 'non_blessed_attributes', label: this.label('nonBlessedAttributes')}], className: 'script-filter-blessing'})
        totalHTML += Snippets.selectInput({id: 'filter_level_cap', label: this.label('levelCap'), options: ['capped', 'uncapped'].map(option => ({label: this.label(`levelCap_${option}`), value: option})), className: 'script-filter-level-cap'})

        totalHTML += '</div>'

        return totalHTML
    }
}

export default TeamsFilterModule
