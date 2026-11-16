# shortcut: rascunho baseado em critérios gerais de doação; validar com a equipe do banco de leite antes de uso real.
PERGUNTAS = [
    {"codigo": "boa_saude", "texto": "Você está com boa saúde?"},
    {"codigo": "exames_prenatal", "texto": "Seus exames do pré-natal vieram sem alteração?"},
    {"codigo": "remedio_continuo", "texto": "Você toma algum remédio todos os dias?"},
    {"codigo": "fuma", "texto": "Você fuma?"},
    {"codigo": "alcool_drogas", "texto": "Você consome bebida alcoólica ou outras drogas?"},
    {"codigo": "transfusao", "texto": "Você recebeu transfusão de sangue nos últimos 12 meses?"},
    {"codigo": "leite_sobrando", "texto": "Você tem mais leite do que seu bebê precisa?"},
]

CODIGOS = {p["codigo"] for p in PERGUNTAS}
TEXTOS = {p["codigo"]: p["texto"] for p in PERGUNTAS}
