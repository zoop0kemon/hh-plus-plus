import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import Affection from '../../data/Affection'
import GirlXP from '../../data/GirlXP'
import { ELEMENTS } from '../../data/Elements'
import { RARITIES } from '../../data/Rarities'

import styles from './styles.lazy.scss'
import { lsKeys } from '../../common/Constants'

const {$} = Helpers

const MODULE_KEY = 'harem'

const GEM_COST_MULTIPLIERS = {
    starting: 1,
    common: 1,
    rare: 2,
    epic: 3,
    legendary: 4,
    mythic: 5,
}
const SC_PER_AFF = 417
const SC_PER_XP = 200

const getGemCostFromAwakeningLevel = (awakeningLevel, rarity) => {
    const {awakening_requirements} = window
    let gems = 0
    if (awakeningLevel < awakening_requirements.length) {
        gems = awakening_requirements.slice(awakeningLevel).reduce((sum, {cost}) => sum += (cost*GEM_COST_MULTIPLIERS[rarity]), 0)
    }
    return gems
}

class HaremInfoModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)

        this.aggregates
    }

    shouldRun () {
        return (Helpers.isCurrentPage('characters') || Helpers.isCurrentPage('harem')) && !Helpers.isCurrentPage('hero')
    }

    async aggregateStats () {
        const girlDictionary = await Helpers.getGirlDictionary()
        const {GIRL_MAX_LEVEL} = window
        const aggregates = {
            totalGirls: 0,
            girls: 0,
            caracs: {1: 0, 2: 0, 3: 0},
            elements: ELEMENTS.reduce((acc, element) => {acc[element] = 0; return acc}, {}),
            rarities: RARITIES.reduce((acc, rarity) => {acc[rarity] = 0; return acc}, {}),
            levelSum: 0,
            unlockedScenes: 0,
            totalScenes: 0,
            scPerHour: 0,
            scCollectAll: 0,
            aff: 0,
            affSC: 0,
            affHC: 0,
            xpToCap: 0,
            xpToMax: 0,
            gems: ELEMENTS.reduce((acc, element) => {acc[element] = 0; return acc}, {}),
        }
        const filters = Helpers.lsGet('filters')
        const {level_range} = filters
        const min_level = parseInt(level_range?.match(/^\d+/)?.[0] || 1)
        const max_level = parseInt(level_range?.match(/-(\d+)/)?.[1] || min_level)

        girlDictionary.forEach((girl) => {
            const {shards, class: carac, element, rarity, grade, salaries} = girl
            if (shards === 100 && [carac, element, rarity, grade, salaries].every(key => key !== undefined)) {
                const {name, affection, xp, role, armor, figure, zodiac, eye_colors, hair_colors} = girl
                let {graded, salary, level, level_cap} = girl
                graded = graded || 0
                salary = salary || salaries.split('|')[graded].split(',')[0]
                level = level || 1
                level_cap = level_cap || 250

                let girlMaches = true
                girlMaches &= !filters.name || name.search(new RegExp(filters.name, 'i')) > -1
                girlMaches &= !filters.element?.length || filters.element.includes(element)
                girlMaches &= !filters.shards?.length || filters.shards.includes('100')
                girlMaches &= !filters.class?.length || filters.class.map(carac => parseInt(carac)).includes(carac)
                girlMaches &= !filters.level_range || (level >= min_level && level <= max_level)
                girlMaches &= !filters.level_cap || filters.level_cap === 'all' || (filters.level_cap === 'capped') === (level === level_cap)
                girlMaches &= !filters.rarity || filters.rarity === 'all' || filters.rarity === rarity
                girlMaches &= !filters.affection_cap || filters.affection_cap === 'all' || (filters.affection_cap === 'capped') === (grade === graded)
                girlMaches &= !filters.max_affection_grade || filters.max_affection_grade === 'all' || parseInt(filters.max_affection_grade) === grade
                girlMaches &= !filters.current_affection_grade || filters.current_affection_grade === 'all' || parseInt(filters.current_affection_grade) === graded
                girlMaches &= !filters.role || filters.role === 'all' || parseInt(filters.role) === role
                girlMaches &= !filters.equipment || filters.equipment === 'all' || (filters.equipment === 'equipped') === (!!armor?.length)
                girlMaches &= !filters.pose || filters.pose === 'all' || parseInt(filters.pose) === figure
                girlMaches &= !filters.zodiac || filters.zodiac === 'all' || filters.zodiac === zodiac
                girlMaches &= !filters.eye_color || filters.eye_color === 'all' || eye_colors?.includes(filters.eye_color)
                girlMaches &= !filters.hair_color || filters.hair_color === 'all' || hair_colors?.includes(filters.hair_color)

                aggregates.totalGirls++
                if (girlMaches) {
                    aggregates.girls++
                    aggregates.caracs[carac]++
                    aggregates.elements[element]++
                    aggregates.rarities[rarity]++
                    aggregates.levelSum += level
                    aggregates.unlockedScenes += graded
                    aggregates.totalScenes += grade
                    aggregates.scPerHour += Math.round(salary / (salaries.split('|')[graded].split(',')[1] / 60))
                    aggregates.scCollectAll += salary
                    if (graded < grade) {
                        aggregates.aff += Math.max(Affection[rarity].totalAff(grade) - (affection || 0), 0)
                        const currentGradeSC = graded > 0 ? Affection[rarity].totalSC(graded) : 0
                        const currentGradeHC = graded > 0 ? Affection[rarity].totalHC(graded) : 0
                        aggregates.affSC += Affection[rarity].totalSC(grade) - currentGradeSC
                        const hcDiff = Affection[rarity].totalHC(grade) - currentGradeHC
                        aggregates.affHC += Helpers.isNutakuKobans() ? Math.ceil(hcDiff / 6) : hcDiff
                    }
                    aggregates.xpToMax += Math.max(GirlXP[rarity][GIRL_MAX_LEVEL - 2] - (xp || 0), 0)
                    aggregates.xpToCap += Math.max(GirlXP[rarity][level_cap - 2] - (xp || 0), 0)
                    aggregates.gems[element] += getGemCostFromAwakeningLevel((level_cap-250)/50, rarity)
                }
            } else if (shards === 100) {
                console.log(`Error: missing info for ${girl.name}`)
            }
        })

        return aggregates
    }

    buildStatsDisplay () {
        return $(`
            <div class="harem-info-panel">
                ${this.buildGeneralSummary()}
                ${this.buildUpgradeSummary()}
                ${this.buildMarketSummary()}
            </div>
        `)
    }

    buildGeneralSummary () {
        const {high_level_girl_owned, awakening_requirements, GIRL_MAX_LEVEL, GT} = window
        const {girls, totalGirls, caracs, elements, rarities, levelSum, unlockedScenes, totalScenes, scPerHour, scCollectAll} = this.aggregates
        const levelCapAggregate = high_level_girl_owned.slice(1).map((girls_owned, i)=>{
            const {cap_level} = awakening_requirements[i]
            const {girls_required} = awakening_requirements[i+1]
            return {
                girls_required,
                girls_owned,
                cap_level
            }
        })
        return `
            <div class="summary-block general-summary">
                <h1>${this.label('haremStats')}</h1>
                <div>${I18n.nThousand(girls)}${girls !== totalGirls ? `/${I18n.nThousand(totalGirls)}` : ''} <span class="clubGirl_mix_icn"></span></div>
                <ul class="summary-grid caracs-summary">
                    ${Object.entries(caracs).map(([carac, count]) => `<li><span tooltip="${GT.caracs[carac]}"><span carac="${carac}"></span><span>${I18n.nThousand(count)}</span></span></li>`).join('')}
                </ul>
                <ul class="summary-grid elements-summary">
                    ${Object.entries(elements).map(([element, count]) => `<li><span tooltip="${GT.design[`${element}_flavor_element`]}"><span class="${element}_element_icn"></span><span>${I18n.nThousand(count)}</span></span></li>`).join('')}
                </ul>
                <ul class="summary-grid rarity-summary">
                    ${Object.entries(rarities).map(([rarity, count]) => `<li><span tooltip="${GT.design[`girls_rarity_${rarity}`]}"><span class="rarity-icon slot ${rarity}"><span class="initial">${GT.design[`girls_rarity_${rarity}`][0].normalize('NFD').replace(/[\u0300-\u036f]/g, '')}</span></span><span>${I18n.nThousand(count)}</span></span></li>`).join('')}
                </ul>
                <ul class="summary-grid xp-aff-summary">
                    <li>
                        <span tooltip="${this.label('haremLevel')}">
                            <span class="xp-aff-label">${GT.design.Lvl}</span>
                            <span>${I18n.nThousand(levelSum)}<br>/ ${I18n.nThousand(GIRL_MAX_LEVEL * girls)}</span>
                        </span>
                    </li>
                    <li>
                        <span tooltip="${this.label('unlockedScenes')}">
                            <span class="xp-aff-label unlocked-scenes-icon" style="background-image:url(${Helpers.getCDNHost()}/design_v2/affstar.png);"></span>
                            <span>${I18n.nThousand(unlockedScenes)}<br>/ ${I18n.nThousand(totalScenes)}</span>
                        </span>
                    </li>
                </ul>
                <ul class="summary-grid salary-summary">
                    <li>
                        <span tooltip="${this.label('income')}">
                            <span class="salary-label"><span class="hudSC_mix_icn"></span></span>
                            <span>${I18n.nThousand(scPerHour)} / ${GT.time.h}<br>${I18n.nThousand(scCollectAll)} / ${GT.design.harem_collect}</span>
                        </span>
                    </li>
                </ul>
                <ul class="summary-grid level-caps-summary">
                    ${levelCapAggregate.map(({cap_level, girls_required, girls_owned}) => `<li><span class="level-cap">${cap_level}</span><span ${girls_owned>=girls_required ? 'class="level-cap-unlocked"':''}>${I18n.nThousand(girls_owned)}<span class="required-girls">/${girls_required}</span></span></li>`).join('')}
                </ul>
            </div>
        `
    }

    buildUpgradeSummary () {
        const {GT} = window
        const {aff, affSC, affHC, xpToCap, xpToMax, gems} = this.aggregates
        return `
            <div class="summary-block upgrade-summary">
                <h1>${this.label('upgrades')}</h1>
                <span>${this.label('toUpgrade')}</span>
                <ul class="summary-grid upgrade-costs">
                    <li>
                        <span tooltip="${GT.design.Affection}">
                            <span class="affection-label" style="background-image:url(${Helpers.getCDNHost()}/design/ic_gifts_gray.svg)"></span>
                            <span class="cost-value">${I18n.nThousand(aff)} ${GT.design.Aff}<br>(<span class="hudSC_mix_icn"></span> ${I18n.nThousand(aff * SC_PER_AFF)})</span>
                        </span>
                    </li>
                    <li>
                        <span tooltip="${this.label('affectionScenes')}">
                            <span class="affection-label" style="background-image:url(${Helpers.getCDNHost()}/design_v2/affstar.png)"></span>
                            <span class="cost-value">${this.label('or', {left: `<span class="hudSC_mix_icn"></span> ${I18n.nThousand(affSC)}<br>`, right: `<span class="hudHC_mix_icn"></span> ${I18n.nThousand(affHC)}`})}</span>
                        </span>
                    </li>
                </ul>
                <h1>${this.label('levelsAwakening')}</h1>
                <span>${this.label('toLevelCap')}</span>
                <ul class="summary-grid upgrade-costs">
                    <li>
                        <span tooltip="${GT.design.Experience}">
                            <span class="affection-label" style="background-image:url(${Helpers.getCDNHost()}/design/ic_books_gray.svg)"></span>
                            <span class="cost-value">${I18n.nThousand(xpToCap)} ${GT.design.XP}<br>(<span class="hudSC_mix_icn"></span> ${I18n.nThousand(xpToCap * SC_PER_XP)})</span>
                        </span>
                    </li>
                </ul>
                <span class="to-max-label">${this.label('toLevelMax', {max: GIRL_MAX_LEVEL})}</span>
                <div class="to-max-combi">
                    <ul class="summary-grid upgrade-costs">
                        <li>
                            <span tooltip="${GT.design.Experience}">
                                <span class="affection-label" style="background-image:url(${Helpers.getCDNHost()}/design/ic_books_gray.svg)"></span>
                                <span class="cost-value">${I18n.nThousand(xpToMax)} ${GT.design.XP}<br>(<span class="hudSC_mix_icn"></span> ${I18n.nThousand(xpToMax * SC_PER_XP)})</span>
                            </span>
                        </li>
                    </ul>
                    <ul class="summary-grid gems-summary">
                        ${Object.entries(gems).map(([element, count]) => `<li><span tooltip="${GT.design[`${element}_gem`]}"><span class="gem-icon" style="background-image: url(${Helpers.getCDNHost()}/pictures/design/gems/${element}.png)"></span><span>${I18n.nThousand(count)}</span></span></li>`).join('')}
                    </ul>
                </div>
            </div>
        `
    }

    buildMarketSummary () {
        const marketInfo = Helpers.lsGet(lsKeys.MARKET_INFO)
        const href = Helpers.getHref('../shop.html')
        let content = ''

        if (!marketInfo) {
            content = `
                <p class="market-warning">${this.label('visitMarket', {href})}</p>
            `
        } else {
            const {Hero} = window.shared ? window.shared : window
            const {server_now_ts, GT} = window
            const {buyableItems, sellableItems, refreshTime, refreshLevel} = marketInfo

            let buyableContent = ''
            let sellableContent = ''

            if (refreshTime < server_now_ts || refreshLevel < Hero.infos.level) {
                buyableContent = `
                    <span>${this.label('buyable')}</span>
                    <p class="market-warning">${this.label('marketRestocked', {href})}</p>
                `
            } else if (buyableItems) {
                const {aff, xp} = buyableItems
                buyableContent = `
                    <span>${this.label('buyable')}</span>
                    <ul class="summary-grid upgrade-costs">
                        <li>
                            <span tooltip="${this.label('books')}">
                                <span class="affection-label" style="background-image:url(${Helpers.getCDNHost()}/design/ic_books_gray.svg)"></span>
                                <span class="cost-value">
                                    ${this.label('canBeBought', {item: `${I18n.nThousand(xp.sc.value)} ${GT.design.XP} (${xp.sc.count})`, amount: `<span class="hudSC_mix_icn"></span> ${I18n.nThousand(xp.sc.cost)}`})}<br>
                                    ${this.label('canBeBought', {item: `${I18n.nThousand(xp.hc.value)} ${GT.design.XP} (${xp.hc.count})`, amount: `<span class="hudHC_mix_icn"></span> ${I18n.nThousand(xp.hc.cost)}`})}
                                </span>
                            </span>
                        </li>
                        <li>
                            <span tooltip="${this.label('gifts')}">
                                <span class="affection-label" style="background-image:url(${Helpers.getCDNHost()}/design/ic_gifts_gray.svg)"></span>
                                <span class="cost-value">
                                    ${this.label('canBeBought', {item: `${I18n.nThousand(aff.sc.value)} ${GT.design.Aff} (${aff.sc.count})`, amount: `<span class="hudSC_mix_icn"></span> ${I18n.nThousand(aff.sc.cost)}`})}<br>
                                    ${this.label('canBeBought', {item: `${I18n.nThousand(aff.hc.value)} ${GT.design.Aff} (${aff.hc.count})`, amount: `<span class="hudHC_mix_icn"></span> ${I18n.nThousand(aff.hc.cost)}`})}
                                </span>
                            </span>
                        </li>
                    </ul>
                    <p class="restock-info">
                        ${this.label('marketRestock', {time: new Date(refreshTime * 1000).toLocaleString(I18n.getLang()), level: refreshLevel+1})}
                    </p>
                `
            } else {
                buyableContent = `
                    <span>${this.label('buyable')}</span>
                    <p class="market-warning">${this.label('visitMarket')}</p>
                `
            }

            if (sellableItems) {
                const {player_gems_amount} = window
                const {xp, aff} = sellableItems
                sellableContent = `
                    <span>${this.label('sellable')}</span>
                    <ul class="summary-grid upgrade-costs">
                        <li>
                            <span tooltip="${this.label('books')}">
                                <span class="affection-label" style="background-image:url(${Helpers.getCDNHost()}/design/ic_books_gray.svg)"></span>
                                <span class="cost-value">
                                    ${I18n.nThousand(xp.value)} ${GT.design.XP} (${xp.count})<br>
                                    ${this.label('canBeSold', {sc: `<span class="hudSC_mix_icn"></span> ${I18n.nThousand(xp.cost)}`})}
                                </span>
                            </span>
                        </li>
                        <li>
                            <span tooltip="${this.label('gifts')}">
                                <span class="affection-label" style="background-image:url(${Helpers.getCDNHost()}/design/ic_gifts_gray.svg)"></span>
                                <span class="cost-value">
                                    ${I18n.nThousand(aff.value)} ${GT.design.Aff} (${aff.count})<br>
                                    ${this.label('canBeSold', {sc: `<span class="hudSC_mix_icn"></span> ${I18n.nThousand(aff.cost)}`})}
                                </span>
                            </span>
                        </li>
                    </ul>
                    <ul class="summary-grid gems-stock">
                        ${ELEMENTS.map((element) => `<li><span tooltip="${GT.design[`${element}_gem`]}"><span class="gem-icon" style="background-image: url(${Helpers.getCDNHost()}/pictures/design/gems/${element}.png)"></span><span>${I18n.nThousand(parseInt(player_gems_amount[element].amount),10)}</span></span></li>`).join('')}
                    </ul>
                `
            } else {
                sellableContent = `
                    <span>${this.label('sellable')}</span>
                    <p class="market-warning">${this.label('visitMarket')}</p>
                `
            }

            content = sellableContent + buyableContent
        }

        return `
            <div class="summary-block market-summary">
                <h1>${this.label('market')}</h1>
                ${content}
            </div>
        `
    }

    attachToPage ($panel) {
        const $prev_panel = $('#harem_left .harem-info-panel')
        if ($prev_panel.length) {
            const prev_classes = $prev_panel.attr('class')
            $prev_panel.html($panel.addClass(prev_classes).html())
            return
        }

        const $button = $('<div class="harem-info-panel-toggle clubGirl_mix_icn"></div>')
        const $overlayBG = $('<div class="harem-info-overlay-bg"></div>')
        $('#harem_left').append($button).append($panel).append($overlayBG)

        $button.click(() => {
            if ($panel.hasClass('visible')) {
                $panel.removeClass('visible')
                $overlayBG.removeClass('visible')
            } else {
                $panel.addClass('visible')
                $overlayBG.addClass('visible')
            }
        })

        $overlayBG.click(() => {
            $panel.removeClass('visible')
            $overlayBG.removeClass('visible')
        })
    }

    attachWikiLink (id_girl, girl, $girl) {
        const {shards, name} = girl
        const wikiLink = Helpers.getWikiLink(name, id_girl, I18n.getLang())
        if (!wikiLink) {return}

        if (shards === 100) {
            const $existingLink = $girl.find('.WikiLink a')
            if ($existingLink.length) {
                $existingLink.attr('href', wikiLink)
            } else {
                $girl.find('.middle_part h3').wrap(`<div class="WikiLink"><a href="${wikiLink}" target="_blank"></a></div>`)
            }
        } else {
            const $existingLink = $girl.find('.WikiLinkDialogbox > a')
            if ($existingLink.length) {
                $existingLink.attr('href', wikiLink)
            } else {
                $girl.find('.middle_part.missing_girl .dialog-box').append(`<div class="WikiLinkDialogbox"><a href="${wikiLink}" target="_blank">${this.label('wikiPage', {name})}</a></div>`)
            }
        }
    }

    attachSceneCostsAndStats (girl, $girl) {
        const {GT} = window
        const $lockedStars = $girl.find('a.later')
        if (!$lockedStars.length) {return}
        $lockedStars.each((_, el) => {
            const $el = $(el)
            const index = $el.index()
            const {rarity, affection} = girl

            const remainingAffection = Affection[rarity].totalAff(index + 1) - affection
            const {sc, hc} = Affection[rarity].steps[index]
            const hcMultiplier = Helpers.isNutakuKobans() ? 1/6 : 1

            const ttContent = `
                <div class="scene-costs-tooltip">
                    ${I18n.nThousand(remainingAffection)} ${GT.design.Aff}<br>
                    ${this.label('or', {left: `<span class="hudSC_mix_icn"></span> ${I18n.nThousand(sc)}<br>`, right: `<span class="hudHC_mix_icn"></span> ${I18n.nThousand(Math.ceil(hc * hcMultiplier))}` })}
                </div>
            `.replace(/(\n| {4})/g, '')

            $el.attr('tooltip', ttContent)
        })
    }

    async onGirlSelectionChanged(id, $girl) {
        const girlDictionary = await Helpers.getGirlDictionary()
        const girl = girlDictionary.get(`${id}`)
        this.attachWikiLink(id, girl, $girl)
        this.attachSceneCostsAndStats(girl, $girl)
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            $(document).on('girl-dictionary:updated', async () => {
                this.aggregates = await this.aggregateStats()
                this.attachToPage(this.buildStatsDisplay())
            })
            Helpers.onAjaxResponse(/action=get_girls_list/i, async () => {
                // only to run if no girls from filter, since girl dict won't be updated.
                this.aggregates = await this.aggregateStats()
                this.attachToPage(this.buildStatsDisplay())
            })

            const checkSelectionChange = () => {
                const $girl = $('#harem_right [girl]')
                if (!$girl.length) {return}
                const girlId = $girl.attr('girl')
                this.currentGirlId = girlId
                this.onGirlSelectionChanged(girlId, $girl)
            }

            new MutationObserver(checkSelectionChange).observe($('#harem_right')[0], {childList: true, subtree: true})
            checkSelectionChange()
        })

        this.hasRun = true
    }
}

export default HaremInfoModule
