import Helpers from '../common/Helpers'

let girlDictionary

const upsert = (id, data) => {
    const existingEntry = girlDictionary.get(`${id}`)
    const upsert = Object.assign({}, existingEntry, data)
    girlDictionary.set(`${id}`, upsert)
}

const collectFromGirlList = async (girl_list, {trusted=true, could_own=true}={}) => {
    girlDictionary = await Helpers.getGirlDictionary()
    let updated = false
    const {GT: {zodiac: zodiacs}} = window

    Object.values(girl_list).forEach((girl) => {
        const {id_girl, name} = girl
        if (id_girl && name) {
            const {own, is_owned, shards, rarity, graded2, nb_grades, class: girl_class, element, element_data, id_role, salaries, figure, position_img, eye_color1, eye_color2, hair_color1, hair_color2, zodiac, blessed_attributes, grade_offset_values} = girl
            const has_girl = could_own && (own !== undefined ? own : (is_owned !== undefined ? is_owned : shards == 100))

            const girl_data = { // Data for owned or unowned girls
                name,
                shards: could_own ? (has_girl ? 100 : parseInt(shards, 10)) : undefined,
                rarity,
                grade: nb_grades ? parseInt(nb_grades, 10) : (graded2 ? $(graded2).length : undefined),
                element: element ? element : element_data?.type,
                class: parseInt(girl_class, 10),
                role: parseInt(id_role, 10),
                salaries,
                figure: figure ? parseInt(figure, 10) : (position_img ? parseInt(position_img.match(/\d+/g)[0], 10) : undefined),
                eye_colors: eye_color1 || eye_color2 ? [eye_color1, eye_color2].filter(color => !!color) : undefined,
                hair_colors: hair_color1 || hair_color2 ? [hair_color1, hair_color2].filter(color => !!color) : undefined,
                zodiac: zodiac ? Object.keys(zodiacs).find(key => zodiacs[key] === zodiac.substring(3)) : undefined,
                grade_offsets: grade_offset_values
            }
            if ((Helpers.isCurrentPage('characters') || Helpers.isCurrentPage('harem')) && !Helpers.isCurrentPage('hero')) { // base stats only available for unblessed girls
                const {carac1, carac2, carac3} = girl
                const caracs = [carac1, carac2, carac3]
                if (caracs.every(carac => Number.isInteger(carac) && carac<100)) {
                    girl_data.caracs = caracs
                }
            }
            if (has_girl && trusted) { // player mutable
                const {fav_graded, graded, affection, xp, level, level_cap, awakening_level, salary, date_added, armor, skill_tiers_info, skills, skill_trait} = girl
                const cur_grade = graded ? parseInt(graded, 10) : (graded2 ? $(graded2).filter('g:not(.grey):not(.green)').length : undefined)

                girl_data.pose = (fav_graded == null || parseInt(fav_graded, 10) < 0) ? cur_grade : parseInt(fav_graded, 10)
                girl_data.graded = cur_grade
                girl_data.affection = parseInt(affection, 10)
                girl_data.xp = parseInt(xp, 10)
                girl_data.level = parseInt(level, 10)
                girl_data.level_cap = level_cap ? parseInt(level_cap, 10) : parseInt(awakening_level, 10) * 50 + 250
                girl_data.salary = parseInt(salary, 10)
                if (date_added) {
                    girl_data.date_added = Date.parse(`${date_added} UTC`)
                }
                if (armor) { // extract only needed parts of armor data
                    girl_data.equips = armor.map(equip => {
                        const {level: e_level, rarity: e_rarity, slot_index, caracs, id_variation, resonance_bonuses, skin} = equip
                        const {id_item_skin, identifier, name: e_name, ico} = skin
                        return {level: e_level, rarity: e_rarity, slot_index, caracs, id_variation, resonance_bonuses, skin: {id_item_skin, identifier, name: e_name, ico}}
                    })
                }
                // extract and reorginize needed parts of skill data
                if (skill_tiers_info) {
                    const skill_tiers = Object.values(skill_tiers_info).map(tier => tier.skill_points_used)
                    girl_data.skill_tiers = skill_tiers
                    if (skill_tiers[0] === 0) {
                        girl_data.skills = {}
                    }
                }
                if (skills) {
                    girl_data.skills = {}
                    Object.entries(skills).forEach(([skill_id, {skill}]) => {
                        const {tier, level: s_level, flat_value, percentage_value, description, icon, skill_type, named_attack_text, name: s_name} = skill
                        const girl_skill = {tier, level: s_level, flat_value, percentage_value, description, icon}
                        if (tier == 3) {girl_skill.trait = skill_trait}
                        if (skill_type) {girl_skill.skill_type = skill_type}
                        if (named_attack_text) {girl_skill.named_attack_text = named_attack_text}
                        if (s_name) {girl_skill.name = s_name}
                        girl_data.skills[skill_id] = girl_skill
                    })
                }
            }

            // clear undefined keys to not overwrite known data
            Object.keys(girl_data).forEach((key) => {
                if (girl_data[key] == null || girl_data[key] !== girl_data[key]) {
                    delete girl_data[key]
                }
            })
            upsert(id_girl, girl_data)
            updated = true
        }
    })

    if (updated) {
        Helpers.setGirlDictionary(girlDictionary)
    }
}
// Just to update shard values
const collectFromRewards = async (rewards) => {
    if (rewards && rewards.data && !rewards.data.draft && rewards.data.shards) {
        girlDictionary = await Helpers.getGirlDictionary()
        rewards.data.shards.forEach(({id_girl, value}) => {
            upsert(id_girl, {shards: Math.min(value, 100)})
        })
        Helpers.setGirlDictionary(girlDictionary)
    }
}
// Update/collect player mutable keys
const updateFavPose = async (response, opt) => {
    const searchParams = new URLSearchParams(opt.data)
    const id_girl = searchParams.get('id_girl')
    const pose = parseInt(searchParams.get('girl_grade'), 10)
    girlDictionary = await Helpers.getGirlDictionary()

    upsert(id_girl, {pose})
    Helpers.setGirlDictionary(girlDictionary)
}
const updateXpOrAff = async (response, opt) => {
    const searchParams = new URLSearchParams(opt.data)
    const id_girl = searchParams.get('id_girl')
    girlDictionary = await Helpers.getGirlDictionary()
    const {xp, level, affection} = response

    if (xp) {
        upsert(id_girl, {xp, level})
    } else if (affection) {
        upsert(id_girl, {affection})
    }
    Helpers.setGirlDictionary(girlDictionary)
}
const updateEquipsInfo = async (response, opt) => {
    const searchParams = new URLSearchParams(opt.data)
    const id_girl = searchParams.get('id_girl')
    girlDictionary = await Helpers.getGirlDictionary()

    if (id_girl) {
        const {equipped_armor, unequipped_armor} = response
        const equipped_armor_list = Array.isArray(equipped_armor) ? equipped_armor : (equipped_armor ? [equipped_armor] : [])
        const unequipped_armor_list = Array.isArray(unequipped_armor) ? unequipped_armor : (unequipped_armor ? [unequipped_armor] : [])
        const girl_data = girlDictionary.get(`${id_girl}`)

        if (equipped_armor_list.length) {
            let to_sort = false

            equipped_armor_list.forEach(equip => {
                const {level, rarity, slot_index, caracs, id_variation, resonance_bonuses, skin} = equip
                const {id_item_skin, identifier, name, ico} = skin
                const equip_info = {level, rarity, slot_index, caracs, id_variation, resonance_bonuses, skin: {id_item_skin, identifier, name, ico}}

                const index = girl_data.equips.findIndex(item => item.slot_index === slot_index)
                if (index > -1) {
                    girl_data.equips[index] = equip_info
                } else {
                    girl_data.equips.push(equip_info)
                    to_sort = true
                }
            })

            if (to_sort) {
                girl_data.equips.sort((a, b) => parseInt(a.slot_index)-parseInt(b.slot_index))
            }
        } else if (unequipped_armor_list.length) {
            unequipped_armor_list.forEach(equip => {
                const {slot_index} = equip
                const index = girl_data.equips.findIndex(item => item.slot_index === slot_index)
                girl_data.equips.splice(index, 1)
            })
        }

        girlDictionary.set(`${id_girl}`, girl_data)
    } else { // remove all equips
        girlDictionary.forEach((girl) => {
            if (girl.equips && girl.equips.length) {
                girl.equips = []
            }
        })
        // unsure if this will always run before the page refreshes
    }

    Helpers.setGirlDictionary(girlDictionary)
}
const collectSkillInfo = async (response, opt) => {
    const searchParams = new URLSearchParams(opt.data)
    const id_girl = searchParams.get('id_girl')
    const {girl_skills} = response
    const skill_tiers = []
    const skills = {}
    Object.values(girl_skills).forEach(skill_tier => {
        const {icon: skill_trait, upgrades_count} = skill_tier
        skill_tiers.push(upgrades_count)
        Object.entries(skill_tier.skills).forEach(([skill_id, skill]) => {
            const {tier, level, flat_value, percentage_value, description, icon, skill_type, named_attack_text, name} = skill
            if (level > 0) {
                skills[skill_id] = {tier, level, flat_value, percentage_value, description, icon}
                if (tier == 3) {skills[skill_id].trait = skill_trait}
                if (skill_type) {skills[skill_id].skill_type = skill_type}
                if (named_attack_text) {skills[skill_id].named_attack_text = named_attack_text}
                if (name) {skills[skill_id].name = name}
            }
        })
    })

    girlDictionary = await Helpers.getGirlDictionary()
    upsert(id_girl, {skill_tiers, skills})
    Helpers.setGirlDictionary(girlDictionary)
}

const collectFromAjaxResponseSingular = (response) => {
    const {rewards} = response
    collectFromRewards(rewards)
}
const collectFromAjaxResponsePlural = (response) => {
    const {rewards: rewardsSets} = response
    if (rewardsSets) {
        rewardsSets.forEach(collectFromRewards)
    }
}
const collectFromAjaxResponseLeagues = (response) => {
    const {rewards} = response
    if (!rewards) {return}
    const {list} = rewards
    if (list) {
        list.forEach(collectFromRewards)
    }
}

class GirlDictionaryCollector {
    static collect() {
        Helpers.defer(() => {
            // Data for owned girls
            if (Helpers.isCurrentPage('/girl/')) {
                const {girl} = window
                collectFromGirlList([girl])

                Helpers.onAjaxResponse(/action=girl_give_(xp|affection)/i, updateXpOrAff)
                Helpers.onAjaxResponse(/action=girl_equipment_(equip|unequip)/i, updateEquipsInfo)
                Helpers.onAjaxResponse(/action=girl_skills_(list|upgrade)/i, collectSkillInfo)
            } else if (Helpers.isCurrentPage('activities')) {
                const {pop_hero_girls} = window
                if (pop_hero_girls) {
                    collectFromGirlList(pop_hero_girls)
                }
            } else if (['edit-team', 'add-boss-bang-team', 'edit-labyrinth-team'].some(page => Helpers.isCurrentPage(page))) {
                const {availableGirls} = window
                collectFromGirlList(availableGirls)
            } else if (Helpers.isCurrentPage('waifu.html')) {
                const {girls_data_list} = window
                collectFromGirlList(girls_data_list)
            }
            // Data for unowned or owned girls
            if ((Helpers.isCurrentPage('characters') || Helpers.isCurrentPage('harem')) && !Helpers.isCurrentPage('hero')) {
                Helpers.onAjaxResponse(/action=get_girls_list/i, ({girls_list}) => {
                    collectFromGirlList(girls_list)
                })
                Helpers.onAjaxResponse(/action=get_girl&/i, ({girl}) => {
                    collectFromGirlList([{...girl, ...girl.girl}])
                })

                Helpers.onAjaxResponse(/action=show_specific_girl_grade/i, updateFavPose)
                Helpers.onAjaxResponse(/action=girl_equipment_(equip|unequip)/i, updateEquipsInfo)
            } else if (Helpers.isCurrentPage('event')) {
                const {event_girls} = window
                collectFromGirlList(event_girls, {trusted: false})
            } else if (Helpers.isCurrentPage('clubs')) {
                const {club_champion_data} = window
                if (club_champion_data && club_champion_data.reward) {
                    const {shards} = club_champion_data.reward
                    if (shards && shards.length) {
                        const {girl_class, previous_value} = shards[0]
                        const girl_data = Object.assign({class: girl_class, shards: previous_value}, shards[0])

                        collectFromGirlList([girl_data], {trusted: false})
                    }
                }
            } else if (Helpers.isCurrentPage('pre-battle')) {
                const {opponent_fighter} = window
                const {team} = opponent_fighter.player || opponent_fighter
                const girls = team.girls.map(girl => girl.girl)
                collectFromGirlList(girls, {trusted: false, could_own: false})
            } else if (Helpers.isCurrentPage('season-arena')) {
                const {opponents} = window
                const girls = []
                opponents.forEach(opponent => opponent.player.team.girls.forEach(({girl}) => {
                    if (!girls.find(({id_girl}) => id_girl == girl.id_girl)) {
                        girls.push(girl)
                    }
                }))
                collectFromGirlList(girls, {trusted: false, could_own: false})
            } else if (Helpers.isCurrentPage('season.html')) {
                const {seasons_girls} = window
                const girls = seasons_girls.map(girl => {
                    const {girl_class, previous_value} = girl
                    return Object.assign({class: girl_class, shards: previous_value}, girl)
                })
                collectFromGirlList(girls, {trusted: false})
            } else if (['path-of-valor', 'path-of-glory'].some(page => Helpers.isCurrentPage(page))) {
                const {path_girls} = window
                const girls = path_girls.map(girl => {
                    const {girl_shards} = girl
                    return Object.assign({shards: girl_shards}, girl)
                })
                collectFromGirlList(girls, {trusted: false})
            } else if (Helpers.isCurrentPage('pantheon.html')) {
                if (!girl_rewards) {return}
                const girls = girl_rewards.map(({girl_data, is_owned}) => Object.assign({is_owned}, girl_data))
                collectFromGirlList(girls, {trusted: false})
            }
            // SM, ME, and Lab market girl data and shard progress
            if ((Helpers.isCurrentPage('event') && Helpers.hasSearch('tab=sm_event')) || ['seasonal', 'labyrinth.html'].some(page => Helpers.isCurrentPage(page))) {
                Helpers.onAjaxResponse(/action=event_market_get_data/i, ({inventory}) => {
                    const girls = []
                    inventory.forEach(({shards}) => {
                        if (shards) {
                            const {girl_class, previous_value} = shards[0]
                            girls.push(Object.assign({class: girl_class, shards: previous_value}, shards[0]))
                        }
                    })
                    collectFromGirlList(girls, {trusted: false})
                })
                Helpers.onAjaxResponse(/action=event_market_buy/i, ({rewards}) => collectFromAjaxResponseSingular(rewards))
            }
            // To track shard progress
            if (Helpers.isCurrentPage('battle')) {
                Helpers.onAjaxResponse(/action=do_battles_(leagues|seasons|troll|pantheon)/i, collectFromAjaxResponseSingular)
            } else if (Helpers.isCurrentPage('pachinko')) {
                Helpers.onAjaxResponse(/action=play/i, collectFromAjaxResponseSingular)
                Helpers.onAjaxResponse(/action=claim/i, collectFromAjaxResponseSingular)
            } else if (Helpers.isCurrentPage('activities')) {
                Helpers.onAjaxResponse(/action=give_reward/i, collectFromAjaxResponseSingular)
            } else if (Helpers.isCurrentPage('champion')) {
                Helpers.onAjaxResponse(/class=TeamBattle/i, (response) => {
                    const {end} = response
                    if (end) {
                        collectFromAjaxResponseSingular(end)
                    }
                })
            } else if (Helpers.isCurrentPage('home')) {
                Helpers.onAjaxResponse(/action=process_rewards_queue/i, collectFromAjaxResponsePlural)
            } else if (Helpers.isCurrentPage('season')) {
                Helpers.onAjaxResponse(/action=claim/i, collectFromAjaxResponseSingular)
            } else if (Helpers.isCurrentPage('leagues.html')) {
                Helpers.onAjaxResponse(/action=claim_rewards/i, collectFromAjaxResponseLeagues)
            }
        })
    }
}

export default GirlDictionaryCollector
