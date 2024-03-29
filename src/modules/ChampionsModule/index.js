import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

import styles from './styles.lazy.scss'

const {$} = Helpers

const MODULE_KEY = 'champions'

const calculateCCShardProjection = (percentage, participants) => {
// formula from zoopokemon's spreadsheet
// return Math.max(
//     1,
//     Math.floor(
//         (Math.round(percentage * 100) / 100) *
//         (3 * participants + 4)
//     )
// )

    // the "socialist" formula
    // return Math.round((7/8) * Math.sqrt(participants))

    // zoopokemon's proposed shard range
    // percentage = Math.max(percentage, 0)
    // const percentagePoint = Math.round(percentage * 100)
    // const I = (p) => Math.ceil(100/p)
    // const h = (x) => 0.0075 * Math.pow(x - 1, 2) + 2

    // let max, min
    // const fairShare = I(participants)
    // const scale = h(participants)
    // if (percentagePoint <= fairShare) {
    //     max = Math.round(
    //         (
    //             (Math.ceil((5/3) * scale) - 1)
    //             /
    //             fairShare
    //         )
    //         * percentagePoint
    //         + 1
    //     )
    //     min = Math.round(
    //         (
    //             (Math.ceil((1/3) * scale) - 1)
    //             /
    //             fairShare
    //         )
    //         * percentagePoint
    //         + 1
    //     )
    // } else {
    //     max = Math.round(
    //         (
    //             (Math.ceil((5/3) * scale) - 1)
    //             /
    //             (4 * fairShare)
    //         )
    //         * (percentagePoint - fairShare)
    //         + Math.ceil((5/3) * scale)
    //     )
    //     min = Math.ceil((1/3) * scale)
    // }

    // return `${min}-${max}`

    // upcoming formula as promised by Noacc
    return Math.round(0.6 * Math.sqrt(participants)) + Math.round(percentage * 100)
}

class ChampionsModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true,
            restriction: {blacklist: ['HoH']},
            subSettings: [
                {
                    key: 'poseMatching',
                    label: I18n.getModuleLabel('config', `${MODULE_KEY}_poseMatching`),
                    default: true
                },
                {
                    key: 'fixPower',
                    label: I18n.getModuleLabel('config', `${MODULE_KEY}_fixPower`),
                    default: true
                }
            ]
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return ['champions/', 'clubs', 'club-champion'].some(page => Helpers.isCurrentPage(page))
    }

    run ({poseMatching, fixPower}) {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            if (Helpers.isCurrentPage('clubs')) {
                this.addChampionInfoOnClubsPage()
            }
            if (Helpers.isCurrentPage('champions/') || Helpers.isCurrentPage('club-champion')) {
                this.poseMatching({poseMatching, fixPower})
                this.showTicketsWhileResting()
                this.fasterSkipButton()
                this.showChampionLevel()
            }
        })

        this.hasRun = true
    }

    addChampionInfoOnClubsPage () {
        const {club_champion_data, members_list, server_now_ts} = window
        if (!club_champion_data || !club_champion_data.fight.active) {return}
        const {fight: {participants}} = club_champion_data

        const clubMembersTab = () => {
            // Mark members that haven't hit the champ
            const participatingMembers = participants.map(({id_member})=>id_member)
            const nonParticipatingMembers = members_list.filter(({id_member})=>!participatingMembers.includes(id_member))

            const highlightNonParticipants = () => {
                nonParticipatingMembers.forEach(({id_member}) => {
                    $(`#members .avatar[id-member=${id_member}]`).parent().addClass('non-participant')
                })
            }
            highlightNonParticipants()
            new MutationObserver(highlightNonParticipants).observe(document.getElementById('members'), {childList: true, subtree: true})
        }
        const clubChampionsTab = () => {
            const {champion: {bar}, fight: {start_time}, timers: {championFight}} = club_champion_data
            const totalPositiveImpressionParticipants = participants.length //.filter(({challenge_impression_done}) => parseInt(challenge_impression_done) > 0).length
            const totalImpression = parseInt(bar.max)

            // Display impression and shard projections on the champ table
            Helpers.doWhenSelectorAvailable('.club-champion-members-challenges .data-list', () => {
                const $members_challenges_table = $('.club-champion-members-challenges .data-list')
                const addImpressionShards = () => {
                    const {club_champion_participants: sorted_participants} = window

                    sorted_participants.forEach(({challenge_impression_done}, index) => {
                        const impression = parseInt(challenge_impression_done)
                        const percentage = impression / totalImpression
                        const shards = calculateCCShardProjection(percentage, totalPositiveImpressionParticipants)
        
                        const $cellHTML = $(`
                            <div>${I18n.nThousand(impression)}</div>
                            <div>${I18n.nRounding(percentage * 100, 2, 0)}% / <span class="shard"></span> x ${shards}</div>
                        `)

                        $members_challenges_table.find('.data-row.body-row').eq(index).children().last().empty().append($cellHTML)
                    })
                }

                addImpressionShards()
                const observer = new MutationObserver(() => {
                    addImpressionShards()
                })
                observer.observe($members_challenges_table[0], {childList: true})
            })

            // Show participant count
            $('.club-details-container #club_champions').prepend(`<div class="script-participant-count">${this.label('participants', {participants: totalPositiveImpressionParticipants, members: members_list.length})}</div>`)

            // Fix broken progress bar in non-english locales
            Helpers.doWhenSelectorAvailable('.club_champions_bar', () => {
                const $clubChampionsBar = $('.club_champions_bar')
                $clubChampionsBar.attr('style', $clubChampionsBar.attr('style').replace(',','.'))
            })

            // Add time since start
            Helpers.doWhenSelectorAvailable('.club_champions_timer_fight', () => {
                const $timerFight = $('.club_champions_timer_fight')
                if ($timerFight.length && !$('.script-round-duration-time').length) {
                    const {format_time_short, createTimer} = window.shared ? window.shared.timer : window

                    const durationString = `<span class="script-round-duration-time">${format_time_short(server_now_ts - start_time)}</span>`
                    const $dummyTimerTarget = $('<div class="dummy-timer-target"></div>')
                    $timerFight.append('<br/>').append(`<span class="script-round-duration">${this.label('clubChampDuration', {duration: durationString})}</span>`).append($dummyTimerTarget)
                    const $durationEl = $timerFight.find('.script-round-duration')
                    const $durationText = $durationEl.find('.script-round-duration-time')

                    const timerResetTime = (server_now_ts - start_time) <= 60 * 60 ? 60 * 60 : 24 * 60 * 60
                    let useResettingTimer = timerResetTime <= championFight
                    const timerDuration = useResettingTimer ? timerResetTime : championFight
                    let resetTimeDuration = 0

                    const onUpdate = (state) => {
                        const remainingTime = state.time_remaining

                        const newTime = (server_now_ts - start_time) + ((timerDuration - remainingTime) + resetTimeDuration)
                        $durationText.text(format_time_short(newTime))
                    }
                    const onComplete = () => {
                        // keep reseting timer to keep updating every second if needed
                        if (useResettingTimer) {
                            resetTimeDuration += timerDuration
                            useResettingTimer = timerResetTime + resetTimeDuration <= championFight
                            const newTimerDuration = useResettingTimer ? timerResetTime : championFight - resetTimeDuration
                            resetTimeDuration -= timerDuration - newTimerDuration // adjust to account for change in timer duration for last timer
                            createTimer($dummyTimerTarget, newTimerDuration, {onUpdate: onUpdate, onComplete: onComplete}).startTimer()
                        }
                    }

                    createTimer($dummyTimerTarget, timerDuration, {onUpdate: onUpdate, onComplete: onComplete}).startTimer()
                }
            })

            // Show challenge button instead of refill button while team resting
            Helpers.doWhenSelectorAvailable('.btn_skip_team_cooldown', () => {
                $('.btn_skip_team_cooldown').hide()
                if (!$('.btn_skip_champion_cooldown').length) {
                    $('.challenge_container').show()
                }
            })
        }

        Helpers.doWhenSelectorAvailable('.tabs-switcher#club-tabs', () => {
            clubMembersTab()
            $('.tabs-switcher#club-tabs #club_champions_tab').on('click', () => {
                setTimeout(clubChampionsTab, 10)
            })
        })
    }

    poseMatching ({poseMatching, fixPower}) {
        const {championData} = window
        const {canDraft, champion, hero_damage} = championData

        if (!canDraft) {return}

        const {poses} = champion
        const figures = poses.map(fig=>parseInt(fig))
        const figuresExtrapolated = [...figures, ...figures]

        const attachMatches = () => {
            const $girlSelection = $('.champions-middle__girl-selection')
            const {team} = championData

            team.forEach(({id_girl, figure, damage}, i) => {
                const $girl = $girlSelection.find(`[id_girl=${id_girl}]`)

                if (poseMatching) {
                    const rightPoseWrongPlace = figures.includes(parseInt(figure))
                    const rightPoseRightPlace = figuresExtrapolated[i] === parseInt(figure)

                    let $marker = $girl.find('.script-pose-match')
                    if (!$marker.length) {
                        $marker = $('<span class="script-pose-match"></span>')
                        $girl.append($marker)
                    }

                    if (rightPoseRightPlace) {
                        $marker.addClass('green-tick-icon')
                        $marker.removeClass('empty')
                    } else if (rightPoseWrongPlace) {
                        $marker.addClass('green-tick-icon')
                        $marker.addClass('empty')
                    }
                }

                if (fixPower) {
                    const actualPower = damage + hero_damage
                    const $damage = $girl.find('[carac=damage]')
                    $damage.text(I18n.nRounding(actualPower, 1, 1)).attr('hh_title', I18n.nThousand(actualPower))
                }
            })
        }
        attachMatches()

        new MutationObserver(attachMatches).observe($('#contains_all>section')[0], {childList: true})

        const onDraft = (response) => {
            const {teamArray} = response
            window.championData.team = teamArray
        }
        Helpers.onAjaxResponse(/action=team_draft/, onDraft)
        Helpers.onAjaxResponse(/action=champion_team_draft/, onDraft)
        const onReorder = (response, opt) => {
            if (!response.success) {return}

            const searchParams = new URLSearchParams(opt.data)
            const reorderedIDs = searchParams.getAll('team_order[]')

            const {team} = championData

            const reorderedTeam = []
            reorderedIDs.forEach(id => {
                reorderedTeam.push(team.find(({id_girl})=>id_girl===id))
            })

            window.championData.team = reorderedTeam
            attachMatches()
        }
        Helpers.onAjaxResponse(/action=team_reorder/, onReorder)
        Helpers.onAjaxResponse(/action=champion_team_reorder/, onReorder)
    }

    showTicketsWhileResting () {
        const attachCount = () => {
            if (!$('.champions-bottom__ticket-amount').length) {
                const {championData: {champion: {currentTickets}}} = window
                $('.champions-bottom__rest').css({'width': '280px'}).before(`<div class="champions-bottom__ticket-amount"><span class="ticket_icn"></span>x ${currentTickets}</div>`)
            }
        }
        attachCount()
        new MutationObserver(attachCount).observe($('#contains_all>section')[0], {childList: true})
    }

    fasterSkipButton () {
        Helpers.onAjaxResponse(/class=TeamBattle/i, (response) => {
            Helpers.doWhenSelectorAvailable('button.skip-button', () => {
                $('button.skip-button').click(() => {
                    $('.rounds-info__counter .placeholder-num').text(response.battle.length)
                })
                $('button.skip-button').show()
            })
        })
    }

    showChampionLevel () {
        const {championData, GT} = window
        if (!championData) {return}
        const {champion} = championData
        if (!champion) {return}
        const {level} = champion
        if (!level) {return}

        const annotate = () => {
            $('.champions-top__title').append(`<span class="script-champ-level">(${GT.design.Lvl} ${level})</span>`)
        }
        if ($('.champions-top__title').length) {
            annotate()
        } else {
            const observer = new MutationObserver(() => {
                if ($('.champions-top__title').length) {
                    annotate()
                    observer.disconnect()
                }
            })
            observer.observe($('#contains_all > section')[0], {childList: true})
        }
    }
}

export default ChampionsModule
