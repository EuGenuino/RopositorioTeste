// CONFIGURATION & STATE
const STATE = {
    imageLoaded: false,
    imageSrc: '',
    imageMimeType: '',
    imageDataBase64: '',
    niche: '',
    title: '',
    hook: '',
    apiKey: '',
    isAnalyzing: false,
    rawMarkdown: ''
};

// =============================================================
// NICHE PROFILES — Calibração de regras por nicho
// =============================================================
// Cada perfil define palavras-chave que o `detectNicheProfile` usa
// para identificar o nicho a partir do campo livre digitado pelo usuário,
// e um bloco `directives` que é injetado no prompt do Gemini.
// Esses ajustes PRECEDEM as regras universais — quando houver conflito,
// o modelo deve seguir o perfil específico.
const NICHE_PROFILES = {
    review: {
        label: 'Review de Produtos',
        keywords: [
            'review', 'reviews', 'análise', 'analise', 'unboxing',
            'comparativo', 'produto', 'produtos', 'tech', 'gadget',
            'gadgets', 'teste', 'testando', 'opinião sincera', 'vale a pena'
        ],
        directives: `
DIRETRIZES ESPECÍFICAS PARA NICHO DE REVIEW DE PRODUTOS:
- Nome ou modelo do produto no título é OBRIGATÓRIO. Não penalize comprimento causado pelo nome técnico do produto (ex.: "iPhone 17 Pro Max", "Galaxy S26 Ultra").
- Números no título (preço, modelo, ano, geração) AGREGAM valor neste nicho — IGNORE a regra geral de penalização por números. Aqui números servem de gancho de busca e qualificador de relevância.
- Títulos comparativos e de decisão de compra performam ACIMA da média: "X vs Y", "Vale a pena em [ano]?", "Antes de comprar...", "[Produto] depois de [tempo de uso]". Bonifique fortemente quando presentes.
- Títulos com tom de aviso/alerta ("Não compre antes de ver", "O que ninguém te conta sobre...", "Cuidado com esse [produto]") convertem fortemente — bonifique.
- Thumbnail: o PRODUTO precisa estar visualmente reconhecível e dominar pelo menos 30-50% da composição. Reprove se o produto está pequeno, cortado de forma que perde identidade ou pouco distintivo do fundo.
- Thumbnail: combo "produto físico + reação facial expressiva (positiva ou negativa)" é o padrão de maior CTR neste nicho. Polegar para baixo, expressão de choque, surpresa ou decepção funcionam fortemente.
- Thumbnail: marcadores visuais como setas, círculos vermelhos, "X" sobre defeitos ou "✓" sobre qualidades são ACEITÁVEIS e comuns aqui — NÃO trate como sinal de amadorismo. Trate como linguagem visual do nicho.
- Thumbnail: preço destacado em badge funciona ("R$ 1.299"). Trate como elemento legítimo, não como "número penalizável".
- SEO no título AINDA funciona neste nicho — palavras-chave técnicas (modelo, especificação, "review", "análise") são positivas. NÃO aplique a regra geral de "SEO morreu".
- Hook: deve mostrar o produto FISICAMENTE nos primeiros 5 segundos. Hook que demora a apresentar o produto é reprovado.
- Hook: declarar conflito de interesse logo no início ("comprei com meu próprio dinheiro" / "fui patrocinado pela X mas a opinião é minha") aumenta credibilidade — bonifique quando presente.
- Hook: declarar tempo de uso real ("usei por 30 dias", "testei por 3 meses", "venho usando há 1 ano") é sinal de autoridade — bonifique.
- Hook: deve prometer explicitamente um veredicto ("no final desse vídeo eu vou te dizer se vale a pena ou não"). Penalize hooks que não prometem essa entrega.
- Duração ideal: 8-15 minutos para reviews diretos. Espectador quer decisão de compra rápida, não palestra. Vídeos acima de 20 min só funcionam para comparativos profundos ou long-term reviews.
- Veredicto explícito ("vale a pena?", "recomendo?", "comprar ou esperar?") deve ser parte da promessa do pacote thumb+título — sinalize se isso estiver ausente.
`
    },
    tutorial: {
        label: 'Tutorial / How-to',
        keywords: [
            'tutorial', 'tutoriais', 'how-to', 'how to', 'passo a passo',
            'aprender', 'curso', 'cursos', 'aulas', 'aula', 'guia',
            'iniciante', 'iniciantes', 'do zero', 'ensino'
        ],
        directives: `
DIRETRIZES ESPECÍFICAS PARA NICHO DE TUTORIAL:
- SEO no título AINDA funciona neste nicho (busca direta é forte). Palavras-chave técnicas e específicas devem ser preservadas. NÃO penalize comprimento se for por causa de termos buscáveis essenciais.
- Títulos com números ("5 erros...", "10 dicas...", "3 passos para...") performam BEM em tutoriais — IGNORE a regra geral de penalização por números.
- Rosto na thumbnail é MENOS crítico. Capturas de tela, ferramenta sendo usada, before/after ou resultado final podem substituir o rosto sem perda de CTR.
- Capítulos do roteiro são item OBRIGATÓRIO no scorecard de retenção (espectadores pulam para o passo que precisam). Sinalize fortemente se ausentes.
- Duração: vídeos de 20-40 min com capítulos performam melhor que vídeos curtos cortando informação. NÃO penalize duração longa.
- Hook: pode declarar promessa direta ("ao final desse vídeo você vai conseguir X") — neste nicho é menos sobre tensão emocional e mais sobre promessa explícita de payoff prático.
- Títulos podem ser ligeiramente mais formais e técnicos. Não penalize por isso.
`
    },
    entretenimento: {
        label: 'Entretenimento',
        keywords: [
            'entretenimento', 'humor', 'comédia', 'comedia', 'vlog',
            'vlogs', 'gameplay', 'jogos', 'games', 'reacts', 'reação',
            'reacao', 'pegadinha', 'desafio', 'challenge'
        ],
        directives: `
DIRETRIZES ESPECÍFICAS PARA NICHO DE ENTRETENIMENTO:
- Títulos negativos, controversos ou de choque PESAM MAIS — bonifique fortemente quando presentes e penalize títulos chapados/positivos.
- Hook nos primeiros 90 segundos é OBRIGATÓRIO. Considere REPROVADO qualquer hook que demore a apresentar o conflito/payoff/resultado.
- Thumbnail: expressão facial extrema (choque, riso exagerado, indignação) é diferencial decisivo — bonifique.
- SEO no título é IRRELEVANTE — penalize keyword stuffing como sinal de amador.
- Duração ideal: 12-24 minutos.
- Saudações longas, vinhetas ou "fala galera" no hook são PESADAMENTE penalizados.
`
    },
    noticias: {
        label: 'Notícias / Atualidades',
        keywords: [
            'notícias', 'noticias', 'news', 'jornalismo', 'atualidade',
            'atualidades', 'política', 'politica', 'mercado', 'economia',
            'cotidiano', 'urgente'
        ],
        directives: `
DIRETRIZES ESPECÍFICAS PARA NICHO DE NOTÍCIAS:
- Duração mais CURTA (8-12 minutos) é ACEITÁVEL e até preferível. NÃO aplique o critério geral de "mínimo 12 min".
- Atualidade do título é crítica — datas, anos e referências temporais AGREGAM valor (oposto da regra geral de evitar números).
- Thumbnail: composição "personagem público + reação/emoção" é padrão eficaz do nicho.
- Hook: deve estabelecer a notícia em ~15s. NÃO há tempo para construção dramática longa.
- Títulos podem ser ligeiramente mais longos (até 8 palavras) se carregarem informação substantiva.
- Tom de urgência ("AGORA", "URGENTE", "ÚLTIMAS") é aceitável mas se overusado vira ruído — penalize repetição.
`
    },
    educacional: {
        label: 'Educacional / Conhecimento',
        keywords: [
            'educacional', 'educação', 'educacao', 'ciência', 'ciencia',
            'história', 'historia', 'aprendizado', 'conhecimento',
            'filosofia', 'matemática', 'matematica', 'física', 'fisica',
            'biologia', 'curiosidade'
        ],
        directives: `
DIRETRIZES ESPECÍFICAS PARA NICHO EDUCACIONAL:
- Capítulos do roteiro são item OBRIGATÓRIO no scorecard.
- Títulos em formato de pergunta ("Por que...", "Como...", "O que aconteceria se...") performam bem — NÃO penalize.
- Lacuna de curiosidade tem peso MAIOR — bonifique quando o título promete revelação intelectual genuína.
- Thumbnail: ilustrações conceituais, infográficos ou imagens históricas/científicas podem substituir rosto sem perda de CTR.
- Duração ideal: 15-40 minutos. Vídeos curtos demais sinalizam superficialidade neste nicho — penalize duração abaixo de 10 min.
- Hook deve estabelecer relevância prática nos primeiros 30s ("por que você deveria se importar com isso").
- Linguagem ligeiramente mais formal é aceitável — não penalize.
`
    }
};

function detectNicheProfile(nicheText) {
    if (!nicheText) return null;
    const t = nicheText.toLowerCase().trim();
    if (!t) return null;
    for (const profile of Object.values(NICHE_PROFILES)) {
        if (profile.keywords.some(kw => t.includes(kw))) {
            return profile;
        }
    }
    return null;
}

// DOM ELEMENTS
const el = {
    // Header
    btnOpenSettings: document.getElementById('btn-open-settings'),
    
    // Upload Zone
    uploadZone: document.getElementById('upload-zone'),
    fileInput: document.getElementById('file-input'),
    uploadPrompt: document.getElementById('upload-prompt'),
    previewContainer: document.getElementById('preview-container'),
    imagePreview: document.getElementById('image-preview'),
    gridOverlay: document.getElementById('grid-overlay'),
    dangerOverlay: document.getElementById('danger-overlay'),
    
    // Inputs
    inputNicho: document.getElementById('input-nicho'),
    inputTitulo: document.getElementById('input-titulo'),
    inputHook: document.getElementById('input-hook'),
    
    // Actions
    btnAnalyzeGemini: document.getElementById('btn-analyze-gemini'),
    btnAnalyzeMock: document.getElementById('btn-analyze-mock'),
    btnReset: document.getElementById('btn-reset'),
    
    // Simulators
    simulatorsCard: document.getElementById('simulators-card'),
    btnToggleGrid: document.getElementById('btn-toggle-grid'),
    btnToggleDanger: document.getElementById('btn-toggle-danger'),
    imagePreviewMicro: document.getElementById('image-preview-micro'),
    imagePreviewFeed: document.getElementById('image-preview-feed'),
    simVideoTitle: document.getElementById('sim-video-title'),
    simChannelNiche: document.getElementById('sim-channel-niche'),
    
    // Results
    resultsArea: document.getElementById('results-area'),
    welcomeArea: document.getElementById('welcome-area'),
    analysisLoading: document.getElementById('analysis-loading'),
    analysisResults: document.getElementById('analysis-results'),
    txtScore: document.getElementById('txt-score'),
    scoreProgress: document.getElementById('score-progress'),
    txtVerdict: document.getElementById('txt-verdict'),
    txtVerdictBox: document.getElementById('txt-verdict-box'),
    btnCopyMd: document.getElementById('btn-copy-md'),
    btnCopyMdTab: document.getElementById('btn-copy-md-tab'),
    btnPrintPdf: document.getElementById('btn-print-pdf'),
    scorecardThumbBody: document.getElementById('scorecard-thumb-body'),
    scorecardTitleBody: document.getElementById('scorecard-title-body'),
    cardScorecardHook: document.getElementById('card-scorecard-hook'),
    scorecardHookBody: document.getElementById('scorecard-hook-body'),
    cardHookAnalysis: document.getElementById('card-hook-analysis'),
    hookAnalysisContent: document.getElementById('hook-analysis-content'),
    
    // Results Lists
    criticalIssuesList: document.getElementById('critical-issues-list'),
    improvementsList: document.getElementById('improvements-list'),
    strengthsList: document.getElementById('strengths-list'),
    prioritiesList: document.getElementById('priorities-list'),
    cardCriticalIssues: document.getElementById('card-critical-issues'),
    cardImprovements: document.getElementById('card-improvements'),
    cardStrengths: document.getElementById('card-strengths'),
    cardPriorities: document.getElementById('card-priorities'),
    
    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    markdownRawOutput: document.getElementById('markdown-raw-output'),
    
    // Settings Modal
    settingsModal: document.getElementById('settings-modal'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    inputApiKey: document.getElementById('input-api-key'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    btnClearSettings: document.getElementById('btn-clear-settings'),
    apiStatusBox: document.getElementById('api-status-box'),
    apiStatusText: document.getElementById('api-status-text'),
    
    // Toast
    toast: document.getElementById('toast'),
    
    // History
    historyContainer: document.getElementById('history-container'),
    historyList: document.getElementById('history-list'),
    btnClearHistory: document.getElementById('btn-clear-history'),
    
    // Title & Synergy Analysis
    cardTitleSynergy: document.getElementById('card-title-synergy'),
    titleSynergyContent: document.getElementById('title-synergy-content'),
    cardTitleSuggestions: document.getElementById('card-title-suggestions'),
    titleSuggestionsList: document.getElementById('title-suggestions-list'),
    cardThumbSuggestions: document.getElementById('card-thumb-suggestions'),
    thumbSuggestionsList: document.getElementById('thumb-suggestions-list'),
    cardComboRecommendation: document.getElementById('card-combo-recommendation'),
    comboRecommendationContent: document.getElementById('combo-recommendation-content')
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    // Initialise Lucide icons
    lucide.createIcons();
    
    // Load saved API Key
    loadApiKey();
    
    // Event listeners
    setupEventListeners();
    
    // Setup initial state
    updateUIForState();
    
    // Render history
    renderHistoryList();
});

// LOAD & SAVE SETTINGS
function loadApiKey() {
    const savedKey = localStorage.getItem('thumbaudit_gemini_key');
    if (savedKey) {
        STATE.apiKey = savedKey;
        el.inputApiKey.value = savedKey;
        setApiStatus(true, 'Chave de API configurada. Pronto para realizar análises reais!');
        el.btnOpenSettings.innerHTML = '<i data-lucide="check-circle" class="color-success"></i> API Conectada';
    } else {
        STATE.apiKey = '';
        el.inputApiKey.value = '';
        setApiStatus(false, 'Nenhuma chave configurada. O aplicativo funcionará em modo de demonstração.');
        el.btnOpenSettings.innerHTML = '<i data-lucide="settings"></i> Configurações da API';
    }
    lucide.createIcons();
}

function setApiStatus(isOk, text) {
    if (isOk) {
        el.apiStatusBox.className = 'status-indicator-box success';
    } else {
        el.apiStatusBox.className = 'status-indicator-box';
    }
    el.apiStatusText.innerText = text;
}

function saveApiKey() {
    const key = el.inputApiKey.value.trim();
    if (key) {
        localStorage.setItem('thumbaudit_gemini_key', key);
        showToast('Configurações salvas com sucesso!');
    } else {
        localStorage.removeItem('thumbaudit_gemini_key');
        showToast('Chave de API removida.');
    }
    loadApiKey();
    closeModal();
    updateUIForState();
}

function clearApiKey() {
    localStorage.removeItem('thumbaudit_gemini_key');
    el.inputApiKey.value = '';
    showToast('Chave de API removida.');
    loadApiKey();
    closeModal();
    updateUIForState();
}

// EVENT LISTENERS SETUP
function setupEventListeners() {
    // Modal controls
    el.btnOpenSettings.addEventListener('click', openModal);
    el.btnCloseSettings.addEventListener('click', closeModal);
    el.btnSaveSettings.addEventListener('click', saveApiKey);
    el.btnClearSettings.addEventListener('click', clearApiKey);
    el.settingsModal.addEventListener('click', (e) => {
        if (e.target === el.settingsModal) closeModal();
    });
    
    el.btnClearHistory.addEventListener('click', clearHistory);
    
    // Upload zone events
    el.uploadZone.addEventListener('click', () => {
        if (!STATE.imageLoaded) {
            el.fileInput.click();
        }
    });
    
    el.fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        el.uploadZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            el.uploadZone.classList.add('dragover');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        el.uploadZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            el.uploadZone.classList.remove('dragover');
        }, false);
    });
    
    el.uploadZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    // Inputs sync
    el.inputNicho.addEventListener('input', (e) => {
        STATE.niche = e.target.value;
        el.simChannelNiche.innerText = STATE.niche || 'Geral';
    });
    
    el.inputTitulo.addEventListener('input', (e) => {
        STATE.title = e.target.value;
        el.simVideoTitle.innerText = STATE.title || 'Título do Vídeo Aparecerá Aqui de Forma Responsiva...';
    });

    el.inputHook.addEventListener('input', (e) => {
        STATE.hook = e.target.value;
    });
    
    // Action buttons
    el.btnAnalyzeGemini.addEventListener('click', runGeminiAnalysis);
    el.btnAnalyzeMock.addEventListener('click', runMockAnalysis);
    el.btnReset.addEventListener('click', resetApp);
    
    // Toggles
    el.btnToggleGrid.addEventListener('click', () => {
        const active = el.gridOverlay.classList.toggle('hidden');
        el.btnToggleGrid.classList.toggle('active', !active);
    });
    
    el.btnToggleDanger.addEventListener('click', () => {
        const active = el.dangerOverlay.classList.toggle('hidden');
        el.btnToggleDanger.classList.toggle('active', !active);
    });
    
    // Results actions
    el.btnCopyMd.addEventListener('click', () => copyToClipboard(STATE.rawMarkdown));
    el.btnCopyMdTab.addEventListener('click', () => copyToClipboard(STATE.rawMarkdown));
    el.btnPrintPdf.addEventListener('click', () => window.print());
    
    // Tabs switching
    el.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            el.tabBtns.forEach(b => b.classList.remove('active'));
            el.tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// MODAL STATE
function openModal() {
    el.settingsModal.classList.add('active');
}

// RESTORE ORIGINAL RESET APP WITH HOOK RESETS
function resetApp() {
    STATE.imageLoaded = false;
    STATE.imageSrc = '';
    STATE.imageMimeType = '';
    STATE.imageDataBase64 = '';
    STATE.rawMarkdown = '';
    STATE.hook = '';
    
    el.fileInput.value = '';
    el.inputHook.value = '';
    el.imagePreview.src = '';
    el.imagePreviewMicro.src = '';
    el.imagePreviewFeed.src = '';
    
    el.gridOverlay.classList.add('hidden');
    el.dangerOverlay.classList.add('hidden');
    el.btnToggleGrid.classList.remove('active');
    el.btnToggleDanger.classList.remove('active');
    
    el.resultsArea.classList.add('hidden');
    el.analysisResults.classList.add('hidden');
    
    el.cardTitleSynergy.classList.add('hidden');
    el.cardTitleSuggestions.classList.add('hidden');
    el.cardThumbSuggestions.classList.add('hidden');
    el.cardComboRecommendation.classList.add('hidden');
    el.cardScorecardHook.classList.add('hidden');
    el.cardHookAnalysis.classList.add('hidden');
    
    el.uploadZone.classList.remove('has-image');
    updateUIForState();
    renderHistoryList();
}

function closeModal() {
    el.settingsModal.classList.remove('active');
}

// TOAST NOTIFICATIONS
function showToast(text, duration = 3000) {
    el.toast.innerHTML = `<i data-lucide="info" class="inline-icon"></i> ${text}`;
    lucide.createIcons();
    el.toast.classList.add('active');
    setTimeout(() => {
        el.toast.classList.remove('active');
    }, duration);
}

// HANDLE FILE UPLOAD
function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Formato inválido! Envie apenas arquivos de imagem.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        STATE.imageSrc = e.target.result;
        STATE.imageMimeType = file.type;
        STATE.imageDataBase64 = e.target.result.split(',')[1];
        STATE.imageLoaded = true;
        
        // Show previews
        el.imagePreview.src = STATE.imageSrc;
        el.imagePreviewMicro.src = STATE.imageSrc;
        el.imagePreviewFeed.src = STATE.imageSrc;
        
        updateUIForState();
        showToast('Miniatura carregada com sucesso!');
    };
    reader.onerror = () => {
        showToast('Erro ao carregar o arquivo.');
    };
    reader.readAsDataURL(file);
}

// UPDATE UI FOR STATE
function updateUIForState() {
    if (STATE.imageLoaded) {
        // Show edit items
        el.uploadPrompt.classList.add('hidden');
        el.previewContainer.classList.remove('hidden');
        el.simulatorsCard.classList.remove('hidden');
        el.welcomeArea.classList.add('hidden');
        el.btnReset.classList.remove('hidden');
        el.uploadZone.classList.add('has-image');
        
        // Enable buttons based on API Key presence
        if (STATE.apiKey) {
            el.btnAnalyzeGemini.classList.remove('disabled');
            el.btnAnalyzeGemini.disabled = false;
            el.btnAnalyzeMock.classList.add('hidden');
        } else {
            el.btnAnalyzeGemini.classList.add('disabled');
            el.btnAnalyzeGemini.disabled = true;
            el.btnAnalyzeMock.classList.remove('hidden');
            el.btnAnalyzeMock.classList.remove('disabled');
            el.btnAnalyzeMock.disabled = false;
        }
    } else {
        // Welcome mode
        el.uploadPrompt.classList.remove('hidden');
        el.previewContainer.classList.add('hidden');
        el.simulatorsCard.classList.add('hidden');
        el.welcomeArea.classList.remove('hidden');
        el.btnReset.classList.add('hidden');
        
        el.btnAnalyzeGemini.classList.add('disabled');
        el.btnAnalyzeGemini.disabled = true;
        el.btnAnalyzeMock.classList.add('disabled');
        el.btnAnalyzeMock.disabled = true;
    }
}

// COPY TO CLIPBOARD
function copyToClipboard(text) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copiado para a área de transferência!');
    }).catch(err => {
        showToast('Falha ao copiar.');
    });
}

// DYNAMIC CONTEXTUAL MOCK ANALYSIS GENERATOR
function generateMockAnalysis() {
    const nicheName = STATE.niche || 'Geral';
    const videoTitle = STATE.title || 'COMO GANHAR DINHEIRO COM INTELIGÊNCIA ARTIFICIAL EM 2026';
    const hookText = STATE.hook || '';
    
    const hasHook = hookText.trim().length > 0;
    
    // Calculate score dynamically
    const thumbScore = 8.2;
    const titleScore = 7.8;
    const hookScore = 6.2;
    
    let overallScore;
    if (hasHook) {
        overallScore = ((thumbScore * 0.3) + (titleScore * 0.3) + (hookScore * 0.4)).toFixed(1);
    } else {
        overallScore = ((thumbScore * 0.5) + (titleScore * 0.5)).toFixed(1);
    }
    
    let report = `🖼️ ANÁLISE DE THUMBNAIL — DIAGNÓSTICO COMPLETO

**PONTUAÇÃO GERAL: ${overallScore}/10**

---

📊 SCORECARD RÁPIDO (THUMBNAIL)

| Pilar | Critério | Status |
|---|---|---|
| Composição | Regra dos terços | ✅ Aprovado |
| Composição | Espaço negativo | ✅ Aprovado |
| Composição | Zonas de perigo | ⚠️ Melhorável |
| Composição | Profundidade/camadas | ✅ Aprovado |
| Composição | Direção do olhar | ✅ Aprovado |
| Composição | Fluxo em Z | ⚠️ Melhorável |
| Cores | Contraste texto/fundo | ✅ Aprovado |
| Cores | Par de cores | ✅ Aprovado |
| Cores | Sobrevivência mobile | ✅ Aprovado |
| Cores | Psicologia/nicho | ✅ Aprovado |
| Cores | Tratamento do fundo | ✅ Aprovado |
| Tipografia | Escolha da fonte | ✅ Aprovado |
| Tipografia | Quantidade de fontes | ✅ Aprovado |
| Tipografia | Tamanho do texto | ✅ Aprovado |
| Tipografia | Posicionamento | ✅ Aprovado |
| Tipografia | Tratamento de contraste | ✅ Aprovado |
| Tipografia | Complementaridade | ✅ Aprovado |
| Global | Teste mobile 160px | ✅ Aprovado |

---

📊 SCORECARD RÁPIDO (TÍTULO)

| Dimensão | Pontuação | Observação Rápida |
|---|---|---|
| Comprimento do Título | 8.0/10 | Título atual possui 9 palavras, o que é um pouco longo. |
| Legibilidade do Título | 8.5/10 | Compreensão imediata, linguagem direta e clara. |
| Força Emocional do Título | 7.5/10 | Título foca em benefício lógico, mas falta tensão. |
| Valência (Negativo/Positivo) | 7.0/10 | Enquadramento neutro/positivo. Poderia ser negativo. |
| Sinergia Thumb + Título | 9.0/10 | Ambos trabalham o mesmo universo sem repetir palavras. |

`;

    if (hasHook) {
        report += `---

📊 SCORECARD RÁPIDO (HOOK)

| Teste Essencial | Status | Observação Rápida |
|---|---|---|
| Reafirmação da Promessa | ✅ Aprovado | Começa direto respondendo ao título do vídeo. |
| Estabelecimento de Apostas | ⚠️ Melhorável | Demora 18 segundos para apresentar o que está em jogo. |
| Timestamp do Payoff | ❌ Reprovado | Não deixa claro em qual momento do vídeo entregará o resultado. |
| Abertura de Loop de Curiosidade | ✅ Aprovado | Abre um loop intrigante sobre um segredo oculto no nicho. |

`;
    }

    report += `---

🔴 PROBLEMAS CRÍTICOS
(Apenas itens com pontuação baixa ou problemas sérios)

**[ZONAS DE PERIGO DO YT]**
- O que está errado: O texto secundário no canto inferior direito está parcialmente encoberto pela badge de tempo.
- Por que prejudica o CTR: Causa atrito visual e passa sensação de amadorismo ao espectador no mobile.
- Como corrigir: Mova o elemento de texto 50px para cima ou para o lado esquerdo (inspeção por análise visual).

---

🟡 MELHORIAS RECOMENDADAS

**[VALÊNCIA DO TÍTULO]**
- Situação atual: O título atual "${videoTitle}" foca puramente em uma promessa positiva comum.
- Oportunidade: Enquadrar na perda ou urgência para aumentar o clique imediato explorando a aversão à perda.

---

🟢 PONTOS FORTES
- Expressão de espanto do sujeito cria alto engajamento visual.
- Contraste WCAG 4.5:1 excelente entre texto amarelo e fundo azul marinho.
- Espaço negativo de ~35% muito bem distribuído.

---

💡 PRIORIDADE DE AÇÃO
1. Mover os elements visuais críticos para fora do canto inferior direito.
2. Alterar o título para uma versão focada em enquadramento negativo (aversão à perda).
3. Aumentar o contorno do texto principal para melhorar a sobrevivência mobile (160px).

---

📝 ANÁLISE DE TÍTULO E SINERGIA

### Análise de Título
- **Comprimento e Economia Cognitiva**: O título atual possui ${videoTitle.split(' ').length} palavras e ${videoTitle.length} caracteres. Ele excede levemente o limite ideal de 5 a 6 palavras. Cortar palavras de suporte ("Como", "Com") aumentará o impacto de leitura instantânea.
- **Legibilidade (Flesch adaptado)**: Linguagem direta, mas o termo "Inteligência Artificial" adiciona uma palavra longa que atrai atenção cognitiva extra. Soa natural, mas pode ser simplificado para "IA".
- **Uso de Números**: O número "2026" dá contexto temporal de urgência, mas diminui levemente o mistério.
- **Valência Emocional (Negativo vs Positivo)**: Valência puramente positiva. Títulos positivos tendem a ter 22% menos visualizações em comparação com ganchos baseados em erros ou perdas no nicho de ${nicheName}.
- **Tom Emocional Dominante**: Predomina a Curiosidade intelectual, mas sem tensão ou controvérsia.
- **Lacuna de Curiosidade**: Moderada. Promete um tutorial de ganho de dinheiro, mas não esconde como isso será feito.

### Análise de Sinergia
- **Complementaridade vs Redundância**: O título diz "IA em 2026" e a thumbnail exibe um robô com expressão chocada. Há excelente complementaridade visual, pois a imagem tangibiliza o tema do título sem precisar escrever "robô" ou repetir todo o título no texto da thumb.
- **Alinhamento Emocional**: Alinhamento excelente. A expressão da thumbnail indica choque/descoberta, combinando com a promessa de revelação financeira do título.
- **Consistência de Promessa**: Honestidade mantida. A promessa implícita é direta e entrega o que o título do nicho de ${nicheName} propõe.
- **Hierarquia de Informação**: A thumbnail apresenta o "Universo" (Tecnologia/IA) e o título estabelece o "Conflito" (ganhar dinheiro).

`;

    if (hasHook) {
        report += `---

🎯 ANÁLISE DE HOOK E RETENÇÃO

### Análise dos Microestágios
- **0-3s (Gancho Visual e de Tema)**: Começa bem ao citar o tema diretamente sem introduções ou saudações demoradas. Contudo, falta um estímulo visual forte simultâneo para prender a atenção.
- **3-15s (Apostas e Promessa de Payoff)**: Há uma promessa clara, mas as consequências de não assistir ao vídeo (apostas) são fracas. O espectador precisa sentir a urgência de imediato.
- **15-30s (Compromisso e Prova)**: O roteiro tenta criar curiosidade, mas falha em mostrar uma micro-prova ou teaser de resultado para reter o espectador até o payoff.

### Erros Comuns Identificados
- **Sem Saudações Iniciais Proteladas**: ✅ Excelente! Sem "E aí pessoal..." ou logotipos animados.
- **Foco imediato nas apostas**: ⚠️ O conflito é introduzido de forma morna. Evite definições e explicações teóricas antes de prender o espectador.

### Sugestão de Reescrita Otimizada
*Roteiro Atual:*
"${hookText.substring(0, 150)}..."

*Roteiro Otimizado:*
"Você está perdendo dinheiro com inteligência artificial todos os dias porque comete este erro básico. Em exatamente 4 minutos, vou te mostrar o passo a passo exato para faturar seus primeiros R$ 500 sem programar nada. Olha só este resultado..."

`;
    }

    report += `---

✏️ SUGESTÕES DE TÍTULOS ALTERNATIVOS
- **Versão Curta/Curiosidade**: "Ganhar Dinheiro Com IA"
  - Contagem: 4 palavras, 23 carac.
  - Emoção dominante: Curiosidade
- **Versão Emocional Negativa**: "Não Use IA Antes de Ver Isso"
  - Contagem: 8 palavras, 29 carac.
  - Emoção dominante: Medo/Urgência
- **Versão Humor/Controvérsia**: "Fui Demitido e a IA me Enriqueceu"
  - Contagem: 8 palavras, 33 carac.
  - Emoção dominante: Choque/Curiosidade

---

🖼️ SUGESTÕES DE AJUSTE NA THUMBNAIL
- **Ajuste de Posição**: Mover o texto principal do canto inferior direito para a esquerda para evitar sobreposição do elemento de duração.
- **Ajuste de Contraste**: Adicionar uma sombra preta projetada de 5px atrás do texto amarelo para ressaltá-lo em relação ao brilho de fundo.

---

⚡ RECOMENDAÇÃO DE COMBO DE SINERGIA
Recomenda-se utilizar a **Versão Emocional Negativa** ("Não Use IA Antes de Ver Isso") combinada com o **Ajuste de Posição** na thumbnail. Essa combinação cria uma lacuna de curiosidade perfeita: a thumbnail mostra a ferramenta visual e o título proíbe o uso, gerando urgência máxima e eliminando redundâncias.

---

🔍 VEREDICTO FINAL
Excelente combo de thumbnail e título com alto potencial de CTR. Os ajustes simples trarão ótimo retorno.`;

    return report;
}

// RUN MOCK ANALYSIS
function runMockAnalysis() {
    if (!STATE.imageLoaded) return;
    
    el.resultsArea.classList.remove('hidden');
    el.analysisLoading.classList.remove('hidden');
    el.analysisResults.classList.add('hidden');
    
    // Simulate loading delay
    setTimeout(() => {
        el.analysisLoading.classList.add('hidden');
        el.analysisResults.classList.remove('hidden');
        
        const mockMd = generateMockAnalysis();
        STATE.rawMarkdown = mockMd;
        
        parseAndRenderReport(mockMd);
        saveAnalysisToHistory(mockMd);
        showToast('Demonstração gerada! Configure uma chave de API para análises reais.');
    }, 1500);
}

// GEMINI API DIRECT INTEGRATION
async function runGeminiAnalysis() {
    if (!STATE.imageLoaded || !STATE.apiKey) return;
    
    el.resultsArea.classList.remove('hidden');
    el.analysisLoading.classList.remove('hidden');
    el.analysisResults.classList.add('hidden');
    
    const nicheContext = STATE.niche ? `Nicho do canal: ${STATE.niche}` : 'Nicho do canal: Não especificado pelo usuário.';
    const titleContext = STATE.title ? `Título do vídeo: "${STATE.title}"` : 'Título do vídeo: Não especificado pelo usuário.';
    const hookContext = STATE.hook ? `Texto do Hook (roteiro inicial): "${STATE.hook}"` : 'Texto do Hook: Não especificado pelo usuário.';
    
    const hasHook = STATE.hook && STATE.hook.trim().length > 0;

    // Detecta perfil de nicho via keyword matching e prepara bloco
    // de calibração específica que será injetado no prompt.
    const nicheProfile = detectNicheProfile(STATE.niche);
    const nicheCalibration = nicheProfile ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CALIBRAÇÃO ESPECÍFICA PARA O NICHO: ${nicheProfile.label.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
As diretrizes abaixo PRECEDEM e AJUSTAM as regras universais. Quando houver conflito entre uma regra universal e uma diretriz deste perfil de nicho, SIGA A DIRETRIZ DO NICHO. Aplique este perfil em todos os scorecards, problemas críticos, melhorias e sugestões de título.
${nicheProfile.directives}` : '';

    if (nicheProfile) {
        showToast(`Calibrando análise para nicho: ${nicheProfile.label}`);
    }
    
    let hookDirectives = '';
    let hookScorecardFormat = '';
    let hookAnalysisFormat = '';
    let scoreExplanation = 'SCORE GERAL: Nota de 0 a 10 que reflete a performance combinada do pacote de miniatura e título (50% Thumbnail e 50% Título).';
    
    if (hasHook) {
        scoreExplanation = 'SCORE GERAL: Nota de 0 a 10 que reflete a performance combinada do pacote usando a seguinte média ponderada: 30% Thumbnail, 30% Título e 40% Hook do Roteiro.';
        
        hookDirectives = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS E DIRETRIZES DE ANÁLISE DE HOOK E RETENÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Você deve avaliar o texto do Hook fornecido de acordo com as regras de ouro para retenção de espectadores:
1. Os 4 Testes Essenciais de Validação do Hook:
   - Reafirmação da Promessa: A primeira frase ou os primeiros segundos do vídeo devem ecoar a promessa do Título e da Thumbnail sem enrolações ou palavras vazias de transição (ex: evite iniciar com "então", "basicamente", "hoje eu vou").
   - Estabelecimento de Apostas: Nos primeiros 15s, o Hook deve definir com clareza o que está em jogo (qual o ganho para quem assistir, e qual o risco ou prejuízo de ignorar o conteúdo).
   - Timestamp do Payoff Próximo: Sinalizar expressamente de forma breve quando o valor ou desfecho central prometido (payoff) será entregue ao espectador.
   - Abertura de Loop de Curiosidade: Abrir um mistério instigante na cabeça do espectador que só será solucionado no decorrer do vídeo.
2. Os 3 Microestágios Críticos:
   - 0-3 segundos: Gancho imediato de tema e estímulo visual/verbal direto.
   - 3-15 segundos: Desenvolvimento da tensão, premissa e apostas em jogo.
   - 15-30 segundos: Criação de compromisso/prova e direcionamento até o payoff.
3. Erros Críticos a Identificar e Penalizar:
   - Saudações prolixas e desnecessárias no início (ex: "Sejam bem-vindos...", "E aí pessoal...").
   - Vinhetas ou logotipos animados de entrada que façam o espectador perder os primeiros segundos cruciais.
   - Queima lenta de contexto ou repetição redundante e idêntica das palavras do título de forma desnecessária.
   - "Sequestro" de atenção sem valor de payoff real.
`;

        hookScorecardFormat = `
---

📊 SCORECARD RÁPIDO (HOOK)

| Teste Essencial | Status | Observação Rápida |
|---|---|---|
| Reafirmação da Promessa | [✅ Aprovado / ⚠️ Melhorável / ❌ Reprovado] | [Observação rápida de no máximo 60 caracteres] |
| Estabelecimento de Apostas | [✅ Aprovado / ⚠️ Melhorável / ❌ Reprovado] | [Observação rápida de no máximo 60 caracteres] |
| Timestamp do Payoff | [✅ Aprovado / ⚠️ Melhorável / ❌ Reprovado] | [Observação rápida de no máximo 60 caracteres] |
| Abertura de Loop de Curiosidade | [✅ Aprovado / ⚠️ Melhorável / ❌ Reprovado] | [Observação rápida de no máximo 60 caracteres] |
`;

        hookAnalysisFormat = `
---

🎯 ANÁLISE DE HOOK E RETENÇÃO

### Análise dos Microestágios
- **0-3s (Gancho Visual e de Tema)**: [Feedback sobre a entrada do roteiro nos primeiros segundos]
- **3-15s (Apostas e Promessa de Payoff)**: [Avaliação da tensão gerada e urgência]
- **15-30s (Compromisso e Prova)**: [Análise da construção de curiosidade e micro-prova de valor]

### Erros Comuns Identificados
- [Liste de forma concisa quaisquer erros presentes, como saudações demoradas, enrolação, redundâncias, etc. Se nenhum, indique isso de forma elogiosa.]

### Sugestão de Reescrita Otimizada
*Roteiro Atual:*
"[Trecho curto do roteiro original avaliado]"

*Roteiro Otimizado:*
"[Versão otimizada reescrita pelo modelo aplicando todos os 4 testes essenciais e sem introduções prolixas]"
`;
    }
    
    const systemPrompt = `Você é um especialista em design de thumbnails para YouTube e estrategista de CTR, com profundo conhecimento em composição visual, teoria das cores, tipografia, psicologia de títulos, roteiros/hooks de retenção e sinergia visual-verbal.
Analise a miniatura (thumbnail) enviada pelo usuário juntamente com os metadados fornecidos e retorne um diagnóstico completo de performance.

CONTEXTO ADICIONAL DO CANAL:
- ${nicheContext}
- ${titleContext}
- ${hookContext}
${hookDirectives}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS E DIRETRIZES DE ANÁLISE DO TÍTULO E SINERGIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Economia Cognitiva: Benchmarks provam que títulos curtos (até 5 palavras) possuem maior engajamento. Analise a quantidade de palavras e caracteres e identifique gorduras verbais que podem ser eliminadas.
2. Legibilidade do Título: Analise a facilidade de leitura baseando-se no conceito adaptado de Flesch. Avalie o uso de palavras longas/raras e a formalidade da linguagem.
3. Uso de Números: Títulos com números recebem em média ~11% menos views por diminuir o mistério, embora adicionem estrutura. Avalie se o número serve ao gancho ou apenas organiza o conteúdo.
4. Valência Emocional (Negativo vs Positivo): Enquadramentos negativos sinalizam urgência e geram cerca de 22% mais views que enquadramentos positivos devido à aversão à perda.
5. Sinergia (Thumbnail + Título): Avalie complementaridade (thumbnail mostra o que o título sugere; título nomeia o conflito visual da thumbnail) vs redundância (se dizem a mesma coisa de forma desperdiçada).
6. Hierarquia de Informação: A thumbnail deve comunicar o "universo" (contexto visual) e o título deve comunicar o "conflito/promessa" (o que está em jogo).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SISTEMA DE PONTUAÇÃO DOS SCORECARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. SCORECARD DA THUMBNAIL: Avalie cada um dos 18 critérios específicos com Status (✅ Aprovado, ⚠️ Melhorável ou ❌ Reprovado).
2. SCORECARD DO TÍTULO: Pontue de 0 a 10 cada dimensão de títulos e sinergia, com uma observação rápida (máximo 60 caracteres).
${hasHook ? '3. SCORECARD DO HOOK: Avalie os 4 testes essenciais com Status (✅ Aprovado, ⚠️ Melhorável ou ❌ Reprovado) e observação rápida.' : ''}
${scoreExplanation}
${nicheCalibration}
FORMATO DE RESPOSTA OBRIGATÓRIO (SIGA À RISCA, EXATAMENTE ESSA ORDEM E ESSES MARCADORES DE SEÇÃO):

---

🖼️ ANÁLISE DE THUMBNAIL — DIAGNÓSTICO COMPLETO

**PONTUAÇÃO GERAL: [SCORE_GERAL]/10**

---

📊 SCORECARD RÁPIDO (THUMBNAIL)

| Pilar | Critério | Status |
|---|---|---|
| Composição | Regra dos terços | [✅ Aprovado / ⚠️ Melhorável / ❌ Reprovado] |
| Composição | Espaço negativo | [✅ Aprovado / ⚠️ Melhorável / ❌ Reprovado] |
| Composição | Zonas de perigo | [✅ Aprovado / ⚠️ Melhorável / ❌ Reprovado] |
| Composição | Profundidade/camadas | [✅ Aprovado / ⚠️ Melhorável / ❌ Reprovado] |
| Composição | Direção do olhar | [✅ Aprovado / ⚠️ Melhorável / ❌ Reprovado] |
| Composição | Fluxo em Z | [✅ Aprovado / ⚠️ Melhorável / ❌ Reprovado] |
| Cores | Contraste texto/fundo | [✅ Aprovado / ⚠️ Melhorável / ❌ Reprovado] |
| Cores | Par de cores | [✅ Aprovado / ⚠️ Melhorável / ❌ Reprovado] |
| Cores | Sobrevivência mobile | [✅ Aprovado / ⚠️ Melhorável / ❌ Reprovado] |
| Cores | Psicologia/nicho | [✅ Aprovado / ⚠️ Melhorável / ❌ Reprovado] |
| Cores | Tratamento do fundo | [✅ Aprovado / ⚠️ Melhorável / ❌ Reprovado] |
| Tipografia | Escolha da fonte | [✅ Aprovado / ⚠️ Melhorável / ❌ Reprovado] |
| Tipografia | Quantidade de fontes | [✅ Aprovado / ⚠️ Melhorável / ❌ Reprovado] |
| Tipografia | Tamanho do texto | [✅ Aprovado / ⚠️ Melhorável / ❌ Reprovado] |
| Tipografia | Posicionamento | [✅ Aprovado / ⚠️ Melhorável / ❌ Reprovado] |
| Tipografia | Tratamento de contraste | [✅ Aprovado / ⚠️ Melhorável / ❌ Reprovado] |
| Tipografia | Complementaridade | [✅ Aprovado / ⚠️ Melhorável / ❌ Reprovado] |
| Global | Teste mobile 160px | [✅ Aprovado / ⚠️ Melhorável / ❌ Reprovado] |

---

📊 SCORECARD RÁPIDO (TÍTULO)

| Dimensão | Pontuação | Observação Rápida |
|---|---|---|
| Comprimento do Título | [Nota]/10 | [Observação rápida] |
| Legibilidade do Título | [Nota]/10 | [Observação rápida] |
| Força Emocional do Título | [Nota]/10 | [Observação rápida] |
| Valência (Negativo/Positivo) | [Nota]/10 | [Observação rápida] |
| Sinergia Thumb + Título | [Nota]/10 | [Observação rápida] |
${hookScorecardFormat}
---

🔴 PROBLEMAS CRÍTICOS
(Apenas itens com pontuação inferior a 6.0 ou problemas visuais sérios. Se não houver nenhum, liste "Nenhum problema crítico detectado.")

**[NOME DO PROBLEMA]**
- O que está errado: [descrição objetiva com localização no frame]
- Por que prejudica o CTR: [impacto direto e mensurável]
- Como corrigir: [instrução específica e imediatamente acionável]

---

🟡 MELHORIAS RECOMENDADAS
(Itens de melhorias secundárias. Se não houver nenhum, liste "Nenhuma melhoria necessária.")

**[NOME DA MELHORIA]**
- Situação atual: [o que foi observado]
- Oportunidade: [o que pode ser melhorado e como]

---

🟢 PONTOS FORTES
(Máximo 3 pontos fortes mais relevantes do conjunto)

- [Ponto forte 1]
- [Ponto forte 2]
- [Ponto forte 3]

---

💡 PRIORIDADE DE AÇÃO
1. [Ação mais urgente]
2. [Segunda ação]
3. [Terceira ação]

---

📝 ANÁLISE DE TÍTULO E SINERGIA

### Análise de Título
- **Comprimento e Economia Cognitiva**: [Análise das palavras, contagem de caracteres e atrito cognitivo]
- **Legibilidade (Flesch adaptado)**: [Nível de acessibilidade, se soa falado ou formal demais]
- **Uso de Números**: [Avaliação de números, gancho ou diminuição da curiosidade]
- **Valência Emocional (Negativo vs Positivo)**: [Avaliação da valência e o potencial gancho de perda]
- **Tom Emocional Dominante**: [Alegria, raiva, controvérsia ou neutro]
- **Lacuna de Curiosidade**: [Análise de mistério e a pergunta implícita]

### Análise de Sinergia
- **Complementaridade vs Redundância**: [O quanto a thumb e o título trabalham juntos sem repetir as mesmas palavras]
- **Alinhamento Emocional**: [Consistência do sentimento expressado na imagem e na escrita]
- **Consistência de Promessa**: [Se o pacote forma uma expectativa honesta com o conteúdo do nicho]
- **Hierarquia de Informação**: [Identificar o Universo na thumbnail e o Conflito no título]
${hookAnalysisFormat}
---

✏️ SUGESTÕES DE TÍTULOS ALTERNATIVOS
(Sugira 3 títulos alternativos aplicando as regras e mantendo o contexto. Use exatamente esse formato de subitens)

- **Versão Curta/Curiosidade**: "[Sugestão 1]"
  - Contagem: [X] palavras, [Y] caracteres
  - Emoção dominante: [Emoção]
- **Versão Emocional Negativa**: "[Sugestão 2]"
  - Contagem: [X] palavras, [Y] caracteres
  - Emoção dominante: [Emoção]
- **Versão Humor/Controvérsia**: "[Sugestão 3]"
  - Contagem: [X] palavras, [Y] caracteres
  - Emoção dominante: [Emoção]

---

🖼️ SUGESTÕES DE AJUSTE NA THUMBNAIL
(Forneça de 2 a 4 sugestões acionáveis de melhoria na thumbnail)

- **[Ajuste 1]**: [Ação específica]
- **[Ajuste 2]**: [Ação específica]

---

⚡ RECOMENDAÇÃO DE COMBO DE SINERGIA
[Forneça de 2 a 3 linhas explicando qual título alternativo sugerido combinado com qual ajuste de thumbnail formará o combo ideal de CTR e o porquê.]

---

🔍 VEREDICTO FINAL
[Uma frase direta resumindo a eficácia de conversão do conjunto atual.]

---`;

    const modelsToTry = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'];
    let lastError = null;
    
    for (const model of modelsToTry) {
        try {
            console.log(`Tentando análise com o modelo: ${model}`);
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${STATE.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: systemPrompt },
                            {
                                inlineData: {
                                    mimeType: STATE.imageMimeType,
                                    data: STATE.imageDataBase64
                                }
                            }
                        ]
                    }]
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || `Erro HTTP ${response.status}`);
            }

            const data = await response.json();
            const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!textResult) {
                throw new Error('O Gemini retornou uma resposta vazia.');
            }

            STATE.rawMarkdown = textResult;
            
            el.analysisLoading.classList.add('hidden');
            el.analysisResults.classList.remove('hidden');
            
            parseAndRenderReport(textResult);
            saveAnalysisToHistory(textResult);
            
            if (model !== 'gemini-3.5-flash') {
                showToast(`Análise concluída via fallback (${model})!`);
            } else {
                showToast('Diagnóstico concluído com sucesso!');
            }
            return; // Success, exit function

        } catch (error) {
            console.warn(`Erro no modelo ${model}:`, error.message);
            lastError = error;
            
            if (model === modelsToTry[modelsToTry.length - 1]) {
                break; // Last model failed
            }
            
            showToast(`${model} indisponível. Tentando ${modelsToTry[1]}...`);
            await new Promise(resolve => setTimeout(resolve, 800)); // Short delay before retry
        }
    }
    
    // If we reach here, all models failed
    console.error('Gemini Analysis Error (All models failed):', lastError);
    el.analysisLoading.classList.add('hidden');
    resetApp();
    showToast(`Erro na análise: ${lastError.message}`);
}

// MARKDOWN REPORT PARSER & RENDERER
function parseAndRenderReport(mdText) {
    // 1. Fill raw markdown text tab
    el.markdownRawOutput.value = mdText;
    
    // 2. Extract Score
    let score = '0.0';
    const scoreRegex = /\*\*PONTUAÇÃO GERAL:\s*([0-9.]+)\/10\*\*/i;
    const scoreMatch = mdText.match(scoreRegex);
    if (scoreMatch && scoreMatch[1]) {
        score = parseFloat(scoreMatch[1]).toFixed(1);
    }
    el.txtScore.innerText = score;
    
    // Animate Score Ring Progress (Radius=70, Circumference = 2 * Math.PI * 70 = 439.82 => ~440)
    const circumference = 440;
    const offset = circumference - (parseFloat(score) / 10) * circumference;
    el.scoreProgress.style.strokeDashoffset = offset;
    
    // Adjust score color dynamically
    const scoreNum = parseFloat(score);
    if (scoreNum >= 8.0) {
        el.scoreProgress.style.stroke = 'var(--color-success)';
    } else if (scoreNum >= 5.0) {
        el.scoreProgress.style.stroke = 'var(--color-warning)';
    } else {
        el.scoreProgress.style.stroke = 'var(--color-danger)';
    }

    // 3. Extract sections by slicing the text
    const sections = {
        scorecardThumb: '',
        scorecardTitle: '',
        scorecardHook: '',
        critical: '',
        improvements: '',
        strengths: '',
        priorities: '',
        titleSynergy: '',
        hookAnalysis: '',
        titleSuggestions: '',
        thumbSuggestions: '',
        combo: '',
        verdict: ''
    };
    
    const sectionsHeaders = [
        { key: 'scorecardThumb', phrase: '📊 SCORECARD RÁPIDO (THUMBNAIL)' },
        { key: 'scorecardTitle', phrase: '📊 SCORECARD RÁPIDO (TÍTULO)' },
        { key: 'scorecardHook', phrase: '📊 SCORECARD RÁPIDO (HOOK)' },
        { key: 'critical', phrase: '🔴 PROBLEMAS CRÍTICOS' },
        { key: 'improvements', phrase: '🟡 MELHORIAS RECOMENDADAS' },
        { key: 'strengths', phrase: '🟢 PONTOS FORTES' },
        { key: 'priorities', phrase: '💡 PRIORIDADE DE AÇÃO' },
        { key: 'titleSynergy', phrase: '📝 ANÁLISE DE TÍTULO E SINERGIA' },
        { key: 'hookAnalysis', phrase: '🎯 ANÁLISE DE HOOK E RETENÇÃO' },
        { key: 'titleSuggestions', phrase: '✏️ SUGESTÕES DE TÍTULOS ALTERNATIVOS' },
        { key: 'thumbSuggestions', phrase: '🖼️ SUGESTÕES DE AJUSTE NA THUMBNAIL' },
        { key: 'combo', phrase: '⚡ RECOMENDAÇÃO DE COMBO DE SINERGIA' },
        { key: 'verdict', phrase: '🔍 VEREDICTO FINAL' }
    ];
    
    for (let i = 0; i < sectionsHeaders.length; i++) {
        const header = sectionsHeaders[i];
        const index = mdText.indexOf(header.phrase);
        if (index !== -1) {
            const start = index + header.phrase.length;
            let end = mdText.length;
            
            // Find start of next section
            for (let j = i + 1; j < sectionsHeaders.length; j++) {
                const nextIndex = mdText.indexOf(sectionsHeaders[j].phrase);
                if (nextIndex !== -1 && nextIndex > index) {
                    end = nextIndex;
                    break;
                }
            }
            sections[header.key] = mdText.substring(start, end).trim();
        }
    }
    
    // Render scorecard tables
    renderScorecardTable(sections.scorecardThumb, el.scorecardThumbBody, 'thumb');
    renderScorecardTable(sections.scorecardTitle, el.scorecardTitleBody, 'title');
    
    // Render hook scorecard if present
    if (sections.scorecardHook && sections.scorecardHook.trim()) {
        el.cardScorecardHook.classList.remove('hidden');
        renderScorecardTable(sections.scorecardHook, el.scorecardHookBody, 'hook');
    } else {
        el.cardScorecardHook.classList.add('hidden');
    }

    // Render critical issues
    renderDetailedItems(sections.critical, el.criticalIssuesList, el.cardCriticalIssues, 'danger-zone');
    
    // Render improvements
    renderDetailedItems(sections.improvements, el.improvementsList, el.cardImprovements, 'warning-zone');
    
    // Render strengths
    renderStrengths(sections.strengths, el.strengthsList, el.cardStrengths);
    
    // Render priorities
    renderPriorities(sections.priorities, el.prioritiesList, el.cardPriorities);
    
    // Render new Title, Synergy, Suggestions and Combo sections
    renderTitleSynergy(sections.titleSynergy);
    
    // Render hook detailed analysis if present
    if (sections.hookAnalysis && sections.hookAnalysis.trim()) {
        el.cardHookAnalysis.classList.remove('hidden');
        el.hookAnalysisContent.innerHTML = formatMarkdownToHtml(sections.hookAnalysis);
    } else {
        el.cardHookAnalysis.classList.add('hidden');
    }
    
    renderTitleSuggestions(sections.titleSuggestions);
    renderThumbSuggestions(sections.thumbSuggestions);
    renderComboRecommendation(sections.combo);
    
    // Render Verdict
    let verdictText = 'Análise concluída com sucesso.';
    if (sections.verdict) {
        // Clean verdict text (remove any trailing markdown divider lines)
        verdictText = sections.verdict.replace(/---/g, '').trim();
    }
    el.txtVerdict.innerText = verdictText;
}

// SCORECARD PARSER (FLEXIBLE FOR THUMBNAIL STATUS, TITLE SCORES AND HOOK STATUS)
function renderScorecardTable(scorecardMd, targetBodyEl, tableType) {
    if (!targetBodyEl) return;
    targetBodyEl.innerHTML = '';
    
    if (!scorecardMd) {
        targetBodyEl.innerHTML = '<tr><td colspan="3" class="text-center">Tabela indisponível</td></tr>';
        return;
    }
    
    const lines = scorecardMd.split('\n');
    let rowsRendered = 0;
    
    lines.forEach(line => {
        if (!line.includes('|') || line.includes('---|')) return;
        
        const cols = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
        if (cols.length >= 3) {
            // Skip headers
            if (cols[0].toUpperCase() === 'PILAR' || cols[0].toUpperCase() === 'DIMENSÃO' || cols[0].toUpperCase() === 'TESTE ESSENCIAL') return;
            
            const col1 = cols[0];
            const col2 = cols[1];
            const col3 = cols[2];
            
            const tr = document.createElement('tr');
            
            if (tableType === 'thumb') {
                // columns: Pilar | Critério | Status
                let statusClass = 'nao-aplicavel';
                let statusText = 'N/A';
                
                if (col3.includes('✅') || col3.toUpperCase().includes('APROVADO')) {
                    statusClass = 'aprovado';
                    statusText = 'Aprovado';
                } else if (col3.includes('⚠️') || col3.toUpperCase().includes('MELHORÁVEL') || col3.toUpperCase().includes('MELHORAVEL')) {
                    statusClass = 'melhoravel';
                    statusText = 'Melhorável';
                } else if (col3.includes('❌') || col3.toUpperCase().includes('REPROVADO')) {
                    statusClass = 'reprovado';
                    statusText = 'Reprovado';
                }
                
                tr.innerHTML = `
                    <td><strong>${col1}</strong></td>
                    <td>${col2}</td>
                    <td class="text-center">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </td>
                `;
            } else if (tableType === 'title') {
                // columns: Dimensão | Pontuação | Observação Rápida
                let scoreVal = parseFloat(col2.split('/')[0]);
                let statusClass = 'nao-aplicavel';
                if (!isNaN(scoreVal)) {
                    if (scoreVal >= 8.0) statusClass = 'aprovado';
                    else if (scoreVal >= 5.0) statusClass = 'melhoravel';
                    else statusClass = 'reprovado';
                }
                
                tr.innerHTML = `
                    <td><strong>${col1}</strong></td>
                    <td class="text-center">
                        <span class="status-badge ${statusClass}">${col2}</span>
                    </td>
                    <td>${col3}</td>
                `;
            } else if (tableType === 'hook') {
                // columns: Teste Essencial | Status | Observação Rápida
                let statusClass = 'nao-aplicavel';
                let statusText = 'N/A';
                
                if (col2.includes('✅') || col2.toUpperCase().includes('APROVADO')) {
                    statusClass = 'aprovado';
                    statusText = 'Aprovado';
                } else if (col2.includes('⚠️') || col2.toUpperCase().includes('MELHORÁVEL') || col2.toUpperCase().includes('MELHORAVEL')) {
                    statusClass = 'melhoravel';
                    statusText = 'Melhorável';
                } else if (col2.includes('❌') || col2.toUpperCase().includes('REPROVADO')) {
                    statusClass = 'reprovado';
                    statusText = 'Reprovado';
                }
                
                tr.innerHTML = `
                    <td><strong>${col1}</strong></td>
                    <td class="text-center">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </td>
                    <td>${col3}</td>
                `;
            }
            targetBodyEl.appendChild(tr);
            rowsRendered++;
        }
    });
    
    if (rowsRendered === 0) {
        targetBodyEl.innerHTML = '<tr><td colspan="3" class="text-center">Nenhum critério parseado</td></tr>';
    }
}


// HELPER TO CONVERT BASIC MARKDOWN TO HTML
function formatMarkdownToHtml(mdText) {
    if (!mdText) return '';
    let html = mdText
        // Replace bold **text**
        .replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>')
        // Replace subheadings ### text
        .replace(/###\s*(.*)/g, '<h4>$1</h4>')
        // Replace bold list items like - **text**:
        .replace(/^- \*\*([^\*]+)\*\*:(.*)/gm, '<li><strong>$1</strong>:$2</li>')
        // Replace list items - text
        .replace(/^- \s*(.*)/gm, '<li>$1</li>')
        // Replace line breaks
        .replace(/\n/g, '<br>');
    
    // Wrap list items in <ul>
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    return html;
}

// TITLE & SYNERGY RENDERER
function renderTitleSynergy(mdText) {
    if (!mdText) {
        el.cardTitleSynergy.classList.add('hidden');
        return;
    }
    el.cardTitleSynergy.classList.remove('hidden');
    el.titleSynergyContent.innerHTML = formatMarkdownToHtml(mdText);
}

// TITLE SUGGESTIONS RENDERER
function renderTitleSuggestions(mdText) {
    if (!mdText) {
        el.cardTitleSuggestions.classList.add('hidden');
        return;
    }
    el.cardTitleSuggestions.classList.remove('hidden');
    el.titleSuggestionsList.innerHTML = '';
    
    const lines = mdText.split('\n');
    let currentItem = null;
    
    lines.forEach(line => {
        const cleanLine = line.trim();
        if (!cleanLine) return;
        
        // Match main type and title, e.g. - **Versão Curta/Curiosidade**: "Segredo!"
        const mainMatch = cleanLine.match(/^- \*\*([^\*]+)\*\*:\s*["'«“]([^"»”]+)["'»“]/);
        if (mainMatch) {
            if (currentItem) {
                renderSuggestionCard(currentItem);
            }
            currentItem = {
                tag: mainMatch[1],
                title: mainMatch[2],
                words: '',
                chars: '',
                emotion: ''
            };
            return;
        }
        
        if (currentItem) {
            // Match meta count: - Contagem: 4 palavras, 25 caracteres
            const countMatch = cleanLine.match(/Contagem:\s*(\d+)\s*palavras,\s*(\d+)\s*carac/i) || 
                               cleanLine.match(/(\d+)\s*palavras,\s*(\d+)\s*carac/i);
            if (countMatch) {
                currentItem.words = countMatch[1];
                currentItem.chars = countMatch[2];
            }
            
            // Match emotion: - Emoção dominante: Medo
            const emotionMatch = cleanLine.match(/emoo\s*dominante:\s*(.*)/i) || 
                                 cleanLine.match(/emoo:\s*(.*)/i) ||
                                 cleanLine.match(/emo[çc]o\s*dominante:\s*(.*)/i);
            if (emotionMatch) {
                currentItem.emotion = emotionMatch[1].replace(/[\*\-]/g, '').trim();
            }
        }
    });
    
    if (currentItem) {
        renderSuggestionCard(currentItem);
    }
    
    function renderSuggestionCard(item) {
        const div = document.createElement('div');
        div.className = 'alternative-title-item';
        div.innerHTML = `
            <div class="alternative-title-header">
                <span class="alternative-title-tag">${item.tag}</span>
            </div>
            <div class="alternative-title-text" onclick="navigator.clipboard.writeText('${item.title.replace(/'/g, "\\'")}')" title="Clique para copiar o título">
                "${item.title}"
            </div>
            <div class="alternative-title-meta">
                <span class="title-meta-badge">${item.words || '?'} palavras</span>
                <span class="title-meta-badge">${item.chars || '?'} caracteres</span>
                <span class="title-meta-badge emotion">${item.emotion || 'Neutra'}</span>
            </div>
        `;
        el.titleSuggestionsList.appendChild(div);
    }
}

// THUMBNAIL SUGGESTIONS RENDERER
function renderThumbSuggestions(mdText) {
    if (!mdText) {
        el.cardThumbSuggestions.classList.add('hidden');
        return;
    }
    el.cardThumbSuggestions.classList.remove('hidden');
    el.thumbSuggestionsList.innerHTML = '';
    
    const lines = mdText.split('\n');
    const ul = document.createElement('ul');
    ul.className = 'markdown-content';
    
    lines.forEach(line => {
        const clean = line.replace(/^- \s*/, '').trim();
        if (!clean || clean.startsWith('---')) return;
        
        const li = document.createElement('li');
        li.innerHTML = clean.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
        ul.appendChild(li);
    });
    
    el.thumbSuggestionsList.appendChild(ul);
}

// COMBO RECOMMENDATION RENDERER
function renderComboRecommendation(mdText) {
    if (!mdText) {
        el.cardComboRecommendation.classList.add('hidden');
        return;
    }
    el.cardComboRecommendation.classList.remove('hidden');
    
    const cleanText = mdText.replace(/^- \s*/, '').replace(/---/g, '').trim();
    el.comboRecommendationContent.innerHTML = `
        <div class="combo-highlight-box">
            ${cleanText.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>')}
        </div>
    `;
}

// DETAILED CARD ITEMS PARSER (CRITICAL ISSUES / IMPROVEMENTS)
function renderDetailedItems(mdText, listEl, cardEl, themeClass) {
    listEl.innerHTML = '';
    
    if (!mdText || mdText.includes('Nenhum problema crítico') || mdText.includes('Nenhuma melhoria')) {
        cardEl.classList.add('hidden');
        return;
    }
    
    cardEl.classList.remove('hidden');
    
    // Split by titles marked in **[...]** or similar
    const blocks = mdText.split(/\*\*\[/);
    
    let itemsRendered = 0;
    
    blocks.forEach(block => {
        if (!block.trim()) return;
        
        // Re-add leading bracket to match title extraction
        const fullBlock = block.startsWith('[') ? block : '[' + block;
        
        const titleMatch = fullBlock.match(/^\[([^\]]+)\]/);
        if (!titleMatch) return;
        
        const title = titleMatch[1];
        const content = fullBlock.substring(titleMatch[0].length).trim();
        
        // Split bullet points
        const lines = content.split('\n');
        let errDesc = '';
        let whyDesc = '';
        let howDesc = '';
        
        lines.forEach(line => {
            const cleanLine = line.replace(/^-\s*/, '').trim();
            if (line.toLowerCase().includes('o que está errado:') || line.toLowerCase().includes('situação atual:')) {
                errDesc = cleanLine.substring(cleanLine.indexOf(':') + 1).trim();
            } else if (line.toLowerCase().includes('por que prejudica o ctr:') || line.toLowerCase().includes('oportunidade:')) {
                whyDesc = cleanLine.substring(cleanLine.indexOf(':') + 1).trim();
            } else if (line.toLowerCase().includes('como corrigir:') || line.toLowerCase().includes('como:')) {
                howDesc = cleanLine.substring(cleanLine.indexOf(':') + 1).trim();
            }
        });
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'issue-item';
        
        // Determine label names based on whether it is critical (error) or recommendation (opportunity)
        const isError = themeClass === 'danger-zone';
        const labelErr = isError ? 'O que está errado' : 'Situação atual';
        const labelWhy = isError ? 'Impacto no CTR' : 'Oportunidade';
        const labelHow = isError ? 'Como corrigir' : 'Recomendação';
        
        itemDiv.innerHTML = `
            <div class="issue-title color-${isError ? 'danger' : 'warning'}">
                <i data-lucide="${isError ? 'alert-octagon' : 'alert-triangle'}"></i> ${title}
            </div>
            ${errDesc ? `<p><span class="issue-label">${labelErr}:</span> ${errDesc}</p>` : ''}
            ${whyDesc ? `<p><span class="issue-label">${labelWhy}:</span> ${whyDesc}</p>` : ''}
            ${howDesc ? `<p><span class="issue-label">${labelHow}:</span> ${howDesc}</p>` : ''}
        `;
        listEl.appendChild(itemDiv);
        itemsRendered++;
    });
    
    if (itemsRendered === 0) {
        // Fallback: render raw section text if parse fails
        listEl.innerHTML = `<div class="issue-item"><p>${mdText.replace(/\n/g, '<br>')}</p></div>`;
    }
    
    lucide.createIcons();
}

// STRENGTHS PARSER
function renderStrengths(mdText, listEl, cardEl) {
    listEl.innerHTML = '';
    
    if (!mdText) {
        cardEl.classList.add('hidden');
        return;
    }
    
    cardEl.classList.remove('hidden');
    
    const lines = mdText.split('\n');
    let itemsRendered = 0;
    
    lines.forEach(line => {
        const clean = line.replace(/^-\s*/, '').trim();
        if (!clean || clean.startsWith('---')) return;
        
        const li = document.createElement('div');
        li.className = 'issue-item';
        
        // Extract bold title if exists
        const titleMatch = clean.match(/^\*\*([^*]+)\*\*(.*)/);
        if (titleMatch) {
            li.innerHTML = `
                <div class="issue-title color-success"><i data-lucide="check"></i> ${titleMatch[1]}</div>
                <p>${titleMatch[2].trim()}</p>
            `;
        } else {
            li.innerHTML = `
                <div class="issue-title color-success"><i data-lucide="check"></i> Força Visual</div>
                <p>${clean}</p>
            `;
        }
        
        listEl.appendChild(li);
        itemsRendered++;
    });
    
    if (itemsRendered === 0) {
        cardEl.classList.add('hidden');
    }
    
    lucide.createIcons();
}

// PRIORITIES PARSER
function renderPriorities(mdText, listEl, cardEl) {
    listEl.innerHTML = '';
    
    if (!mdText) {
        cardEl.classList.add('hidden');
        return;
    }
    
    cardEl.classList.remove('hidden');
    
    const lines = mdText.split('\n');
    let index = 1;
    
    lines.forEach(line => {
        // Clean line numbers
        const clean = line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim();
        if (!clean || clean.startsWith('---')) return;
        
        const item = document.createElement('div');
        item.className = 'priority-timeline-item';
        item.innerHTML = `
            <div class="priority-number">${index}</div>
            <div class="priority-text">${clean}</div>
        `;
        listEl.appendChild(item);
        index++;
    });
    
    if (index === 1) {
        cardEl.classList.add('hidden');
    }
}

// ==========================================
// HISTÓRICO DE ANÁLISES (LOCALSTORAGE)
// ==========================================

// COMPRESS IMAGE TO JPEG (MAX WIDTH 320PX) FOR LOCALSTORAGE
function compressImage(base64Str, mimeType, callback) {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 320;
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress as image/jpeg, quality 0.7
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        callback(compressedBase64);
    };
    img.onerror = () => {
        callback(base64Str); // Fallback to original if load fails
    };
    img.src = base64Str;
}

// SAVE TO HISTORY
function saveAnalysisToHistory(rawData) {
    compressImage(STATE.imageSrc, STATE.imageMimeType, (compressedImageSrc) => {
        const historyItem = {
            id: 'hist_' + Date.now(),
            date: new Date().toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            title: STATE.title || 'Sem Título',
            niche: STATE.niche || 'Geral',
            imageSrc: compressedImageSrc,
            imageMimeType: 'image/jpeg',
            rawMarkdown: rawData,
            hook: STATE.hook || ''
        };
        
        let history = JSON.parse(localStorage.getItem('thumbaudit_history') || '[]');
        history.unshift(historyItem);
        
        // Limitar a 20 itens
        if (history.length > 20) {
            history.pop();
        }
        
        localStorage.setItem('thumbaudit_history', JSON.stringify(history));
        renderHistoryList();
    });
}

// RENDER HISTORY LIST
function renderHistoryList() {
    const history = JSON.parse(localStorage.getItem('thumbaudit_history') || '[]');
    
    // Só exibe se a imagem não estiver carregada e existirem itens
    if (!STATE.imageLoaded && history.length > 0) {
        el.historyContainer.classList.remove('hidden');
        
        el.historyList.innerHTML = history.map(item => {
            // Encontrar nota no markdown
            let score = '0.0';
            const scoreRegex = /\*\*PONTUAÇÃO GERAL:\s*([0-9.]+)\/10\*\*/i;
            const scoreMatch = item.rawMarkdown.match(scoreRegex);
            if (scoreMatch && scoreMatch[1]) {
                score = parseFloat(scoreMatch[1]).toFixed(1);
            }
            
            const scoreNum = parseFloat(score);
            let scoreClass = 'score-yellow';
            if (scoreNum >= 8.0) scoreClass = 'score-green';
            else if (scoreNum < 5.0) scoreClass = 'score-red';
            
            return `
                <div class="history-card" onclick="loadHistoryItem('${item.id}')">
                    <div class="history-card-img-wrapper">
                        <img src="${item.imageSrc}" alt="Thumbnail preview">
                        <div class="history-card-score ${scoreClass}">
                            <i data-lucide="award" style="width:14px;height:14px;"></i> ${score}/10
                        </div>
                        <button class="history-card-delete-btn" onclick="deleteHistoryItem('${item.id}', event)" title="Excluir do histórico">
                            <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                        </button>
                    </div>
                    <div class="history-card-info">
                        <h4 class="history-card-title" title="${item.title || 'Sem Título'}">${item.title || 'Sem Título'}</h4>
                        <div class="history-card-meta">
                            <span class="history-card-niche" title="${item.niche || 'Geral'}">${item.niche || 'Geral'}</span>
                            <span class="history-card-date">${item.date}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        lucide.createIcons();
    } else {
        el.historyContainer.classList.add('hidden');
        el.historyList.innerHTML = '';
    }
}

// LOAD HISTORY ITEM
function loadHistoryItem(id) {
    let history = JSON.parse(localStorage.getItem('thumbaudit_history') || '[]');
    const item = history.find(h => h.id === id);
    if (!item) return;
    
    STATE.imageSrc = item.imageSrc;
    STATE.imageMimeType = item.imageMimeType;
    STATE.imageDataBase64 = item.imageSrc.split(',')[1];
    STATE.imageLoaded = true;
    STATE.title = item.title;
    STATE.niche = item.niche;
    STATE.hook = item.hook || '';
    STATE.rawMarkdown = item.rawMarkdown;
    
    // Sincronizar inputs
    el.inputNicho.value = item.niche === 'Geral' ? '' : item.niche;
    el.inputTitulo.value = item.title === 'Sem Título' ? '' : item.title;
    el.inputHook.value = item.hook || '';
    el.simChannelNiche.innerText = item.niche;
    el.simVideoTitle.innerText = item.title;
    
    // Setar previews de imagem
    el.imagePreview.src = item.imageSrc;
    el.imagePreviewMicro.src = item.imageSrc;
    el.imagePreviewFeed.src = item.imageSrc;
    
    // Mostrar resultados
    el.resultsArea.classList.remove('hidden');
    el.analysisResults.classList.remove('hidden');
    
    parseAndRenderReport(item.rawMarkdown);
    updateUIForState();
    
    // Rolar a página suavemente até o dashboard
    el.resultsArea.scrollIntoView({ behavior: 'smooth' });
    
    showToast('Análise histórica carregada!');
}

// DELETE SINGLE ITEM
function deleteHistoryItem(id, event) {
    if (event) {
        event.stopPropagation(); // Evita carregar o item ao clicar na lixeira
    }
    
    let history = JSON.parse(localStorage.getItem('thumbaudit_history') || '[]');
    history = history.filter(h => h.id !== id);
    localStorage.setItem('thumbaudit_history', JSON.stringify(history));
    
    renderHistoryList();
    showToast('Análise removida do histórico.');
}

// CLEAR ALL HISTORY
function clearHistory() {
    if (confirm('Tem certeza de que deseja limpar todo o histórico de análises? Esta ação não pode ser desfeita.')) {
        localStorage.removeItem('thumbaudit_history');
        renderHistoryList();
        showToast('Histórico limpo com sucesso.');
    }
}

// Expor funções para uso em escopo global (inline HTML onclick)
window.loadHistoryItem = loadHistoryItem;
window.deleteHistoryItem = deleteHistoryItem;
