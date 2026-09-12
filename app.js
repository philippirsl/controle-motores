// =====================================================
// CONFIGURAÇÃO SUPABASE
// =====================================================

const SUPABASE_URL = "https://kxuzpnlizvmluroxenlg.supabase.co";
const SUPABASE_KEY = "sb_publishable_2VUSWEN1y8Ggvl5qIfhthA_0P1v7bWP";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// Nome do bucket no Supabase Storage
const STORAGE_BUCKET = "fotos-equipamentos";


// =====================================================
// ELEMENTOS
// =====================================================

const telas = {
    home: document.getElementById("home"),
    cadastro: document.getElementById("cadastro"),
    consulta: document.getElementById("consulta"),
    detalhes: document.getElementById("detalhes")
};

const btnCamera = document.getElementById("btnCamera");
const btnGaleria = document.getElementById("btnGaleria");

const fotoCamera = document.getElementById("fotoCamera");
const fotoGaleria = document.getElementById("fotoGaleria");

const previewContainer = document.getElementById("previewContainer");
const previewFoto = document.getElementById("previewFoto");

const ocrCard = document.getElementById("ocrCard");
const ocrStatus = document.getElementById("ocrStatus");
const ocrProgress = document.getElementById("ocrProgress");

const dadosPlaca = document.getElementById("dadosPlaca");

let arquivoFoto = null;
let filtroAtual = "todos";
let equipamentos = [];


// =====================================================
// NAVEGAÇÃO
// =====================================================

function mostrarTela(nome) {

    Object.values(telas).forEach(tela => {
        tela.classList.remove("active");
    });

    telas[nome].classList.add("active");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function abrirCadastro() {

    mostrarTela("cadastro");

}


function abrirConsulta() {

    mostrarTela("consulta");

    carregarEquipamentos();

}


function voltarHome() {

    mostrarTela("home");

}


// =====================================================
// FOTO
// =====================================================

btnCamera.addEventListener("click", () => {

    fotoCamera.click();

});


btnGaleria.addEventListener("click", () => {

    fotoGaleria.click();

});


fotoCamera.addEventListener("change", () => {

    processarFoto(fotoCamera.files[0]);

});


fotoGaleria.addEventListener("change", () => {

    processarFoto(fotoGaleria.files[0]);

});


async function processarFoto(file) {

    if (!file) {
        return;
    }

    arquivoFoto = file;

    const imagemURL = URL.createObjectURL(file);

    previewFoto.src = imagemURL;

    previewContainer.classList.remove("hidden");

    // mostra área OCR
    ocrCard.classList.remove("hidden");

    dadosPlaca.classList.add("hidden");

    ocrProgress.style.width = "0%";

    await executarOCR(file);

}


// =====================================================
// OCR
// =====================================================

async function executarOCR(file) {

    try {

        ocrStatus.textContent = "Preparando leitura...";

        const resultado = await Tesseract.recognize(
            file,
            "eng",
            {

                logger: mensagem => {

                    if (mensagem.status === "recognizing text") {

                        const progresso =
                            Math.round(mensagem.progress * 100);

                        ocrProgress.style.width =
                            progresso + "%";

                        ocrStatus.textContent =
                            `Lendo placa... ${progresso}%`;
                    }

                    else {

                        ocrStatus.textContent =
                            mensagem.status;
                    }

                }

            }
        );


        const texto = resultado.data.text;

        console.log("TEXTO OCR:");
        console.log(texto);

        interpretarPlaca(texto);

        ocrProgress.style.width = "100%";

        ocrStatus.textContent =
            "Leitura concluída. Confira os dados.";

        setTimeout(() => {

            ocrCard.classList.add("hidden");

            dadosPlaca.classList.remove("hidden");

        }, 700);

    }

    catch (erro) {

        console.error(erro);

        ocrStatus.textContent =
            "Não foi possível ler a placa.";

        dadosPlaca.classList.remove("hidden");

        mostrarToast(
            "Não consegui ler automaticamente. Você pode preencher os dados manualmente."
        );

    }

}


// =====================================================
// INTERPRETAÇÃO DA PLACA
// =====================================================

function interpretarPlaca(texto) {

    const textoOriginal = texto;

    const textoMaiusculo =
        texto.toUpperCase();


    // -----------------------------------------
    // FABRICANTE
    // -----------------------------------------

    const fabricantes = [
        "WEG",
        "SIEMENS",
        "SEW",
        "ABB",
        "SCHNEIDER",
        "DANFOSS",
        "NORD",
        "BONFIGLIOLI",
        "CEMER",
        "ELETROMOTO",
        "VOGES",
        "NOVOZYMES"
    ];

    const fabricanteEncontrado =
        fabricantes.find(f =>
            textoMaiusculo.includes(f)
        );

    if (fabricanteEncontrado) {

        document.getElementById("fabricante").value =
            fabricanteEncontrado;

    }


    // -----------------------------------------
    // TENSÃO
    // -----------------------------------------

    const tensoes =
        textoOriginal.match(
            /\b(?:110|115|127|220|230|240|380|400|440|460|480|660)\s?V\b/gi
        );

    if (tensoes && tensoes.length > 0) {

        document.getElementById("tensao").value =
            tensoes.join(" / ");

    }


    // -----------------------------------------
    // FREQUÊNCIA
    // -----------------------------------------

    const frequencia =
        textoOriginal.match(
            /\b(?:50|60)\s?Hz\b/gi
        );

    if (frequencia) {

        document.getElementById("frequencia_hz").value =
            extrairNumero(frequencia[0]);

    }


    // -----------------------------------------
    // RPM
    // -----------------------------------------

    const rpm =
        textoOriginal.match(
            /\b\d{3,5}\s?(?:RPM|r\/min)\b/gi
        );

    if (rpm) {

        document.getElementById("rotacao_rpm").value =
            extrairNumero(rpm[0]);

    }


    // -----------------------------------------
    // CORRENTE
    // -----------------------------------------

    const corrente =
        textoOriginal.match(
            /\b\d+(?:[,.]\d+)?\s?A\b/gi
        );

    if (corrente) {

        document.getElementById("corrente_a").value =
            extrairNumero(corrente[0]);

    }


    // -----------------------------------------
    // POTÊNCIA
    // -----------------------------------------

    const potencia =
        textoOriginal.match(
            /\b\d+(?:[,.]\d+)?\s?(?:CV|HP|KW)\b/gi
        );

    if (potencia) {

        let valor =
            extrairNumero(potencia[0]);

        const unidade =
            potencia[0].toUpperCase();

        if (unidade.includes("KW")) {

            valor =
                valor * 1.35962;

        }

        document.getElementById("potencia_cv").value =
            valor.toFixed(2);

    }


    // -----------------------------------------
    // MODELO
    // -----------------------------------------

    const modelo =
        procurarModelo(textoMaiusculo);

    if (modelo) {

        document.getElementById("modelo").value =
            modelo;

    }


    // -----------------------------------------
    // NÚMERO DE SÉRIE
    // -----------------------------------------

    const serie =
        procurarSerie(textoOriginal);

    if (serie) {

        document.getElementById("numero_serie").value =
            serie;

    }

}


// =====================================================
// EXTRAÇÃO DE NÚMEROS
// =====================================================

function extrairNumero(texto) {

    const numero =
        texto
            .replace(",", ".")
            .match(/\d+(?:\.\d+)?/);

    return numero
        ? numero[0]
        : "";

}


// =====================================================
// MODELO
// =====================================================

function procurarModelo(texto) {

    const linhas =
        texto
            .split("\n")
            .map(l => l.trim())
            .filter(Boolean);

    const palavrasIgnoradas = [
        "WEG",
        "SIEMENS",
        "MOTOR",
        "MOT",
        "TYPE",
        "TIPO",
        "MODEL",
        "MODELO",
        "SERIAL",
        "SERIE",
        "VOLT",
        "V",
        "HZ",
        "RPM",
        "A",
        "CV",
        "KW",
        "HP"
    ];

    for (const linha of linhas) {

        if (
            linha.length >= 3 &&
            linha.length <= 30 &&
            /^[A-Z0-9\-\/]+$/i.test(linha)
        ) {

            const limpa =
                linha.toUpperCase();

            if (
                !palavrasIgnoradas.includes(limpa) &&
                /\d/.test(limpa)
            ) {

                return linha;

            }

        }

    }

    return "";

}


// =====================================================
// SÉRIE
// =====================================================

function procurarSerie(texto) {

    const resultado =
        texto.match(
            /(?:SERIAL|SERIE|S\/N|SN)[\s:.-]*([A-Z0-9\-\/]+)/i
        );

    if (resultado) {

        return resultado[1];

    }

    return "";

}


// =====================================================
// TIPO
// =====================================================

document.getElementById("tipo")
    .addEventListener("change", function () {

        if (this.value === "redutor") {

            document
                .getElementById("camposRedutor")
                .classList.remove("hidden");

        }

        else {

            document
                .getElementById("camposRedutor")
                .classList.add("hidden");

        }

    });


// =====================================================
// SALVAR
// =====================================================

document
    .getElementById("btnSalvar")
    .addEventListener("click", salvarEquipamento);


async function salvarEquipamento() {

    const nome =
        document.getElementById("nome").value.trim();

    const local =
        document.getElementById("local").value.trim();

    const tipo =
        document.getElementById("tipo").value;


    if (!nome) {

        mostrarToast("Informe o nome do equipamento.");

        return;

    }


    if (!local) {

        mostrarToast("Informe o local de instalação.");

        return;

    }


    if (!tipo) {

        mostrarToast("Selecione o tipo do equipamento.");

        return;

    }


    const btn =
        document.getElementById("btnSalvar");

    btn.disabled = true;

    btn.textContent = "Salvando...";


    try {

        let fotoURL = null;


        // ==========================================
        // UPLOAD DA FOTO
        // ==========================================

        if (arquivoFoto) {

            const extensao =
                arquivoFoto.name
                    .split(".")
                    .pop()
                    .toLowerCase();

            const nomeArquivo =
                `${crypto.randomUUID()}.${extensao}`;

            const caminho =
                `equipamentos/${nomeArquivo}`;


            const upload =
                await supabaseClient
                    .storage
                    .from(STORAGE_BUCKET)
                    .upload(
                        caminho,
                        arquivoFoto,
                        {
                            contentType: arquivoFoto.type,
                            upsert: false
                        }
                    );


            if (upload.error) {

                throw upload.error;

            }


            const publicURL =
                supabaseClient
                    .storage
                    .from(STORAGE_BUCKET)
                    .getPublicUrl(caminho);


            fotoURL =
                publicURL.data.publicUrl;

        }


        // ==========================================
        // DADOS
        // ==========================================

        const dados = {

            nome: nome,

            local_instalacao: local,

            tipo: tipo,

            fabricante:
                valor("fabricante"),

            modelo:
                valor("modelo"),

            potencia_cv:
                numero("potencia_cv"),

            tensao:
                valor("tensao"),

            corrente_a:
                numero("corrente_a"),

            rotacao_rpm:
                numero("rotacao_rpm"),

            frequencia_hz:
                numero("frequencia_hz"),

            numero_serie:
                valor("numero_serie"),

            relacao:
                valor("relacao"),

            rotacao_entrada_rpm:
                numero("rotacao_entrada_rpm"),

            rotacao_saida_rpm:
                numero("rotacao_saida_rpm"),

            foto_placa:
                fotoURL,

            observacoes:
                valor("observacoes")

        };


        // ==========================================
        // INSERT
        // ==========================================

        const resultado =
            await supabaseClient
                .from("equipamentos")
                .insert(dados);


        if (resultado.error) {

            throw resultado.error;

        }


        mostrarToast(
            "Equipamento cadastrado com sucesso!"
        );


        limparCadastro();


        setTimeout(() => {

            abrirConsulta();

        }, 1200);


    }

    catch (erro) {

        console.error(erro);

        mostrarToast(
            "Erro ao salvar: " + erro.message
        );

    }

    finally {

        btn.disabled = false;

        btn.textContent =
            "Salvar equipamento";

    }

}


// =====================================================
// FUNÇÕES DE VALOR
// =====================================================

function valor(id) {

    const elemento =
        document.getElementById(id);

    if (!elemento) {
        return null;
    }

    const valor =
        elemento.value.trim();

    return valor === ""
        ? null
        : valor;

}


function numero(id) {

    const valorCampo =
        valor(id);

    if (!valorCampo) {
        return null;
    }

    const numero =
        parseFloat(
            valorCampo.replace(",", ".")
        );

    return Number.isNaN(numero)
        ? null
        : numero;

}


// =====================================================
// LIMPAR CADASTRO
// =====================================================

function limparCadastro() {

    document
        .querySelectorAll(
            "#cadastro input, #cadastro textarea"
        )
        .forEach(campo => {

            campo.value = "";

        });


    document.getElementById("tipo").value = "";

    previewContainer.classList.add("hidden");

    dadosPlaca.classList.add("hidden");

    ocrCard.classList.add("hidden");

    document
        .getElementById("camposRedutor")
        .classList.add("hidden");

    arquivoFoto = null;

}


// =====================================================
// CONSULTA
// =====================================================

async function carregarEquipamentos() {

    const lista =
        document.getElementById(
            "listaEquipamentos"
        );

    lista.innerHTML =
        `<div class="empty">Carregando...</div>`;


    const resultado =
        await supabaseClient
            .from("equipamentos")
            .select("*")
            .order("criado_em", {
                ascending: false
            });


    if (resultado.error) {

        console.error(resultado.error);

        lista.innerHTML =
            `<div class="empty">
                Erro ao carregar equipamentos.
            </div>`;

        return;

    }


    equipamentos =
        resultado.data || [];


    renderizarEquipamentos();

}


// =====================================================
// RENDERIZA LISTA
// =====================================================

function renderizarEquipamentos() {

    const lista =
        document.getElementById(
            "listaEquipamentos"
        );

    const busca =
        document
            .getElementById("busca")
            .value
            .toLowerCase()
            .trim();


    const filtrados =
        equipamentos.filter(item => {

            const correspondeTexto =
                !busca ||
                (item.nome || "")
                    .toLowerCase()
                    .includes(busca) ||
                (item.local_instalacao || "")
                    .toLowerCase()
                    .includes(busca) ||
                (item.fabricante || "")
                    .toLowerCase()
                    .includes(busca) ||
                (item.modelo || "")
                    .toLowerCase()
                    .includes(busca) ||
                (item.numero_serie || "")
                    .toLowerCase()
                    .includes(busca);


            const correspondeTipo =
                filtroAtual === "todos" ||
                item.tipo === filtroAtual;


            return (
                correspondeTexto &&
                correspondeTipo
            );

        });


    if (filtrados.length === 0) {

        lista.innerHTML =
            `<div class="empty">
                Nenhum equipamento encontrado.
            </div>`;

        return;

    }


    lista.innerHTML = "";


    filtrados.forEach(item => {

        const div =
            document.createElement("div");

        div.className =
            "equipment-item";


        div.innerHTML = `

            <div class="equipment-icon">
                ⚙
            </div>

            <div class="equipment-info">

                <strong>
                    ${escapar(item.nome)}
                </strong>

                <span>
                    ${escapar(item.local_instalacao || "-")}
                    •
                    ${nomeTipo(item.tipo)}
                </span>

            </div>
        `;


        div.addEventListener(
            "click",
            () => abrirDetalhes(item)
        );


        lista.appendChild(div);

    });

}


// =====================================================
// BUSCA
// =====================================================

document
    .getElementById("busca")
    .addEventListener(
        "input",
        renderizarEquipamentos
    );


// =====================================================
// FILTROS
// =====================================================

document
    .querySelectorAll(".filter")
    .forEach(botao => {

        botao.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".filter")
                    .forEach(b =>
                        b.classList.remove("active")
                    );


                botao.classList.add("active");


                filtroAtual =
                    botao.dataset.filter;


                renderizarEquipamentos();

            }
        );

    });


// =====================================================
// DETALHES
// =====================================================

function abrirDetalhes(item) {

    document.getElementById("dNome").textContent =
        item.nome || "-";

    document.getElementById("dTipo").textContent =
        nomeTipo(item.tipo);

    document.getElementById("dLocal").textContent =
        item.local_instalacao || "-";

    document.getElementById("dFabricante").textContent =
        item.fabricante || "-";

    document.getElementById("dModelo").textContent =
        item.modelo || "-";

    document.getElementById("dPotencia").textContent =
        item.potencia_cv
            ? `${item.potencia_cv} CV`
            : "-";

    document.getElementById("dTensao").textContent =
        item.tensao || "-";

    document.getElementById("dCorrente").textContent =
        item.corrente_a
            ? `${item.corrente_a} A`
            : "-";

    document.getElementById("dRotacao").textContent =
        item.rotacao_rpm
            ? `${item.rotacao_rpm} RPM`
            : "-";

    document.getElementById("dFrequencia").textContent =
        item.frequencia_hz
            ? `${item.frequencia_hz} Hz`
            : "-";

    document.getElementById("dSerie").textContent =
        item.numero_serie || "-";

    document.getElementById("dRelacao").textContent =
        item.relacao || "-";

    document.getElementById("dEntrada").textContent =
        item.rotacao_entrada_rpm
            ? `${item.rotacao_entrada_rpm} RPM`
            : "-";

    document.getElementById("dSaida").textContent =
        item.rotacao_saida_rpm
            ? `${item.rotacao_saida_rpm} RPM`
            : "-";

    document.getElementById("dObservacoes").textContent =
        item.observacoes || "-";


    const fotoCard =
        document.getElementById(
            "fotoDetalheCard"
        );

    const foto =
        document.getElementById(
            "fotoDetalhe"
        );


    if (item.foto_placa) {

        foto.src =
            item.foto_placa;

        fotoCard.classList.remove(
            "hidden"
        );

    }

    else {

        fotoCard.classList.add(
            "hidden"
        );

    }


    mostrarTela("detalhes");

}


// =====================================================
// TIPO
// =====================================================

function nomeTipo(tipo) {

    if (tipo === "motor") {
        return "Motor elétrico";
    }

    if (tipo === "redutor") {
        return "Redutor";
    }

    if (tipo === "outro") {
        return "Outro";
    }

    return "-";

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapar(texto) {

    const div =
        document.createElement("div");

    div.textContent =
        texto;

    return div.innerHTML;

}


// =====================================================
// TOAST
// =====================================================

function mostrarToast(mensagem) {

    const toast =
        document.getElementById("toast");

    toast.textContent =
        mensagem;

    toast.classList.add("show");


    setTimeout(() => {

        toast.classList.remove("show");

    }, 3500);

}
