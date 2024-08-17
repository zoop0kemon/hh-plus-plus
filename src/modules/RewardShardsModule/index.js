import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

import styles from './styles.lazy.scss'

const MODULE_KEY = 'rewardShards'

const ID_FROM_URL_REGEX = /(?<id>[0-9]+)\/ico[0-9](-[0-9]+x)?.[a-z]+(\?v=[0-9]+)?$/i

const extractIdFromUrl = (url) => {
    const matches = url.match(ID_FROM_URL_REGEX)
    if (!matches || !matches.groups) {return}

    const {groups: {id}} = matches
    return id
}
const makeShardCount = ({shards, name, className}) => `<div class="script-shard-count ${className ? className : ''}" shards="${shards}" name="${name}" shards-tooltip><span class="shard_icn"></span> ${shards}</div>`

class RewardShardsModule extends CoreModule {
    constructor() {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun() {
        return ['pre-battle', 'clubs', 'pachinko', 'season-arena'].some(page => Helpers.isCurrentPage(page))
    }

    run() {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            if (Helpers.isCurrentPage('pre-battle')) {
                Helpers.doWhenSelectorAvailable('.rewards_list', () => {
                    this.displayOnPreBattle()
                    this.fixRewardScroll()
                })
            }
            if (Helpers.isCurrentPage('clubs')) {
                this.displayOnClubChampion()
            }
            if (Helpers.isCurrentPage('pachinko')) {
                this.displayOnPachinko()
            }
            if (Helpers.isCurrentPage('season-arena')) {
                Helpers.doWhenSelectorAvailable('.rewards_list', () => {
                    this.displayOnSeason()
                    this.fixRewardScroll()
                })
            }
        })

        this.hasRun = true
    }

    async displayOnPreBattle() {
        const $girlsReward = $('.slot.girl_ico')
        if (!$girlsReward.length) {return}
        const girlDictionary = await Helpers.getGirlDictionary()

        const annotate = ($girlsReward) => {
            const $girlIcos = $girlsReward.find('.girl_ico')
            $girlIcos.each((i, el) => {
                const $el = $(el)
                const $img = $el.find('img')
                if (!$img.length) {return}
                const url = $img.attr('src')

                const id = extractIdFromUrl(url)
                if (!id) {return}
                const girl = girlDictionary.get(id)
                const name = girl?.name || '????'
                const shards = girl?.shards !== undefined ? girl.shards : '?'

                $el.append(makeShardCount({name, shards}))
            })
        }

        if ($('.slot.girl_ico .girl_ico').length) {
            annotate($girlsReward)
        } else {
            new MutationObserver(() => {
                if ($('.slot.girl_ico .girl_ico').length) {
                    annotate($girlsReward)
                }
            }).observe($girlsReward[0], {childList: true})
        }
        new MutationObserver(() => {
            if ($('.rewards_tooltip .girl_ico').length) {
                annotate($('.rewards_tooltip'))
            }
        }).observe(document.body, {childList: true})
    }

    displayOnClubChampion() {
        const {club_champion_data} = window
        if (!club_champion_data || !club_champion_data.reward.shards) {return}
        const annotate = () => {
            const {previous_value: shards, name} = club_champion_data.reward.shards[0]
            $('.girl-shards-reward-wrapper .slot_girl_shards').append(makeShardCount({shards, name}))
        }

        Helpers.doWhenSelectorAvailable('.tabs-switcher#club-tabs', () => {
            $('.tabs-switcher#club-tabs #club_champions_tab').on('click', () => {
                Helpers.doWhenSelectorAvailable('.girl-shards-reward-wrapper .slot_girl_shards', () => {
                    setTimeout(annotate, 10)
                })
            })
        })
    }

    displayOnPachinko() {
        const annotate = async () => {
            const girlDictionary = await Helpers.getGirlDictionary()
            $('.rewards_tooltip .girl_ico').each((i, el) => {
                const $el = $(el)
                const $img = $el.find('img')
                if (!$img.length) {return}
                const url = $img.attr('src')

                const id = extractIdFromUrl(url)
                if (!id) {return}
                const girl = girlDictionary.get(id)
                const name = girl?.name || '????'
                const shards = girl?.shards !== undefined ? girl.shards : '?'

                $el.append(makeShardCount({name, shards}))
            })
        }

        new MutationObserver(() => {
            if ($('.rewards_tooltip .girl_ico').length) {
                annotate()
            }
        }).observe(document.body, {childList: true})
    }

    async displayOnSeason() {
        const girlDictionary = await Helpers.getGirlDictionary()

        const annotate = (selector) => {
            $(selector).each((i, el) => {
                const $el = $(el)
                const $img = $el.find('img')
                if (!$img.length) {return}
                const url = $img.attr('src')

                const id = extractIdFromUrl(url)
                if (!id) {return}
                const girl = girlDictionary.get(id)
                const name = girl?.name || '????'
                const shards = girl?.shards !== undefined ? girl.shards : '?'

                $el.find('.shards').hide()
                $el.append(makeShardCount({name, shards}))
            })
        }

        Helpers.doWhenSelectorAvailable('.slot.girl_ico .slot_girl_shards', () => {
            annotate('.slot.girl_ico .slot_girl_shards')
        })
        new MutationObserver(() => {
            if ($('.rewards_tooltip .girl_ico').length) {
                annotate('.rewards_tooltip .girl_ico')
            }
        }).observe(document.body, {childList: true})
    }

    fixRewardScroll() {
        $('.rewards_list .scroling_animation:not(.one_icon) .scroling_wrapper').each((i, el) => {
            $(el).children().clone().appendTo($(el))
            setTimeout(() => {
                $(el).css('animation-name', 'script_rewards_scrolling')
            }, 100)
        })
    }
}

export default RewardShardsModule
