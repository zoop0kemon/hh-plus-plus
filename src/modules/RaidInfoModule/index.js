import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

import styles from './styles.lazy.scss'
import Sheet from '../../common/Sheet'

const MODULE_KEY = 'raid'

class RaidInfoModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return Helpers.isCurrentPage('love-raids')
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            this.injectCSSVars()

            Helpers.doWhenSelectorAvailable('.love-raids-container .raid-card', async () => {
                const girlDictionary = await Helpers.getGirlDictionary()
                const {GT, shared: {timer: {format_time_short}}} = window

                $('.love-raids-page .page-title').wrap(`<a href="${Helpers.getHref('/love-raids.html')}" style="text-decoration: none;"></a>`)

                love_raids.forEach(raid => {
                    const girl_data = girlDictionary.get(`${raid.id_girl}`)
                    const subtype_id = raid?.raid_module_pk
                    const $raid_card = $(`.raid-card[id_raid="${raid.id_raid}"]`)

                    const $duration = $(`<div class="raid-duration"><p>${GT.design.seasons_duration} ${format_time_short(raid.event_duration_seconds)}</p></div>`)
                    const $raid_name = $raid_card.find('.raid-name')
                    $raid_name.contents().wrap('<span><span/>')
                    switch (raid.raid_module_type) {
                    case 'troll':
                        $raid_name.append('<span class="type_icon hudBattlePts_mix_icn"></span>')
                        if (subtype_id !== undefined) {
                            $raid_name.append(`<a href="${Helpers.getHref(`/troll-pre-battle.html?id_opponent=${subtype_id}`)}"><img class="subtype_icon" src="${Helpers.getCDNHost()}/pictures/trolls/${subtype_id}/ico1.png"></img></a>`)
                        }
                        break
                    case 'champion':
                        $raid_name.append('<span class="type_icon ticket_icn"></span>')
                        if (subtype_id !== undefined) {
                            $raid_name.append(`<a href="${Helpers.getHref(`/champions/${subtype_id}`)}">${subtype_id}</a>`)
                        }
                        break
                    case 'season':
                        $raid_name.append(`<a href="${Helpers.getHref('/season-arena.html')}"><span class="type_icon hudKiss_mix_icn"></span></a>`)
                        break
                    }
                    $raid_card.find('>>.raid-timer').append($duration)

                    const shards = girl_data?.shards || 0
                    const no_skin_shards = $raid_card.find('.skins_shard_icn').length ? parseInt($raid_card.find('.shards[skins-shard]').attr('skins-shard')) === 33 : true
                    if (raid.status === 'upcoming') {
                        $raid_card.addClass('upcoming')
                    }
                    if (shards === 100 && no_skin_shards) {
                        $raid_card.addClass('gotten')
                    }

                    const grade = girl_data?.grade
                    if (grade) {
                        $raid_card.find('.raid-card-header').append(`<div class="graded">${'<g></g>'.repeat(grade)}</div>`)
                    }

                    if (raid.status === 'upcoming' && raid.announcement_type_name !== 'full') {
                        const girl_name = girl_data?.name || '????'
                        let hidden = true

                        const toggle = () => {
                            if (hidden) {
                                $raid_card.find('.eye>img').attr('src', `${Helpers.getCDNHost()}/quest/ic_eyeclosed.svg`)
                                $raid_card.find('.girl-img.left').attr('src', `${Helpers.getCDNHost()}/pictures/girls/${raid.id_girl}/ava0.png`.toImageUrl('ava'))
                                $raid_card.find('.girl-img.right').attr('src', `${Helpers.getCDNHost()}/pictures/girls/${raid.id_girl}/grade_skins/grade_skin${raid.girl_data.grade_skins.length}.png`)
                                $raid_card.find('.raid-name>span').eq(0).text(`${girl_name} ${GT.design.love_raid}`)
                                $raid_card.find('.girl-name>a').text(girl_name)
                            } else {
                                $raid_card.find('.eye>img').attr('src', `${Helpers.getCDNHost()}/quest/ic_eyeopen.svg`)
                                $raid_card.find('.girl-img.left').attr('src', `${Helpers.getCDNHost()}/pictures/girls/${raid.id_girl}/avb0.png`.toImageUrl('ava'))
                                $raid_card.find('.girl-img.right').attr('src', `${Helpers.getCDNHost()}/pictures/girls/${raid.id_girl}/avb0.png`.toImageUrl('ava'))
                                $raid_card.find('.raid-name>span').eq(0).text(raid.event_name)
                                $raid_card.find('.girl-name>a').text(raid.girl_data.name)
                            }
                            hidden = !hidden
                        }

                        $raid_card.find('.girl-img').off('load')
                        $(`<div class="eye btn-control"><img src="${Helpers.getCDNHost()}/quest/ic_eyeopen.svg"></div>`).click(toggle).appendTo($raid_card.find('.raid-content'))
                        $raid_card.find('.girl-name').eq(0).contents().wrap(`<a href="${Helpers.getHref(`/characters/${raid.id_girl}`)}"></a>`)

                        // fill in missing shard info
                        if (raid.announcement_type_name === 'none') {
                            const $shards = $raid_card.find('.shards_bar_wrapper .shards').eq(0)
                            $shards.attr('shards', shards).find('>p>span').text(`${shards}/100`)
                            $raid_card.find('.shards_bar .bar').eq(0).css('width', `${shards}%`)
                        }
                    }
                })
            })
        })

        this.hasRun = true
    }

    injectCSSVars () {
        Sheet.registerVar('grade-star', `url("${Helpers.getCDNHost()}/design_v2/affstar_S.png")`)
    }
}

export default RaidInfoModule
