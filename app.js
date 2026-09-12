// =====================================================
// CONFIGURAÇÃO SUPABASE
// =====================================================

const SUPABASE_URL = "https://kxuzpnlizvmluroxenlg.supabase.co";
const SUPABASE_KEY = "sb_publishable_2VUSWEN1y8Ggvl5qIfhthA_0P1v7bWP";

const STORAGE_BUCKET = "fotos-equipamentos";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =====================================================
// VARIÁVEIS
// =====================================================

let equipamentoAtual = null;
let arquivoFoto = null;
let arquivoFotoEdicao = null;
let filtroAtual = "todos";


// =====================================================
// ELEMENTOS
// =====================================================

const telaHome = document.getElementById("telaHome");
const telaCadastro = document.getElementById("telaCadastro");
const telaConsulta = document.getElementById("telaConsulta");
const telaDetalhes = document.getElementById("telaDetalhes");

const btnCamera = document.getElementById("btnCamera");
const btnGaleria = document.getElementById("btnGaleria");

const fotoCamera = document.getElementById("fotoCamera");
const fotoGaleria = document.getElementById("fotoGaleria");

const previewContainer =
    document.getElementById("previewContainer");

const previewFoto =
    document.getElementById("previewFoto");

const ocrStatus =
    document.getElementById("ocrStatus");

const tipo = document.getElementById("tipo");

const camposRedutor =
    document.getElementById("camposRedutor");


// =====================================================
// NAVEGAÇÃO
// =====================================================

function mostrarTela(tela) {

    document.querySelectorAll(".tela").forEach(el => {
        el.classList.remove("ativa");
    });

    tela.classList.add("ativa");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function abrirCadastro() {

    limparCadastro();

    mostrarTela(telaCadastro);
}


function abrirConsulta() {

    mostrarTela(telaConsulta);

    carregarEquipamentos();
}


function voltarHome() {

    mostrarTela(telaHome);
}


function voltarConsulta() {

    mostrarTela(telaConsulta);

    carregarEquipamentos();
}


// =====================================================
// MENSAGENS
// =====================================================

function mostrarMensagem(texto) {

    const mensagem =
        document.getElementById("mensagem");

    mensagem.textContent = texto;

    mensagem.classList.add("exibir");

    setTimeout(() => {
        mensagem.classList.remove("exibir");
    }, 3000);
}


// =====================================================
// FOTO - CADASTRO
// =====================================================

btnCamera.addEventListener("click", () => {

    fotoCamera.click();

});


btnGaleria.addEventListener("click", () => {

    fotoGaleria.click();

});


fotoCamera.addEventListener("change", () => {

    if (fotoCamera.files.length > 0) {

        processarFoto(fotoCamera.files[0]);

    }

});


fotoGaleria.addEventListener("change", () => {

    if (fotoGaleria.files.length > 0) {

        processarFoto(fotoGaleria.files[0]);

    }

});


// =====================================================
// PROCESSAR FOTO
// =====================================================

async function processarFoto(file) {

    if (!file) return;

    arquivoFoto = file;

    const url = URL.createObjectURL(file);

    previewFoto.src = url;

    previewContainer.classList.remove("oculto");

    ocrStatus.classList.remove("oculto");

    ocrStatus.textContent =
        "Lendo placa do equipamento...";

    try {

        const resultado =
            await Tesseract.recognize(
                file,
                "eng",
                {
                    logger: info => {

                        if (info.status === "recognizing text") {

                            const porcentagem =
                                Math.round(
                                    info.progress * 100
                                );

                            ocrStatus.textContent =
                                `Lendo placa... ${porcentagem}%`;

                        }

                    }
                }
            );


        const texto =
            resultado.data.text;

        preencherDadosOCR(texto);

        ocrStatus.textContent =
            "Leitura concluída. Confira os dados encontrados.";

    } catch (erro) {

        console.error(erro);

        ocrStatus.textContent =
            "Não foi possível ler automaticamente a placa. Você pode preencher os dados manualmente.";

    }
}


// =====================================================
// OCR
// =====================================================

function preencherDadosOCR(texto) {

    console.log("Texto OCR:", texto);

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
        "VOGES"
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
    // FREQUÊNCIA
    // -----------------------------------------

    const freq =
        textoMaiusculo.match(
            /(\d+(?:[.,]\d+)?)\s*HZ/
        );

    if (freq) {

        document.getElementById("frequencia_hz").value =
            freq[1].replace(",", ".");

    }


    // -----------------------------------------
    // RPM
    // -----------------------------------------

    const rpm =
        textoMaiusculo.match(
            /(\d{3,5})\s*(?:RPM|MIN[- ]?1)/
        );

    if (rpm) {

        document.getElementById("rotacao_rpm").value =
            rpm[1];

    }


    // -----------------------------------------
    // CORRENTE
    // -----------------------------------------

    const corrente =
        textoMaiusculo.match(
            /(\d+(?:[.,]\d+)?)\s*A(?:\s|$)/
        );

    if (corrente) {

        document.getElementById("corrente_a").value =
            corrente[1].replace(",", ".");

    }


    // -----------------------------------------
    // POTÊNCIA CV
    // -----------------------------------------

    const potenciaCV =
        textoMaiusculo.match(
            /(\d+(?:[.,]\d+)?)\s*(?:CV|HP)/
        );

    if (potenciaCV) {

        document.getElementById("potencia_cv").value =
            potenciaCV[1].replace(",", ".");

    }


    // -----------------------------------------
    // POTÊNCIA KW
    // -----------------------------------------

    const potenciaKW =
        textoMaiusculo.match(
            /(\d+(?:[.,]\d+)?)\s*KW/
        );

    if (
        potenciaKW &&
        !potenciaCV
    ) {

        const kw =
            parseFloat(
                potenciaKW[1].replace(",", ".")
            );

        const cv =
            kw * 1.35962;

        document.getElementById("potencia_cv").value =
            cv.toFixed(2);

    }


    // -----------------------------------------
    // TENSÃO
    // -----------------------------------------

    const tensoes =
        textoMaiusculo.match(
            /\b\d{2,4}\s*(?:\/|-)\s*\d{2,4}(?:\s*(?:V))?\b|\b\d{3,4}\s*V\b/g
        );

    if (tensoes && tensoes.length > 0) {

        document.getElementById("tensao").value =
            tensoes[0].replace(/\s+/g, " ");

    }


    // -----------------------------------------
    // MODELO
    // -----------------------------------------

    const modelo =
        textoMaiusculo.match(
            /(?:TYPE|MODEL|MODELO|TIPO)\s*[:\-]?\s*([A-Z0-9\-\/\.]+)/i
        );

    if (modelo) {

        document.getElementById("modelo").value =
            modelo[1];

    }


    // -----------------------------------------
    // NÚMERO DE SÉRIE
    // -----------------------------------------

    const serie =
        textoMaiusculo.match(
            /(?:S\/N|SN|SERIAL|SERIE|N[Oº°]?)\s*[:\-]?\s*([A-Z0-9\-\.]+)/i
        );

    if (serie) {

        document.getElementById("numero_serie").value =
            serie[1];

    }

}


// =====================================================
// TIPO
// =====================================================

tipo.addEventListener("change", atualizarCamposRedutor);


function atualizarCamposRedutor() {

    if (tipo.value === "Redutor") {

        camposRedutor.classList.remove("oculto");

    } else {

        camposRedutor.classList.add("oculto");

    }

}


// =====================================================
// SALVAR NOVO EQUIPAMENTO
// =====================================================

document
    .getElementById("btnSalvar")
    .addEventListener("click", salvarEquipamento);


async function salvarEquipamento() {

    const nome =
        document.getElementById("nome").value.trim();

    const local =
        document.getElementById("local").value.trim();

    const tipoValor =
        document.getElementById("tipo").value;


    if (!nome) {

        mostrarMensagem(
            "Informe o nome do equipamento."
        );

        return;
    }


    if (!local) {

        mostrarMensagem(
            "Informe o local de instalação."
        );

        return;
    }


    if (!tipoValor) {

        mostrarMensagem(
            "Selecione o tipo do equipamento."
        );

        return;
    }


    const btn =
        document.getElementById("btnSalvar");

    btn.disabled = true;

    btn.textContent = "Salvando...";


    try {

        let fotoPath = null;


        // -----------------------------------------
        // UPLOAD DA FOTO
        // -----------------------------------------

        if (arquivoFoto) {

            fotoPath =
                await enviarFoto(arquivoFoto);

        }


        // -----------------------------------------
        // DADOS
        // -----------------------------------------

        const dados = {

            nome: nome,

            local_instalacao: local,

            tipo: tipoValor,

            fabricante:
                valorOuNull("fabricante"),

            modelo:
                valorOuNull("modelo"),

            potencia_cv:
                numeroOuNull("potencia_cv"),

            tensao:
                valorOuNull("tensao"),

            corrente_a:
                numeroOuNull("corrente_a"),

            rotacao_rpm:
                numeroOuNull("rotacao_rpm"),

            frequencia_hz:
                numeroOuNull("frequencia_hz"),

            numero_serie:
                valorOuNull("numero_serie"),

            relacao:
                valorOuNull("relacao"),

            rotacao_entrada_rpm:
                numeroOuNull("rotacao_entrada_rpm"),

            rotacao_saida_rpm:
                numeroOuNull("rotacao_saida_rpm"),

            foto_placa:
                fotoPath,

            observacoes:
                valorOuNull("observacoes")

        };


        // -----------------------------------------
        // INSERT
        // -----------------------------------------

        const { error } =
            await supabaseClient
                .from("equipamentos")
                .insert(dados);


        if (error) {

            console.error(error);

            throw error;

        }


        mostrarMensagem(
            "Equipamento cadastrado com sucesso."
        );


        limparCadastro();


        setTimeout(() => {

            abrirConsulta();

        }, 1000);


    } catch (erro) {

        console.error(erro);

        mostrarMensagem(
            "Erro ao salvar equipamento: " +
            erro.message
        );

    } finally {

        btn.disabled = false;

        btn.textContent =
            "Salvar equipamento";

    }

}


// =====================================================
// UPLOAD FOTO
// =====================================================

async function enviarFoto(file) {

    const extensao =
        obterExtensao(file.name);


    const nomeArquivo =
        `${crypto.randomUUID()}.${extensao}`;


    const caminho =
        `equipamentos/${nomeArquivo}`;


    const { error } =
        await supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .upload(
                caminho,
                file,
                {
                    contentType: file.type,
                    upsert: false
                }
            );


    if (error) {

        throw error;

    }


    // IMPORTANTE:
    // guardamos o CAMINHO do arquivo,
    // não a URL completa.

    return caminho;

}


function obterExtensao(nome) {

    const partes =
        nome.split(".");

    if (partes.length < 2) {
        return "jpg";
    }

    return partes.pop().toLowerCase();

}


// =====================================================
// OBTER URL DA FOTO
// =====================================================

function obterUrlFoto(valor) {

    if (!valor) {
        return null;
    }


    // Compatibilidade com registros antigos
    // que já possuem uma URL completa.

    if (
        valor.startsWith("http://") ||
        valor.startsWith("https://")
    ) {

        return valor;

    }


    const resultado =
        supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(valor);


    return resultado.data.publicUrl;

}


// =====================================================
// EXTRAIR CAMINHO DA FOTO
// =====================================================

function extrairCaminhoFoto(valor) {

    if (!valor) {
        return null;
    }


    // Se já for um caminho
    if (
        !valor.startsWith("http://") &&
        !valor.startsWith("https://")
    ) {

        return valor;

    }


    const marcador =
        `/storage/v1/object/public/${STORAGE_BUCKET}/`;


    const posicao =
        valor.indexOf(marcador);


    if (posicao === -1) {

        return null;

    }


    const caminho =
        valor.substring(
            posicao + marcador.length
        );


    return decodeURIComponent(caminho);

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
        `<div class="card">
            Carregando equipamentos...
        </div>`;


    const { data, error } =
        await supabaseClient
            .from("equipamentos")
            .select("*")
            .order("criado_em", {
                ascending: false
            });


    if (error) {

        console.error(error);

        lista.innerHTML =
            `<div class="card">
                Erro ao carregar equipamentos.
            </div>`;

        return;

    }


    window.todosEquipamentos =
        data || [];


    aplicarFiltros();

}


// =====================================================
// BUSCA
// =====================================================

document
    .getElementById("busca")
    .addEventListener(
        "input",
        aplicarFiltros
    );


document
    .querySelectorAll(".filtro")
    .forEach(botao => {

        botao.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".filtro")
                    .forEach(b => {
                        b.classList.remove("ativo");
                    });


                botao.classList.add("ativo");


                filtroAtual =
                    botao.dataset.filtro;


                aplicarFiltros();

            }
        );

    });


function aplicarFiltros() {

    const busca =
        document
            .getElementById("busca")
            .value
            .toLowerCase()
            .trim();


    let equipamentos =
        window.todosEquipamentos || [];


    // -----------------------------------------
    // FILTRO TIPO
    // -----------------------------------------

    if (filtroAtual === "motor") {

        equipamentos =
            equipamentos.filter(
                equipamento =>
                    equipamento.tipo ===
                    "Motor elétrico"
            );

    }


    if (filtroAtual === "redutor") {

        equipamentos =
            equipamentos.filter(
                equipamento =>
                    equipamento.tipo ===
                    "Redutor"
            );

    }


    // -----------------------------------------
    // BUSCA
    // -----------------------------------------

    if (busca) {

        equipamentos =
            equipamentos.filter(equipamento => {

                const texto = [

                    equipamento.nome,

                    equipamento.local_instalacao,

                    equipamento.fabricante,

                    equipamento.modelo,

                    equipamento.numero_serie,

                    equipamento.tipo

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                return texto.includes(busca);

            });

    }


    renderizarEquipamentos(equipamentos);

}


// =====================================================
// RENDERIZAR LISTA
// =====================================================

function renderizarEquipamentos(equipamentos) {

    const lista =
        document.getElementById(
            "listaEquipamentos"
        );


    if (!equipamentos.length) {

        lista.innerHTML =
            `<div class="card">
                Nenhum equipamento encontrado.
            </div>`;

        return;

    }


    lista.innerHTML = "";


    equipamentos.forEach(equipamento => {

        const item =
            document.createElement("div");


        item.className =
            "equipamento-item";


        item.innerHTML = `

            <div class="item-linha">

                <div>

                    <h3>
                        ${escaparHTML(
                            equipamento.nome
                        )}
                    </h3>

                    <p>
                        ${escaparHTML(
                            equipamento.local_instalacao
                        )}
                    </p>

                    ${
                        equipamento.fabricante
                            ? `<p>
                                ${escaparHTML(
                                    equipamento.fabricante
                                )}
                                ${
                                    equipamento.modelo
                                        ? " • " +
                                          escaparHTML(
                                              equipamento.modelo
                                          )
                                        : ""
                                }
                               </p>`
                            : ""
                    }

                </div>


                <span class="badge">
                    ${escaparHTML(
                        equipamento.tipo
                    )}
                </span>

            </div>

        `;


        item.addEventListener(
            "click",
            () => abrirDetalhes(equipamento)
        );


        lista.appendChild(item);

    });

}


// =====================================================
// DETALHES
// =====================================================

function abrirDetalhes(equipamento) {

    equipamentoAtual =
        equipamento;


    preencherDetalhes(equipamento);


    document
        .getElementById("modoVisualizacao")
        .classList.remove("oculto");


    document
        .getElementById("modoEdicao")
        .classList.add("oculto");


    mostrarTela(telaDetalhes);

}


// =====================================================
// PREENCHER DETALHES
// =====================================================

function preencherDetalhes(e) {

    document.getElementById("detNome").textContent =
        e.nome || "-";


    document.getElementById("detLocal").textContent =
        e.local_instalacao || "-";


    document.getElementById("detTipo").textContent =
        e.tipo || "-";


    document.getElementById("detFabricante").textContent =
        e.fabricante || "-";


    document.getElementById("detModelo").textContent =
        e.modelo || "-";


    document.getElementById("detPotencia").textContent =
        e.potencia_cv != null
            ? `${e.potencia_cv} CV`
            : "-";


    document.getElementById("detTensao").textContent =
        e.tensao || "-";


    document.getElementById("detCorrente").textContent =
        e.corrente_a != null
            ? `${e.corrente_a} A`
            : "-";


    document.getElementById("detRotacao").textContent =
        e.rotacao_rpm != null
            ? `${e.rotacao_rpm} RPM`
            : "-";


    document.getElementById("detFrequencia").textContent =
        e.frequencia_hz != null
            ? `${e.frequencia_hz} Hz`
            : "-";


    document.getElementById("detSerie").textContent =
        e.numero_serie || "-";


    document.getElementById("detRelacao").textContent =
        e.relacao || "-";


    document.getElementById("detEntrada").textContent =
        e.rotacao_entrada_rpm != null
            ? `${e.rotacao_entrada_rpm} RPM`
            : "-";


    document.getElementById("detSaida").textContent =
        e.rotacao_saida_rpm != null
            ? `${e.rotacao_saida_rpm} RPM`
            : "-";


    document.getElementById("detObservacoes").textContent =
        e.observacoes || "-";


    // -----------------------------------------
    // REDUTOR
    // -----------------------------------------

    const redutorBox =
        document.getElementById(
            "detRedutorBox"
        );


    if (e.tipo === "Redutor") {

        redutorBox.classList.remove("oculto");

    } else {

        redutorBox.classList.add("oculto");

    }


    // -----------------------------------------
    // FOTO
    // -----------------------------------------

    const imagem =
        document.getElementById("detFoto");

    const semFoto =
        document.getElementById("semFoto");


    const url =
        obterUrlFoto(e.foto_placa);


    if (url) {

        imagem.src = url;

        imagem.classList.remove("oculto");

        semFoto.classList.add("oculto");


        imagem.onerror = () => {

            imagem.classList.add("oculto");

            semFoto.textContent =
                "Não foi possível carregar a foto.";

            semFoto.classList.remove("oculto");

        };

    } else {

        imagem.src = "";

        imagem.classList.add("oculto");

        semFoto.textContent =
            "Nenhuma foto cadastrada.";

        semFoto.classList.remove("oculto");

    }

}


// =====================================================
// ATIVAR EDIÇÃO
// =====================================================

function ativarEdicao() {

    if (!equipamentoAtual) {
        return;
    }


    const e =
        equipamentoAtual;


    document.getElementById("editNome").value =
        e.nome || "";


    document.getElementById("editLocal").value =
        e.local_instalacao || "";


    document.getElementById("editTipo").value =
        e.tipo || "Outro";


    document.getElementById("editFabricante").value =
        e.fabricante || "";


    document.getElementById("editModelo").value =
        e.modelo || "";


    document.getElementById("editPotencia").value =
        e.potencia_cv ?? "";


    document.getElementById("editTensao").value =
        e.tensao || "";


    document.getElementById("editCorrente").value =
        e.corrente_a ?? "";


    document.getElementById("editRotacao").value =
        e.rotacao_rpm ?? "";


    document.getElementById("editFrequencia").value =
        e.frequencia_hz ?? "";


    document.getElementById("editSerie").value =
        e.numero_serie || "";


    document.getElementById("editRelacao").value =
        e.relacao || "";


    document.getElementById("editEntrada").value =
        e.rotacao_entrada_rpm ?? "";


    document.getElementById("editSaida").value =
        e.rotacao_saida_rpm ?? "";


    document.getElementById("editObservacoes").value =
        e.observacoes || "";


    arquivoFotoEdicao = null;


    document
        .getElementById("editPreviewFoto")
        .classList.add("oculto");


    atualizarCamposRedutorEdicao();


    document
        .getElementById("modoVisualizacao")
        .classList.add("oculto");


    document
        .getElementById("modoEdicao")
        .classList.remove("oculto");


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// =====================================================
// TIPO REDUTOR - EDIÇÃO
// =====================================================

document
    .getElementById("editTipo")
    .addEventListener(
        "change",
        atualizarCamposRedutorEdicao
    );


function atualizarCamposRedutorEdicao() {

    const box =
        document.getElementById(
            "editRedutorBox"
        );


    if (
        document.getElementById(
            "editTipo"
        ).value === "Redutor"
    ) {

        box.classList.remove("oculto");

    } else {

        box.classList.add("oculto");

    }

}


// =====================================================
// FOTO EDIÇÃO
// =====================================================

function selecionarFotoEdicao() {

    document
        .getElementById("editFoto")
        .click();

}


document
    .getElementById("editFoto")
    .addEventListener(
        "change",
        () => {

            const file =
                document.getElementById(
                    "editFoto"
                ).files[0];


            if (!file) {
                return;
            }


            arquivoFotoEdicao = file;


            const url =
                URL.createObjectURL(file);


            const preview =
                document.getElementById(
                    "editPreviewFoto"
                );


            preview.src = url;

            preview.classList.remove(
                "oculto"
            );

        }
    );


// =====================================================
// SALVAR ALTERAÇÕES
// =====================================================

async function salvarAlteracoes() {

    if (!equipamentoAtual) {
        return;
    }


    const nome =
        document
            .getElementById("editNome")
            .value
            .trim();


    const local =
        document
            .getElementById("editLocal")
            .value
            .trim();


    const tipoValor =
        document.getElementById(
            "editTipo"
        ).value;


    if (!nome || !local || !tipoValor) {

        mostrarMensagem(
            "Preencha nome, local e tipo."
        );

        return;

    }


    try {

        let fotoPath =
            equipamentoAtual.foto_placa;


        // -----------------------------------------
        // SE ESCOLHEU NOVA FOTO
        // -----------------------------------------

        if (arquivoFotoEdicao) {

            const novaFoto =
                await enviarFoto(
                    arquivoFotoEdicao
                );


            // Exclui a foto antiga
            // somente depois que a nova
            // foi enviada com sucesso.

            await excluirFotoStorage(
                equipamentoAtual.foto_placa
            );


            fotoPath = novaFoto;

        }


        // -----------------------------------------
        // DADOS
        // -----------------------------------------

        const dados = {

            nome: nome,

            local_instalacao: local,

            tipo: tipoValor,

            fabricante:
                valorOuNullEdit("editFabricante"),

            modelo:
                valorOuNullEdit("editModelo"),

            potencia_cv:
                numeroOuNullEdit("editPotencia"),

            tensao:
                valorOuNullEdit("editTensao"),

            corrente_a:
                numeroOuNullEdit("editCorrente"),

            rotacao_rpm:
                numeroOuNullEdit("editRotacao"),

            frequencia_hz:
                numeroOuNullEdit("editFrequencia"),

            numero_serie:
                valorOuNullEdit("editSerie"),

            relacao:
                valorOuNullEdit("editRelacao"),

            rotacao_entrada_rpm:
                numeroOuNullEdit("editEntrada"),

            rotacao_saida_rpm:
                numeroOuNullEdit("editSaida"),

            foto_placa:
                fotoPath,

            observacoes:
                valorOuNullEdit("editObservacoes"),

            atualizado_em:
                new Date().toISOString()

        };


        // -----------------------------------------
        // UPDATE
        // -----------------------------------------

        const { data, error } =
            await supabaseClient
                .from("equipamentos")
                .update(dados)
                .eq(
                    "id",
                    equipamentoAtual.id
                )
                .select()
                .single();


        if (error) {

            console.error(error);

            throw error;

        }


        equipamentoAtual = data;


        preencherDetalhes(data);


        document
            .getElementById("modoEdicao")
            .classList.add("oculto");


        document
            .getElementById("modoVisualizacao")
            .classList.remove("oculto");


        mostrarMensagem(
            "Equipamento alterado com sucesso."
        );


    } catch (erro) {

        console.error(erro);

        mostrarMensagem(
            "Erro ao alterar equipamento: " +
            erro.message
        );

    }

}


// =====================================================
// EXCLUIR EQUIPAMENTO
// =====================================================

async function excluirEquipamento() {

    if (!equipamentoAtual) {
        return;
    }


    const confirmou =
        confirm(
            `Deseja realmente excluir o equipamento "${equipamentoAtual.nome}"?`
        );


    if (!confirmou) {
        return;
    }


    try {

        // -----------------------------------------
        // EXCLUI FOTO
        // -----------------------------------------

        await excluirFotoStorage(
            equipamentoAtual.foto_placa
        );


        // -----------------------------------------
        // EXCLUI REGISTRO
        // -----------------------------------------

        const { error } =
            await supabaseClient
                .from("equipamentos")
                .delete()
                .eq(
                    "id",
                    equipamentoAtual.id
                );


        if (error) {

            console.error(error);

            throw error;

        }


        equipamentoAtual = null;


        mostrarMensagem(
            "Equipamento excluído com sucesso."
        );


        setTimeout(() => {

            abrirConsulta();

        }, 800);


    } catch (erro) {

        console.error(erro);

        mostrarMensagem(
            "Erro ao excluir equipamento: " +
            erro.message
        );

    }

}


// =====================================================
// EXCLUIR FOTO DO STORAGE
// =====================================================

async function excluirFotoStorage(valor) {

    const caminho =
        extrairCaminhoFoto(valor);


    if (!caminho) {
        return;
    }


    const { error } =
        await supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .remove([
                caminho
            ]);


    if (error) {

        console.warn(
            "Não foi possível excluir a foto:",
            error
        );

        // Não interrompe a exclusão
        // do equipamento.

    }

}


// =====================================================
// CANCELAR EDIÇÃO
// =====================================================

function cancelarEdicao() {

    document
        .getElementById("modoEdicao")
        .classList.add("oculto");


    document
        .getElementById("modoVisualizacao")
        .classList.remove("oculto");

}


// =====================================================
// LIMPAR CADASTRO
// =====================================================

function limparCadastro() {

    const campos = [

        "nome",
        "local",
        "fabricante",
        "modelo",
        "potencia_cv",
        "tensao",
        "corrente_a",
        "rotacao_rpm",
        "frequencia_hz",
        "numero_serie",
        "relacao",
        "rotacao_entrada_rpm",
        "rotacao_saida_rpm",
        "observacoes"

    ];


    campos.forEach(id => {

        const campo =
            document.getElementById(id);

        if (campo) {
            campo.value = "";
        }

    });


    tipo.value = "";


    arquivoFoto = null;


    previewContainer.classList.add(
        "oculto"
    );


    previewFoto.src = "";


    ocrStatus.classList.add(
        "oculto"
    );


    camposRedutor.classList.add(
        "oculto"
    );


    fotoCamera.value = "";
    fotoGaleria.value = "";

}


// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function valorOuNull(id) {

    const valor =
        document
            .getElementById(id)
            .value
            .trim();


    return valor === ""
        ? null
        : valor;

}


function numeroOuNull(id) {

    const valor =
        document
            .getElementById(id)
            .value
            .trim();


    if (valor === "") {
        return null;
    }


    const numero =
        Number(
            valor.replace(",", ".")
        );


    return Number.isFinite(numero)
        ? numero
        : null;

}


function valorOuNullEdit(id) {

    const valor =
        document
            .getElementById(id)
            .value
            .trim();


    return valor === ""
        ? null
        : valor;

}


function numeroOuNullEdit(id) {

    const valor =
        document
            .getElementById(id)
            .value
            .trim();


    if (valor === "") {
        return null;
    }


    const numero =
        Number(
            valor.replace(",", ".")
        );


    return Number.isFinite(numero)
        ? numero
        : null;

}


function escaparHTML(valor) {

    if (valor === null || valor === undefined) {
        return "";
    }


    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =====================================================
// INICIALIZAÇÃO
// =====================================================

mostrarTela(telaHome);
