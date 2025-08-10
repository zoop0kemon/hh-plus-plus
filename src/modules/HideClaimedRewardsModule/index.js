import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

import styles from './styles.lazy.scss'

const MODULE_KEY = 'hideClaimedRewards'

// Inspired by the hide claimed rewards module from the Ben Brazke script
class HideClaimedRewardsModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return ['path-of-valor', 'path-of-glory', 'season.html', 'event.html', 'seasonal', 'member-progression'].some(page => Helpers.isCurrentPage(page))
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            if (['path-of-valor', 'path-of-glory'].some(page => Helpers.isCurrentPage(page))) {
                this.hideClaimedRewards({
                    scroll_area: '.potions-paths-progress-bar-tiers',
                    tier: '.potions-paths-tier',
                    tiers_unlocked_var: 'currentTier',
                    is_vertical: true,
                    progress_bar: '.potions-paths-progress-bar .potions-paths-progress-bar-current',
                    girl: '.girl-preview .avatar, .girl-preview .animated-girl-display',
                    hide: () => {
                        $('.potions-paths-tier:not(.unclaimed):has(.claimed-slot)').addClass('script-hide-claimed')
                        return $('.potions-paths-tier.unclaimed').toArray()
                    }
                })
            } else if (Helpers.isCurrentPage('season.html')) {
                const {season_has_pass} = window
                const can_claim = season_has_pass ? 2 : 1
                const cant_claim = season_has_pass ? 0 : 1

                this.hideClaimedRewards({
                    wait_for: '.season-timer',
                    scroll_area: '.rewards_container_seasons',
                    tier: '.rewards_pair',
                    tiers_unlocked_var: 'season_tier',
                    girl: '#girls_holder .girl_block, #girls_holder .animated-girl-display',
                    hide: () => {
                        const claimable_tiers = []
                        $('.rewards_pair').each((i, el) => {
                            const claimed = $(el).find('.reward_wrapper.reward_claimed').length
                            const claimable = $(el).find('.reward_wrapper.reward_is_claimable').length
                            if (claimed === can_claim) {
                                $(el).addClass('script-hide-claimed')
                            } else if (claimable > cant_claim) {
                                claimable_tiers.push(el)
                            }
                        })
                        return claimable_tiers
                    }
                })
            } else if (Helpers.isCurrentPage('event.html') && !Helpers.isCurrentPage('world-boss-event')) {
                const {current_event: {can_participate, type}} = window
                if (can_participate) {
                    if (type === 'path_event') {
                        this.hideClaimedRewards({
                            scroll_area: '.scroll-area.poa',
                            tier: '.nc-poa-reward-pair',
                            tiers_unlocked_var: 'next_tier', // off by one, but not needed since no progress bar
                            girl: '#poa-content .girls .girl-avatar, #poa-content .girls .animated-girl-display',
                            hide: () => {
                                const claimable_tiers = []
                                $('.nc-poa-reward-pair').each((i, el) => {
                                    const claimed = $(el).find('.nc-poa-reward-container.claimed').length
                                    const claimable = $(el).find('.nc-poa-reward-container.claimable').length

                                    if (claimable > 0) {
                                        claimable_tiers.push(el)
                                    } else if (claimed > 0) {
                                        $(el).addClass('script-hide-claimed')
                                    }
                                })
                                return claimable_tiers
                            }
                        })
                    } else if (type === 'dp_event') {
                        this.hideClaimedRewards({
                            scroll_area: '.player-progression-container',
                            tier: '.tier-container',
                            tiers_unlocked_var: 'current_tier',
                            progress_bar: '.dp-progress-bar .dp-progress-bar-current',
                            girl: '.right-container [class*="girl-avatar"]',
                            hide: () => {
                                $('.tier-container:has(.claimed-reward-tick.display-block)').addClass('script-hide-claimed')
                                return $('.tier-container:has([rel="reward-claim"]:not(.hidden):not([style="display: none;"]))').toArray()
                            }
                        })
                    }
                }
            } else if (Helpers.isCurrentPage('seasonal')) {
                this.hideClaimedRewards({
                    scroll_area: '.mega-progress-bar-section',
                    tier: '.mega-tier-container',
                    tiers_unlocked_var: 'mega_current_tier',
                    progress_bar: '.mega-progress-bar .mega-progress-bar-current',
                    girl: '.girls-reward-container .avatar, .girls-reward-container .animated-girl-display',
                    hide: () => {
                        $('.mega-tier-container:has(.claimed):not(:has([rel="claim"]))').addClass('script-hide-claimed')
                        return $('.mega-tier-container:has([rel="claim"])').toArray()
                    }
                })
            } else if (Helpers.isCurrentPage('member-progression')) {
                this.hideClaimedRewards({
                    wait_for: '.info_text_container',
                    scroll_area: '.tiers-container',
                    tier: '.tier',
                    tiers_unlocked_var: 'current_tier',
                    progress_bar: '.progress-bar .progress-bar-current',
                    girl: '.page-girl',
                    hide: () => {
                        $('.tier.claimed').addClass('script-hide-claimed')
                        return $('.tier.unclaimed').toArray()
                    }
                })
            }
        })

        this.hasRun = true
    }

    hideClaimedRewards ({wait_for, scroll_area, tier, tiers_unlocked_var, is_vertical, progress_bar, girl, hide}) {
        Helpers.doWhenSelectorAvailable(wait_for ? wait_for : '.timer', () => {
            let hidden = false
            let claimable = []
            const is_horizontal = !is_vertical
            const $progressBar = progress_bar ? $(progress_bar).eq(0) : null
            const tier_size = is_horizontal ? $(tier).width() : $(tier).height()

            const assertHidden = () => {
                claimable = hide()
                if ($progressBar) {
                    $progressBar.addClass('no-transition')
                    const offset = claimable.length ? (is_horizontal ? claimable.at(-1).offsetLeft : claimable.at(-1).offsetTop) : -tier_size/2
                    $progressBar.css(is_horizontal ? 'width' : 'height', offset + tier_size/2)
                    $progressBar[0].offsetHeight
                    $progressBar.removeClass('no-transition')
                }
                hidden = true
            }
            const assertShown = () => {
                $('.script-hide-claimed').removeClass('script-hide-claimed')
                if ($progressBar) {
                    $progressBar.addClass('no-transition')
                    const tiers_unlocked = parseInt(window[tiers_unlocked_var])
                    const offset = tiers_unlocked ? (is_horizontal ? $(tier)[tiers_unlocked-1].offsetLeft : $(tier)[tiers_unlocked-1].offsetTop) : -tier_size/2
                    $progressBar.css(is_horizontal ? 'width' : 'height', offset + tier_size/2)
                    $progressBar[0].offsetHeight
                    $progressBar.removeClass('no-transition')
                }
                claimable = []
                hidden = false
            }

            const $scrollArea = is_horizontal ? $(scroll_area) : $(scroll_area).parent()
            $scrollArea.finish()
            const scroll_size = is_horizontal ? $scrollArea.scrollLeft() : $scrollArea.scrollTop()
            const full_size = is_horizontal ? $(scroll_area)[0].scrollWidth : $(scroll_area)[0].scrollHeight
            assertHidden()
            const hide_size = is_horizontal ? $(scroll_area)[0].scrollWidth : $(scroll_area)[0].scrollHeight
            if (is_horizontal) {
                $scrollArea.scrollLeft(scroll_size - (full_size - hide_size))
            } else {
                $scrollArea.scrollTop(scroll_size - (full_size - hide_size))
            }

            const toggle = () => {
                if (hidden) {
                    assertShown()
                } else {
                    assertHidden()
                }
            }
            $(girl).click(toggle)

            const observer = new MutationObserver((mutations) => {
                if (!hidden) {return}
                let shouldUpdate = false

                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes') {
                        const {attributeName, target} = mutation
                        if (attributeName === 'class' && claimable.includes(target.closest(tier)) && !$(target).hasClass('script-hide-claimed')) {
                            shouldUpdate = true
                        }
                    }
                })

                if (shouldUpdate) {
                    assertHidden()
                }
            })
            observer.observe($(scroll_area)[0], {attributes: true, attributeFilter: ['class'], subtree: true})
        })
    }
}

export default HideClaimedRewardsModule
