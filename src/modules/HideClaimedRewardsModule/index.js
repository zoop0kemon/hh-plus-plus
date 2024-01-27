import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

import styles from './styles.lazy.scss'

const MODULE_KEY = 'hideClaimedRewards'

const POV_REM_PER_GROUP = 0.3 + 3.6 // margin-top + height
const POV_PX_PER_GROUP = POV_REM_PER_GROUP * 16
const SEASON_TIER_WIDTH = 69.6

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
                this.pov()
            } else if (Helpers.isCurrentPage('season.html')) {
                this.season()
            } else if (Helpers.isCurrentPage('event.html')) {
                this.poa()
                this.dp()
            } else if (Helpers.isCurrentPage('seasonal')) {
                this.seasonalEvent()
                this.megaEvent()
            } else if (Helpers.isCurrentPage('member-progression')) {
                this.heroLevel()
            }
        })

        this.hasRun = true
    }

    pov () {
        Helpers.doWhenSelectorAvailable('.potions-paths-timer', () => {
            let hidden = false
            let $groupsToHide = $('.potions-paths-tier:not(.unclaimed):has(.claimed-slot)')
            let $groupsRemaining = $('.potions-paths-tier.unclaimed')
            let claimedCount = $groupsToHide.length
            let unclaimedCount = $groupsRemaining.length
            const heightPattern = /height: ?(?<existingLength>[0-9.a-z%]+);?/
            let existingLengthStr
            let newLength
            const $progressBar = $('.potions-paths-progress-bar .potions-paths-progress-bar-current')
            const styleAttr = $progressBar.attr('style')

            const assertHidden = () => {
                $groupsToHide = $('.potions-paths-tier:not(.unclaimed):has(.claimed-slot)')
                $groupsRemaining = $('.potions-paths-tier.unclaimed')
                claimedCount = $groupsToHide.length
                unclaimedCount = $groupsRemaining.length
                hidden = true
                if (claimedCount === 0) {
                    // nothing to do
                    return
                }

                $groupsToHide.addClass('script-hide-claimed')
                if (styleAttr) {
                    setTimeout(() => {
                        if (existingLengthStr) {
                            newLength = existingLengthStr
                            if (existingLengthStr.endsWith('px')) {
                                const existingLength = parseInt(existingLengthStr)
                                newLength = Math.round(existingLength - (claimedCount * POV_PX_PER_GROUP)) + 'px'
                            } else if (existingLengthStr.endsWith('rem')) {
                                const existingLength = parseFloat(existingLengthStr)
                                newLength = existingLength - (claimedCount * POV_REM_PER_GROUP) + 'rem'
                            }
                        }
                        $progressBar.addClass('no-transition')
                        $progressBar.attr('style', styleAttr.replace(heightPattern, `height:${newLength};`))
                        $progressBar[0].offsetHeight
                        $progressBar.removeClass('no-transition')
                    }, 1)
                }
            }
            const assertShown = () => {
                $('.script-hide-claimed').removeClass('script-hide-claimed')
                hidden = false
                if (styleAttr) {
                    $progressBar.addClass('no-transition')
                    $progressBar.attr('style', styleAttr.replace(heightPattern, `height:${existingLengthStr};`))
                    $progressBar[0].offsetHeight
                    $progressBar.removeClass('no-transition')
                }
            }

            if (styleAttr) {
                const matches = styleAttr.match(heightPattern)
                if (matches && matches.groups) {
                    existingLengthStr = matches.groups.existingLength
                }
            }
            assertHidden()
            $('.potions-paths-progress-bar-section').stop(true).animate({
                scrollTop: Math.max(0, (unclaimedCount * POV_PX_PER_GROUP) - 150)
            }, 100)

            const toggle = () => {
                if (hidden) {
                    assertShown()
                } else {
                    assertHidden()
                }
            }

            const observer = new MutationObserver((mutations) => {
                if (!hidden) {return}
                let shouldUpdate = false
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes') {
                        const {attributeName, target} = mutation
                        if (attributeName === 'class' && !$(target).hasClass('potions-paths-progress-bar-current') && 
                            !$(target).hasClass('unclaimed')&& !$groupsToHide.toArray().includes(target)) {
                            shouldUpdate = true
                        }
                    }
                })

                if (shouldUpdate) {
                    assertHidden()
                }
            })
            observer.observe($('.potions-paths-progress-bar-tiers')[0], {attributes: true, attributeFilter: ['class'], subtree: true})

            $('.girl-preview').click(toggle)
        })
    }

    season () {
        let hidden = false

        const fixWidth = () => {
            const $row = $('.rewards_seasons_row')
            $row.css('width', 'max-content')
        }
        const assertHidden = (shouldScroll) => {
            const $tiers = $('.rewards_pair')
            const {season_tiers, season_has_pass, season_tier} = window

            let unclaimedCount = 0

            $tiers.each((i, el) => {
                const {free_reward_picked, pass_reward_picked, tier} = season_tiers[i]
                if (free_reward_picked === '1' && (!season_has_pass || pass_reward_picked === '1')) {
                    $(el).addClass('script-hide-claimed')
                } else if (parseInt(tier) <= season_tier) {
                    unclaimedCount++
                }
            })

            hidden = true

            fixWidth()

            const $rowScroll = $('.rewards_container_seasons')
            $rowScroll.getNiceScroll().resize()

            if (shouldScroll) {
                const left = SEASON_TIER_WIDTH * unclaimedCount
                $rowScroll.getNiceScroll(0).doScrollLeft(Math.max(0, left - 600), 200)
            }
        }
        const assertShown = () => {
            $('.script-hide-claimed').removeClass('script-hide-claimed')
            hidden = false
            fixWidth()
            const $rowScroll = $('.rewards_container_seasons')
            $rowScroll.getNiceScroll().resize()
        }

        const $rowScroll = $('.rewards_container_seasons')
        if ($rowScroll.length && $rowScroll.getNiceScroll(0).doScrollLeft) {
            assertHidden(true)
        } else {
            const observer = new MutationObserver(() => {
                const $rowScroll = $('.rewards_container_seasons')
                if ($rowScroll.length && $rowScroll.getNiceScroll(0).doScrollLeft) {
                    observer.disconnect()
                    assertHidden(true)
                }
            })
            observer.observe(document.getElementById('seasons_tab_container'), {childList: true, subtree: true})
        }

        Helpers.onAjaxResponse(/action=season_claim/, (response, opt) => {
            const searchParams = new URLSearchParams(opt.data)

            // key is free/pass_<tier>
            const key = searchParams.get('key')

            const keyPattern = /(?<type>free|pass)_(?<tier>[0-9]+)/
            const matches = key.match(keyPattern)

            let type, tier

            if (matches && matches.groups) {
                ({type, tier} = matches.groups)
            }

            const {season_tiers} = window

            const tierToUpdate = season_tiers.find(({tier: check})=>tier === check)

            if (tierToUpdate) {
                tierToUpdate[`${type}_reward_picked`] = '1'
            }

            if (hidden) {
                assertHidden(false)
            }
        })
        const toggle = () => {
            if (hidden) {
                assertShown()
            } else {
                assertHidden(false)
            }
        }
        $('#girls_holder').click(toggle)
    }

    poa () {
        if(!$('a.active[href*="?tab=path_event_"]').length){return}

        Helpers.doWhenSelectorAvailable('.nc-poa-reward-pair', () => {
            const {bonus_rewards_unlocked, next_tier} = window

            const assertHidden = () => {
                $('.nc-poa-reward-pair').each((i, el) => {
                    const $free = $(el).find('.nc-poa-free-reward')
                    const $pass = $(el).find('.nc-poa-locked-reward')
                    if ( $free.hasClass('claimed') && ( $pass.hasClass('claimed') || !bonus_rewards_unlocked)) {
                        $(el).addClass('script-hide-claimed')
                    }
                })
            }
            const assertShown = () => {
                $('.nc-poa-reward-pair').removeClass('script-hide-claimed')
            }
            const fixScroll = () => {
                $('.scroll-area').getNiceScroll().resize()
            }
            assertHidden()
            fixScroll()
            $('.scroll-area').getNiceScroll(0).doScrollLeft(Math.max(0, $('.nc-poa-reward-pair').eq(next_tier-1).offset().left - ($('.nc-poa-reward-pair').width()+16)*6), 100)
            const toggle = () => {
                if ($('.script-hide-claimed').length) {
                    assertShown()
                } else {
                    assertHidden()
                }
                fixScroll()
            }
            $('#poa-content .girls').click(()=>{toggle()})
        })
    }
    
    dp () {
        if(!$('a.active[href*="?tab=dp_event_"]').length || $('#nc-poa-no-participation').length){return}

        Helpers.doWhenSelectorAvailable('.tiers-progression', () => {
            let hidden = false
            let $groupsToHide = $('.tier-container:has(.claimed-reward-tick.display-block)')
            let $groupsRemaining = $('.tier-container:has([rel="reward-claim"]:not(.hidden):not([style="display: none;"]))')
            const widthPattern = /width: ?(?<existingLength>[0-9.a-z%]+);?/
            let existingLengthStr
            let newLength
            const $progressBar = $('.dp-progress-bar .dp-progress-bar-current')
            const styleAttr = $progressBar.attr('style')

            const assertHidden = () => {
                $groupsToHide = $('.tier-container:has(.claimed-reward-tick.display-block)')
                $groupsRemaining = $('.tier-container:has([rel="reward-claim"]:not(.hidden):not([style="display: none;"]))')
                hidden = true
                if ($groupsToHide.length == 0) {return}

                $groupsToHide.addClass('script-hide-claimed')
                if (styleAttr) {
                    setTimeout(() => {
                        if ($groupsRemaining.length) {
                            newLength = $groupsRemaining.last().find('.tier-level')[0].offsetLeft
                        } else {
                            newLength = 0
                        }
                        $progressBar.addClass('no-transition')
                        $progressBar.attr('style', styleAttr.replace(widthPattern, `width:${newLength}px;`))
                        $progressBar[0].offsetHeight
                        $progressBar.removeClass('no-transition')
                    }, 1)
                }
            }
            const assertShown = () => {
                $('.tier-container').removeClass('script-hide-claimed')
                hidden = false
                if (styleAttr) {
                    $progressBar.addClass('no-transition')
                    $progressBar.attr('style', styleAttr.replace(widthPattern, `width:${existingLengthStr};`))
                    $progressBar[0].offsetHeight
                    $progressBar.removeClass('no-transition')
                }
            }
            const fixScroll = () => {
                $('.player-progression-container').getNiceScroll().resize()
            }

            if (styleAttr) {
                const matches = styleAttr.match(widthPattern)
                if (matches && matches.groups) {
                    existingLengthStr = matches.groups.existingLength
                } 
            }
            assertHidden()
            fixScroll()
            $('.player-progression-container').stop(true).animate({
                scrollLeft: Math.max(0, newLength - 150)
            }, 100)
            const toggle = () => {
                if (hidden) {
                    assertShown()
                } else {
                    assertHidden()
                }
                fixScroll()
            }

            const observer = new MutationObserver((mutations) => {
                if (!hidden) {return}
                let shouldUpdate = false
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes') {
                        const {attributeName, target} = mutation
                        if (attributeName === 'class' && !$(target).hasClass('dp-progress-bar-current')) {
                            const tier = $(target).closest('.tier-container')[0]
                            if (($(tier).find('[rel="reward-claim"]').css('display') == 'none') && !$groupsToHide.toArray().includes(tier)) {
                                shouldUpdate = true
                            }
                        }
                    }
                })

                if (shouldUpdate) {
                    assertHidden()
                }
            })
            observer.observe($('.tiers-progression')[0], {attributes: true, attributeFilter: ['class'], subtree: true})

            $('.right-container').click(()=>{toggle()})
        })
    }

    seasonalEvent () {
        Helpers.doWhenSelectorAvailable('.seasonal-timer.timer', () => {
            let hidden = false
            let $groupsToHide = $('.seasonal-tier.claimed')
            let $groupsRemaining = $('.seasonal-tier.unclaimed')
            let claimedCount = $groupsToHide.length
            const widthPattern = /width: ?(?<existingLength>[0-9.a-z%]+);?/
            const containerWidth = $('.seasonal-tier-container').width()
            let existingLengthStr
            let newLength
            const $progressBar = $('.seasonal-progress-bar .seasonal-progress-bar-current')
            const styleAttr = $progressBar.attr('style')

            const assertHidden = () => {
                $groupsToHide = $('.seasonal-tier.claimed')
                $groupsRemaining = $('.seasonal-tier.unclaimed')
                claimedCount = $groupsToHide.length
                hidden = true
                if (claimedCount === 0) {
                    // nothing to do
                    return
                }

                $groupsToHide.addClass('script-hide-claimed')
                if (styleAttr) {
                    setTimeout(() => {
                        if ($groupsRemaining.length) {
                            newLength = containerWidth * ($groupsRemaining.length - 0.5)
                        } else {
                            newLength = 0
                        }
                        $progressBar.addClass('no-transition')
                        $progressBar.attr('style', styleAttr.replace(widthPattern, `width:${newLength}px;`))
                        $progressBar[0].offsetHeight
                        $progressBar.removeClass('no-transition')
                    }, 1)
                }
                setTimeout(() => {
                    $('.seasonal-progress-bar-section').getNiceScroll().resize()
                }, 1200)
            }
            const assertShown = () => {
                $('.script-hide-claimed').removeClass('script-hide-claimed')
                hidden = false
                if (styleAttr) {
                    $progressBar.addClass('no-transition')
                    $progressBar.attr('style', styleAttr.replace(widthPattern, `width:${existingLengthStr};`))
                    $progressBar[0].offsetHeight
                    $progressBar.removeClass('no-transition')
                }
                setTimeout(() => {
                    $('.seasonal-progress-bar-section').getNiceScroll().resize()
                }, 1200)
            }

            if (styleAttr) {
                const matches = styleAttr.match(widthPattern)
                if (matches && matches.groups) {
                    existingLengthStr = matches.groups.existingLength
                }
            }
            assertHidden()
            $('.seasonal-progress-bar-section').stop(true).animate({
                scrollLeft: Math.max(0, newLength - 150)
            }, 100)

            const toggle = () => {
                if (hidden) {
                    assertShown()
                } else {
                    assertHidden()
                }
            }

            const observer = new MutationObserver((mutations) => {
                if (!hidden) {return}
                let shouldUpdate = false
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes') {
                        const {attributeName, target} = mutation
                        if (attributeName === 'class' && !$(target).hasClass('seasonal-progress-bar-current') &&
                            !$(target).hasClass('unclaimed') && !$groupsToHide.toArray().includes(target)) {
                            shouldUpdate = true
                        }
                    }
                })

                if (shouldUpdate) {
                    assertHidden()
                }
            })
            observer.observe($('.seasonal-progress-bar-tiers')[0], {attributes: true, attributeFilter: ['class'], subtree: true})

            $('.girls-reward-container').click(toggle)
        })
    }

    megaEvent () {
        Helpers.doWhenSelectorAvailable('.mega-timer.timer', () => {
            let hidden = false
            let $groupsToHide = $('.mega-tier-container:has(.claimed):not(:has([rel="claim"]))')
            let $groupsRemaining = $('.mega-tier-container:has([rel="claim"])')
            let claimedCount = $groupsToHide.length
            const widthPattern = /width: ?(?<existingLength>[0-9.a-z%]+);?/
            const containerWidth = $('.mega-tier-container').width()
            let existingLengthStr
            let newLength
            const $progressBar = $('.mega-progress-bar .mega-progress-bar-current')
            const styleAttr = $progressBar.attr('style')

            const assertHidden = () => {
                $groupsToHide = $('.mega-tier-container:has(.claimed):not(:has([rel="claim"]))')
                $groupsRemaining = $('.mega-tier-container:has([rel="claim"])')
                claimedCount = $groupsToHide.length
                hidden = true
                if (claimedCount === 0) {
                    // nothing to do
                    return
                }

                $groupsToHide.addClass('script-hide-claimed')
                if (styleAttr) {
                    setTimeout(() => {
                        if ($groupsRemaining.length) {
                            newLength = containerWidth * ($groupsRemaining.length - 0.5)
                        } else {
                            newLength = 0
                        }
                        $progressBar.addClass('no-transition')
                        $progressBar.attr('style', styleAttr.replace(widthPattern, `width:${newLength}px;`))
                        $progressBar[0].offsetHeight
                        $progressBar.removeClass('no-transition')
                    }, 1)
                }
                setTimeout(() => {
                    $('.mega-progress-bar-section').getNiceScroll().resize()
                }, 1200)
            }
            const assertShown = () => {
                $('.script-hide-claimed').removeClass('script-hide-claimed')
                hidden = false
                if (styleAttr) {
                    $progressBar.addClass('no-transition')
                    $progressBar.attr('style', styleAttr.replace(widthPattern, `width:${existingLengthStr};`))
                    $progressBar[0].offsetHeight
                    $progressBar.removeClass('no-transition')
                }
                setTimeout(() => {
                    $('.mega-progress-bar-section').getNiceScroll().resize()
                }, 1200)
            }

            if (styleAttr) {
                const matches = styleAttr.match(widthPattern)
                if (matches && matches.groups) {
                    existingLengthStr = matches.groups.existingLength
                }
            }
            assertHidden()
            $('.mega-progress-bar-section').stop(true).animate({
                scrollLeft: Math.max(0, newLength - 150)
            }, 100)

            const toggle = () => {
                if (hidden) {
                    assertShown()
                } else {
                    assertHidden()
                }
            }

            const observer = new MutationObserver((mutations) => {
                if (!hidden) {return}
                let shouldUpdate = false
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes') {
                        const {attributeName, target} = mutation
                        if (attributeName === 'class' && !$(target).hasClass('mega-progress-bar-current') &&
                            !$(target).hasClass('unclaimed') && !$groupsToHide.toArray().includes(target)) {
                            shouldUpdate = true
                        }
                    }
                })

                if (shouldUpdate) {
                    assertHidden()
                }
            })
            observer.observe($('.mega-progress-bar-tiers')[0], {attributes: true, attributeFilter: ['class'], subtree: true})

            $('.girls-reward-container').click(toggle)
        })
    }

    heroLevel () {
        Helpers.doWhenSelectorAvailable('.progress-bar', () => {
            let hidden = false
            let $groupsToHide = $('.tier.claimed')
            let $groupsRemaining = $('.tier.unclaimed')
            let claimedCount = $groupsToHide.length
            const widthPattern = /width: ?(?<existingLength>[0-9.a-z%]+);?/
            const containerWidth = $('.tiers .tier').outerWidth()
            let existingLengthStr
            let newLength
            const $progressBar = $('.progress-bar .progress-bar-current')
            const styleAttr = $progressBar.attr('style')

            const assertHidden = () => {
                $groupsToHide = $('.tier.claimed')
                $groupsRemaining = $('.tier.unclaimed')
                claimedCount = $groupsToHide.length
                hidden = true
                if (claimedCount === 0) {
                    // nothing to do
                    return
                }

                $groupsToHide.addClass('script-hide-claimed')
                if (styleAttr) {
                    setTimeout(() => {
                        if ($groupsRemaining.length) {
                            newLength = containerWidth * ($groupsRemaining.length - 0.5)
                        } else {
                            newLength = 0
                        }
                        $progressBar.addClass('no-transition')
                        $progressBar.attr('style', styleAttr.replace(widthPattern, `width:${newLength}px;`))
                        $progressBar[0].offsetHeight
                        $progressBar.removeClass('no-transition')
                    }, 1)
                }
                setTimeout(() => {
                    $('.progress-bar-current').getNiceScroll().resize()
                }, 1200)
            }
            const assertShown = () => {
                $('.script-hide-claimed').removeClass('script-hide-claimed')
                hidden = false
                if (styleAttr) {
                    $progressBar.addClass('no-transition')
                    $progressBar.attr('style', styleAttr.replace(widthPattern, `width:${existingLengthStr};`))
                    $progressBar[0].offsetHeight
                    $progressBar.removeClass('no-transition')
                }
                setTimeout(() => {
                    $('.progress-bar-current').getNiceScroll().resize()
                }, 1200)
            }

            if (styleAttr) {
                const matches = styleAttr.match(widthPattern)
                if (matches && matches.groups) {
                    existingLengthStr = matches.groups.existingLength
                }
            }
            assertHidden()
            $('.progress-bar-current').stop(true).animate({
                scrollLeft: Math.max(0, newLength - 150)
            }, 100)

            const toggle = () => {
                if (hidden) {
                    assertShown()
                } else {
                    assertHidden()
                }
            }

            const observer = new MutationObserver((mutations) => {
                if (!hidden) {return}
                let shouldUpdate = false
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes') {
                        const {attributeName, target} = mutation
                        if (attributeName === 'class' && !$(target).hasClass('progress-bar-current') &&
                            !$(target).hasClass('unclaimed') && !$groupsToHide.toArray().includes(target)) {
                            shouldUpdate = true
                        }
                    }
                })

                if (shouldUpdate) {
                    assertHidden()
                }
            })
            observer.observe($('.tiers-container .tiers')[0], {attributes: true, attributeFilter: ['class'], subtree: true})

            $('.page-girl').click(toggle)
        })
    }
}

export default HideClaimedRewardsModule
