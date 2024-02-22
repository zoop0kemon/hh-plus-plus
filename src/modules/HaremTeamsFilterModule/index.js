import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import { lsKeys } from '../../common/Constants'
import Sheet from '../../common/Sheet'

import styles from './styles.lazy.scss'

const { $ } = Helpers

const MODULE_KEY = 'haremTeamsFilter'

class HaremTeamsFilterModule extends CoreModule {
    constructor() {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun() {
        return Helpers.isCurrentPage('harem') && !Helpers.isCurrentPage('hero')
    }

    run() {
        if (this.hasRun || !this.shouldRun()) { return }

        styles.use()

        Helpers.defer(() => {
            this.injectCSSVars()
            this.createAndAttach()

            this.loadFilter()
        })

        this.hasRun = true
    }

    injectCSSVars() {
        Sheet.registerVar('cross-icon', `url('${Helpers.getCDNHost()}/clubs/ic_xCross.png')`)
    }

    loadFilter() {
        const filters = Helpers.lsGet('filters')

        if (filters && filters.team) {
            if ($('.girls_list > div').length) {
                this.doFilter(filters.team)
            } else {
                const observer = new MutationObserver(() => {
                    if ($('.girls_list > div').length) {
                        this.doFilter(filters.team)
                        observer.disconnect()
                    }
                })
                observer.observe($('.girls_list')[0], { childList: true })
            }
        }
    }

    createAndAttach() {
        const $teamsButton = this.createTeamsButton()
        const $teamsBox = this.createTeamsBox()
        $('#filtering_girls .reset-filters-container').prepend($teamsButton)
        $('#harem_whole').append($teamsBox)

        $teamsButton.click(() => $teamsBox.find('.team-selection').toggle())
        const doFilter = this.doFilter
        $teamsBox.find('.team-slot-container').click(function () {
            doFilter($(this).data('girl-ids'))
            $teamsBox.find('.team-selection').css('display', 'none')
        })
        $teamsBox.find('.close-team-selection').click(() => $teamsBox.find('.team-selection').css('display', 'none'))
    }

    doFilter(girlIds) {
        const { harem, hh_show_filtered_girls } = window
        harem.haremFilter.resetFilters()
        harem.filteredGirlsIds = girlIds.map(id => +id)
        harem.filteredGirlsList = girlIds.map(id => harem.allGirls[id])

        const filterData = girlIds.reduce((a, i) => { a[i] = {}; return a }, {})
        hh_show_filtered_girls('.girls_list', filterData)

        harem.resetGirlsList()
        harem.loadMoreGirlsAfterCurrent()
        harem.scrollToAndOpenGirl()

        Helpers.lsSet('filters', { team: girlIds })
    }

    createTeamsButton() {
        return $(`<button id="teams-filter" class="blue_button_L">${this.label('team')}</button>`)
    }

    createTeamsBox() {
        const bdsmTeams = Helpers.lsGet(lsKeys.TEAMS_DICTIONARY)
        const href = Helpers.getHref('../teams.html')
        if (!bdsmTeams) {
            return $(`
        <div style="position:relative">
            <div class="team-selection" style="display: none;">
                <span class="close-team-selection"></span>
                ${this.label('visitTeams', {href})}
            </div>
        </div>`)
        }
        const { teamIds, teamsDict } = bdsmTeams
        return $(`
    <div style="position:relative">
        <div class="team-selection" style="display: none;">
            <span class="close-team-selection"></span>
            <div class="teams-grid-container rarity-background">
                ${teamIds.map(teamId => teamsDict[teamId]).map(team => `
                    <div class="team-slot-container ${team.iconRarity}" data-id-team="${team.teamId}" data-girl-ids='${JSON.stringify(team.girls)}'>
                        <img src="${Helpers.getCDNHost()}/pictures/girls/${team.iconId}/ico${team.iconLevel}.png" />
                        ${team.themeElements ? `
                            <div class="theme-icons">
                                ${team.themeElements.map(element => `<img class="theme-icon" src="${Helpers.getCDNHost()}/pictures/girls_elements/${element}.png"/>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
    `)
    }
}

export default HaremTeamsFilterModule
