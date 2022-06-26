export class TrazzmDialog extends BaseEntitySheet {
	constructor (parent, options = {register: false}) {
		super(parent.object, options);
		this.parent = parent;

		if (!options.register) {
			// Deregister the sheet as this is just a modal dialog.
			delete this.entity.apps[this.appId];
		}
	}

	static get defaultOptions () {
		const options = super.defaultOptions;
		delete options.template;
		options.classes = ['form', 'dialog', 'trazzm-window'];
		options.closeOnSubmit = false;
		options.submitOnClose = true;
		options.submitOnChange = true;
		options.width = 400;
		options.modal = true;
		options.pinnable = false;
		return options;
	}

	get template () {
		return this.options.template;
	}

	get title () {
		return this.options.title;
	}

	/**
	 * @param html {JQuery}
	 * @return undefined
	 */
	activateListeners (html) {
		super.activateListeners(html);
		if (this.options.submitOnChange) {
			html.find('input').off('focusout').focusout(this._onSubmit.bind(this));
			html.find('select').off('change').change(this._onSubmit.bind(this));
		}

		TrazzmDialog.initializeComponents(html);
	}

	static initializeComponents (html) {
		const updateSelections = parent => {
			const selector = parent.data('selector');
			const val = parent.val();
			html.find(`[data-selector-parent="${selector}"]`).each((i, el) => {
				const jqel = $(el);
				const isParentHidden =
					(parent.attr('type') !== 'checkbox' && parent.hasClass('trazzm-hidden'))
					|| (parent.attr('type') === 'checkbox'
						&& parent.prev().hasClass('trazzm-hidden'));

				if (isParentHidden) {
					jqel.addClass('trazzm-hidden');
					return;
				}

				const show = el.dataset.show && el.dataset.show.split(',').map(s => s.trimStart());
				const hide = el.dataset.hide && el.dataset.hide.split(',').map(s => s.trimStart());

				if (parent.attr('type') === 'checkbox') {
					if (parent.prop('checked')) {
						jqel.removeClass('trazzm-hidden');
					} else {
						jqel.addClass('trazzm-hidden');
					}
				} else {
					if ((show && show.includes(val)) || (hide && !hide.includes(val))) {
						jqel.removeClass('trazzm-hidden');
					} else {
						jqel.addClass('trazzm-hidden');
					}
				}
			});
		};

		html.find('.fancy-checkbox').click(evt => {
			const target = $(evt.currentTarget);
			const selected = !target.hasClass('selected');
			const parent = target.parent();

			if (target.data('bound')) {
				const bound =  html.find(`input[name="${target.data('bound')}"]`);
				if (bound.prop('disabled')) {
					return;
				}

				bound.prop('checked', selected);
				updateSelections(bound);
			}

			selected ? target.addClass('selected') : target.removeClass('selected');

			if (parent[0].tagName === 'LEGEND') {
				parent.parent()[0].disabled = !selected;
			}
		}).each((i, el) => {
			const jqel = $(el);
			if (jqel.data('bound')) {
				const bound =  html.find(`input[name="${jqel.data('bound')}"]`);
				if (bound.prop('checked')) {
					jqel.addClass('selected');
				}

				updateSelections(bound);
			}

			const parent = jqel.parent();
			if (parent[0].tagName === 'LEGEND') {
				parent.parent()[0].disabled = !jqel.hasClass('selected');
			}
		});

		html.find('select[data-selector]')
			.change(evt => {
				updateSelections($(evt.currentTarget));
				const recalculate = evt.currentTarget.dataset.recalculate;
				if (recalculate) {
					TrazzmDialog.recalculateHeight($(this.form));
				}
			}).each((i, el) => updateSelections($(el)));
	}

	async close () {
		if (this.parent.setModal && this.options.modal) {
			this.parent.setModal(false);
		}

		return super.close();
	}

	getData () {
		const data = this.parent.getData();
		data.dialogOptions = this.options;
		return data;
	}

	async maximize () {
		await super.maximize();
		TrazzmDialog.recalculateHeight($(this.form));
	}

	render (force = false, options = {}) {
		if (this.parent.setModal && this.options.modal) {
			this.parent.setModal(true);
		}

		return super.render(force, options);
	}

	_createEditor (target, editorOptions, initialContent) {
		editorOptions.content_css =
			`${CONFIG.TinyMCE.css.join(',')},modules/trazzm-5e-sheet/styles/trazzm-mce.css`;
		super._createEditor(target, editorOptions, initialContent);
	}

	/**
	 * @private
	 */
	_updateObject (event, formData) {
		this.parent._updateObject(event, formData);
	}

	static recalculateHeight (html) {
		let total = 0;
		const labels = html.children('label:not(.trazzm-inline)');
		const richText = html.children('.trazzm-rich-text').length > 0;
		html.children('div, fieldset, label.trazzm-inline')
			.add(labels.children('input'))
			.each((i, el) => total += $(el).outerHeight(true));

		const content = html.closest('.window-content');
		html.height(total);

		const diff = total - content.height();
		const win = content.closest('.trazzm-window');
		win.height(win.height() + diff + (richText ? 20 : 0));
	}

	static removeRow (data, evt) {
		const row = $(evt.currentTarget).closest('.trazzm-form-row');
		const id = Number(row.data('item-id'));
		const newData = [];

		for (let i = 0; i < data.length; i++) {
			const item = data[i];
			if (i !== id) {
				if (typeof item === 'object' && typeof item.id !== 'string') {
					item.id = newData.length;
				}

				newData.push(item);
			}
		}

		return newData;
	}
}
