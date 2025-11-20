let cardContainer = document.querySelector(".card-container");
let paginationContainer = document.querySelector(".pagination-container");
let inputBusca = document.querySelector("input");
let dados = [];
let dadosAtuais = [];

let paginaAtual = 1;
const cardsPorPagina = 8;
// Função para carregar os dados do JSON e renderizar todos os cards inicialmente
async function carregarDados() {
    try {
        const resposta = await fetch("data.json");
        dados = await resposta.json();
        renderizarCards(dados);
    } catch (error) {
        console.error("Erro ao carregar os dados:", error);
    }
}

function iniciarBusca() {
    const termoBusca = inputBusca.value.toLowerCase();
    dadosAtuais = dados.filter(dado => 
        dado.nome.toLowerCase().includes(termoBusca)
    );
    paginaAtual = 1; // Reseta para a primeira página após a busca
    renderizarCards(dadosAtuais);
}

function renderizarCards(dadosParaRenderizar) {
    dadosAtuais = dadosParaRenderizar;
    cardContainer.innerHTML = ""; // Limpa o container antes de adicionar novos cards

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
                <p><strong>Porte:</strong> ${dado.porte}</p>
                <p><strong>Nível de Energia:</strong> ${dado.nivel_energia}</p>
                <p><strong>Expectativa de Vida:</strong> ${dado.expectativa_vida}</p>
                <p><strong>Origem:</strong> ${dado.origem}</p>
                <p><strong>Grupo:</strong> ${dado.grupo}</p>
                <p><strong>Fun Fact:</strong> ${dado.fun_fact}</p>
            </div>
        `;
        cardContainer.appendChild(article);
    }
    configurarPaginacao();
}

function configurarPaginacao() {
    paginationContainer.innerHTML = "";
    const totalPaginas = Math.ceil(dadosAtuais.length / cardsPorPagina);

    // Botão "Anterior"
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
            window.scrollTo(0, 0); // Rola para o topo da página
        });
        paginationContainer.appendChild(botao);
    }

    // Botão "Próximo"
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

// Chama a função para carregar os dados assim que a página for carregada
window.onload = carregarDados;