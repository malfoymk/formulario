# Developer Documentation

Este documento é voltado para devs que vão manter/evoluir o projeto.

## Visão geral

O projeto é um **gerador/visualizador de formulários** a partir de uma especificação JSON (um “DSL” simples).

A aplicação tem:

- Editor JSON (com numeração de linhas)
- Validações de regras internas (além de JSON válido)
- Renderização do formulário (JSON -> DOM)
- Templates prontos (`forms.js`)
- Toolbar do editor (rascunhos no `localStorage`, import/export `.json`)

## Como executar

Veja o `README.md`. Em resumo:

```bash
npm install
npm run dev
```

## Estrutura do projeto

Arquivos principais:

- `index.html`
  - Layout da tela, editor, preview, dropdown e toolbar
- `assets/js/forms.js`
  - Templates expostos em `window.FORM_TEMPLATES`
- `assets/js/global.js`
  - Core do app: parsing, validações, renderização, mensagens de erro, toolbar
- `assets/css/global.css`
  - Estilos globais e estilos da toolbar

## Fluxo de dados (high level)

1. Usuário seleciona um template no dropdown **ou** edita o JSON no textarea
2. `refreshJsonPreview()` roda
3. Dentro do `try`:
   - `JSON.parse(rawFull)`
   - normalizações (`normalizeSpecIdentifiers`, `normalizeButtonsGroupToEnd`)
   - validações (`validate*`)
   - renderiza (`renderForm`)
4. Se falhar:
   - JSON inválido: `formatJsonParseError()` gera erro amigável
   - regra interna inválida: `throw new Error("...")` e o `catch` mostra a mensagem

## Contrato: DSL do JSON

### Estrutura base

O JSON esperado (alto nível) é:

```json
{
  "divisions": [
    {
      "theme": "INICIO",
      "content": [
        { "text": "Título", "alignment": "center" },
        { "field": "Nome", "id": "nome", "name": "nome", "type": "text", "width": 50 },
        { "checkbox": "Aceito", "id": "aceito", "name": "aceito" },
        { "selectlist": "Opções", "id": "opt", "name": "opt", "options": "A;B;C" }
      ]
    }
  ]
}
```

### Itens suportados em `content`

Conforme o renderizador atual (`renderForm` em `assets/js/global.js`), os itens aceitos são:

- `text`
  - Renderiza um bloco de texto
  - Campos comuns: `text`, `alignment`, `font`, `attributes`

- `field`
  - Renderiza um `<input>`
  - Campos comuns: `field`, `id`, `name`, `type`, `width`, `hint`, `attributes`
  - `type: "numeric"` vira `<input type="number">`

- `checkbox`
  - Renderiza `<input type="checkbox">`
  - Campos comuns: `checkbox`, `id`, `name`, `attributes`

- `selectlist`
  - Renderiza `<select>`
  - Campos comuns: `selectlist`, `id`, `name`, `options`, `attributes`
  - `options` é uma string separada por `;`

- `button`
  - Renderiza `<button>`
  - Campos comuns: `button`, `id`, `name`, `color`, `width`, `attributes`

### Divisões (`divisions`) e temas (`theme`)

- A aplicação trata cada `division` como uma `<section>`.
- Há temas especiais que possuem regras extras:

#### `ROW_NUM_PROCESSO`
- Deve existir.
- Deve estar **logo após** a primeira divisão não-header.

#### `BUTTONS_GROUP_ID`
- Deve existir.
- É automaticamente movido para o fim (`normalizeButtonsGroupToEnd`).
- Dentro dele devem existir botões obrigatórios com `id`:
  - `avancar`
  - `cancelar`
  - `save_changes`

## Normalizações

### Normalização de `id`/`name` (ponto)

- `normalizeSpecIdentifiers` troca `.` por `_` em todas as chaves `id` e `name` no spec.
- Se houver mudança, o textarea é reescrito com o JSON normalizado.

## Validações

Todas as validações lançam `throw new Error("mensagem")` para cair no `catch`.

### `validateIdAndNameRequired(spec)`
Exige que itens de campo (`field`, `checkbox`, `selectlist`, `button`) tenham:

- `id` não vazio
- `name` não vazio

### `validateIdAndNameEqual(spec)`
Exige que `id === name` para itens de campo, **exceto** dentro de divisões com `theme`:

- `BUTTONS_GROUP_ID`
- `ROW_NUM_PROCESSO`

### `validateRowNumProcessoDivision(spec)`
Exige presença e posição do tema `ROW_NUM_PROCESSO`.

### `validateButtonsGroupIsLast(spec)`
Exige que exista `theme: "BUTTONS_GROUP_ID"`.

### `normalizeButtonsGroupToEnd(spec)`
Se `BUTTONS_GROUP_ID` não estiver no fim, move para o fim (modo auto-correção).

### `validateButtonsGroupRequiredButtons(spec)`
Dentro do `BUTTONS_GROUP_ID`, exige botões com ids obrigatórios.

## Erros de JSON inválido

Quando `JSON.parse` falha:

- `formatJsonParseError` gera mensagem amigável em PT-BR
- Inclui:
  - `Linha/coluna` quando disponível
  - `Perto de: "..."` (snippet perto do offset)
  - `Perto do id/name: "..."` (heurística: último id/name antes do offset)

## Toolbar do editor (rascunhos, exportar, importar)

### UI
No `index.html`:

- `select#json-drafts`
- `button#draft-save`
- `button#draft-load`
- `button#json-export`
- `button#json-import`
- `input#json-file` (hidden)

### Rascunhos multi-slot
- Usa `localStorage` com a chave: `formul-rio:drafts:v1`
- Estrutura: objeto `{ [nomeDoRascunho]: "conteúdo do textarea" }`

Funções relevantes em `global.js`:

- `readDrafts()` / `writeDrafts()`
- `refreshDraftsDropdown()`
- `saveDraft()` / `loadDraft()`

### Exportar
- `exportJson()` pede nome via `prompt` e baixa `.json` usando `Blob` + `URL.createObjectURL`.

### Importar
- `importJson()` abre o seletor de arquivo
- `onFileSelected()` lê e escreve no textarea e chama `refreshJsonPreview()`
- Se o JSON estiver inválido, o texto permanece no editor e o erro aparece.

## Como adicionar um novo tipo de campo

### 1) Render
Em `renderForm(spec)`, hoje o roteamento é por chaves:

- `if ("text" in item) ...`
- `if ("field" in item) ...`
- ...

Para adicionar, por exemplo, `textarea`:

1. Criar uma função `createTextarea(item)`
2. Adicionar um novo `if ("textarea" in item)` em `renderForm`

### 2) Validações
Se o novo tipo também exigir `id`/`name`, atualizar a lógica `requiresIdName` nas validações.

## Como adicionar uma nova validação

Padrão atual:

1. Criar função `validateX(spec)`
2. Chamar no `refreshJsonPreview()` dentro do `try`, antes de `renderForm`
3. Se regra quebrar, usar `throw new Error("mensagem amigável")`

Dica: mantenha mensagens curtas e acionáveis.

## Convenções e decisões

- Não usar `onclick` vindo do JSON (bloqueado no `applyAttributes`) para evitar execução arbitrária.
- `BUTTONS_GROUP_ID` é tratado como bloco especial.
- Normalização de `id/name` é automática (ponto -> underscore).

## Troubleshooting

- Preview não renderiza:
  - verifique `#json-error`
  - valide se JSON está válido
  - verifique regras internas (ROW_NUM_PROCESSO, BUTTONS_GROUP_ID)

- Rascunhos não aparecem:
  - verificar se o browser bloqueou `localStorage` (modo privado/restrições)
  - abrir DevTools e inspecionar `localStorage['formul-rio:drafts:v1']`
