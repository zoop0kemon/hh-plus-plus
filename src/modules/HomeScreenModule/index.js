import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import { lsKeys } from '../../common/Constants'
import I18n from '../../i18n'
import pantheonIcon from '../../assets/pantheon.svg'
import labyrinthIcon from '../../assets/labyrinth.svg'

import styles from './styles.lazy.scss'
import AvailableFeatures from '../../common/AvailableFeatures'
import Sheet from '../../common/Sheet'

const {$} = Helpers

const MODULE_KEY = 'homeScreen'

const makeEnergyBarHTML = ({type, timeForSinglePoint, timeOnLoad, iconClass, currentVal, max}) => {
    const {GT} = window
    return `
        <div class="energy_counter" type="${type}" id="canvas_${type}_energy">
            <div class="energy_counter_amount_container">
                <div class="energy_counter_icon"><span class="${iconClass}"></span></div>
                <div class="energy_counter_amount">
                    <span energy>${currentVal}</span>/<span rel="max">${max}</span>
                </div>
            </div>
            <span rel="count_txt" timeforsinglepoint="${timeForSinglePoint}" ${currentVal >= max ? 'style="display:none;"' : `timeonload="${timeOnLoad}"`}>
                ${GT.design.more_in} <span rel="count"></span>
            </span>
        </div>
    `
}

class HomeScreenModule extends CoreModule {
    constructor() {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true,
            // subSettings: [
            //     {
            //         key: 'leaguePos',
            //         label: I18n.getModuleLabel('config', `${MODULE_KEY}_leaguePos`),
            //         default: false
            //     }
            // ]
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun() {
        return Helpers.isCurrentPage('home')
    }

    run() {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            this.injectCSSVars()
            this.addTimers()
            this.forceActivitiesTab()
            this.addReplyTimer()
            this.addShortcuts()

            // if (leaguePos) {
            //     this.addLeaguePos()
            // }
        })

        this.hasRun = true
    }

    injectCSSVars() {
        Sheet.registerVar('pantheon-icon', `url("${pantheonIcon}")`)
        Sheet.registerVar('labyrinth-icon', `url("${labyrinthIcon}")`)
        Sheet.registerVar('champions-icon', `url("${Helpers.getCDNHost()}/design/menu/ic_champions.svg")`)
    }

    setNotification(type, notification) {
        window.notificationData[type] = notification
        window.displayNotifications()
    }

    addTimers() {
        const {server_now_ts} = window
        // Market
        const marketInfo = Helpers.lsGet(lsKeys.MARKET_INFO)
        if (marketInfo) {
            const {refreshTime} = marketInfo
            if (refreshTime > server_now_ts) {
                this.attachTimer('shop', refreshTime)
            }
        }

        const trackedTimes = Helpers.lsGet(lsKeys.TRACKED_TIMES)
        if (!trackedTimes) {return}
        // Pachinko
        const pachinko_time = trackedTimes?.pachinko?.filter(({time}) => time).sort((a, b) => a.time-b.time)[0]?.time
        if (pachinko_time) {
            this.attachTimer('pachinko', pachinko_time)
        }

        // Champions
        const champ_times = Object.values(trackedTimes.champs)
        const shortest_time = champ_times.filter(({time}) => time && time > server_now_ts).sort((a, b) => a.time-b.time)[0]?.time
        if (shortest_time) {
            this.attachTimer('god-path', shortest_time)
        }

        // Club Champ
        // if (Helpers.isInClub() && trackedTimes.clubChamp && trackedTimes.clubChamp > server_now_ts) {
        //     this.attachTimer('clubs', trackedTimes.clubChamp)
        // }
    }

    makeLinkSelector(rel) {
        return `[rel=${rel}] > .notif-position > span`
    }

    attachTimer(rel, endAt) {
        if (!$(`[rel=${rel}] .additional-menu-data`).length) {
            const {createPageTimers} = window.shared ? window.shared.general : window
            const {server_now_ts} = window
            const selector = this.makeLinkSelector(rel)

            const $container = $('<div class="additional-menu-data"></div>')
            const $elm = $(`<div class="timer-box visible-timer" rel="script-${rel}"></div>`)
            $container.append($elm)

            $(selector).append($container)
            createPageTimers([{dom_element: `script-${rel}`, time_remaining: endAt - server_now_ts}])
        }
    }

    async addShortcuts() {
        const shortcutHtml = (className, href, title, iconClass) => `<a class="round_blue_button script-home-shortcut script-home-shortcut-${className}" href="${Helpers.getHref(href)}" tooltip hh_title="${title}"><div class="${iconClass}"></div></a>`

        // Club champ
        if (Helpers.isInClub()) {
            // is in club
            const $clubShortcuts = $('<div class="script-home-shortcut-container"></div>')
            $clubShortcuts.append(shortcutHtml('club-champ', '/club-champion.html', this.label('clubChamp'), 'clubChampions_flat_icn'))

            const $wrapper = $('<div class="quest-container"></div>')
            $('a[rel="clubs"]').wrap($wrapper).after($clubShortcuts)
        }

        const {pantheon} = AvailableFeatures
        const champs = await AvailableFeatures.champs()
        const labyrinth = await AvailableFeatures.labyrinth()

        if (champs || pantheon || labyrinth) {
            const {GT} = window
            const $godShortcuts = $('<div class="script-home-shortcut-container"></div>')
            if (champs) {
                $godShortcuts.append(shortcutHtml('champs', '/champions-map.html', GT.design.Champions, 'champions_flat_icn'))
            }
            if (pantheon) {
                $godShortcuts.append(shortcutHtml('pantheon', '/pantheon.html', GT.design.pantheon, 'pantheon_flat_icn'))
            }
            if (labyrinth) {
                $godShortcuts.append(shortcutHtml('labyrinth', '/labyrinth-entrance.html', GT.design.labyrinth, 'labyrinth_flat_icn'))
            }

            const $wrapper = $('<div class="quest-container"></div>')
            const $sexGodPath = $('a[rel="god-path"]')
            if ($sexGodPath.hasClass('position-sex-god-path')) { // position class for legacy home screen module, class moved here because of async delay
                $sexGodPath.removeClass('position-sex-god-path')
                $wrapper.addClass('position-sex-god-path')
            }
            $sexGodPath.wrap($wrapper).after($godShortcuts)
        }
    }

    forceActivitiesTab() {
        $('a[rel=activities]').attr('href', Helpers.getHref('/activities.html?tab=missions'))
    }

    addLeaguePos() {
        const $leaguePos = $('<div class="script-league-pos"></div>')
        $('[rel=leaderboard]').wrap('<div class="quest-container"></div>').after($leaguePos)

        const $additionalData = $('[rel=leaderboard] .additional-menu-data')
        if ($additionalData.length) {
            // TODO parse and put into own label again
        } else {
            window.$.ajax({
                url: Helpers.getHref('/leagues.html'),
                success: (data) => {
                    let leaguesListItem
                    let leagueTag

                    const {Hero: {infos: {id: playerID}}} = window.shared ? window.shared : window

                    const leaguesListPattern = new RegExp(`leagues_list.push\\( ?(?<leaguesListItem>{"id_player":"${playerID}".*}) ?\\);`)
                    const leagueTagPattern = /league_tag = (?<leagueTag>[1-9]);/

                    new DOMParser().parseFromString(data, 'text/html').querySelectorAll('script[type="text/javascript"]').forEach(element => {
                        const { textContent } = element
                        if (!textContent) {return}
                        if (textContent.includes('leagues_list')) {
                            const matches = textContent.match(leaguesListPattern)
                            if (matches && matches.groups) {
                                leaguesListItem = JSON.parse(matches.groups.leaguesListItem)
                            }
                        }
                        if (textContent.includes('league_tag')) {
                            const matches = textContent.match(leagueTagPattern)
                            if (matches && matches.groups) {
                                leagueTag = matches.groups.leagueTag
                            }
                        }
                    })

                    if (!leaguesListItem || !leagueTag) {return}
                    const { place } = leaguesListItem

                    $leaguePos.append(`<div class="script-league-icon script-league-rank script-league-rank-digits-${`${place}`.length}" style="background-image: url(${Helpers.getCDNHost()}/leagues/${leagueTag}.png);">${place}</div>`)
                }
            })
        }
    }

    addReplyTimer() {
        const $messenger = $('.messenger-link')
        if (!$messenger.length) {return}
        const {Hero} = window.shared ? window.shared : window
        const {energies: {reply}} = Hero
        if (!reply) { return }

        const type = 'reply'
        const { amount, max_regen_amount, seconds_per_point, next_refresh_ts } = reply

        const $replyTimer = Helpers.$(makeEnergyBarHTML({ type: 'reply', iconClass: 'messenger_reply_currency_icn', currentVal: amount, max: max_regen_amount, timeForSinglePoint: seconds_per_point, timeOnLoad: next_refresh_ts }))

        $messenger.append($replyTimer)

        if (amount < max_regen_amount) {
            if (!Hero.c) {
                Hero.c = {}
            }

            const {createEnergyTimer} = window.shared ? window.shared.timer : window
            const selector = `.energy_counter[type="${type}"]`
            const addTimer = () => {
                Hero.c[type] = createEnergyTimer($(selector))
                Hero.c[type].startTimer()
            }
            addTimer()
        }
    }
}

export default HomeScreenModule
