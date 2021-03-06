import {DND5E} from "../../systems/dnd5e/module/config.js";
import ActorSheet5e from "../../systems/dnd5e/module/actor/sheets/base.js";
import ActorSheet5eCharacter from "../../systems/dnd5e/module/actor/sheets/character.js";

import {preloadTrazzm5eHandlebarsTemplates} from "./templates/trazzm-5e-templates.js";
import {addFavorites} from "./trazzm-5e-favorites.js";
import {Rules} from './scripts/rules.js';
import {TrazzmDialog} from './scripts/dialog.js';

export const TRAZZM5E = {};
TRAZZM5E.Rules = Rules;

let position = 0;

// handlebar helper compare string
Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
    return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
});

TRAZZM5E.notDefinedOrEmpty = function (obj) {
    return obj == null || obj === '';
};

export class Trazzm5eSheet extends ActorSheet5eCharacter {

    get template() {
        if (!game.user.isGM && this.actor.limited) return "modules/trazzm-5e-sheet/templates/trazzm-5e-sheet-ltd.html";
        return "modules/trazzm-5e-sheet/templates/trazzm-5e-sheet.html";
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["trazzm-5e", "dnd5e", "sheet", "actor", "character"],
            blockFavTab: true,
            width: 740,
            height: 720
        });
    }

    getData() {
        const data = super.getData();
        data.TrazzmRules = TRAZZM5E.Rules;
        console.debug(data);
        return data;
    }

    _createEditor(target, editorOptions, initialContent) {
        editorOptions.min_height = 200;
        super._createEditor(target, editorOptions, initialContent);
    }

    // save all simultaneously open editor field when one field is saved
    async _onEditorSave(target, element, content) {
        return this.submit();
    }

    activateListeners(html) {
        super.activateListeners(html);
        this._activateDialogs(html);

        // store Scroll Pos
        const attributesTab = html.find('.tab.attributes');
        attributesTab.scroll(function () {
            position = this.scrollPos = {top: attributesTab.scrollTop()};
        });
        let tabNav = html.find('a.item:not([data-tab="attributes"])');
        tabNav.click(function () {
            this.scrollPos = {top: 0};
            attributesTab.scrollTop(0);
        });

        // toggle item delete protection
        html.find('.trazzm-5e-delete-toggle').click(async (event) => {
            event.preventDefault();
            let actor = this.actor;

            if (actor.getFlag('trazzm-5e-sheet', 'allow-delete')) {
                await actor.unsetFlag('trazzm-5e-sheet', 'allow-delete');
            } else {
                await actor.setFlag('trazzm-5e-sheet', 'allow-delete', true);
            }
        });

        // toggle favorites
        html.find('.favorites-toggle').click(async (event) => {
            event.preventDefault();
            let actor = this.actor;

            if (actor.getFlag('trazzm-5e-sheet', 'favorites-compressed')) {
                await actor.unsetFlag('trazzm-5e-sheet', 'favorites-compressed');
            } else {
                await actor.setFlag('trazzm-5e-sheet', 'favorites-compressed', true);
            }
        });

        // set input fields via editable elements
        html.find('[contenteditable]').on('paste', function (e) {
            //strips elements added to the editable tag when pasting
            let $self = $(this);

            // set maxlength
            let maxlength = 40;
            if ($self[0].dataset.maxlength) {
                maxlength = parseInt($self[0].dataset.maxlength);
            }

            setTimeout(function () {
                let textString = $self.text();
                textString = textString.substring(0, maxlength);
                $self.html(textString);
            }, 0);

        }).on('keypress', function (e) {
            let $self = $(this);

            // set maxlength
            let maxlength = 40;
            if ($self[0].dataset.maxlength) {
                maxlength = parseInt($self[0].dataset.maxlength);
            }

            // only accept backspace, arrow keys and delete after maximum characters
            let keys = [8, 37, 38, 39, 40, 46];

            if ($(this).text().length === maxlength && keys.indexOf(e.keyCode) < 0) {
                e.preventDefault();
            }

            if (e.keyCode === 13) {
                $(this).blur();
            }
        });

        html.find('[contenteditable]').blur(async (event) => {
            let value = event.target.textContent;
            let target = event.target.dataset.target;
            html.find('input[type="hidden"][data-input="' + target + '"]').val(value).submit();
        });

        html.find('[contenteditable]').blur(async (event) => {
            let value = event.target.textContent;
            let target = event.target.dataset.target;
            html.find('input[type="hidden"][data-input="' + target + '"]').val(value).submit();
        });

        // changing item qty and charges values (removing if both value and max are 0)
        html.find('.item:not(.inventory-header) input').change(event => {
            let value = event.target.value;
            let actor = this.actor;
            let itemId = $(event.target).parents('.item')[0].dataset.itemId;
            let path = event.target.dataset.path;
            let data = {};
            data[path] = Number(event.target.value);
            actor.getOwnedItem(itemId).update(data);
        });

        // creating charges for the item
        html.find('.inventory-list .item .addCharges').click(event => {
            let actor = this.actor;
            let itemId = $(event.target).parents('.item')[0].dataset.itemId;
            let item = actor.getOwnedItem(itemId);

            item.data.uses = {value: 1, max: 1};
            let data = {};
            data['data.uses.value'] = 1;
            data['data.uses.max'] = 1;

            actor.getOwnedItem(itemId).update(data);
        });
    }

    /**
     * @private
     * @param {JQuery} html
     */
    _activateDialogs ( html ) {
        html.find('.trazzm-simple-dialog, [data-dialog]').click(evt => {
            const options = duplicate(evt.currentTarget.dataset);

            // if (options.dialog === 'RollHD' && evt.shiftKey) {
            //     this._rollHighestHD();
            //     return;
            // }

            if (options.width !== undefined) {
                options.width = parseInt(options.width);
            }

            if (options.template !== undefined) {
                options.template = 'modules/trazzm-5e-sheet/templates/dialog/' + options.template;
            }

            if (options.dialog === undefined) {
                new TrazzmDialog(this, options).render(true);
            } else {
                const dialog = eval(`TrazzmDialog${options.dialog}Dialog.prototype.constructor`);
                new dialog(this, options).render(true);
            }
        });
    }
}

// Add Character Class List
async function addClassList(app, html, data) {
    let actor = game.actors.entities.find(a => a.data._id === data.actor._id);
    let classList = [];
    let items = data.actor.items;

    for (let item of items) {
        if (item.type === "class") {
            let i18n = `TRAZZM5E.Class-${item.name}`;
            let classLookup = game.i18n.localize( i18n );
            let className = (item.name.length == 3) ? classLookup : item.name;
            let subclass = (item.data.subclass) ? `(${item.data.subclass})` : ``;
            classList.push(className + ' ' + subclass + ' L' + item.data.levels);
        }
    }
    classList = "<ul class='class-list'><li class='class-item'>" + classList.join("</li><li class='class-item'>") + "</li></ul>";
    mergeObject(actor, {"data.flags.trazzm-5e-sheet.classlist": classList});
    let classListTarget = html.find('.level-information');
    classListTarget.before(classList);
}

// Manage Sheet Options
async function setSheetClasses(app, html, data) {
    let actor = game.actors.entities.find(a => a.data._id === data.actor._id);
    if (game.settings.get("trazzm-5e-sheet", "useRoundPortraits")) {
        html.find('.trazzm-5e-sheet .profile').addClass('roundPortrait');
    }
    if (game.settings.get("trazzm-5e-sheet", "disableHpOverlay")) {
        html.find('.trazzm-5e-sheet .profile').addClass('disable-hp-overlay');
    }
    if (game.settings.get("trazzm-5e-sheet", "hpOverlayBorder") > 0) {
        html.find('.trazzm-5e-sheet .profile .hp-overlay').css({'border-width': game.settings.get("trazzm-5e-sheet", "hpOverlayBorder") + 'px'});
    }
}

// Preload trazzm-5e Handlebars Templates
Hooks.once("init", () => {
    preloadTrazzm5eHandlebarsTemplates();

    game.settings.register("trazzm-5e-sheet", "useDarkMode", {
        name: "Use alternate dark mode",
        hint: "Checking this option will enable an alternate Dark Mode version of the Trazzm5e Sheet.",
        scope: "user",
        config: true,
        default: false,
        type: Boolean,
        onChange: data => {
            data === true ? document.body.classList.add("trazzm-5eDark") : document.body.classList.remove("trazzm-5eDark");
        }
    });

    game.settings.register("trazzm-5e-sheet", "primaryAccent", {
        name: "Primary accent color.",
        hint: "Overwrite the default primary accent color (#48BB78) for Dark Mode used to highlight e. g. buttons, input field borders or hover states. Use any valid css value like red/#ff0000/rgba(255,0,0)/rgba(255,0,0,1)",
        scope: "user",
        config: true,
        default: "",
        type: String,
        onChange: data => {
            data === true ? document.documentElement.style.setProperty('--darkmode-primary-accent', primaryAccentColor)
                : document.documentElement.style.setProperty('--darkmode-primary-accent', "#48BB78");
        }
    });

    game.settings.register("trazzm-5e-sheet", "secondaryAccent", {
        name: "Secondary accent color.",
        hint: "Overwrite the default secondary accent color (rgba(0,150,150,.325)) for Dark Mode used to highlight preparation states. Use any valid css value like red/#ff0000/rgba(255,0,0)/rgba(255,0,0,1)",
        scope: "user",
        config: true,
        default: "",
        type: String,
        onChange: data => {
            data === true ? document.documentElement.style.setProperty('--darkmode-secondary-accent', secondaryAccentColor)
                : document.documentElement.style.setProperty('--darkmode-secondary-accent', "rgba(0,150,150,.325)");
        }
    });

    const useDarkMode = game.settings.get('trazzm-5e-sheet', "useDarkMode");
    if (useDarkMode === true) {
        document.body.classList.add("trazzm-5eDark");
    }
    const primaryAccentColor = game.settings.get('trazzm-5e-sheet', "primaryAccent");
    const secondaryAccentColor = game.settings.get('trazzm-5e-sheet', "secondaryAccent");
    if (useDarkMode === true && primaryAccentColor !== '') {
        document.documentElement.style.setProperty('--darkmode-primary-accent', primaryAccentColor);
    }
    if (useDarkMode === true && secondaryAccentColor !== '') {
        document.documentElement.style.setProperty('--darkmode-secondary-accent', secondaryAccentColor);
    }
});

// Register Trazzm5e Sheet and make default character sheet
Actors.registerSheet("dnd5e", Trazzm5eSheet, {
    types: ["character"],
    makeDefault: true
});

Hooks.on("renderTrazzm5eSheet", (app, html, data) => {
    // migrateTraits(app, html, data);
    addFavorites(app, html, data, position);
    addClassList(app, html, data);
    setSheetClasses(app, html, data);
    //toggleTraitsList(app, html, data)
    // console.log(data);
    console.log("Trazzm5e Sheet rendered!");
});

Hooks.once("ready", () => {
    console.log("Trazzm5e Sheet is ready!");

    if (window.BetterRolls) {
        window.BetterRolls.hooks.addActorSheet("Trazzm5eSheet");
    }

    game.settings.register("trazzm-5e-sheet", "useRoundPortraits", {
        name: "PC Sheets: Sheets use round portraits.",
        hint: "You should check this if you use round portraits. It will adapt the hp overlay and portait buttons to make it look nicer. Also looks nice on square portraits without a custom frame.",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });
    game.settings.register("trazzm-5e-sheet", "hpOverlayBorder", {
        name: "PC Sheets: Border width for the hit point overlay",
        hint: "If your portrait has a frame you can adjust the Hit Point overlay to compensate the frame width. It might look nicer if the overlay doesn't tint the border.",
        scope: "world",
        config: true,
        default: 0,
        type: Number
    });
    game.settings.register("trazzm-5e-sheet", "disableHpOverlay", {
        name: "Disable the hit point overlay.",
        hint: "If you don't like the video game style Hit Point overlay on your character's portrait you can disable it.",
        scope: "user",
        config: true,
        default: false,
        type: Boolean
    });
});
