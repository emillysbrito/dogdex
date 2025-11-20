let cardContainer = document.querySelector(".card-container");
let paginationContainer = document.querySelector(".pagination-container");
let inputBusca = document.querySelector("input");
let filtroBtn = document.getElementById("filtro-btn");
let filterPanel = document.getElementById("filter-panel");
let dados = [];
let dadosAtuais = [];

const totalSegmentosEnergia = 5;

const mapaEnergia = {
    "Baixo": 1,
    "Médio-Baixo": 2,
    "Médio": 3,
    "Médio-Alto": 4,
    "Alto": 5,
    "Muito Alto": 5
};

function criarHtmlSegmentos(nivelEnergia) {
    const segmentosAtivos = mapaEnergia[nivelEnergia] || 0;
    let htmlSegmentos = '';
    for (let i = 1; i <= totalSegmentosEnergia; i++) {
        const status = (i <= segmentosAtivos) ? 'active' : 'inactive';
        htmlSegmentos += `<span class="segment ${status}"></span>`;
    }
    return htmlSegmentos;
}

function criarHtmlNivelEnergia(dado) {
    const segmentos = criarHtmlSegmentos(dado.nivel_energia);
    return `
        <div class="stat-item">
            <div class="stat-info">
                <span class="stat-label"><i class="fa-solid fa-bolt"></i> Nível de Energia</span>
                <div class="stat-bar">${segmentos}</div>
            </div>
            <div class="stat-value">
                <span class="text-value">${dado.nivel_energia}</span>
            </div>
        </div>
    `;
}

let paginaAtual = 1;
const cardsPorPagina = 8;

async function carregarDados() {
    try {
        const resposta = await fetch("data.json");
        dados = await resposta.json();
        popularFiltros();
        renderizarCards(dados);

        configurarPainelFiltro();
    } catch (error) {
        console.error("Erro ao carregar os dados:", error);
    }
}

function configurarPainelFiltro() {
    filtroBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        filterPanel.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
        if (!filterPanel.contains(e.target) && !filtroBtn.contains(e.target)) {
            filterPanel.classList.remove("show");
        }
    });
}

function popularFiltros() {
     filterPanel.innerHTML = ''; // Limpa o painel

    const contentDiv = document.createElement('div');
    contentDiv.className = 'filter-panel-content';

    const criarGrupoFiltro = (titulo, categoria, valores) => {
        const groupDiv = document.createElement("div");
        groupDiv.className = "filter-group";
        groupDiv.innerHTML = `<div class="filter-group-title">${titulo}</div>`;

        valores.forEach(valor => {
            const optionDiv = document.createElement("div");
            optionDiv.className = "filter-option";
            const id = `${categoria}-${valor.replace(/\s+/g, '-')}`;
            optionDiv.innerHTML = `
                <label for="${id}">
                    <input type="checkbox" id="${id}" name="${categoria}" value="${valor}">
                    ${valor}
                </label>
            `;
            optionDiv.querySelector("input").addEventListener("change", iniciarBusca);
            groupDiv.appendChild(optionDiv);
        });
        contentDiv.appendChild(groupDiv);
    };

    filterPanel.appendChild(contentDiv);

    // 1. Porte
    const portes = [...new Set(dados.map(d => d.porte))].sort();
    criarGrupoFiltro("Porte", "porte", portes);
    // 2. Nível de Energia (sem "Médio-Baixo" e "Médio-Alto")
    const niveisEnergia = Object.keys(mapaEnergia).filter(nivel => nivel !== "Médio-Baixo" && nivel !== "Médio-Alto");
    criarGrupoFiltro("Nível de Energia", "energia", niveisEnergia);
    // 3. Grupo FCI
    const grupos = [...new Set(dados.map(d => d.grupo.split(' ')[0]))].sort((a, b) => a - b);
    criarGrupoFiltro("Grupo FCI", "grupo", grupos.map(g => `Grupo ${g}`));
    // Botão de Limpar
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "filter-actions";
    const limparBtn = document.createElement("button");
    limparBtn.id = "limpar-filtros-btn";
    limparBtn.textContent = "Limpar Filtros";
    limparBtn.onclick = () => {
        filterPanel.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        iniciarBusca();
    };
    actionsDiv.appendChild(limparBtn);
    filterPanel.appendChild(actionsDiv);
}

function iniciarBusca() {
    const termoBusca = inputBusca.value.toLowerCase();
    const filtrosAtivos = {
        porte: [],
        energia: [],
        grupo: []
    };

    filterPanel.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        filtrosAtivos[cb.name].push(cb.value);
    });

    let dadosFiltrados = dados.filter(dado => {
        const correspondeBusca = dado.nome.toLowerCase().includes(termoBusca);

        const correspondePorte = filtrosAtivos.porte.length === 0 || filtrosAtivos.porte.includes(dado.porte);
        const correspondeEnergia = filtrosAtivos.energia.length === 0 || filtrosAtivos.energia.includes(dado.nivel_energia);
        const correspondeGrupo = filtrosAtivos.grupo.length === 0 || filtrosAtivos.grupo.some(selectedGroupLabel => {
            // Extrai o número do grupo do label (ex: "Grupo 1" -> "1")
            const selectedGroupNumber = selectedGroupLabel.replace("Grupo ", "");
            // Verifica se o dado.grupo começa com o número do grupo seguido de um espaço
            return dado.grupo.startsWith(selectedGroupNumber + ' ');
        });

        return correspondeBusca && correspondePorte && correspondeEnergia && correspondeGrupo;
    });

    paginaAtual = 1;
    renderizarCards(dadosFiltrados);
}

function renderizarCards(dadosParaRenderizar) {
    dadosAtuais = dadosParaRenderizar;
    cardContainer.innerHTML = "";

    if (dadosAtuais.length === 0) {
        cardContainer.innerHTML = `<div class="no-results"><i class="fa-solid fa-magnifying-glass"></i><p>Nenhum cãozinho encontrado.<br>Tente ajustar sua busca ou filtros!</p></div>`;
        configurarPaginacao(); // Limpa a paginação
        return;
    }

    const indiceInicial = (paginaAtual - 1) * cardsPorPagina;
    const indiceFinal = paginaAtual * cardsPorPagina;
    const dadosDaPagina = dadosAtuais.slice(indiceInicial, indiceFinal);

    for (let dado of dadosDaPagina){
        let article = document.createElement("article");
        article.classList.add("card");

        article.innerHTML = `
        <img src="${dado.imagem}" alt="Imagem de um cachorro da raça ${dado.nome}">
            <div class="card-content">
                <h2>${dado.nome}</h2>
                <p>${dado.descricao}</p>
                <p><strong><i class="fa-solid fa-paw"></i> Porte:</strong> ${dado.porte}</p>
                
                ${criarHtmlNivelEnergia(dado)}
                
                <p><strong><i class="fa-solid fa-heart-pulse"></i> Expectativa de Vida:</strong> ${dado.expectativa_vida}</p>
                <p><strong><i class="fa-solid fa-location-dot"></i> Origem:</strong> ${dado.origem}</p>
                <p><strong><i class="fa-solid fa-bone"></i> Grupo:</strong> ${dado.grupo}</p>
                <p><strong><i class="fa-solid fa-lightbulb"></i> Fun Fact:</strong> ${dado.fun_fact}</p>
            </div>
        `;

        cardContainer.appendChild(article);
    }
    configurarPaginacao();
}

function configurarPaginacao() {
    paginationContainer.innerHTML = "";
    const totalPaginas = Math.ceil(dadosAtuais.length / cardsPorPagina);
    const botaoAnterior = document.createElement("button");
    botaoAnterior.innerHTML = '<i class="fa-solid fa-angle-left"></i>';
    botaoAnterior.classList.add("pagination-arrow");
    if (paginaAtual === 1) {
        botaoAnterior.disabled = true;
    }
    botaoAnterior.addEventListener("click", () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            renderizarCards(dadosAtuais);
            window.scrollTo(0, 0);
        }
    });
    paginationContainer.appendChild(botaoAnterior);

    for (let i = 1; i <= totalPaginas; i++) {
        const botao = document.createElement("button");
        botao.innerText = i;
        botao.classList.add("pagination-button");
        if (i === paginaAtual) {
            botao.classList.add("active");
        }
        botao.addEventListener("click", () => {
            paginaAtual = i;
            renderizarCards(dadosAtuais);
            window.scrollTo(0, 0);
        });
        paginationContainer.appendChild(botao);
    }

    const botaoProximo = document.createElement("button");
    botaoProximo.innerHTML = '<i class="fa-solid fa-angle-right"></i>';
    botaoProximo.classList.add("pagination-arrow");
    if (paginaAtual === totalPaginas || totalPaginas === 0) {
        botaoProximo.disabled = true;
    }
    botaoProximo.addEventListener("click", () => {
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            renderizarCards(dadosAtuais);
            window.scrollTo(0, 0);
        }
    });
    paginationContainer.appendChild(botaoProximo);
}

window.onload = carregarDados;