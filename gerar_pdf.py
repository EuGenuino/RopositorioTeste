"""
Gera o PDF "O que realmente funciona no YouTube hoje" a partir do conteudo organizado.
"""
from fpdf import FPDF

# ---------------------------------------------------------------------------
# Configuracao do documento
# ---------------------------------------------------------------------------
class PDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("DejaVu", "", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, "O que realmente funciona no YouTube hoje", 0, 0, "L")
        self.cell(0, 8, f"Pagina {self.page_no() - 1}", 0, 1, "R")
        self.set_draw_color(220, 220, 220)
        self.line(15, 22, 195, 22)
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("DejaVu", "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, "Resumo organizado a partir do video do canal 'YouTube Sem MIMIMI'", 0, 0, "C")


pdf = PDF(orientation="P", unit="mm", format="A4")
pdf.set_auto_page_break(auto=True, margin=20)
pdf.set_margins(left=20, top=20, right=20)

# Fontes Unicode
pdf.add_font("DejaVu", "", "/tmp/DejaVuSans.ttf", uni=True)
pdf.add_font("DejaVu", "B", "/tmp/DejaVuSans-Bold.ttf", uni=True)
pdf.add_font("DejaVu", "I", "/tmp/DejaVuSans-Oblique.ttf", uni=True)

# Paleta
COR_TITULO = (200, 16, 46)        # vermelho YouTube
COR_SUBTITULO = (33, 33, 33)
COR_DESTAQUE = (200, 16, 46)
COR_TEXTO = (40, 40, 40)
COR_CINZA = (110, 110, 110)
COR_BG_QUOTE = (245, 245, 245)
COR_BG_TABELA = (250, 235, 235)


# ---------------------------------------------------------------------------
# Helpers de layout
# ---------------------------------------------------------------------------
def titulo_principal(texto):
    pdf.set_font("DejaVu", "B", 22)
    pdf.set_text_color(*COR_TITULO)
    pdf.multi_cell(0, 10, texto)
    pdf.ln(2)


def h1(texto):
    if pdf.get_y() > 230:
        pdf.add_page()
    pdf.ln(4)
    pdf.set_font("DejaVu", "B", 16)
    pdf.set_text_color(*COR_TITULO)
    pdf.multi_cell(0, 9, texto)
    pdf.set_draw_color(*COR_TITULO)
    pdf.set_line_width(0.6)
    y = pdf.get_y()
    pdf.line(20, y, 195, y)
    pdf.set_line_width(0.2)
    pdf.ln(4)


def h2(texto):
    if pdf.get_y() > 250:
        pdf.add_page()
    pdf.ln(2)
    pdf.set_font("DejaVu", "B", 13)
    pdf.set_text_color(*COR_SUBTITULO)
    pdf.multi_cell(0, 7, texto)
    pdf.ln(1)


def h3(texto):
    if pdf.get_y() > 255:
        pdf.add_page()
    pdf.set_font("DejaVu", "B", 11)
    pdf.set_text_color(*COR_DESTAQUE)
    pdf.multi_cell(0, 6, texto)
    pdf.ln(0.5)


def p(texto):
    pdf.set_font("DejaVu", "", 11)
    pdf.set_text_color(*COR_TEXTO)
    pdf.multi_cell(0, 6, texto)
    pdf.ln(1)


def bullet(texto, nivel=0):
    pdf.set_font("DejaVu", "", 11)
    pdf.set_text_color(*COR_TEXTO)
    indent = 6 + nivel * 6
    pdf.set_x(20 + indent)
    bullet_char = "\u2022" if nivel == 0 else "\u25E6"
    pdf.cell(4, 6, bullet_char, 0, 0)
    largura = 195 - (20 + indent + 4)
    x_inicio = pdf.get_x()
    y_inicio = pdf.get_y()
    pdf.multi_cell(largura, 6, texto)
    pdf.set_x(20)


def numerado(numero, texto):
    pdf.set_font("DejaVu", "B", 11)
    pdf.set_text_color(*COR_DESTAQUE)
    pdf.set_x(26)
    pdf.cell(8, 6, f"{numero}.", 0, 0)
    pdf.set_font("DejaVu", "", 11)
    pdf.set_text_color(*COR_TEXTO)
    largura = 195 - (26 + 8)
    pdf.multi_cell(largura, 6, texto)
    pdf.set_x(20)


def quote(texto):
    pdf.ln(2)
    pdf.set_font("DejaVu", "I", 11)
    pdf.set_text_color(80, 80, 80)
    pdf.set_fill_color(*COR_BG_QUOTE)
    pdf.set_draw_color(*COR_DESTAQUE)
    pdf.set_line_width(1.0)
    x = pdf.get_x()
    y = pdf.get_y()
    pdf.set_x(25)
    pdf.multi_cell(170, 6, texto, border=0, fill=True)
    y_fim = pdf.get_y()
    pdf.line(25, y, 25, y_fim)
    pdf.set_line_width(0.2)
    pdf.ln(2)


def destaque(texto):
    pdf.ln(1)
    pdf.set_font("DejaVu", "B", 11)
    pdf.set_text_color(*COR_DESTAQUE)
    pdf.set_fill_color(255, 240, 240)
    pdf.multi_cell(0, 7, texto, fill=True)
    pdf.ln(2)


def tabela(headers, linhas):
    pdf.ln(2)
    pdf.set_font("DejaVu", "B", 10)
    pdf.set_text_color(255, 255, 255)
    pdf.set_fill_color(*COR_TITULO)
    larguras = [85, 85]
    for i, h in enumerate(headers):
        pdf.cell(larguras[i], 8, h, border=0, align="L", fill=True)
    pdf.ln()
    pdf.set_font("DejaVu", "", 10)
    pdf.set_text_color(*COR_TEXTO)
    for i, linha in enumerate(linhas):
        fill = (i % 2 == 0)
        if fill:
            pdf.set_fill_color(252, 245, 245)
        else:
            pdf.set_fill_color(255, 255, 255)
        # calcular altura necessaria
        alturas = []
        for j, celula in enumerate(linha):
            n_linhas = max(1, len(pdf.multi_cell(larguras[j], 6, celula, split_only=True)))
            alturas.append(n_linhas * 6)
        h = max(alturas)
        x_inicio = pdf.get_x()
        y_inicio = pdf.get_y()
        for j, celula in enumerate(linha):
            x = pdf.get_x()
            y = pdf.get_y()
            pdf.multi_cell(larguras[j], 6, celula, border=0, fill=fill)
            pdf.set_xy(x + larguras[j], y)
        pdf.set_xy(x_inicio, y_inicio + h)
    pdf.ln(3)


# ---------------------------------------------------------------------------
# CAPA
# ---------------------------------------------------------------------------
pdf.add_page()
pdf.ln(40)
pdf.set_font("DejaVu", "B", 28)
pdf.set_text_color(*COR_TITULO)
pdf.multi_cell(0, 14, "O que realmente funciona\nno YouTube hoje", align="C")
pdf.ln(6)

pdf.set_font("DejaVu", "I", 13)
pdf.set_text_color(80, 80, 80)
pdf.multi_cell(0, 7, "Conceitos e insights extraidos do video do canal\n\"YouTube Sem MIMIMI\"", align="C")
pdf.ln(20)

pdf.set_draw_color(*COR_TITULO)
pdf.set_line_width(1.2)
pdf.line(60, pdf.get_y(), 150, pdf.get_y())
pdf.set_line_width(0.2)
pdf.ln(10)

pdf.set_font("DejaVu", "", 11)
pdf.set_text_color(*COR_TEXTO)
pdf.multi_cell(0, 6,
    "Resumo estruturado de um react do canal 'YouTube Sem MIMIMI' "
    "ao video do Ancapsul, que por sua vez analisava um estudo do "
    "site 1of10.com sobre o que faz um video viralizar em 2025.",
    align="C")
pdf.ln(40)

pdf.set_font("DejaVu", "", 10)
pdf.set_text_color(*COR_CINZA)
pdf.multi_cell(0, 5,
    "Base do estudo: 323.000 videos | 62 bilhoes de visualizacoes | 15 anos de conteudo",
    align="C")

# ---------------------------------------------------------------------------
# CONTEUDO
# ---------------------------------------------------------------------------
pdf.add_page()

# 1
h1("1. Contexto do video")
bullet("O autor raramente faz reacts, mas considerou esse video relevante por envolver dois grandes nomes do YouTube: Ancapsul (referencia da decada passada) e Peter Jordan/Nerd de Negocios (referencia atual).")
bullet("A base do conteudo analisado e o estudo do site 1of10.com chamado \"O que realmente faz um video ser viral em 2025\".")
bullet("Numeros do estudo: 323.000 videos analisados, 62 bilhoes de visualizacoes e 15 anos de tempo total de execucao.")
destaque("Aviso de vies: o estudo cobre 15 anos de YouTube. Como a plataforma muda muito, algumas conclusoes podem estar desatualizadas.")

# 2
h1("2. A grande verdade: nao existe atalho")

h2("Plataformas estao em guerra contra a automacao")
bullet("X cortou pagamentos para agregadores.")
bullet("Instagram seguiu o mesmo caminho.")
bullet("YouTube tende a fazer o mesmo, porque a internet esta sendo inundada por:")
bullet("Canais automatizados (robos gerando videos).", nivel=1)
bullet("Traducao e repostagem de conteudo estrangeiro.", nivel=1)
bullet("Conteudo \"requentado\" sem valor agregado.", nivel=1)

h2("IA nao e o problema. Automacao e.")
bullet("Voce PODE usar IA com sabedoria.")
bullet("O que o YouTube combate e o uso da IA para automatizar 100% do processo, eliminando a criacao humana.")

h2("A regra de ouro")
quote("Quem da certo no YouTube e quem GOSTA de fazer videos. Nao precisa ser por puro amor (pode ser por dinheiro), mas se voce acorda todo dia para fazer algo que detesta, dificilmente vai longe.")

# 3
h1("3. Algoritmo: nem magica, nem favoritismo")
bullet("O algoritmo NAO tem favoritos, nao e \"magico\" e nao e sorte.")
bullet("Ele e apenas um reflexo do gosto do usuario final.")
bullet("Se um canal nao cresce, ha algo objetivamente errado - nao e perseguicao da plataforma.")

# 4
h1("4. Duracao ideal do video")

h2("Conclusao central")
p("O publico que gostava de video curto migrou para os Shorts. Restou no formato tradicional uma audiencia que prefere videos mais longos.")

h2("Faixas recomendadas")
tabela(
    ["Formato", "Duracao ideal"],
    [
        ["Videos normais (entretenimento / educacao)", "18 a 24 minutos"],
        ["Minimo recomendado (qualquer nicho)", "Acima de 12 minutos"],
        ["Videos longos com profundidade", "~40 minutos (sweet spot)"],
        ["Videos muito longos", "1h+ volta a performar (exceto 30-60 min: vale do desempenho)"],
    ]
)

h2("Por que 40 minutos funciona melhor que 1h?")
bullet("Insight psicologico: \"40 min\" tem menos digitos na tela do que \"1h05\". Parece mais palatavel, gera mais cliques.")
bullet("Acima de 1 hora, o usuario se intimida.")

h2("Por que videos longos ganham?")
numerado(1, "Maior tempo total de visualizacao (metrica-chave do YouTube).")
numerado(2, "Mais dados para o algoritmo classificar a satisfacao do usuario.")

destaque("Atencao: a duracao ideal depende do nicho. Noticia, por exemplo, tende a ser mais curta.")

# 5
h1("5. O Hook: entregue tudo logo no comeco")

h2("Conceito")
bullet("O Ancapsul (e o Mr. Beast) entregam a noticia/desfecho em ~1 minuto e meio.")
bullet("Quem fica depois disso e porque quer aprofundar.")

h2("Por que isso e poderoso?")
quote("E melhor a pessoa assistir 1m30 do seu video do que NAO assistir nada.")
bullet("Aumenta a retencao media.")
bullet("Evita a sensacao de clickbait/sequestro de atencao (\"fica ate o final pra saber\").")
bullet("O algoritmo prefere usuarios satisfeitos a usuarios frustrados.")

h2("Aplicacao para videos longos (tutoriais, etc.)")
bullet("Use capitulos com titulos descritivos.")
bullet("A pessoa pode pular para a duvida especifica, assistir 2 min e sair feliz.")
bullet("Sem capitulos, ela sai sem ver nada.")

# 6
h1("6. Titulos: regras e nuances")

h2("Quantidade de palavras")
bullet("Menos de 5 palavras: maior engajamento.")
bullet("6+ palavras: desempenho comeca a cair.")
bullet("10+ palavras: queda forte de visualizacoes.")

h2("Caracteres")
bullet("O ideal e ate 64 caracteres. A partir de 65, o YouTube corta com \"...\".")
bullet("Acima de 70 caracteres, o desempenho piora drasticamente.")

h2("Por que SEO no titulo nao funciona mais")
bullet("Antigamente, encher o titulo de palavras-chave fazia sentido (busca).")
bullet("Hoje, quase ninguem pesquisa no YouTube. O trafego vem da recomendacao na home.")
bullet("Excecao: canais de tutorial, onde SEO ainda e relevante.")

h2("Linguagem")
bullet("Evite pontuacao excessiva (virgulas, dois-pontos).")
bullet("Evite palavras complexas ou em ingles.")
bullet("Use palavras simples e diretas - leitura instantanea.")

h2("Numeros no titulo (\"5 dicas para...\", \"10 erros...\")")
bullet("O estudo diz que diminui em 35% as views.")
bullet("O criador discorda parcialmente: depende do tema. Conteudos de lista ainda funcionam muito bem a longo prazo, especialmente se o tema gera interesse.")

h2("Titulos negativos / pessimistas")
bullet("Funcionam mais que titulos otimistas.")
bullet("O \"clique pelo medo\" e altamente eficaz.")
bullet("Exemplo: videos negativos sobre o Egito performam melhor que videos positivos.")
bullet("Por que funciona?")
bullet("Sinaliza urgencia.", nivel=1)
bullet("Cria tensao.", nivel=1)
bullet("Sugere conflito ou revelacao.", nivel=1)

h2("Controversia / quebra de expectativa")
bullet("O estudo e cetico; o criador defende fortemente.")
bullet("Exemplo dado: titulos do Ryan Santos, sempre bizarros e chocantes.")
bullet("Mesmo quem NAO gosta clica para entender o porque.")
destaque("Requer coragem e capacidade de sustentar uma tese fora do obvio.")

# 7
h1("7. Nicho: o que mais viraliza")

h2("Top nichos com maior potencial viral")
numerado(1, "Filmes e televisao")
numerado(2, "Musica")
numerado(3, "Politica")
numerado(4, "Historia")
numerado(5, "Noticias")

h2("O grande insight: diferencial de visao")
p("Nao basta entrar num nicho viral - e preciso ter um angulo unico.")
bullet("Ancapsul faz canal de noticias com vies anarcocapitalista. E o que ninguem mais entrega igual.")
bullet("Existe canal de carros com vies marxista que tambem se destaca pelo angulo.")

h2("Pergunta para voce se fazer")
quote("Qual e o MEU diferencial dentro desse nicho?")
p("Se a resposta for \"nenhum\", esta ai o motivo de o canal nao crescer.")

h2("Outro ponto: nicho com assunto inesgotavel")
bullet("O criador comecou falando so de anarcocapitalismo, mas acabaram os assuntos.")
bullet("Migrou para noticias, que tem materia-prima diaria.")
bullet("Dica: escolha temas onde sempre havera algo novo a falar.")

# 8
h1("8. Thumbnails: a engenharia da capa")

h2("Quantidade de rostos")
bullet("2 rostos > 1 rosto > nenhum rosto.")
bullet("Combinacao ideal: seu rosto + rosto da pessoa/tema abordado.")

h2("Texto na thumbnail")
bullet("84% das thumbs tem texto, mas thumbs com texto recebem 19% MENOS views.")
bullet("O ideal e transmitir a ideia so com imagem - mais dificil, mas mais eficaz.")
bullet("Outro motivo pratico: o YouTube esta investindo em internacionalizacao automatica. Thumb sem texto evita ter que subir uma versao por idioma.")

h2("Se for usar texto")
bullet("Maximo 3 palavras (teste empirico do criador).")
bullet("O estudo sugere menos de 10 caracteres.")

h2("Cores")
bullet("Brilho e contraste altos sempre vencem.")
bullet("Thumbs escuras (mesmo em canais de terror) performam pior.")
bullet("Cores como ciano ajudam segundo o estudo - o criador e cetico quanto a influencia exata da cor.")

h2("Dica pratica para calibrar")
bullet("Monitor de PC costuma estar descalibrado.")
bullet("Teste a thumb no celular. A tela do celular e mais fiel ao que o usuario final vai ver.")
bullet("Se ficar nitida e chamativa no celular, esta aprovada.")

# 9
h1("9. AdBreaks (interrupcoes para anuncio)")
bullet("O simbolo do canal aparece de tempos em tempos no video do Ancapsul, marca de AdBreak.")
bullet("Indica ao algoritmo um ponto natural para inserir anuncios.")
bullet("Aumenta a monetizacao sem prejudicar o ritmo do video.")

# 10
h1("10. Conteudo autoral vs. requentado: a guerra silenciosa")

h2("O calculo matematico que condena os agregadores")
bullet("A cada 10 pessoas que querem criar canal, 9 querem o atalho (copiar/automatizar).")
bullet("Resultado: enxurrada de conteudo identico inundando a plataforma.")
bullet("Estimativa do criador: apenas 6-7% dos videos publicados hoje sao realmente originais.")

h2("Por que IA generativa por si so nao resolve")
bullet("Se 50 pessoas pedem ao ChatGPT um roteiro sobre o MESMO tema, e matematicamente impossivel que sejam roteiros realmente diferentes. Vao variar sinonimos, ordem das palavras, mas a essencia se repete.")
bullet("O dicionario tem limites; os temas, ainda mais.")

h2("Quem se destaca?")
destaque("Quem coloca experiencia pessoal real.")
bullet("IA nao consegue inventar vivencia.")
bullet("Quando se inventa vivencia, o YouTube classifica como conteudo ficticio - e penaliza.")

h2("Resumo dessa parte")
bullet("IA com sabedoria? SIM.")
bullet("IA + automacao total? NAO.")
bullet("Experiencia pessoal real? INDISPENSAVEL.")
bullet("Mentir/fingir vivencia? PUNIDO.")

# 11
h1("11. Sinais praticos do mercado")
bullet("X cortou agregadores: engajamento de criadores autorais SUBIU.")
bullet("Instagram caminha para o mesmo.")
bullet("YouTube seguira inevitavelmente. Ja ha ondas de desmonetizacao nesse sentido.")
bullet("Conclusao: conteudo original sempre vence no longo prazo.")

# 12
h1("12. Sintese final - Os mandamentos do video")
mandamentos = [
    "Nao existe atalho. Canal cresce devagar; goste do processo.",
    "Use IA, mas nao automatize tudo. A automacao e o inimigo, nao a IA.",
    "Videos mais longos vencem (15 a 24 min, ou ~40 min para os profundos).",
    "Entregue o miolo nos primeiros 90 segundos (hook estilo Mr. Beast).",
    "Capitulos sao essenciais em videos longos.",
    "Titulos curtos (<= 5 palavras, <= 64 caracteres), simples e diretos.",
    "Titulos negativos / com tensao convertem mais.",
    "Controversia funciona - se voce tiver coragem.",
    "SEO morreu (exceto em tutoriais).",
    "Nicho viral + angulo pessoal = formula vencedora.",
    "Thumbnail brilhante, com 2 rostos e pouco/nenhum texto.",
    "Teste thumbnails no celular, nao no PC.",
    "Conteudo autoral e rei. Sua experiencia pessoal e o seu maior ativo.",
    "A plataforma quer originalidade. Alinhe-se com isso ou seja punido.",
]
for i, m in enumerate(mandamentos, 1):
    numerado(i, m)

# 13
h1("13. Calibracao por nicho - perfis especificos")
p("As regras gerais ate aqui (titulos curtos, evitar numeros, etc.) sao um excelente ponto de partida, mas a plataforma se comporta de modo diferente conforme o nicho. Cada perfil abaixo lista as exceções e refinamentos que predominam sobre as regras universais quando o canal opera naquele segmento. Se o seu nicho aparece aqui, aplique este perfil; se nao, use as regras gerais como default.")

h2("13.1 Review de Produtos")
p("Talvez o nicho com mais excecoes a regra geral. O espectador chega para tomar uma decisao de compra - quer informacao especifica e veredicto, nao mistério.")
bullet("Nome ou modelo do produto NO TITULO e obrigatorio (ex.: \"iPhone 17 Pro Max\", \"Galaxy S26 Ultra\"). Nao penalize comprimento causado pelo nome tecnico.")
bullet("Numeros no titulo (preco, modelo, ano, geracao) AGREGAM valor - sao gancho de busca e qualificador de relevancia. Ignore a regra geral de penalizar numeros.")
bullet("Titulos comparativos performam acima da media: \"X vs Y\", \"Vale a pena em [ano]?\", \"Antes de comprar...\", \"[Produto] depois de [tempo de uso]\".")
bullet("Titulos de aviso/alerta convertem fortemente: \"Nao compre antes de ver\", \"O que ninguem te conta sobre...\", \"Cuidado com esse [produto]\".")
bullet("O produto precisa estar VISUALMENTE RECONHECIVEL na thumbnail e dominar 30-50% da composicao. Produto pequeno, cortado ou indistinto e reprovado.")
bullet("Combo de maior CTR: produto fisico + reacao facial expressiva (positiva ou negativa). Polegar para baixo, choque, surpresa, decepcao.")
bullet("Marcadores visuais (setas, circulos vermelhos, X sobre defeitos, V sobre qualidades) sao ACEITAVEIS aqui - linguagem visual do nicho, NAO sinal de amadorismo.")
bullet("Preco em badge funciona (ex.: \"R$ 1.299\", \"-40%\"). Trate como elemento legitimo.")
bullet("SEO no titulo AINDA funciona neste nicho - palavras como \"review\", \"analise\", modelo e especificacao tecnica sao positivas.")
bullet("Hook deve mostrar o produto FISICAMENTE nos primeiros 5 segundos. Hook que demora a apresentar o produto e reprovado.")
bullet("Declarar conflito de interesse no inicio (\"comprei com meu dinheiro\" / \"fui patrocinado mas a opiniao e minha\") aumenta credibilidade.")
bullet("Declarar tempo de uso real (\"usei por 30 dias\", \"testei por 3 meses\", \"venho usando ha 1 ano\") e sinal de autoridade - bonifique.")
bullet("Hook deve prometer EXPLICITAMENTE um veredicto (\"no final desse video eu te digo se vale a pena ou nao\"). Sem essa promessa, retencao despenca.")

tabela(
    ["Item", "Regra do nicho Review"],
    [
        ["Duracao ideal (review direto)", "8 a 15 minutos"],
        ["Duracao para comparativo profundo", "20 a 30 minutos"],
        ["Numero de palavras no titulo", "Ate 8 palavras (mais que a regra geral)"],
        ["Numeros no titulo", "Sempre OK (modelo, preco, ano)"],
        ["SEO no titulo", "Funciona - aplicar"],
        ["Texto na thumbnail", "Pode usar preco/marcador, max 4 palavras"],
        ["Veredicto explicito", "Obrigatorio na promessa do pacote"],
    ]
)
destaque("Erro classico nesse nicho: review chapado e neutro \"em cima do muro\". Espectador quer opiniao firme. Quem nao se posiciona, nao retem.")

h2("13.2 Tutorial / How-to")
bullet("SEO no titulo AINDA funciona (busca direta e forte). Palavras-chave tecnicas devem ser preservadas mesmo que o titulo fique mais longo.")
bullet("Numeros performam BEM aqui (\"5 erros...\", \"10 dicas...\", \"3 passos para...\"). Ignore a regra geral de penalizacao por numeros.")
bullet("Rosto na thumbnail e MENOS critico. Captura de tela, ferramenta em uso, before/after ou resultado final substituem o rosto sem perda.")
bullet("Capitulos no roteiro sao OBRIGATORIOS - espectador pula para o passo que precisa.")
bullet("Duracao de 20-40 min com capitulos performa melhor que video curto cortando informacao.")
bullet("Hook pode ser promessa direta (\"ao final desse video voce vai conseguir X\"). Menos sobre tensao, mais sobre payoff pratico.")

h2("13.3 Entretenimento / Vlog / Gameplay / Reacts")
bullet("Titulos negativos, controversos e de choque PESAM MAIS - bonifique fortemente. Penalize titulos chapados/positivos.")
bullet("Hook nos primeiros 90 segundos e OBRIGATORIO. Reprovacao automatica se demorar.")
bullet("Expressao facial extrema na thumb (choque, riso exagerado, indignacao) e diferencial decisivo.")
bullet("SEO no titulo e IRRELEVANTE - keyword stuffing aqui sinaliza amador.")
bullet("Saudacoes longas, vinhetas, \"fala galera\" no inicio sao pesadamente penalizadas.")
bullet("Duracao ideal: 12 a 24 minutos.")

h2("13.4 Noticias / Atualidades")
bullet("Duracao mais CURTA (8-12 min) e ACEITAVEL e ate preferivel. Nao aplique o minimo geral de 12 min.")
bullet("Atualidade no titulo e critica - datas, anos, referencias temporais AGREGAM valor (oposto da regra geral).")
bullet("Composicao \"personagem publico + reacao/emocao\" e o padrao eficaz da thumb.")
bullet("Hook deve estabelecer a noticia em ~15s - sem construcao dramatica longa.")
bullet("Titulos podem ser ate 8 palavras se carregarem informacao substantiva.")
bullet("Tom de urgencia (\"AGORA\", \"URGENTE\", \"ULTIMAS\") e aceitavel mas overuso vira ruido.")

h2("13.5 Educacional / Conhecimento")
bullet("Capitulos no roteiro sao OBRIGATORIOS no scorecard.")
bullet("Titulos em formato de pergunta (\"Por que...\", \"Como...\", \"O que aconteceria se...\") performam bem - nao penalize.")
bullet("Lacuna de curiosidade tem peso MAIOR - bonifique quando o titulo promete revelacao intelectual genuina.")
bullet("Ilustracoes conceituais, infograficos ou imagens historicas/cientificas substituem o rosto sem perda na thumb.")
bullet("Duracao ideal: 15-40 minutos. Videos abaixo de 10 min sinalizam superficialidade neste nicho.")
bullet("Hook deve estabelecer relevancia pratica nos primeiros 30s (\"por que voce deveria se importar com isso\").")
bullet("Linguagem ligeiramente mais formal e aceitavel - nao penalize.")

destaque("Resumo: nicho Review de Produtos quebra a maioria das regras gerais (numeros, SEO, comprimento). Tutorial e Educacional quebram parcialmente. Entretenimento e o nicho onde as regras gerais sao mais estritas.")

# 14
h1("14. Reflexao de fechamento")
quote("Quem vai dar certo aqui e quem realmente gosta de fazer videos, quem coloca um pouco mais de carinho no conteudo, nao automatiza tudo, usa IA com sabedoria. Nao tem almoco gratis.")
p("O recado dos tres criadores converge para o mesmo ponto: o YouTube de 2025/2026 recompensa quem tem opiniao, vivencia e disposicao para o trabalho lento. Atalhos podem dar resultado por algumas semanas, mas o caminho sustentavel e o do criador com diferencial autoral - alguem que ninguem consegue copiar porque a materia-prima e a propria experiencia de vida.")

# Pagina final - cartao de referencia rapido
pdf.add_page()
h1("Cartao de referencia rapido")

h2("Duracao")
bullet("Videos curtos: 15 min")
bullet("Videos medios: 18 a 24 min")
bullet("Videos profundos: ~40 min")
bullet("Minimo: acima de 12 min")

h2("Titulo")
bullet("Maximo 5 palavras / 64 caracteres")
bullet("Sem pontuacao excessiva")
bullet("Sem palavras dificeis ou em ingles")
bullet("Tom negativo, urgente ou controverso converte mais")

h2("Thumbnail")
bullet("2 rostos, alto brilho, alto contraste")
bullet("Sem texto - ou no maximo 3 palavras")
bullet("Sempre testar no celular")

h2("Roteiro")
bullet("Entregar o nucleo nos primeiros 90 segundos (hook)")
bullet("Usar capitulos em videos longos")
bullet("Adicionar experiencia pessoal real (diferencial intransponivel)")

h2("Estrategia")
bullet("Escolher nicho viral (politica, filmes, musica, historia, noticias)")
bullet("Trazer angulo unico para o nicho")
bullet("Garantir tema com materia-prima inesgotavel")
bullet("Nao automatizar 100% com IA")

h2("Calibracao por nicho (resumo)")
bullet("Review de Produtos: nome do produto + numeros + comparativos + preco no titulo. Produto dominante na thumb. Hook com produto fisico em 5s e veredicto explicito.")
bullet("Tutorial: SEO funciona, numeros funcionam, capitulos obrigatorios, rosto e dispensavel.")
bullet("Entretenimento: titulos negativos pesam mais, hook em 90s e obrigatorio, expressao facial extrema na thumb.")
bullet("Noticias: 8-12 min sao OK, datas e numeros agregam, hook em 15s.")
bullet("Educacional: capitulos obrigatorios, perguntas no titulo, lacuna de curiosidade tem peso maior.")

pdf.ln(8)
pdf.set_font("DejaVu", "I", 9)
pdf.set_text_color(*COR_CINZA)
pdf.multi_cell(0, 5,
    "Documento gerado a partir do video \"Isso e o que realmente funciona no YouTube hoje!\" "
    "do canal YouTube Sem MIMIMI, que reage ao Ancapsul analisando o estudo do site 1of10.com.",
    align="C")

# ---------------------------------------------------------------------------
# Salvar
# ---------------------------------------------------------------------------
pdf.output("/projects/sandbox/RopositorioTeste/youtube_o_que_funciona_hoje.pdf")
print("PDF gerado com sucesso.")
