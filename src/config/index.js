import Helpers from '../common/Helpers'
import { colors, lsKeys } from '../common/Constants'
import Sheet from '../common/Sheet'
import Supporters from '../data/Supporters'
import tierIconGold from '../assets/hh-plus-plus-gold.svg'
import tierIconSilver from '../assets/hh-plus-plus-silver.svg'
import styles from './styles.lazy.scss'
const {$} = Helpers

const CONFIG_SEP = '_'

const TIER_ICONS = {
    gold: tierIconGold,
    silver: tierIconSilver,
}

const supportTiers = {
    'gold': 1,
    'silver': 2,
    'bronze': 3
}

const supporterToString = ({name, tier}) => `${supportTiers[tier]}_${name}`

const sortSupporters = (a,b) => {
    const aStr = supporterToString(a)
    const bStr = supporterToString(b)
    if (aStr < bStr) {
        return -1
    } else if (aStr > bStr) {
        return 1
    }
    return 0
}

class Config {
    constructor() {
        this.groups = []
        this.modules = []
        this.config = {}
        this.hasRendered = false
        this.$configButton = null
        this.$configPane = null
        this.configPaneOpen = false
        this.colors = colors[Helpers.getGameKey()]

        if (Helpers.isCurrentPage('home')) {
            Supporters.getSupporters().then(supporters => {
                this.supporters = supporters
            })
            styles.use()
            Helpers.defer(() => {
                this.init()
                this.renderInteractables()
            })
        }
    }

    init() {
        this.gameIcon = $('.hh_logo>img').attr('src')
        this.gameTitle = $('.hh_logo').attr('title')
    }

    loadConfig () {
        const config = Helpers.lsGet(lsKeys.CONFIG)
        if (config) {
            Object.assign(this.config, (config))
        }
    }

    saveConfig () {
        Helpers.lsSet(lsKeys.CONFIG, this.config)
    }

    updateConfig (key, value) {
        this.config[key] = value
        this.saveConfig()

        const {module, subKey} = this.getModuleForKey(key)
        if (module) {
            if (subKey) {
                if (typeof module.updateSubSetting === 'function') {
                    module.updateSubSetting(subKey, value)
                }
            } else {
                const $setting = this.$configPane.find(`.config-setting[rel=${key}]`)
                const $subSettings = $setting.find('.sub-settings input')
                if (value) {
                    this.runModule(module)
                    Helpers.runDeferred()
                    $setting.addClass('enabled')
                    $subSettings.prop('disabled', false)
                } else {
                    if (typeof module.tearDown === 'function') {
                        module.tearDown()
                    }
                    $setting.removeClass('enabled')
                    $subSettings.prop('disabled', true)
                }
            }
        }
    }

    registerGroup(group) {
        const {name, key} = group
        if (!name || !key) {
            throw new Error('cannot register invalid group, need both "key" and "name"', group)
        }

        if (this.groups.find(group => group.key === key)) {
            console.warn('hh++ config: merging duplicate group', key)
            return
        }
        this.groups.push(group)
    }

    registerModule(module) {
        const {group, configSchema} = module

        if (!group || !this.groups.find(({key}) => key === group)) {
            throw new Error(`cannot register module with unknown group ${group}`)
        }

        if (configSchema && configSchema.restriction) {
            const {restriction: {whitelist, blacklist}} = configSchema
            const gameKey = Helpers.getGameKey()
            if (blacklist) {
                if (blacklist.includes(gameKey)) {
                    return
                }
            } else if (whitelist) {
                if (!whitelist.includes(gameKey)) {
                    return
                }
            }
        }

        this.modules.push(module)

        this.config[this.getConfigKey(group, configSchema.baseKey)] = configSchema.default
        if (configSchema.subSettings) {
            configSchema.subSettings.forEach(setting => {
                this.config[this.getConfigKey(group, configSchema.baseKey, setting.key)] = setting.default
            })
        }
    }

    runModules () {
        this.modules.forEach(module => {
            const moduleEnabled = this.config[this.getConfigKey(module.group, module.configSchema.baseKey)]
            if (moduleEnabled) {
                this.runModule(module)
            }
        })
    }

    runModule(module) {
        const subSettings = Object.keys(this.config)
            .filter(key => key.startsWith(`${this.getConfigKey(module.group, module.configSchema.baseKey)}${CONFIG_SEP}`))
            .map(key => ({ [key.replace(`${this.getConfigKey(module.group, module.configSchema.baseKey)}${CONFIG_SEP}`, '')]: this.config[key] }))
            .reduce((a, b) => Object.assign(a, b), {})
        module.run(subSettings)
    }

    getConfigKey (group, baseKey, subKey) {
        return [group, baseKey, subKey].filter(k=>k).join(CONFIG_SEP)
    }

    getModuleForKey (key) {
        const [kGroup, baseKey, subKey] = key.split(CONFIG_SEP)
        const module = this.modules.find(({group, configSchema}) => configSchema.baseKey === baseKey && group === kGroup)

        return {
            module,
            subKey
        }
    }

    renderInteractables () {
        if (this.hasRendered) {
            return
        }

        this.injectCSSVars()

        // $(document).ready
        this.renderConfigButton()
        // this.renderConfigPane()
        // this.setupEvents()

        this.hasRendered = true
    }

    renderConfigButton () {
        this.$configButton = $(`<div class="hh-plus-plus-config-button" hh_title="${this.gameTitle} ++" tooltip></div>`)
        this.$configButton.click(this.openConfigPane.bind(this))
        $('#contains_all').append(this.$configButton)
    }

    buildConfigPaneContent () {
        return $(`
            <div class="tabs">
                ${this.groups.map(({key, name}) => `<h4 class="${key}" rel="${key}">${name}</h4>`).join('')}
            </div>
            ${this.groups.map(({key: groupKey}) => `
            <div class="group-panel" rel="${groupKey}">
                <div class="panel-contents">
                    ${this.modules.filter(({group}) => group === groupKey).map(({configSchema}) => {
        const baseKey = this.getConfigKey(groupKey, configSchema.baseKey)
        const baseVal = this.config[baseKey]
        return `
                <div class="config-setting ${baseVal ? 'enabled' : ''} ${configSchema.subSettings ? 'has-subsettings' : ''}" rel="${baseKey}">
                    <label class="base-setting">
                        <span>${configSchema.label}</span>
                        <input type="checkbox" name="${baseKey}" ${baseVal ? 'checked="checked"' : ''} />
                    </label>
                    ${configSchema.subSettings ? `
                    <div class="sub-settings">
                        ${configSchema.subSettings.map(subSetting => {
        const subKey = this.getConfigKey(groupKey, configSchema.baseKey, subSetting.key)
        const subVal = this.config[subKey]
        return `
                        <label>
                            <input type="checkbox" name="${subKey}" ${subVal ? 'checked="checked"' : ''} ${baseVal ? '' : 'disabled="disabled"'} />
                            <span>${subSetting.label}</span>
                        </label>`
    }).join('')}
                    </div>` : ''}
                </div>`
    }).join('')}
                </div>
            </div>`
    ).join('')}
            <div class="credits-panel">${this.buildCreditsPane()}</div>`
        )
    }

    buildCreditsPane () {
        const {CHANGELOG, SPECIAL_THANKS, BMAC, PATREON, DISCORD} = window.HHPlusPlus
        const {script: scriptInfo} = GM_info
        const {CODE_CONTRIBUTIONS, TRANSLATIONS} = SPECIAL_THANKS
        const {name, author, version} = scriptInfo

        return `
        <div class="credits-contents">
            <p>You're running ${name} <a class="changelog" tooltip="Click to open CHANGELOG" href="${CHANGELOG}" target="_blank">v${version}</a> by ${author}</p>
            <p>Enjoying the script? Want to throw money at me for some reason? You can <a href="${BMAC}" target="_blank">Buy Me A Coffee</a> or <a href="${PATREON}" target="_blank">support me on Patreon</a> if you'd like.</p>
            <p>Join us on <a href="${DISCORD}" target="_blank">Discord</a>!</p>
            <h2>Special Thanks</h2>
            <div class="thanks-container">
                <div class="thanks-supporters">
                    <h3>Patrons</h3>
                    <ul class="script-supporters">${this.supporters.sort(sortSupporters).map(({name, tier}) => `<li class="script-supporter-${tier}">${name}${['gold', 'silver'].includes(tier) ? `<img class="tier-icon" src="${TIER_ICONS[tier]}" tooltip="${tier.substring(0,1).toUpperCase()}${tier.substring(1)} Tier Supporter"/>` : '' }</li>`).join('')}</ul>
                </div>
                <div class="thanks-code">
                    <h3>Code Contributions</h3>
                    <ul>${CODE_CONTRIBUTIONS.map(credit => `<li>${credit}</li>`).join('')}</ul>
                </div>
                <div class="thanks-translations">
                    <h3>Translations</h3>
                    <ul>${Object.entries(TRANSLATIONS).map(([credit, langs]) => `<li>${credit} ${langs.map(lang => `<span class="country country-${lang}"></span>`).join('')}</li>`).join('')}</ul>
                </div>
            </div>
        </div>
        `
    }

    renderConfigPane () {
        const $creditsButton = $('<span class="blue_circular_btn toggle-credits"><span class="info_icn"></span></span>')
        $creditsButton.click(this.toggleCredits.bind(this))
        const $closePaneButton = $('<span class="close-config-panel" />')
        $closePaneButton.click(this.closeConfigPane.bind(this))

        this.$configPane = $('<div class="hh-plus-plus-config-panel"></div>')
            .append(this.buildConfigPaneContent())
            .prepend($closePaneButton)
            .prepend($creditsButton)
        $('#contains_all').append(this.$configPane)

        this.$configPane.find('.group-panel').niceScroll('.panel-contents', {bouncescroll: false})
        this.$configPane.find('.credits-panel').niceScroll('.credits-contents', {bouncescroll: false})
        this.setupEvents()
        this.selectConfigTab(this.groups[0].key)
    }

    closeConfigPane () {
        if (!this.$configPane.hasClass('shown')) {
            return
        }
        this.$configPane.removeClass('shown')
        this.configPaneOpen = false
    }

    openConfigPane () {
        if (this.$configPane && this.$configPane.hasClass('shown')) {
            return
        }
        if (!this.$configPane) {
            // rendering lazily here so that all modules should have been registered at this point
            this.renderConfigPane()
        }
        this.$configPane.addClass('shown')
        this.configPaneOpen = true
    }

    selectConfigTab(key) {
        this.currentKey = key
        $('.hh-plus-plus-config-panel .credits-panel').removeClass('shown')
        $('.hh-plus-plus-config-panel .tabs h4').removeClass('selected')
        $(`.hh-plus-plus-config-panel .tabs h4[rel=${key}]`).addClass('selected')
        $('.hh-plus-plus-config-panel .group-panel').removeClass('shown')
        $(`.hh-plus-plus-config-panel .group-panel[rel=${key}]`).addClass('shown').getNiceScroll().resize()
        this.creditsShown = false
    }

    toggleCredits() {
        if (this.creditsShown) {
            const key = this.currentKey
            $('.hh-plus-plus-config-panel .credits-panel').removeClass('shown')
            $(`.hh-plus-plus-config-panel .tabs h4[rel=${key}]`).addClass('selected')
            $(`.hh-plus-plus-config-panel .group-panel[rel=${key}]`).addClass('shown').getNiceScroll().resize()
            this.creditsShown = false
        } else {
            $('.hh-plus-plus-config-panel .credits-panel').addClass('shown').getNiceScroll().resize()
            $('.hh-plus-plus-config-panel .tabs h4').removeClass('selected')
            $('.hh-plus-plus-config-panel .group-panel').removeClass('shown')
            this.creditsShown = true
        }
    }

    setupEvents () {
        this.groups.forEach(({key}) => {
            $(`.hh-plus-plus-config-panel .tabs h4[rel=${key}]`).click(this.selectConfigTab.bind(this, key))
        })
        Object.keys(this.config).forEach(key => {
            $(`.hh-plus-plus-config-panel input[name=${key}]`).change((e) => {
                this.updateConfig(key, $(e.target).prop('checked'))
            })
        })
    }

    injectCSSVars () {
        Sheet.registerVar('config-button-icon', `url(${this.gameIcon})`)
        Sheet.registerVar('config-panel-background', this.colors.panelBackground)
        Sheet.registerVar('config-border-image-source', this.colors.panelBorderGradient)
        Sheet.registerVar('config-panel-box-shadow', this.colors.panelInset)
        Sheet.registerVar('cross-icon', `url('${Helpers.getCDNHost()}/clubs/ic_xCross.png')`)
        Sheet.registerVar('config-setting-background', this.colors.homeDark)
        Sheet.registerVar('config-setting-border', this.colors.homeBorder)
    }
}

export default Config
