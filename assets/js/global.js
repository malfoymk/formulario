(() => {
	const trigger = document.querySelector(".dropdown-trigger");
	const menu = document.querySelector(".dropdown");
	const jsonInput = document.querySelector("#json-input");
	const jsonLines = document.querySelector("#json-lines");
	const formPreview = document.querySelector("#form-preview");
	const jsonError = document.querySelector("#json-error");
	const draftsSelect = document.querySelector("#json-drafts");
	const draftSaveBtn = document.querySelector("#draft-save");
	const draftLoadBtn = document.querySelector("#draft-load");
	const exportBtn = document.querySelector("#json-export");
	const importBtn = document.querySelector("#json-import");
	const fileInput = document.querySelector("#json-file");
	let isUpdatingTextarea = false;

	if (!trigger || !menu) return;

	const DRAFTS_STORAGE_KEY = "formul-rio:drafts:v1";

	const readDrafts = () => {
		try {
			const raw = localStorage.getItem(DRAFTS_STORAGE_KEY);
			if (!raw) return {};
			const parsed = JSON.parse(raw);
			if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
			return parsed;
		} catch {
			return {};
		}
	};

	const writeDrafts = (drafts) => {
		try {
			localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
		} catch {
			// ignore
		}
	};

	const refreshDraftsDropdown = () => {
		if (!(draftsSelect instanceof HTMLSelectElement)) return;
		const drafts = readDrafts();
		const entries = Object.keys(drafts).sort((a, b) => a.localeCompare(b));

		const prev = draftsSelect.value;
		draftsSelect.innerHTML = "";
		const placeholder = document.createElement("option");
		placeholder.value = "";
		placeholder.textContent = "Rascunhos...";
		placeholder.disabled = true;
		placeholder.selected = true;
		draftsSelect.appendChild(placeholder);

		for (const name of entries) {
			const opt = document.createElement("option");
			opt.value = name;
			opt.textContent = name;
			draftsSelect.appendChild(opt);
		}

		if (prev && entries.includes(prev)) draftsSelect.value = prev;
	};

	const sanitizeFilename = (name) => {
		if (typeof name !== "string") return "formulario";
		const cleaned = name.trim().replace(/[\\/:*?"<>|]+/g, "-");
		return cleaned || "formulario";
	};

	const downloadText = (filename, text) => {
		const blob = new Blob([text], { type: "application/json;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	};

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

	const updateLineNumbers = () => {
		if (!jsonInput || !jsonLines) return;
		const text = jsonInput.value;
		const lines = Math.max(1, text.split(/\r\n|\r|\n/).length);
		let out = "";
		for (let i = 1; i <= lines; i++) out += `${i}\n`;
		jsonLines.textContent = out;
		jsonLines.scrollTop = jsonInput.scrollTop;
	};

	const getLineColumnFromOffset = (text, offset) => {
		const safeOffset = Math.max(0, Math.min(text.length, offset));
		let line = 1;
		let col = 1;
		for (let i = 0; i < safeOffset; i++) {
			const ch = text[i];
			if (ch === "\r") {
				if (text[i + 1] === "\n") i++;
				line++;
				col = 1;
				continue;
			}
			if (ch === "\n") {
				line++;
				col = 1;
				continue;
			}
			col++;
		}
		return { line, column: col };
	};

	const getSnippetFromOffset = (text, offset, radius = 30) => {
		const safeOffset = Math.max(0, Math.min(text.length, offset));
		let start = Math.max(0, safeOffset - radius);
		let end = Math.min(text.length, safeOffset + radius);

		const window = text.slice(start, end);
		const before = window.slice(0, safeOffset - start);
		const after = window.slice(safeOffset - start);

		const boundaryChars = ['\n', '"'];
		const lastBoundary = Math.max(...boundaryChars.map((c) => before.lastIndexOf(c)));
		const nextBoundaryCandidates = boundaryChars
			.map((c) => after.indexOf(c))
			.filter((i) => i !== -1);
		const nextBoundary = nextBoundaryCandidates.length ? Math.min(...nextBoundaryCandidates) : -1;

		if (lastBoundary !== -1) start = start + lastBoundary + 1;
		if (nextBoundary !== -1) end = start + (safeOffset - start) + nextBoundary;

		const hadPrefix = start > 0;
		const hadSuffix = end < text.length;
		let snippet = text.slice(start, end).replace(/\s+/g, " ").trim();
		if (hadPrefix) snippet = `...${snippet}`;
		if (hadSuffix) snippet = `${snippet}...`;
		return snippet;
	};

	const getNearestIdOrNameFromOffset = (text, offset, lookback = 2500) => {
		const safeOffset = Math.max(0, Math.min(text.length, offset));
		const start = Math.max(0, safeOffset - lookback);
		const region = text.slice(start, safeOffset);

		const re = /"(id|name)"\s*:\s*"([^"]+)"/gi;
		let last = null;
		for (const m of region.matchAll(re)) {
			last = { key: String(m[1]).toLowerCase(), value: String(m[2]) };
		}
		return last;
	};

	const formatJsonParseError = (rawText, err) => {
		const msg = err instanceof Error ? err.message : "";
		const posMatch = /(position|posi[cç][aã]o)\s+(\d+)/i.exec(msg);
		const lineColMatch = /(line|linha)\s+(\d+)\s+(column|coluna)\s+(\d+)/i.exec(msg);

		let line = null;
		let column = null;
		let near = "";
		let nearIdentifier = null;
		let lineFromMessage = null;
		let colFromMessage = null;
		if (lineColMatch) {
			lineFromMessage = Number(lineColMatch[2]);
			colFromMessage = Number(lineColMatch[4]);
		}
		if (posMatch) {
			const offset = Number(posMatch[2]);
			const textForOffset = rawText.replace(/\r/g, "");
			({ line, column } = getLineColumnFromOffset(textForOffset, offset));
			near = getSnippetFromOffset(textForOffset, offset);
			nearIdentifier = getNearestIdOrNameFromOffset(textForOffset, offset);
		} else if (lineFromMessage != null && colFromMessage != null) {
			line = lineFromMessage;
			column = colFromMessage;
		}

		let friendlyError = "JSON inválido.";
		if (/expected\s+','\s+or\s+'}'/i.test(msg)) {
			friendlyError = "JSON inválido: parece que está faltando uma vírgula (,) ou uma chave de fechamento (}).";
		} else if (/unexpected\s+token/i.test(msg)) {
			friendlyError = "JSON inválido: existe um caractere inesperado (verifique vírgulas, aspas e chaves).";
		}

		if (Number.isFinite(line) && Number.isFinite(column)) {
			const mismatchNote =
				Number.isFinite(lineFromMessage) &&
				Number.isFinite(colFromMessage) &&
				(lineFromMessage !== line || colFromMessage !== column)
					? ` (obs: navegador indica linha ${lineFromMessage}, coluna ${colFromMessage})`
					: "";
			const nearNote = near ? ` Perto de: "${near}".` : "";
			const idNameNote = nearIdentifier
				? ` Perto do ${nearIdentifier.key}: "${nearIdentifier.value}".`
				: "";
			return `${friendlyError} Linha ${line}, coluna ${column}.${mismatchNote}${nearNote}${idNameNote}`;
		}
		return friendlyError;
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

	const saveDraft = () => {
		if (!jsonInput) return;
		const name = window.prompt("Nome do rascunho:");
		if (!name || !name.trim()) return;
		const drafts = readDrafts();
		drafts[name.trim()] = jsonInput.value;
		writeDrafts(drafts);
		refreshDraftsDropdown();
		if (draftsSelect instanceof HTMLSelectElement) draftsSelect.value = name.trim();
	};

	const loadDraft = () => {
		if (!jsonInput) return;
		if (!(draftsSelect instanceof HTMLSelectElement)) return;
		const selected = draftsSelect.value;
		if (!selected) return;
		const drafts = readDrafts();
		const raw = drafts[selected];
		if (typeof raw !== "string") return;
		jsonInput.value = raw;
		refreshJsonPreview();
	};

	const exportJson = () => {
		if (!jsonInput) return;
		const name = window.prompt("Nome do arquivo (sem .json):", "formulario");
		if (!name || !name.trim()) return;
		const filename = `${sanitizeFilename(name)}.json`;
		downloadText(filename, jsonInput.value);
	};

	const importJson = () => {
		if (!(fileInput instanceof HTMLInputElement)) return;
		fileInput.value = "";
		fileInput.click();
	};

	const onFileSelected = () => {
		if (!(fileInput instanceof HTMLInputElement)) return;
		const file = fileInput.files && fileInput.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			if (!jsonInput) return;
			const text = typeof reader.result === "string" ? reader.result : "";
			jsonInput.value = text;
			refreshJsonPreview();
		};
		reader.readAsText(file);
	};

	const validateIdAndNameEqual = (spec) => {
		const divisions = Array.isArray(spec?.divisions) ? spec.divisions : [];
		const requiresIdName = (item) =>
			item &&
			typeof item === "object" &&
			("field" in item || "checkbox" in item || "selectlist" in item || "button" in item);

		for (const division of divisions) {
			const theme = typeof division?.theme === "string" ? division.theme : "";
			if (theme === "BUTTONS_GROUP_ID" || theme === "ROW_NUM_PROCESSO") continue;
			const content = Array.isArray(division?.content) ? division.content : [];
			for (const item of content) {
				if (!requiresIdName(item)) continue;

				const id = typeof item.id === "string" ? item.id.trim() : "";
				const name = typeof item.name === "string" ? item.name.trim() : "";
				if (!id || !name) continue;
				if (id === name) continue;

				const theme = typeof division?.theme === "string" ? division.theme : "(sem theme)";
				const label =
					typeof item.field === "string"
						? item.field
						: typeof item.checkbox === "string"
							? item.checkbox
							: typeof item.selectlist === "string"
								? item.selectlist
								: typeof item.button === "string"
									? item.button
									: "(sem label)";

				throw new Error(
					`O campo "name" deve ser igual ao "id" no item "${label}" (theme: ${theme}). (id: ${id}, name: ${name})`
				);
			}
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

	const validateRowNumProcessoDivision = (spec) => {
		const errorMessage = "Não é possível excluir ou remover o theme \"ROW_NUM_PROCESS\"";
		const divisions = Array.isArray(spec?.divisions) ? spec.divisions : [];
		const idxRow = divisions.findIndex((d) => d?.theme === "ROW_NUM_PROCESSO");
		if (idxRow === -1) throw new Error(errorMessage);

		const idxFirstNonHeader = divisions.findIndex((d) => d?.theme !== "header");
		if (idxFirstNonHeader === -1) throw new Error(errorMessage);
		if (idxRow !== idxFirstNonHeader + 1) throw new Error(errorMessage);
	};

	const validateButtonsGroupIsLast = (spec) => {
		const errorMessage = "Não é possível excluir ou remover o theme \"BUTTONS_GROUP_ID\"";
		const divisions = Array.isArray(spec?.divisions) ? spec.divisions : [];
		const idxButtons = divisions.findIndex((d) => d?.theme === "BUTTONS_GROUP_ID");
		if (idxButtons === -1) throw new Error(errorMessage);
	};

	const normalizeButtonsGroupToEnd = (spec) => {
		const divisions = Array.isArray(spec?.divisions) ? spec.divisions : [];
		const idxButtons = divisions.findIndex((d) => d?.theme === "BUTTONS_GROUP_ID");
		if (idxButtons === -1) return { normalized: spec, changed: false };
		if (idxButtons === divisions.length - 1) return { normalized: spec, changed: false };

		const buttonsDivision = divisions[idxButtons];
		const reordered = divisions.filter((_, i) => i !== idxButtons);
		reordered.push(buttonsDivision);
		return { normalized: { ...spec, divisions: reordered }, changed: true };
	};

	const validateButtonsGroupRequiredButtons = (spec) => {
		const errorMessage = "Não é possível excluir botões obrigatórios do theme \"BUTTONS_GROUP_ID\"";
		const divisions = Array.isArray(spec?.divisions) ? spec.divisions : [];
		const division = divisions.find((d) => d?.theme === "BUTTONS_GROUP_ID");
		if (!division || typeof division !== "object") throw new Error(errorMessage);

		const content = Array.isArray(division?.content) ? division.content : [];
		const ids = new Set(
			content
				.filter((i) => i && typeof i === "object" && "button" in i)
				.map((i) => (typeof i.id === "string" ? i.id.trim() : ""))
				.filter(Boolean)
		);

		const required = ["avancar", "cancelar", "save_changes"];
		for (const rid of required) {
			if (!ids.has(rid)) {
				throw new Error(`Falta o botão obrigatório \"${rid}\" no theme \"BUTTONS_GROUP_ID\".`);
			}
		}
	};

	const validateIdAndNameRequired = (spec) => {
		const divisions = Array.isArray(spec?.divisions) ? spec.divisions : [];
		const requiresIdName = (item) =>
			item &&
			typeof item === "object" &&
			("field" in item || "checkbox" in item || "selectlist" in item || "button" in item);

		for (const division of divisions) {
			const content = Array.isArray(division?.content) ? division.content : [];
			for (const item of content) {
				if (!requiresIdName(item)) continue;

				const hasId = typeof item.id === "string" && item.id.trim().length > 0;
				const hasName = typeof item.name === "string" && item.name.trim().length > 0;
				if (hasId && hasName) continue;

				const theme = typeof division?.theme === "string" ? division.theme : "(sem theme)";
				const label =
					typeof item.field === "string"
						? item.field
						: typeof item.checkbox === "string"
							? item.checkbox
							: typeof item.selectlist === "string"
								? item.selectlist
								: typeof item.button === "string"
									? item.button
									: "(sem label)";

				if (!hasId) {
					throw new Error(`Falta o campo "id" no item "${label}" (theme: ${theme}).`);
				}
				throw new Error(`Falta o campo "name" no item "${label}" (theme: ${theme}).`);
			}
		}
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
		const rawFull = jsonInput.value;
		const raw = rawFull.trim();
		updateLineNumbers();
		if (!raw) {
			setError("");
			clearPreview();
			return;
		}
		try {
			const obj = JSON.parse(rawFull);
			const { normalized: normalizedIds, changed: changedIds } = normalizeSpecIdentifiers(obj);
			validateRowNumProcessoDivision(normalizedIds);
			validateButtonsGroupIsLast(normalizedIds);
			const { normalized, changed: changedButtons } = normalizeButtonsGroupToEnd(normalizedIds);
			validateButtonsGroupRequiredButtons(normalized);
			validateIdAndNameRequired(normalized);
			validateIdAndNameEqual(normalized);

			const changed = changedIds || changedButtons;
			if (changed) {
				isUpdatingTextarea = true;
				jsonInput.value = JSON.stringify(normalized, null, 2);
				isUpdatingTextarea = false;
			}

			let notice = "";
			if (changedIds) notice = "Favor sempre utilizar _ nos campos id/name";
			if (changedButtons) notice = notice ? `${notice} | BUTTONS_GROUP_ID foi movido para o fim automaticamente.` : "BUTTONS_GROUP_ID foi movido para o fim automaticamente.";
			setError(notice);
			renderForm(normalized);
		} catch (err) {
			if (err instanceof Error && err.name === "SyntaxError") {
				setError(formatJsonParseError(rawFull, err));
			} else {
				const msg = err instanceof Error ? err.message : "Erro";
				setError(msg);
			}
			clearPreview();
		}
	};

	setOpen(false);
	refreshJsonPreview();
	updateLineNumbers();
	refreshDraftsDropdown();

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
		jsonInput.addEventListener("scroll", updateLineNumbers);
	}

	if (draftSaveBtn) draftSaveBtn.addEventListener("click", saveDraft);
	if (draftLoadBtn) draftLoadBtn.addEventListener("click", loadDraft);
	if (exportBtn) exportBtn.addEventListener("click", exportJson);
	if (importBtn) importBtn.addEventListener("click", importJson);
	if (fileInput) fileInput.addEventListener("change", onFileSelected);

	window.addEventListener("resize", updateLineNumbers);
})();
