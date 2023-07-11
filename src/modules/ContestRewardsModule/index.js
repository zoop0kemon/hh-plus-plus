import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import CoreModule from '../CoreModule'

import styles from './styles.lazy.scss'

const MODULE_KEY = 'contestSummary'

const EXPIRATION_TIME = 21*24*60*60 - 70*60
const THRESHOLD = 24*60*60 - 70*60

class ContestRewardsModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun() {
        return Helpers.isCurrentPage('activities')
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}
        styles.use()

        Helpers.defer(() => {
            this.displayRewardSums()
            this.displayExpiration()

            const observer = new MutationObserver((mutations) => {
                for(const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        this.displayRewardSums()
                        this.displayExpiration()
                    }
                }
            })

            observer.observe($('.left_part .scroll_area')[0],{attributes: false, childList: true, subtree: false})
        })

        this.hasRun = true
    }

    displayRewardSums () {
        const $contestPanel = $('.over_bunny.over_panel')
        const { contests_data, buildMultipleSlots } = window
        const contests = contests_data.finished
        let rewards_data = {
            loot: 'true',
            rewards: [],
            shards: []
        }

        contests.forEach((contest) => {
            if ($(`.contest[id_contest="${contest.id_contest}"]`).length) {
                const {data: reward_data, drops} = contest.reward

                if (reward_data.rewards) {
                    reward_data.rewards.forEach((reward) => {
                        const type = reward.type
                        const sum_reward = rewards_data.rewards.find((e) => {
                            const type_matches = e.type === type
                            const gem_matches = type === 'gems' && type_matches ? e.gem_type === reward.gem_type : true
                            const item_matches = type === 'item' && type_matches ? e.value.item.id_item === reward.value.item.id_item : true
                            const armor_matches = type === 'armor' && type_matches ? e.display === reward.display : true
                            return type_matches && gem_matches && item_matches && armor_matches
                        })

                        if (sum_reward) {
                            if (typeof sum_reward.value === 'object') {
                                sum_reward.value.quantity += parseInt(reward.value.quantity) || 1
                            } else if (type === 'soft_currency') {
                                sum_reward.value += drops.hero.soft_currency
                            }else {
                                sum_reward.value += I18n.parseLocaleRoundedInt(reward.value.toString())
                            }
                        } else {
                            let copied_reward = JSON.parse(JSON.stringify(reward))
                            if (typeof reward.value === 'object') {
                                copied_reward.value.quantity = parseInt(reward.value.quantity) || 1
                            } else if (type === 'soft_currency') {
                                copied_reward.value = drops.hero.soft_currency
                            } else {
                                copied_reward.value = I18n.parseLocaleRoundedInt(reward.value.toString())
                            }
                            rewards_data.rewards.push(copied_reward)
                        }
                    })
                }
                if (reward_data.shards) {
                    reward_data.shards.forEach((girl) => {
                        const sum_girl = rewards_data.shards.find(e => e.id_girl == girl.id_girl)

                        if (sum_girl) {
                            sum_girl.value += girl.value
                        } else {
                            rewards_data.shards.push(JSON.parse(JSON.stringify(girl)))
                        }
                    })
                }
            }
        })

        rewards_data.rewards.forEach((reward) => {
            if (reward.type === 'soft_currency') {
                reward.value = I18n.nRounding(reward.value, 0, 1)
            } else if (typeof reward.value === 'number') {
                reward.value = I18n.nThousand(reward.value)
            }
        })
        const $reward_wrap = $(`<div class="reward_wrap">${buildMultipleSlots(rewards_data, 'xs')}</div>`)

        if (!this.$rewardsDisplay) {
            this.$rewardsDisplay = $('<div class="scriptRewardsDisplay"></div>')
            $contestPanel.append(this.$rewardsDisplay)
        }
        this.$rewardsDisplay.html('')
        this.$rewardsDisplay.append(`<h3>${this.label('totalRewards', {contests: $('.contest .ended').length})}</h3>`)
        this.$rewardsDisplay.append($reward_wrap)
        this.$rewardsDisplay.append(`<br>${this.label('contestsWarning')}`)
    }

    displayExpiration () {
        const {contests_data, GT, createTimer} = window

        $('.contest .contest_header.ended').each((i, contest_header) => {
            const $contest_header = $(contest_header)
            if (!$contest_header.find('.expiration').length) {
                const id_contest = $contest_header.parent().attr('id_contest')
                const contest_data = contests_data.finished.find(e => e.id_contest == id_contest)
                const expires_in = EXPIRATION_TIME - (-contest_data.remaining_time)


                const $timerTarget = $('<span class="expiration_timer"></span>')
                $contest_header.append($(`<div class="expiration">${GT.design.expires_in} </div>`).append($timerTarget))
                if (expires_in <= THRESHOLD) {
                    $contest_header.addClass('expiration-soon')
                }

                const onComplete = ()  => {}
                const onUpdate = (state) => {
                    if (state.time_remaining <= THRESHOLD) {
                        $contest_header.addClass('expiration-soon')
                    }
                }
                createTimer($timerTarget, expires_in, {onUpdate: onUpdate, onComplete: onComplete}).startTimer()
            }
        })
    }
}

export default ContestRewardsModule
