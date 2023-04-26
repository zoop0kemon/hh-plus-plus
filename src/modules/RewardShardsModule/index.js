import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

import styles from './styles.lazy.scss'

const MODULE_KEY = 'rewardShards'

const ID_FROM_URL_REGEX = /(?<id>[0-9]+)\/ico[0-9](-[0-9]+x)?.[a-z]+(\?v=[0-9]+)?$/i

const extractIdFromUrl = (url) => {
    const matches = url.match(ID_FROM_URL_REGEX)
    if (!matches || !matches.groups) {
        return
    }

    const { groups: { id } } = matches
    return id
}
const makeShardCount = ({ shards, name, className }) => `<div class="script-shard-count ${className ? className : ''}" shards="${shards}" name="${name}" shards-tooltip><span class="shard"></span> ${shards}</div>`

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
        if (this.hasRun || !this.shouldRun()) { return }

        styles.use()

        Helpers.defer(() => {
            if (Helpers.isCurrentPage('pre-battle')) {
                Helpers.doWhenSelectorAvailable('.rewards_list', this.displayOnPreBattle)
            }
            if (Helpers.isCurrentPage('clubs')) {
                this.displayOnClubChampion()
            }
            if (Helpers.isCurrentPage('pachinko')) {
                this.displayOnPachinko()
            }
            if (Helpers.isCurrentPage('season-arena')) {
                Helpers.doWhenSelectorAvailable('.rewards_list', this.displayOnSeason)
            }
        })

        this.hasRun = true
    }

    displayOnPreBattle() {
        const girlDictionary = Helpers.getGirlDictionary()

        const $girlsReward = $('.girls_reward')
        if (!$girlsReward.length) { return }

        const annotate = ($girlsReward) => {
            const $girlIcos = $girlsReward.find('.girl_ico')
            $girlIcos.each((i, el) => {
                const $el = $(el)
                const $img = $el.find('img')
                if (!$img.length) { return }
                const url = $img.attr('src')

                const id = extractIdFromUrl(url)
                if (!id) { return }
                const girl = girlDictionary.get(id)
                let name, shards
                if (girl) {
                    ({ name, shards } = girl)
                } else {
                    shards = 0
                }

                $el.append(makeShardCount({ name, shards }))
            })
        }

        if ($('.slot_girl_shards .girl_ico').length) {
            annotate($girlsReward)
        } else {
            new MutationObserver(() => {
                if ($('.slot_girl_shards .girl_ico').length) {
                    annotate($girlsReward)
                }
            }).observe($girlsReward.find('[data-reward-display]')[0], { childList: true })
        }
        new MutationObserver(() => {
            if ($('.rewards_tooltip .girl_ico').length) {
                annotate($('.rewards_tooltip'))
            }
        }).observe(document.body, { childList: true })
    }

    displayOnClubChampion() {
        const { clubChampionsData } = window
        if (!clubChampionsData || !clubChampionsData.reward.shards) { return }
        const annotate = () => {
            const { previous_value: shards, name } = clubChampionsData.reward.shards[0]
            $('.reward_wrap .girl-shards-slot').append(makeShardCount({ shards, name }))
        }

        if ($('.reward_wrap .girl-shards-slot').length) {
            annotate()
        } else {
            const observer = new MutationObserver(() => {
                if ($('.reward_wrap .girl-shards-slot').length) {
                    annotate()
                    observer.disconnect()
                }
            })
            observer.observe($('.reward_wrap')[0], { childList: true })
        }
    }

    displayOnPachinko() {
        const annotate = () => {
            const girlDictionary = Helpers.getGirlDictionary()
            $('.rewards_tooltip .girl_ico').each((i, el) => {
                const $el = $(el)
                const $img = $el.find('img')
                if (!$img.length) { return }
                const url = $img.attr('src')

                const id = extractIdFromUrl(url)
                if (!id) { return }
                const girl = girlDictionary.get(id)
                let name, shards
                if (girl) {
                    ({ name, shards } = girl)
                } else {
                    shards = 0
                }

                $el.append(makeShardCount({ name, shards }))
            })
        }

        new MutationObserver(() => {
            if ($('.rewards_tooltip .girl_ico').length) {
                annotate()
            }
        }).observe(document.body, { childList: true })
    }

    displayOnSeason() {
        const annotate = () => {
            const girlDictionary = Helpers.getGirlDictionary()
            $('.arena-rewards-list .slot_girl_shards .girl_ico').each((i, el) => {
                const $el = $(el)
                const $img = $el.find('img')
                if (!$img.length) { return }
                const url = $img.attr('src')

                const id = extractIdFromUrl(url)
                if (!id) { return }
                const girl = girlDictionary.get(id)
                let name, shards
                if (girl) {
                    ({ name, shards } = girl)
                } else {
                    shards = 0
                }

                $el.append(makeShardCount({ name, shards }))

                // Fix layout widths
                $el.parents('.arena-rewards-list').addClass('script-has-girl-reward')
            })
        }

        if ($('.arena-rewards-list .slot_girl_shards .girl_ico').length) {
            annotate()
        } else if ($('.arena-rewards-list .slot_girl_shards').length) {
            const observer = new MutationObserver(() => {
                if ($('.arena-rewards-list .slot_girl_shards .girl_ico').length) {
                    annotate()
                    observer.disconnect()
                }
            })
            observer.observe($('.arena-rewards-list .slot_girl_shards')[0], { childList: true })
        } else if ($('.arena-rewards-list .girls_reward [data-reward-display]').length) {
            const observer = new MutationObserver(() => {
                if ($('.arena-rewards-list .slot_girl_shards .girl_ico').length) {
                    annotate()
                    observer.disconnect()
                }
            })
            observer.observe($('.arena-rewards-list .girls_reward [data-reward-display]')[0], { childList: true })
        }
    }

    displayOnLeague() {
        const annotate = () => {
            const girlDictionary = Helpers.getGirlDictionary()
            const $girl = $('.leagues_girl_reward_container .girl_ico')
            if (!$girl.length) { return }
            const $img = $girl.find('img')
            if (!$img.length) { return }
            const url = $img.attr('src')

            const id = extractIdFromUrl(url)
            if (!id) { return }
            const girl = girlDictionary.get(id)
            let name, shards
            if (girl) {
                ({ name, shards } = girl)
            } else {
                shards = 0
            }

            $girl.find('.script-shard-count').remove()
            $girl.append(makeShardCount({ name, shards }))
        }

        if ($('.leagues_girl_reward_container .girl_ico').length) {
            annotate()
        } else {
            const observer = new MutationObserver(() => {
                if ($('.leagues_girl_reward_container .girl_ico').length) {
                    annotate()
                    observer.disconnect()
                }
            })
            observer.observe($('.leagues_middle_header')[0], { childList: true })
        }
        $(document).on('girl-dictionary:updated', annotate)
    }
}

export default RewardShardsModule
