window.FORM_TEMPLATES = {
  "Formulário Tipo 1": {
    "width": "0.8",
    "height": "0.4",
    "replicable": true,
    "divisions": [
      { "theme": "header", "content": [] },
      {
        "theme": "FORM_SOLICITACAO_OBRA",
        "content": [
          {
            "text": "Formulário de Notificação",
            "font": "title1",
            "alignment": "center"
          }
        ]
      },
      {
        "theme": "ROW_NUM_PROCESSO",
        "content": [
          {
            "text": "Processo: ",
            "id": "idProcesso",
            "name": "idProcesso_name",
            "attributes": ["hidden"]
          },
          {
            "field": " ",
            "id": "tipo_atividade_id",
            "name": "tipo_atividade_name",
            "attributes": ["hidden"]
          },
          {
            "field": " ",
            "id": "tipo_sub_atividade_id",
            "name": "tipo_sub_atividade_name",
            "attributes": ["hidden"]
          },
          {
            "field": " ",
            "id": "obj_code",
            "name": "obj_code_name",
            "attributes": ["hidden"]
          },
          {
            "field": " ",
            "id": "possui_socio_receita_id",
            "name": "possui_socio_receita_name",
            "attributes": ["hidden"]
          },
          {
            "field": " ",
            "id": "cpf_usuario_procuracao_id",
            "name": "cpf_usuario_procuracao_name",
            "attributes": ["hidden"]
          },
          {
            "field": "{'cep':'cep_id','logradouro':'logradouro_id','numero':'numero_id','complemento':'complemento_id','bairro':'bairro_id'}",
            "id": "update_address",
            "name": "update_address_name",
            "attributes": ["hidden"]
          },
          {
            "field": "{'day_and_shift':'data_turno_fiscal','status':'status_fiscal','region':'regiao_fiscal','scheduling_date':'data_agendamento'}",
            "id": "update_schedule",
            "name": "update_schedule_name",
            "attributes": ["hidden"]
          },
          {
            "field": "{'cpf_cnpj':'proprietario_cpfCnpj','name':'proprietario_nome'}",
            "id": "update_owner",
            "name": "update_owner_name",
            "attributes": ["hidden"]
          },
          { "field": " ", "id": "form_responsible", "name": "form_responsible" }
        ]
      },
      {
        "theme": "INICIO",
        "content": [
          {
            "text": "Dados do Proprietário",
            "font": "title4",
            "alignment": "left"
          },
          {
            "text": "Dados do(a) Proprietário(a)",
            "font": "title4",
            "alignment": "left"
          },
          {
            "field": "*CPF/CNPJ",
            "id": "proprietario_cpfCnpj",
            "type": "text",
            "width": 30
          },
          {
            "field": "*Proprietário(a)",
            "id": "proprietario_nome",
            "type": "text",
            "width": 50
          },
          {
            "field": "*CEP",
            "id": "proprietario_endereco_cep",
            "type": "numeric",
            "width": 20
          },
          {
            "field": "*Logradouro",
            "id": "proprietario_endereco_logradouro",
            "type": "text",
            "width": 50
          },
          {
            "field": "*Número",
            "id": "proprietario_endereco_numero",
            "type": "text",
            "width": 20
          },
          {
            "field": "Complemento",
            "id": "proprietario_endereco_complemento",
            "type": "text",
            "width": 30
          },
          {
            "field": "*Bairro",
            "id": "proprietario_endereco_bairro",
            "type": "text",
            "width": 40
          },
          {
            "field": "*Município",
            "id": "proprietario_endereco_municipio",
            "type": "text",
            "width": 40
          },
          {
            "field": "*Celular",
            "id": "proprietario_celular",
            "type": "text",
            "width": 30
          },
          {
            "field": "*E-mail",
            "id": "proprietario_email",
            "type": "text",
            "width": 60
          },
          { "text": "Dados da Obra", "font": "title4", "alignment": "left" },
          {
            "checkbox": "Os dados da obra são os mesmos do proprietário",
            "id": "obra_mesmoEnderecoProprietario",
            "width": 80
          },
          {
            "field": "*Inscrição Cadastral",
            "id": "obra_inscricaoCadastral",
            "type": "text",
            "width": 30
          },
          {
            "field": "*CEP",
            "id": "obra_endereco_cep",
            "type": "numeric",
            "width": 20
          },
          {
            "field": "Logradouro",
            "id": "obra_endereco_logradouro",
            "type": "text",
            "width": 50
          },
          {
            "field": "Número",
            "id": "obra_endereco_numero",
            "type": "text",
            "width": 20
          },
          {
            "field": "Bairro",
            "id": "obra_endereco_bairro",
            "type": "text",
            "width": 40
          },
          {
            "field": "Complemento",
            "id": "obra_endereco_complemento",
            "type": "text",
            "width": 30
          },
          {
            "field": "Matrícula",
            "id": "obra_matricula",
            "type": "text",
            "width": 25
          },
          { "field": "Quadra", "id": "obra_quadra", "type": "text", "width": 20 },
          { "field": "Lote", "id": "obra_lote", "type": "text", "width": 20 },
          {
            "field": "Loteamento",
            "id": "obra_loteamento",
            "type": "text",
            "width": 40
          },
          {
            "text": "Responsável pelo Formulário",
            "font": "title4",
            "alignment": "left"
          },
          {
            "selectlist": "*Responsável",
            "id": "responsavelFormulario_tipo",
            "options": "Selecione;Proprietário(a);Técnico(a);Procurador(a)",
            "width": 40
          }
        ]
      },
      {
        "theme": "BUTTONS_GROUP_ID",
        "content": [
          {
            "button": "Avançar",
            "id": "avancar",
            "name": "avancar_name",
            "color": "green",
            "width": 10,
            "attributes": ["type=submit"]
          },
          {
            "button": "Cancelar",
            "id": "cancelar",
            "name": "cancelar_name",
            "color": "red",
            "width": 10,
            "attributes": [
              "onclick=goToUrl('entrada.html')",
              "style=margin-left:30px"
            ]
          },
          {
            "button": "Salvar Alterações",
            "id": "save_changes",
            "name": "save_changes",
            "color": "yellow",
            "width": 10,
            "attributes": ["hidden"]
          }
        ]
      }
    ]
  },
  "Formulário Tipo 2": {
    "divisions": [
      {
        "theme": "INICIO",
        "content": [{ "text": "Formulário Tipo 2", "alignment": "center" }]
      }
    ]
  },
  "Formulário Tipo 3": {
    "divisions": [
      {
        "theme": "INICIO",
        "content": [{ "text": "Formulário Tipo 3", "alignment": "center" }]
      }
    ]
  },
  "Formulário Limpo(Sem Campos)": {
    "divisions": [
      {
        "theme": "INICIO",
        "content": [{ "text": "Formulário Limpo", "alignment": "center" }]
      },
      {
        "theme": "ROW_NUM_PROCESSO",
        "content": [
          {
            "text": "Processo: ",
            "id": "idProcesso",
            "name": "idProcesso_name",
            "attributes": ["hidden"]
          },
          {
            "field": " ",
            "id": "tipo_atividade_id",
            "name": "tipo_atividade_name",
            "attributes": ["hidden"]
          },
          {
            "field": " ",
            "id": "tipo_sub_atividade_id",
            "name": "tipo_sub_atividade_name",
            "attributes": ["hidden"]
          },
          {
            "field": " ",
            "id": "obj_code",
            "name": "obj_code_name",
            "attributes": ["hidden"]
          },
          {
            "field": " ",
            "id": "possui_socio_receita_id",
            "name": "possui_socio_receita_name",
            "attributes": ["hidden"]
          },
          {
            "field": " ",
            "id": "cpf_usuario_procuracao_id",
            "name": "cpf_usuario_procuracao_name",
            "attributes": ["hidden"]
          },
          {
            "field": "{'cep':'cep_id','logradouro':'logradouro_id','numero':'numero_id','complemento':'complemento_id','bairro':'bairro_id'}",
            "id": "update_address",
            "name": "update_address_name",
            "attributes": ["hidden"]
          },
          {
            "field": "{'day_and_shift':'data_turno_fiscal','status':'status_fiscal','region':'regiao_fiscal','scheduling_date':'data_agendamento'}",
            "id": "update_schedule",
            "name": "update_schedule_name",
            "attributes": ["hidden"]
          },
          {
            "field": "{'cpf_cnpj':'proprietario_cpfCnpj','name':'proprietario_nome'}",
            "id": "update_owner",
            "name": "update_owner_name",
            "attributes": ["hidden"]
          },
          { "field": " ", "id": "form_responsible", "name": "form_responsible" }
        ]
      },
      {
        "theme": "BUTTONS_GROUP_ID",
        "content": [
          {
            "button": "Avançar",
            "id": "avancar",
            "name": "avancar_name",
            "color": "green",
            "width": 10,
            "attributes": ["type=submit"]
          },
          {
            "button": "Cancelar",
            "id": "cancelar",
            "name": "cancelar_name",
            "color": "red",
            "width": 10,
            "attributes": [
              "onclick=goToUrl('entrada.html')",
              "style=margin-left:30px"
            ]
          },
          {
            "button": "Salvar Alterações",
            "id": "save_changes",
            "name": "save_changes",
            "color": "yellow",
            "width": 10,
            "attributes": ["hidden"]
          }
        ]
      }
    ]
  }
};
