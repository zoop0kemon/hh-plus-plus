import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

import pauseIcon from '../../assets/pause.svg'
import playIcon from '../../assets/play.svg'

import styles from './styles.lazy.scss'
import { lsKeys } from '../../common/Constants'

const MODULE_KEY = 'improvedWaifu'

class ImprovedWaifuModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return Helpers.isCurrentPage('home.html') || Helpers.isCurrentPage('waifu.html')
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(async () => {
            if (Helpers.isCurrentPage('home.html')) {
                const {waifu} = window
                let waifuInfo = Helpers.lsGet(lsKeys.WAIFU_INFO) || {girls:{}}
                let cycle = waifuInfo.cycle || false
                let mode = waifuInfo.mode || 'All'
                let ids = await this.getIds(waifuInfo, mode)
                let girl_id = waifuInfo.girl_id || waifu.id_girl.toString()
                if (cycle) {
                    let temp_id = girl_id
                    if (ids.length == 1) {
                        temp_id = ids[0]
                    } else {
                        while (temp_id == girl_id) {
                            temp_id = ids[Math.floor(Math.random()*ids.length)]
                        }
                    }
                    girl_id = temp_id.toString()
                }
                if (waifuInfo.individual) {
                    girl_id = waifu.id_girl.toString()
                    waifuInfo.individual = false
                }
                waifuInfo.girl_id = girl_id
                this.saveWaifuInfo(waifuInfo)
                if (!waifuInfo.girls[girl_id]) {
                    waifuInfo.girls[girl_id] = {}
                }
                let girlInfo = waifuInfo.girls[girl_id]
                const girlDictionary = await Helpers.getGirlDictionary()
                let dictGirl = girlDictionary.get(girl_id)
                if (!dictGirl) {
                    console.log(this.label('warningMaxGrade', {id: girl_id}))
                    return
                }
                let unlocked_grade = dictGirl.graded
                if (!(unlocked_grade>=0)) {
                    console.log(this.label('warningUnlockedGrade', {id: girl_id}))
                    return
                }
                let max_grade = dictGirl.grade || unlocked_grade
                let selected_grade = girlInfo.grade === undefined ? Math.min(max_grade, unlocked_grade) : girlInfo.grade
                let fav = girlInfo.fav || false

                let display = (waifuInfo.display === undefined)?  !!parseInt(waifu.display) : waifuInfo.display
                let $eye = $(".eye")
                Helpers.doWhenSelectorAvailable('.waifu-container', () => {
                    setTimeout(() => {
                        // if hidden, put girl and re setup hide button
                        if (waifu.display == 0) {
                            $('.waifu-container').eq(0).append(`<img src="${Helpers.getCDNHost()}/pictures/girls/${girl_id}/ava${selected_grade}.png" class="avatar ">`)
                            if (display) {
                                $eye[0].children[0].src = `${Helpers.getCDNHost()}/quest/ic_eyeclosed.svg`
                                $('#bg_all').addClass('blur-effect')
                            }
                        }
                        
                        // wait to replace default behavior of eye button
                        $eye.prop("onclick", null).off("click")
                        $eye.click(() => {
                            $('.waifu-container>img').eq(0).toggleClass('hide')
                            $('.diamond-bar').eq(0).toggleClass('hide')
                            $('.waifu-edit').eq(0).toggleClass('hide')
                            $('.waifu-right').eq(0).toggleClass('hide')
                            if (!display) {
                                $eye[0].children[0].src = `${Helpers.getCDNHost()}/quest/ic_eyeclosed.svg`
                                $('#bg_all').addClass('blur-effect')
                            } else {
                                $eye[0].children[0].src = `${Helpers.getCDNHost()}/quest/ic_eyeopen.svg`
                                $('#bg_all').removeClass('blur-effect')
                            }
                            display = !display
                            waifuInfo.display = display
                            this.saveWaifuInfo(waifuInfo)
                        })
                    }, 50)
                })
                Helpers.doWhenSelectorAvailable('.waifu-container>*', () => {
                    let waifu_animated = $('.waifu-container>canvas')
                    if (waifu_animated.length > 0) {
                        if ($('.waifu-container').children().length == 1) {
                            waifu_animated.eq(0).replaceWith(`<img src="${Helpers.getCDNHost()}/pictures/girls/${girl_id}/ava${selected_grade}.png" class="avatar ">`)
                        } else {
                            waifu_animated.remove()
                        }
                    }
                    // set selected girl and grade
                    if (selected_grade != waifu.selected_grade || girl_id != waifu.girl_id) {
                        $('.waifu-container>img').eq(0).attr('src', `${Helpers.getCDNHost()}/pictures/girls/${girl_id}/ava${selected_grade}.png`)
                    }
                })

                $('.waifu-buttons-container a').remove()
                let waifu_buttons = $('.waifu-buttons-container').eq(0)

                const waifu_href = `<a href="${Helpers.getHref('/waifu.html')}">`
                let gradeSwitch = `<div class="diamond-bar"><div class="girls-name">${waifu_href}${dictGirl.name}</a>${waifu_href}<img src="${Helpers.getCDNHost()}/design/menu/edit.svg"></a></div>`
                for (let i=0;i<7;i++) {
                    gradeSwitch += `<div class="diamond${i==selected_grade? ' selected': ''} ${i<=unlocked_grade ? 'un' : ''}locked${i>max_grade? ' hide' : ''}"></div>`
                }
                gradeSwitch += '</div>'
                waifu_buttons.append(gradeSwitch)

                let $edit_pose = $(`<div class="round_blue_button edit-pose" tooltip hh_title="Edit Pose"><img src="${Helpers.getCDNHost()}/design/menu/edit.svg"></div>`)
                let $reset_pose = $(`<div class="round_blue_button reset-pose hide" tooltip hh_title="Reset Pose"><img src="${Helpers.getCDNHost()}/clubs/ic_xCross.png"></div>`)
                let $save_pose = $(`<div class="round_blue_button save-pose hide" tooltip hh_title="Save Pose"><img src="${Helpers.getCDNHost()}/clubs/ic_Tick.png"></div>`)
                let $waifu_edit = $('<div class="waifu-edit"></div>').append($edit_pose, $reset_pose, $save_pose)
                waifu_buttons.append($waifu_edit)

                let $fav_girl = $(`
                    <div class="waifu-toggle">
                        <div class="round_blue_button fav-girl${fav? ' hide' : ''}" tooltip hh_title="${this.label('favGirl')}">
                            <img src="${Helpers.getCDNHost()}/design/ic_star_white.svg">
                        </div>
                        <div class="round_blue_button unfav-girl${fav? '' : ' hide'}" tooltip hh_title="${this.label('unfavGirl')}">
                            <img src="${Helpers.getCDNHost()}/design/ic_star_orange.svg">
                        </div>
                    </div>
                `)
                let $waifu_mode = $(`
                    <div class="waifu-toggle">
                        <div class="round_blue_button all-mode${mode=='All'? '' : ' hide'}" tooltip hh_title="${this.label('modeAll')}">
                            <img src="${Helpers.getCDNHost()}/pictures/design/harem.svg">
                        </div>
                        <div class="round_blue_button fav-mode${mode=='All'? ' hide' : ''}" tooltip hh_title="${this.label('modeFav')}">
                            <img src="${Helpers.getCDNHost()}/pictures/design/clubs/ic_Girls_S.png">
                        </div>
                    </div>
                `)
                let $random_waifu = $(`
                    <div class="round_blue_button random-waifu" tooltip hh_title="${this.label('randomWaifu')}">
                        <img src="${Helpers.getCDNHost()}/pictures/design/girls.svg">
                    </div>`)
                let $cycle_waifu = $(`
                    <div class="waifu-toggle">
                        <div class="round_blue_button cycle-waifu${cycle? ' hide' : ''}" tooltip hh_title="${this.label('cycleWaifu')}">
                            <img src="${playIcon}">
                        </div>
                        <div class="round_blue_button cycle-pause${cycle? '' : ' hide'}" tooltip hh_title="${this.label('cyclePause')}">
                            <img src="${pauseIcon}">
                        </div>
                    </div>`)
                let $waifu_right = $('<div class="waifu-right"></div>').append($fav_girl, $waifu_mode, $random_waifu, $cycle_waifu)
                waifu_buttons.append($waifu_right)

                Helpers.doWhenSelectorAvailable('.waifu-container>img', () => {
                    if (!display) {
                        $('.waifu-container>img').eq(0).toggleClass('hide')
                        $('.diamond-bar').eq(0).toggleClass('hide')
                        $('.waifu-edit').eq(0).toggleClass('hide')
                        $('.waifu-right').eq(0).toggleClass('hide')
                        $eye[0].children[0].src = `${Helpers.getCDNHost()}/quest/ic_eyeopen.svg`
                        $('#bg_all').removeClass('blur-effect')
                    }
                })

                // waifu-edit
                let editing = false, panning = false;
                let scale, x, y
                try {scale = girlInfo.pose[selected_grade].scale || 1} catch {scale = 1}
                try {x = girlInfo.pose[selected_grade].x || 0} catch {x = 0}
                try {y = girlInfo.pose[selected_grade].y || 0} catch {y = 0}
                let cord = {
                    x: x,
                    y: y,
                }
                let start = {x:0, y:0};
                $edit_pose.click(() => {
                    $(".waifu-edit div").toggleClass("hide")
                    editing = true
                })

                $save_pose.click(() => {
                    $(".waifu-edit div").toggleClass("hide")
                    editing = false
                    if (cord.x != 0 || cord.y != 0 || scale != 1) {
                        if (!girlInfo.pose) {girlInfo.pose = {}}
                        let temp = {}
                        if (cord.x != 1) {temp.x = Math.round(cord.x)}
                        if (cord.y != 1) {temp.y = Math.round(cord.y)}
                        if (scale != 1) {temp.scale = +scale.toFixed(2)}
                        girlInfo.pose[selected_grade] = temp
                    } else if (girlInfo.pose) {
                        delete girlInfo.pose[selected_grade]
                    }
                    this.saveWaifuInfo(waifuInfo)
                })

                $reset_pose.click(() => {
                    $('.waifu-container>img').eq(0).css('transform','')
                    cord = {x:0, y:0}
                    start = {x:0, y:0}
                    scale = 1;
                })

                function setTransform() {
                    $('.waifu-container>img').eq(0).css('transform',`translate(${Math.round(cord.x)}px, ${Math.round(cord.y)}px) scale(${scale})`);
                }

                Helpers.doWhenSelectorAvailable('.waifu-container>img', () => {
                    let waifu_image = $('.waifu-container>img').eq(0)
                    const size = {width: waifu_image.width()/2, height: waifu_image.height()/2}

                    const observer = new MutationObserver(() => {
                        if ($('.waifu-container>img').eq(0).attr('style').includes('margin-top')) {
                            $('.waifu-container>img').eq(0).css('margin-top', '')
                        }
                    })
                    observer.observe(waifu_image[0], {attributes: true, attributeFilter: ['style']})
                    setTransform();

                    waifu_image.mousedown(function (e) {
                        if (!editing) {return;}
                        e.preventDefault();
                        start = {x: e.clientX-cord.x, y: e.clientY-cord.y}
                        panning = true;
                    })
                    waifu_image.mouseup(function (e) {
                        if (!editing) {return}
                        e.preventDefault();
                        panning = false;
                    })
                    waifu_image.mouseleave(function (e) {
                        if (!editing) {return}
                        panning = false;
                    })
                    waifu_image.mousemove(function (e) {
                        if(!panning||!editing) {return}
                        cord = {x: e.clientX - start.x, y: e.clientY-start.y}
                        setTransform();
                    })
                    waifu_image.bind('wheel', function (e) {
                        if (!editing) {return}
                        e.preventDefault();
                        const offset = waifu_image.offset(), old_scale = scale
                        const point = {x: e.clientX-offset.left, y: e.clientY-offset.top}
                        if(e.originalEvent.deltaY < 0) {
                            scale += 0.1;
                        } else {
                            scale = Math.max(scale-0.05, 0.1);
                        }
                        // translation needs improvment
                        cord = {x: cord.x-(scale/old_scale-1)*(point.x-size.width*old_scale),
                                y: cord.y-(scale/old_scale-1)*(point.y-size.height*old_scale)}
                        setTransform();
                    })
                })

                $('.diamond').each((index) => {
                    const $diamond = $('.diamond').eq(index)
                    $($diamond).click(() => {
                        if (selected_grade!=index && $($diamond).hasClass('unlocked')) {
                            if (editing) {
                                $(".waifu-edit div").toggleClass("hide")
                                editing = false
                            }
                            $('.diamond.unlocked').eq(selected_grade).removeClass('selected')
                            $($diamond).addClass('selected')
                            selected_grade = index
                            $('.waifu-container>img').eq(0).attr('src', `${Helpers.getCDNHost()}/pictures/girls/${girl_id}/ava${index}.png`)
                            start = {x:0, y:0}
                            try {scale = girlInfo.pose[selected_grade].scale || 1} catch {scale = 1}
                            try {x = girlInfo.pose[selected_grade].x || 0} catch {x = 0}
                            try {y = girlInfo.pose[selected_grade].y || 0} catch {y = 0}
                            cord = {x: x, y: y}
                            setTransform();
                            girlInfo.grade = selected_grade
                            this.saveWaifuInfo(waifuInfo)
                        }
                    })
                })

                // waifu-right
                $fav_girl.click(() => {
                    if (fav) {
                        $fav_girl.children().toggleClass('hide')
                        delete girlInfo.fav
                    } else {
                        $fav_girl.children().toggleClass('hide')
                        girlInfo.fav = true
                    }
                    fav = !fav
                    this.saveWaifuInfo(waifuInfo)
                })

                $waifu_mode.click(() => {
                    if (mode == 'All') {
                        $waifu_mode.children().toggleClass('hide')
                        mode = 'Favorite'
                    } else {
                        $waifu_mode.children().toggleClass('hide')
                        mode = 'All'
                    }
                    waifuInfo.mode = mode
                    this.saveWaifuInfo(waifuInfo)
                })

                $cycle_waifu.click(() => {
                    $cycle_waifu.children().toggleClass('hide')
                    cycle = !cycle
                    waifuInfo.cycle = cycle
                    this.saveWaifuInfo(waifuInfo)
                })

                $random_waifu.click(async () => {
                    ids = await this.getIds(waifuInfo, mode)
                    let temp_id = girl_id
                    if (ids.length == 1) {
                        temp_id = ids[0]
                    } else {
                        while (temp_id == girl_id) {
                            temp_id = ids[Math.floor(Math.random()*ids.length)]
                        }
                    }
                    girl_id = temp_id.toString()
                    if (!waifuInfo.girls[girl_id]) {
                        waifuInfo.girls[girl_id] = {}
                    }
                    girlInfo = waifuInfo.girls[girl_id]
                    dictGirl = girlDictionary.get(girl_id)
                    if (!dictGirl) {
                        console.log(this.label('warningMaxGrade', {id: girl_id}))
                        return
                    }
                    unlocked_grade = dictGirl.graded
                    if (!(unlocked_grade>=0)) {
                        console.log(this.label('warningUnlockedGrade', {id: girl_id}))
                        return
                    }
                    max_grade = dictGirl.grade || unlocked_grade
                    selected_grade = girlInfo.grade === undefined ? Math.min(max_grade, unlocked_grade) : girlInfo.grade
                    fav = girlInfo.fav || false
                    start = {x:0, y:0}
                    try {scale = girlInfo.pose[selected_grade].scale || 1} catch {scale = 1}
                    try {x = girlInfo.pose[selected_grade].x || 0} catch {x = 0}
                    try {y = girlInfo.pose[selected_grade].y || 0} catch {y = 0}
                    cord = {x: x, y: y}

                    $('.waifu-container>img').eq(0).attr('src', `${Helpers.getCDNHost()}/pictures/girls/${girl_id}/ava${selected_grade}.png`)
                    setTransform();
                    $('.girls-name a').eq(0).text(dictGirl.name)
                    $('.diamond').each(function (index) {
                        index == selected_grade ? $(this).addClass('selected') : $(this).removeClass('selected')
                        if (index <= unlocked_grade) {
                            $(this).addClass ('unlocked')
                            $(this).removeClass ('locked')
                        } else {
                            $(this).addClass ('locked')
                            $(this).removeClass ('unlocked')
                        }
                        index > max_grade ? $(this).addClass('hide') : $(this).removeClass('hide')
                    })
                    if (editing) {
                        $(".waifu-edit div").toggleClass("hide")
                        editing = false
                    }
                    if (fav) {
                        $fav_girl.find('.fav-girl').addClass('hide')
                        $fav_girl.find('.unfav-girl').removeClass('hide')
                    } else {
                        $fav_girl.find('.fav-girl').removeClass('hide')
                        $fav_girl.find('.unfav-girl').addClass('hide')
                    }

                    waifuInfo.girl_id = girl_id
                    this.saveWaifuInfo(waifuInfo)
                })
            } else if (Helpers.isCurrentPage('waifu.html')) {
                let waifuInfo = Helpers.lsGet(lsKeys.WAIFU_INFO)
                if (!waifuInfo) {return}
                let favs = await this.getIds(waifuInfo, 'Favorite', false)

                $('.harem-girl-container').each((index) => {
                    let $girl_container = $('.harem-girl-container').eq(index)
                    let id = $($girl_container).attr('id_girl')
                    let fav = favs.includes(id)
                    $($girl_container).children().last().replaceWith(`<div class="fav-girl" fav=${fav}><img src="${Helpers.getCDNHost()}/design/ic_star_${fav? 'orange' : 'white'}.svg"></div>`)
                    let $fav_button = $($girl_container).children().last()

                    $fav_button.click(() => {
                        let fav = !($fav_button.attr('fav') === 'true')
                        $fav_button.children().attr('src', `${Helpers.getCDNHost()}/design/ic_star_${fav? 'orange' : 'white'}.svg`)
                        $fav_button.attr('fav', fav)

                        if (fav) {
                            waifuInfo.girls[id]? waifuInfo.girls[id].fav = true : waifuInfo.girls[id] = {fav: true}
                        } else {
                            delete waifuInfo.girls[id].fav
                        }
                        this.saveWaifuInfo(waifuInfo)
                    })
                })

                Helpers.onAjaxResponse(/action=waifu_select/i, () => {
                    waifuInfo.individual = true
                    this.saveWaifuInfo(waifuInfo)
                })
            }
        })

        this.hasRun = true
    }

    async getIds (waifuInfo, mode, defaultAll=true) {
        const girlDictionary = await Helpers.getGirlDictionary()
        let ids = []
        if (mode == 'Favorite') {
            ids = Object.entries(waifuInfo.girls).filter(([key, value]) => value.fav).map(([key]) => (key))
            if (ids.length!=0 || !defaultAll) {
                return ids
            }
        }
        girlDictionary.forEach(({shards}, id) => {
            if (shards === 100) {
                ids.push(id)
            }
        })
        return ids
    }

    saveWaifuInfo (waifuInfo) {
        // clear empty objects to save a bit on local storage
        let copiedWaifuInfo = JSON.parse(JSON.stringify(waifuInfo));
        for (let girl in copiedWaifuInfo.girls) {
            const girl_info = copiedWaifuInfo.girls[girl]
            if (girl_info.pose) {
                if (!Object.keys(girl_info.pose).length) {
                    delete girl_info.pose
                }
            }
            if (!Object.keys(girl_info).length) {
                delete copiedWaifuInfo.girls[girl]
            }
        }
        Helpers.lsSet(lsKeys.WAIFU_INFO, copiedWaifuInfo)
    }
}

export default ImprovedWaifuModule
