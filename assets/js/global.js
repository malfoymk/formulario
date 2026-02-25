(() => {
	const trigger = document.querySelector(".dropdown-trigger");
	const menu = document.querySelector(".dropdown");
	const jsonInput = document.querySelector("#json-input");
	const formPreview = document.querySelector("#form-preview");
	const jsonError = document.querySelector("#json-error");
	let isUpdatingTextarea = false;

	if (!trigger || !menu) return;

	const setOpen = (open) => {
		trigger.setAttribute("aria-expanded", String(open));
		menu.classList.toggle("is-open", open);
	};

	const setError = (message) => {
		if (!jsonError) return;
		jsonError.textContent = message || "";
	};

	const clearPreview = () => {
		if (!formPreview) return;
		formPreview.innerHTML = "";
	};

	const applyAttributes = (el, attributes) => {
		if (!attributes || !Array.isArray(attributes)) return;
		for (const attr of attributes) {
			if (attr === "hidden") {
				el.setAttribute("hidden", "");
				continue;
			}
			if (typeof attr !== "string") continue;
			const idx = attr.indexOf("=");
			if (idx === -1) continue;
			const key = attr.slice(0, idx).trim();
			const val = attr.slice(idx + 1).trim();
			if (!key) continue;

			if (key.toLowerCase() === "onclick") continue;
			el.setAttribute(key, val);
		}
	};

	const normalizeIdentifier = (value, kind) => {
		if (typeof value !== "string") return "";
		const trimmed = value.trim();
		if (!trimmed) return "";
		if (!trimmed.includes(".")) return trimmed;
		const normalized = trimmed.replace(/\./g, "_");
		console.warn(`[form-render] ${kind} não pode conter '.', normalizando: '${trimmed}' -> '${normalized}'`);
		return normalized;
	};

	const normalizeSpecIdentifiers = (value) => {
		let changed = false;
		const visit = (node) => {
			if (Array.isArray(node)) {
				const out = node.map(visit);
				return out;
			}
			if (node && typeof node === "object") {
				const out = {};
				for (const [k, v] of Object.entries(node)) {
					if (k === "id" || k === "name") {
						if (typeof v === "string") {
							const trimmed = v.trim();
							const normalized = trimmed.includes(".") ? trimmed.replace(/\./g, "_") : trimmed;
							if (normalized !== trimmed) changed = true;
							out[k] = normalized;
							continue;
						}
						out[k] = v;
						continue;
					}
					out[k] = visit(v);
				}
				return out;
			}
			return node;
		};

		return { normalized: visit(value), changed };
	};

	const createTextBlock = (item) => {
		const el = document.createElement("div");
		el.className = "form-text";
		el.textContent = item.text ?? "";
		if (item.alignment) el.style.textAlign = item.alignment;
		applyAttributes(el, item.attributes);
		return el;
	};

	const createField = (item) => {
		const isHidden = Array.isArray(item.attributes) && item.attributes.includes("hidden");
		const fieldLabel = String(item.field ?? "").trim();
		const shouldHide = isHidden || fieldLabel === "";
		const wrapper = document.createElement("div");
		wrapper.className = "form-row";
		if (item.width != null) wrapper.style.gridColumn = `span ${Math.max(1, Math.min(12, Math.round((Number(item.width) / 100) * 12) || 12))}`;

		const input = document.createElement("input");
		input.className = "form-input";
		input.id = normalizeIdentifier(item.id, "id");
		const normalizedName = normalizeIdentifier(item.name, "name");
		if (normalizedName) input.name = normalizedName;
		input.type = shouldHide ? "hidden" : item.type === "numeric" ? "number" : "text";
		if (item.type === "numeric") input.inputMode = "numeric";
		applyAttributes(input, item.attributes);

		if (shouldHide) {
			wrapper.appendChild(input);
			return wrapper;
		}

		const label = document.createElement("label");
		label.className = "form-label";
		label.htmlFor = input.id;
		label.textContent = fieldLabel || "Campo";

		if (item.hint) {
			const hint = document.createElement("div");
			hint.className = "form-hint";
			hint.textContent = item.hint;
			wrapper.appendChild(label);
			wrapper.appendChild(hint);
			wrapper.appendChild(input);
			return wrapper;
		}

		wrapper.appendChild(label);
		wrapper.appendChild(input);
		return wrapper;
	};

	const createCheckbox = (item) => {
		const wrapper = document.createElement("div");
		wrapper.className = "form-row";
		const label = document.createElement("label");
		label.className = "form-checkbox";
		const input = document.createElement("input");
		input.type = "checkbox";
		input.id = normalizeIdentifier(item.id, "id");
		const normalizedName = normalizeIdentifier(item.name, "name");
		if (normalizedName) input.name = normalizedName;
		applyAttributes(input, item.attributes);
		label.appendChild(input);
		label.appendChild(document.createTextNode(` ${item.checkbox ?? ""}`));
		wrapper.appendChild(label);
		return wrapper;
	};

	const createSelect = (item) => {
		const wrapper = document.createElement("div");
		wrapper.className = "form-row";
		const label = document.createElement("label");
		label.className = "form-label";
		const select = document.createElement("select");
		select.className = "form-input";
		select.id = normalizeIdentifier(item.id, "id");
		const normalizedName = normalizeIdentifier(item.name, "name");
		if (normalizedName) select.name = normalizedName;
		label.htmlFor = select.id;
		label.textContent = item.selectlist || "Selecione";
		applyAttributes(select, item.attributes);

		const options = typeof item.options === "string" ? item.options.split(";") : [];
		for (const opt of options) {
			const o = document.createElement("option");
			o.value = opt;
			o.textContent = opt;
			select.appendChild(o);
		}

		wrapper.appendChild(label);
		wrapper.appendChild(select);
		return wrapper;
	};

	const createButton = (item) => {
		const btn = document.createElement("button");
		btn.className = `form-button ${item.color ? `is-${item.color}` : ""}`.trim();
		btn.id = normalizeIdentifier(item.id, "id");
		const normalizedName = normalizeIdentifier(item.name, "name");
		if (normalizedName) btn.name = normalizedName;
		btn.type = "button";
		applyAttributes(btn, item.attributes);
		if (btn.getAttribute("type") == null) {
			const typeAttr = Array.isArray(item.attributes)
				? item.attributes.find((a) => typeof a === "string" && a.startsWith("type="))
				: null;
			if (typeAttr) btn.type = typeAttr.slice("type=".length);
		}
		btn.textContent = item.button || "Botão";
		return btn;
	};

	const renderForm = (spec) => {
		if (!formPreview) return;
		formPreview.innerHTML = "";
		const form = document.createElement("form");
		form.className = "generated-form";
		form.noValidate = true;

		const divisions = Array.isArray(spec?.divisions) ? spec.divisions : [];
		for (const division of divisions) {
			if (division?.theme === "BUTTONS_GROUP_ID") {
				const section = document.createElement("section");
				section.className = "form-section";
				section.dataset.theme = "BUTTONS_GROUP_ID";

				const group = document.createElement("div");
				group.className = "form-button-group";

				const content = Array.isArray(division?.content) ? division.content : [];
				for (const item of content) {
					if (item == null || typeof item !== "object") continue;
					if ("button" in item) group.appendChild(createButton(item));
				}

				section.appendChild(group);
				form.appendChild(section);
				continue;
			}
			const section = document.createElement("section");
			section.className = "form-section";
			if (division?.theme) section.dataset.theme = String(division.theme);

			const grid = document.createElement("div");
			grid.className = "form-grid";
			section.appendChild(grid);

			const content = Array.isArray(division?.content) ? division.content : [];
			for (const item of content) {
				if (item == null || typeof item !== "object") continue;
				if ("text" in item) {
					grid.appendChild(createTextBlock(item));
					continue;
				}
				if ("field" in item) {
					grid.appendChild(createField(item));
					continue;
				}
				if ("checkbox" in item) {
					grid.appendChild(createCheckbox(item));
					continue;
				}
				if ("selectlist" in item) {
					grid.appendChild(createSelect(item));
					continue;
				}
				if ("button" in item) {
					const row = document.createElement("div");
					row.className = "form-row";
					row.appendChild(createButton(item));
					grid.appendChild(row);
					continue;
				}
			}

			form.appendChild(section);
		}

		formPreview.appendChild(form);
	};

	const FORM_TEMPLATES = (window.FORM_TEMPLATES && typeof window.FORM_TEMPLATES === "object") ? window.FORM_TEMPLATES : {};

	const loadTemplate = (label) => {
		if (!jsonInput) return;
		const template = FORM_TEMPLATES[label];
		if (!template) {
			if (label === "Formulário Limpo(Sem Campos)") {
				jsonInput.value = "";
				refreshJsonPreview();
			}
			return;
		}
		jsonInput.value = JSON.stringify(template, null, 2);
		refreshJsonPreview();
	};

	const refreshJsonPreview = () => {
		if (!jsonInput) return;
		if (isUpdatingTextarea) return;
		const raw = jsonInput.value.trim();
		if (!raw) {
			setError("");
			clearPreview();
			return;
		}
		try {
			const obj = JSON.parse(raw);
			const { normalized, changed } = normalizeSpecIdentifiers(obj);

			if (changed) {
				isUpdatingTextarea = true;
				jsonInput.value = JSON.stringify(normalized, null, 2);
				isUpdatingTextarea = false;
			}

			setError(changed ? "Favor sempre utilizar _ nos campos id/name" : "");
			renderForm(normalized);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "JSON inválido";
			setError(msg);
			clearPreview();
		}
	};

	setOpen(false);
	refreshJsonPreview();

	trigger.addEventListener("click", () => {
		const open = trigger.getAttribute("aria-expanded") === "true";
		setOpen(!open);
	});

	menu.addEventListener("click", (e) => {
		const target = e.target;
		if (!(target instanceof HTMLElement)) return;
		const link = target.closest("a");
		if (!(link instanceof HTMLAnchorElement)) return;

		e.preventDefault();
		const label = (link.textContent || "").trim();
		if (label) {
			trigger.textContent = label;
			loadTemplate(label);
		}
		setOpen(false);
	});

	document.addEventListener("click", (e) => {
		if (e.target instanceof Node && !trigger.contains(e.target) && !menu.contains(e.target)) {
			setOpen(false);
		}
	});

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") setOpen(false);
	});

	if (jsonInput) {
		jsonInput.addEventListener("input", refreshJsonPreview);
	}
})();
