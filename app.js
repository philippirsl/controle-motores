// =====================================================
// CONFIGURAÇÃO SUPABASE
// =====================================================

const SUPABASE_URL = "https://kxuzpnlizvmluroxenlg.supabase.co";
const SUPABASE_KEY = "sb_publishable_2VUSWEN1y8Ggvl5qIfhthA_0P1v7bWP";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const STORAGE_BUCKET = "fotos-equipamentos";


// ------------------------------------------------------------
// ESTADO DA APLICAÇÃO
// ------------------------------------------------------------

let equipamentos = [];
let equipamentoAtual = null;
let fotoSelecionada = null;


// ------------------------------------------------------------
// INICIALIZAÇÃO
// ------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

    configurarEventos();

    mostrarTela("home");

});


// ------------------------------------------------------------
// CONFIGURAÇÃO DOS EVENTOS
// ------------------------------------------------------------

function configurarEventos() {

    // ---------------- HOME ----------------

    const btnCadastrar =
        document.getElementById("btnCadastrar");

    if (btnCadastrar) {
        btnCadastrar.addEventListener("click", () => {

            limparFormulario();

            mostrarTela("cadastro");

        });
    }


    const btnConsultar =
        document.getElementById("btnConsultar");

    if (btnConsultar) {

        btnConsultar.addEventListener("click", () => {

            carregarEquipamentos();

            mostrarTela("consulta");

        });

    }


    // ---------------- VOLTAR ----------------

    document.querySelectorAll("[data-voltar]")
        .forEach(botao => {

            botao.addEventListener("click", () => {

                mostrarTela(
                    botao.dataset.voltar || "home"
                );

            });

        });


    // ---------------- TIPO ----------------

    const tipo =
        document.getElementById("tipo");

    if (tipo) {

        tipo.addEventListener("change", () => {

            atualizarCamposTipo();

        });

    }


    // ---------------- FOTO ----------------

    const inputCamera =
        document.getElementById("cameraInput");

    if (inputCamera) {

        inputCamera.addEventListener(
            "change",
            evento => {

                processarFotoSelecionada(
                    evento.target.files[0]
                );

            }
        );

    }


    const inputGaleria =
        document.getElementById("galeriaInput");

    if (inputGaleria) {

        inputGaleria.addEventListener(
            "change",
            evento => {

                processarFotoSelecionada(
                    evento.target.files[0]
                );

            }
        );

    }


    // ---------------- LEITURA IA ----------------

    const btnLerPlaca =
        document.getElementById("btnLerPlaca");

    if (btnLerPlaca) {

        btnLerPlaca.addEventListener(
            "click",
            processarPlacaComIA
        );

    }


    // ---------------- SALVAR ----------------

    const btnSalvar =
        document.getElementById("btnSalvar");

    if (btnSalvar) {

        btnSalvar.addEventListener(
            "click",
            salvarEquipamento
        );

    }


    // ---------------- ATUALIZAR ----------------

    const btnAtualizar =
        document.getElementById("btnAtualizar");

    if (btnAtualizar) {

        btnAtualizar.addEventListener(
            "click",
            atualizarEquipamento
        );

    }


    // ---------------- PESQUISA ----------------

    const campoBusca =
        document.getElementById("campoBusca");

    if (campoBusca) {

        campoBusca.addEventListener(
            "input",
            () => {

                renderizarEquipamentos(
                    campoBusca.value
                );

            }
        );

    }

}


// ============================================================
// NAVEGAÇÃO
// ============================================================

function mostrarTela(nome) {

    document
        .querySelectorAll(".tela")
        .forEach(tela => {

            tela.classList.remove("ativa");

        });


    const tela =
        document.getElementById(
            "tela-" + nome
        );

    if (tela) {

        tela.classList.add("ativa");

    }

}


// ============================================================
// FOTO
// ============================================================

function processarFotoSelecionada(file) {

    if (!file) {
        return;
    }

    fotoSelecionada = file;

    const preview =
        document.getElementById("previewFoto");

    if (!preview) {
        return;
    }

    const url =
        URL.createObjectURL(file);

    preview.src = url;

    preview.style.display = "block";


    const texto =
        document.getElementById("semFoto");

    if (texto) {

        texto.style.display = "none";

    }

}


// ============================================================
// GEMINI - LEITURA DA PLACA
// ============================================================

async function processarPlacaComIA() {

    try {

        if (!fotoSelecionada) {

            alert(
                "Primeiro tire uma foto ou escolha uma imagem da placa."
            );

            return;

        }


        const botao =
            document.getElementById("btnLerPlaca");


        if (botao) {

            botao.disabled = true;

            botao.textContent =
                "Analisando placa...";

        }


        mostrarStatusOCR(
            "Preparando imagem..."
        );


        const imagem =
            await prepararImagemParaIA(
                fotoSelecionada
            );


        mostrarStatusOCR(
            "Enviando placa para o Gemini..."
        );


        const { data, error } =
            await supabaseClient.functions.invoke(
                "ler-placa-gemini",
                {
                    body: {

                        imageBase64:
                            imagem.base64,

                        mimeType:
                            imagem.mimeType

                    }
                }
            );


        if (error) {

            console.error(
                "Erro Edge Function:",
                error
            );

            throw new Error(
                error.message ||
                "Erro ao consultar o Gemini."
            );

        }


        if (!data || !data.sucesso) {

            throw new Error(
                data?.erro ||
                "O Gemini não retornou os dados."
            );

        }


        console.log(
            "Resultado completo do Gemini:",
            data.dados
        );


        preencherCamposComGemini(
            data.dados
        );


        mostrarStatusOCR(
            "Leitura concluída. Confira os dados antes de salvar."
        );


    } catch (erro) {

        console.error(
            "Erro na leitura da placa:",
            erro
        );


        mostrarStatusOCR(
            "Erro na leitura da placa."
        );


        alert(
            "Não foi possível ler a placa.\n\n" +
            erro.message
        );


    } finally {

        const botao =
            document.getElementById("btnLerPlaca");


        if (botao) {

            botao.disabled = false;

            botao.textContent =
                "Ler placa com IA";

        }

    }

}


// ============================================================
// PREPARAR IMAGEM
// ============================================================

async function prepararImagemParaIA(file) {

    const MAX_WIDTH = 1800;
    const MAX_HEIGHT = 1800;
    const QUALITY = 0.88;


    const img = new Image();

    const url =
        URL.createObjectURL(file);


    try {

        await new Promise(
            (resolve, reject) => {

                img.onload = resolve;

                img.onerror = reject;

                img.src = url;

            }
        );


        let largura =
            img.naturalWidth;

        let altura =
            img.naturalHeight;


        const escala =
            Math.min(
                MAX_WIDTH / largura,
                MAX_HEIGHT / altura,
                1
            );


        largura =
            Math.round(
                largura * escala
            );

        altura =
            Math.round(
                altura * escala
            );


        const canvas =
            document.createElement(
                "canvas"
            );


        canvas.width =
            largura;

        canvas.height =
            altura;


        const ctx =
            canvas.getContext("2d");


        ctx.drawImage(
            img,
            0,
            0,
            largura,
            altura
        );


        const blob =
            await new Promise(
                resolve => {

                    canvas.toBlob(
                        resolve,
                        "image/jpeg",
                        QUALITY
                    );

                }
            );


        if (!blob) {

            throw new Error(
                "Não foi possível preparar a imagem."
            );

        }


        const base64 =
            await blobParaBase64(
                blob
            );


        return {

            base64: base64,

            mimeType:
                "image/jpeg"

        };


    } finally {

        URL.revokeObjectURL(url);

    }

}


// ============================================================
// BLOB → BASE64
// ============================================================

function blobParaBase64(blob) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onloadend = () => {

                const resultado =
                    reader.result;


                const base64 =
                    resultado.split(",")[1];


                resolve(base64);

            };


            reader.onerror =
                reject;


            reader.readAsDataURL(
                blob
            );

        }
    );

}


// ============================================================
// STATUS OCR / IA
// ============================================================

function mostrarStatusOCR(mensagem) {

    const elemento =
        document.getElementById(
            "ocrStatus"
        );


    if (elemento) {

        elemento.textContent =
            mensagem;

    }


    console.log(
        "[IA]",
        mensagem
    );

}


// ============================================================
// PREENCHER FORMULÁRIO COM RESULTADO DO GEMINI
// ============================================================

function preencherCamposComGemini(dados) {

    if (!dados) {
        return;
    }


    preencherSeExistir(
        "fabricante",
        dados.fabricante
    );


    preencherSeExistir(
        "modelo",
        dados.modelo
    );


    preencherSeExistir(
        "potencia_kw",
        dados.potencia_kw
    );


    preencherSeExistir(
        "potencia_cv",
        dados.potencia_cv
    );


    preencherSeExistir(
        "tensao",
        dados.tensao
    );


    // Preferimos mostrar a corrente completa
    // quando a placa possui duas correntes.

    if (
        dados.corrente_texto
    ) {

        preencherSeExistir(
            "corrente_a",
            dados.corrente_texto
        );

    } else {

        preencherSeExistir(
            "corrente_a",
            dados.corrente_a
        );

    }


    preencherSeExistir(
        "rotacao_rpm",
        dados.rotacao_rpm
    );


    preencherSeExistir(
        "frequencia_hz",
        dados.frequencia_hz
    );


    preencherSeExistir(
        "numero_serie",
        dados.numero_serie
    );


    preencherSeExistir(
        "relacao",
        dados.relacao
    );


    preencherSeExistir(
        "rotacao_entrada_rpm",
        dados.rotacao_entrada_rpm
    );


    preencherSeExistir(
        "rotacao_saida_rpm",
        dados.rotacao_saida_rpm
    );


    // Campos adicionais, caso existam no HTML.

    preencherSeExistir(
        "fator_servico",
        dados.fator_servico
    );


    preencherSeExistir(
        "fator_potencia",
        dados.fator_potencia
    );


    preencherSeExistir(
        "rendimento_percentual",
        dados.rendimento_percentual
    );


    preencherSeExistir(
        "classe_isolacao",
        dados.classe_isolacao
    );


    preencherSeExistir(
        "grau_protecao",
        dados.grau_protecao
    );


    preencherSeExistir(
        "regime",
        dados.regime
    );


    preencherSeExistir(
        "estrutura",
        dados.estrutura
    );


    preencherSeExistir(
        "peso_kg",
        dados.peso_kg
    );


    // Observações

    const observacoes =
        document.getElementById(
            "observacoes"
        );


    if (
        observacoes &&
        dados.observacoes_placa
    ) {

        observacoes.value =
            dados.observacoes_placa;

    }


    // Se o tipo ainda não foi escolhido,
    // tentamos identificar automaticamente.

    const tipo =
        document.getElementById(
            "tipo"
        );


    if (tipo) {

        const texto =
            (
                dados.modelo ||
                ""
            ).toLowerCase();


        if (
            dados.relacao ||
            dados.rotacao_saida_rpm
        ) {

            selecionarOpcao(
                tipo,
                "redutor"
            );

        } else if (
            texto.includes("motor") ||
            dados.potencia_kw ||
            dados.potencia_cv
        ) {

            selecionarOpcao(
                tipo,
                "motor"
            );

        }


        atualizarCamposTipo();

    }

}


// ============================================================
// PREENCHER CAMPO
// ============================================================

function preencherSeExistir(
    id,
    valor
) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return;

    }


    const campo =
        document.getElementById(id);


    if (!campo) {

        console.warn(
            `Campo não encontrado: ${id}`
        );

        return;

    }


    campo.value =
        valor;

}


// ============================================================
// SELECIONAR OPÇÃO
// ============================================================

function selecionarOpcao(
    select,
    valor
) {

    const existe =
        Array.from(
            select.options
        ).some(
            opcao =>
                opcao.value === valor
        );


    if (existe) {

        select.value =
            valor;

    }

}


// ============================================================
// CAMPOS DE MOTOR / REDUTOR
// ============================================================

function atualizarCamposTipo() {

    const tipo =
        document.getElementById(
            "tipo"
        );


    const camposRedutor =
        document.getElementById(
            "camposRedutor"
        );


    if (!tipo || !camposRedutor) {
        return;
    }


    if (
        tipo.value === "redutor"
    ) {

        camposRedutor.style.display =
            "block";

    } else {

        camposRedutor.style.display =
            "none";

    }

}


// ============================================================
// LIMPAR FORMULÁRIO
// ============================================================

function limparFormulario() {

    const form =
        document.getElementById(
            "formCadastro"
        );


    if (form) {

        form.reset();

    }


    fotoSelecionada =
        null;


    equipamentoAtual =
        null;


    const preview =
        document.getElementById(
            "previewFoto"
        );


    if (preview) {

        preview.src = "";

        preview.style.display =
            "none";

    }


    const semFoto =
        document.getElementById(
            "semFoto"
        );


    if (semFoto) {

        semFoto.style.display =
            "block";

    }


    mostrarStatusOCR(
        ""
    );


    atualizarCamposTipo();

}


// ============================================================
// COLETAR FORMULÁRIO
// ============================================================

function obterDadosFormulario() {

    return {

        nome:
            valorCampo("nome"),

        local_instalacao:
            valorCampo(
                "local_instalacao"
            ),

        tipo:
            valorCampo("tipo"),

        fabricante:
            valorCampo("fabricante"),

        modelo:
            valorCampo("modelo"),

        potencia_cv:
            numeroCampo(
                "potencia_cv"
            ),

        potencia_kw:
            numeroCampo(
                "potencia_kw"
            ),

        tensao:
            valorCampo("tensao"),

        corrente_a:
            valorCampo("corrente_a"),

        rotacao_rpm:
            numeroCampo(
                "rotacao_rpm"
            ),

        frequencia_hz:
            numeroCampo(
                "frequencia_hz"
            ),

        numero_serie:
            valorCampo(
                "numero_serie"
            ),

        relacao:
            valorCampo("relacao"),

        rotacao_entrada_rpm:
            numeroCampo(
                "rotacao_entrada_rpm"
            ),

        rotacao_saida_rpm:
            numeroCampo(
                "rotacao_saida_rpm"
            ),

        observacoes:
            valorCampo(
                "observacoes"
            )

    };

}


// ============================================================
// VALOR DE CAMPO
// ============================================================

function valorCampo(id) {

    const campo =
        document.getElementById(id);


    if (!campo) {
        return null;
    }


    const valor =
        campo.value.trim();


    return valor === ""
        ? null
        : valor;

}


// ============================================================
// NÚMERO DE CAMPO
// ============================================================

function numeroCampo(id) {

    const valor =
        valorCampo(id);


    if (
        valor === null
    ) {

        return null;

    }


    const normalizado =
        valor
            .replace(",", ".")
            .replace(/[^\d.-]/g, "");


    const numero =
        Number(
            normalizado
        );


    return Number.isFinite(numero)
        ? numero
        : null;

}


// ============================================================
// SALVAR EQUIPAMENTO
// ============================================================

async function salvarEquipamento() {

    try {

        const dados =
            obterDadosFormulario();


        if (!dados.nome) {

            alert(
                "Informe o nome do equipamento."
            );

            return;

        }


        if (!dados.local_instalacao) {

            alert(
                "Informe o local de instalação."
            );

            return;

        }


        if (!dados.tipo) {

            alert(
                "Selecione o tipo do equipamento."
            );

            return;

        }


        const botao =
            document.getElementById(
                "btnSalvar"
            );


        if (botao) {

            botao.disabled =
                true;

            botao.textContent =
                "Salvando...";

        }


        let caminhoFoto =
            null;


        // --------------------------------------------
        // UPLOAD DA FOTO
        // --------------------------------------------

        if (fotoSelecionada) {

            caminhoFoto =
                await enviarFoto(
                    fotoSelecionada
                );

        }


        dados.foto_placa =
            caminhoFoto;


        // --------------------------------------------
        // INSERT
        // --------------------------------------------

        const { data, error } =
            await supabaseClient
                .from("equipamentos")
                .insert([dados])
                .select()
                .single();


        if (error) {

            console.error(
                "Erro ao salvar:",
                error
            );


            // Se o banco falhar depois do upload,
            // tentamos remover a foto.

            if (caminhoFoto) {

                await excluirFoto(
                    caminhoFoto
                );

            }


            throw error;

        }


        equipamentoAtual =
            data;


        alert(
            "Equipamento cadastrado com sucesso!"
        );


        limparFormulario();

        mostrarTela(
            "home"
        );


    } catch (erro) {

        console.error(
            erro
        );


        alert(
            "Não foi possível salvar o equipamento.\n\n" +
            (erro.message || erro)
        );


    } finally {

        const botao =
            document.getElementById(
                "btnSalvar"
            );


        if (botao) {

            botao.disabled =
                false;

            botao.textContent =
                "Salvar equipamento";

        }

    }

}


// ============================================================
// UPLOAD DA FOTO
// ============================================================

async function enviarFoto(file) {

    const extensao =
        obterExtensaoArquivo(
            file.name
        );


    const nomeArquivo =
        crypto.randomUUID() +
        "." +
        extensao;


    const caminho =
        "equipamentos/" +
        nomeArquivo;


    const { error } =
        await supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .upload(
                caminho,
                file,
                {
                    cacheControl:
                        "3600",

                    upsert:
                        false,

                    contentType:
                        file.type ||
                        "image/jpeg"
                }
            );


    if (error) {

        console.error(
            "Erro upload:",
            error
        );

        throw new Error(
            "Não foi possível enviar a foto: " +
            error.message
        );

    }


    return caminho;

}


// ============================================================
// EXTENSÃO
// ============================================================

function obterExtensaoArquivo(nome) {

    const partes =
        nome.split(".");


    if (
        partes.length < 2
    ) {

        return "jpg";

    }


    const extensao =
        partes
            .pop()
            .toLowerCase();


    if (
        ["jpg", "jpeg", "png", "webp"]
            .includes(extensao)
    ) {

        return extensao;

    }


    return "jpg";

}


// ============================================================
// CONSULTAR EQUIPAMENTOS
// ============================================================

async function carregarEquipamentos() {

    const lista =
        document.getElementById(
            "listaEquipamentos"
        );


    if (lista) {

        lista.innerHTML =
            "<p>Carregando...</p>";

    }


    const { data, error } =
        await supabaseClient
            .from("equipamentos")
            .select("*")
            .order(
                "criado_em",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            error
        );


        if (lista) {

            lista.innerHTML =
                "<p>Erro ao carregar equipamentos.</p>";

        }

        return;

    }


    equipamentos =
        data || [];


    renderizarEquipamentos();

}


// ============================================================
// RENDERIZAR LISTA
// ============================================================

function renderizarEquipamentos(
    filtro = ""
) {

    const lista =
        document.getElementById(
            "listaEquipamentos"
        );


    if (!lista) {
        return;
    }


    const busca =
        filtro
            .toLowerCase()
            .trim();


    const resultados =
        equipamentos.filter(
            equipamento => {

                const texto = [

                    equipamento.nome,

                    equipamento.local_instalacao,

                    equipamento.tipo,

                    equipamento.fabricante,

                    equipamento.modelo,

                    equipamento.numero_serie

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                return texto.includes(
                    busca
                );

            }
        );


    if (
        resultados.length === 0
    ) {

        lista.innerHTML =
            "<p>Nenhum equipamento encontrado.</p>";

        return;

    }


    lista.innerHTML =
        resultados
            .map(
                equipamento =>
                    criarCardEquipamento(
                        equipamento
                    )
            )
            .join("");


    lista
        .querySelectorAll(
            "[data-equipamento-id]"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const id =
                        card.dataset
                            .equipamentoId;


                    abrirDetalhes(
                        id
                    );

                }
            );

        });

}


// ============================================================
// CARD
// ============================================================

function criarCardEquipamento(
    equipamento
) {

    const tipo =
        equipamento.tipo === "motor"
            ? "Motor elétrico"
            : equipamento.tipo === "redutor"
                ? "Redutor"
                : "Outro";


    return `
        <div
            class="card-equipamento"
            data-equipamento-id="${escapeHtml(equipamento.id)}"
        >

            <div class="card-conteudo">

                <h3>
                    ${escapeHtml(
                        equipamento.nome ||
                        "Equipamento"
                    )}
                </h3>

                <p>
                    ${escapeHtml(tipo)}
                </p>

                <p>
                    ${escapeHtml(
                        equipamento.fabricante ||
                        ""
                    )}
                    ${equipamento.modelo
                        ? " • " +
                          escapeHtml(
                              equipamento.modelo
                          )
                        : ""
                    }
                </p>

                <small>
                    ${escapeHtml(
                        equipamento.local_instalacao ||
                        ""
                    )}
                </small>

            </div>

        </div>
    `;

}


// ============================================================
// DETALHES
// ============================================================

async function abrirDetalhes(id) {

    const equipamento =
        equipamentos.find(
            item =>
                item.id === id
        );


    if (!equipamento) {
        return;
    }


    equipamentoAtual =
        equipamento;


    preencherDetalhes(
        equipamento
    );


    mostrarTela(
        "detalhes"
    );

}


// ============================================================
// PREENCHER DETALHES
// ============================================================

async function preencherDetalhes(
    equipamento
) {

    preencherTexto(
        "detNome",
        equipamento.nome
    );

    preencherTexto(
        "detLocal",
        equipamento.local_instalacao
    );

    preencherTexto(
        "detTipo",
        equipamento.tipo
    );

    preencherTexto(
        "detFabricante",
        equipamento.fabricante
    );

    preencherTexto(
        "detModelo",
        equipamento.modelo
    );

    preencherTexto(
        "detPotencia",
        montarPotencia(
            equipamento
        )
    );

    preencherTexto(
        "detTensao",
        equipamento.tensao
    );

    preencherTexto(
        "detCorrente",
        equipamento.corrente_a
    );

    preencherTexto(
        "detRotacao",
        equipamento.rotacao_rpm
    );

    preencherTexto(
        "detFrequencia",
        equipamento.frequencia_hz
    );

    preencherTexto(
        "detSerie",
        equipamento.numero_serie
    );

    preencherTexto(
        "detRelacao",
        equipamento.relacao
    );

    preencherTexto(
        "detRotacaoEntrada",
        equipamento.rotacao_entrada_rpm
    );

    preencherTexto(
        "detRotacaoSaida",
        equipamento.rotacao_saida_rpm
    );

    preencherTexto(
        "detObservacoes",
        equipamento.observacoes
    );


    // FOTO

    const imagem =
        document.getElementById(
            "detFoto"
        );


    const semFoto =
        document.getElementById(
            "semFotoDetalhes"
        );


    if (imagem) {

        imagem.style.display =
            "none";

    }


    if (semFoto) {

        semFoto.style.display =
            "block";

    }


    if (
        equipamento.foto_placa
    ) {

        const url =
            await obterUrlFoto(
                equipamento.foto_placa
            );


        if (
            url &&
            imagem
        ) {

            imagem.src =
                url;

            imagem.style.display =
                "block";


            if (semFoto) {

                semFoto.style.display =
                    "none";

            }

        }

    }

}


// ============================================================
// URL DA FOTO
// ============================================================

async function obterUrlFoto(
    valor
) {

    if (!valor) {
        return null;
    }


    const caminho =
        extrairCaminhoFoto(
            valor
        );


    if (!caminho) {
        return null;
    }


    // Usamos URL assinada.
    // Assim o bucket pode permanecer privado.

    const { data, error } =
        await supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(
                caminho,
                3600
            );


    if (error) {

        console.error(
            "Erro ao criar URL da foto:",
            error
        );

        return null;

    }


    return data?.signedUrl ||
        null;

}


// ============================================================
// EXTRAIR CAMINHO DA FOTO
// ============================================================

function extrairCaminhoFoto(
    valor
) {

    if (!valor) {
        return null;
    }


    // Foto nova salva como:
    // equipamentos/arquivo.jpg

    if (
        !valor.startsWith(
            "http://"
        ) &&
        !valor.startsWith(
            "https://"
        )
    ) {

        return valor;

    }


    // Compatibilidade com URLs antigas

    const marcador =
        `/storage/v1/object/public/${STORAGE_BUCKET}/`;


    const posicao =
        valor.indexOf(
            marcador
        );


    if (
        posicao >= 0
    ) {

        return valor.substring(
            posicao +
            marcador.length
        );

    }


    return null;

}


// ============================================================
// EDITAR
// ============================================================

function abrirEdicao() {

    if (!equipamentoAtual) {
        return;
    }


    preencherCampo(
        "editNome",
        equipamentoAtual.nome
    );

    preencherCampo(
        "editLocal",
        equipamentoAtual.local_instalacao
    );

    preencherCampo(
        "editTipo",
        equipamentoAtual.tipo
    );

    preencherCampo(
        "editFabricante",
        equipamentoAtual.fabricante
    );

    preencherCampo(
        "editModelo",
        equipamentoAtual.modelo
    );

    preencherCampo(
        "editPotenciaCV",
        equipamentoAtual.potencia_cv
    );

    preencherCampo(
        "editPotenciaKW",
        equipamentoAtual.potencia_kw
    );

    preencherCampo(
        "editTensao",
        equipamentoAtual.tensao
    );

    preencherCampo(
        "editCorrente",
        equipamentoAtual.corrente_a
    );

    preencherCampo(
        "editRotacao",
        equipamentoAtual.rotacao_rpm
    );

    preencherCampo(
        "editFrequencia",
        equipamentoAtual.frequencia_hz
    );

    preencherCampo(
        "editSerie",
        equipamentoAtual.numero_serie
    );

    preencherCampo(
        "editRelacao",
        equipamentoAtual.relacao
    );

    preencherCampo(
        "editRotacaoEntrada",
        equipamentoAtual.rotacao_entrada_rpm
    );

    preencherCampo(
        "editRotacaoSaida",
        equipamentoAtual.rotacao_saida_rpm
    );

    preencherCampo(
        "editObservacoes",
        equipamentoAtual.observacoes
    );


    mostrarTela(
        "edicao"
    );

}


// ============================================================
// ATUALIZAR EQUIPAMENTO
// ============================================================

async function atualizarEquipamento() {

    if (!equipamentoAtual) {
        return;
    }


    try {

        const dados = {

            nome:
                valorCampoId(
                    "editNome"
                ),

            local_instalacao:
                valorCampoId(
                    "editLocal"
                ),

            tipo:
                valorCampoId(
                    "editTipo"
                ),

            fabricante:
                valorCampoId(
                    "editFabricante"
                ),

            modelo:
                valorCampoId(
                    "editModelo"
                ),

            potencia_cv:
                numeroCampoId(
                    "editPotenciaCV"
                ),

            potencia_kw:
                numeroCampoId(
                    "editPotenciaKW"
                ),

            tensao:
                valorCampoId(
                    "editTensao"
                ),

            corrente_a:
                valorCampoId(
                    "editCorrente"
                ),

            rotacao_rpm:
                numeroCampoId(
                    "editRotacao"
                ),

            frequencia_hz:
                numeroCampoId(
                    "editFrequencia"
                ),

            numero_serie:
                valorCampoId(
                    "editSerie"
                ),

            relacao:
                valorCampoId(
                    "editRelacao"
                ),

            rotacao_entrada_rpm:
                numeroCampoId(
                    "editRotacaoEntrada"
                ),

            rotacao_saida_rpm:
                numeroCampoId(
                    "editRotacaoSaida"
                ),

            observacoes:
                valorCampoId(
                    "editObservacoes"
                ),

            atualizado_em:
                new Date().toISOString()

        };


        const inputFoto =
            document.getElementById(
                "editFotoInput"
            );


        let novaFoto =
            null;


        if (
            inputFoto &&
            inputFoto.files &&
            inputFoto.files.length > 0
        ) {

            novaFoto =
                inputFoto.files[0];

        }


        if (novaFoto) {

            const novoCaminho =
                await enviarFoto(
                    novaFoto
                );


            dados.foto_placa =
                novoCaminho;

        }


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

            throw error;

        }


        // Se houve foto nova, removemos a antiga.

        if (
            novaFoto &&
            equipamentoAtual.foto_placa
        ) {

            await excluirFoto(
                equipamentoAtual.foto_placa
            );

        }


        equipamentoAtual =
            data;


        // Atualiza também a lista local

        const indice =
            equipamentos.findIndex(
                item =>
                    item.id === data.id
            );


        if (
            indice >= 0
        ) {

            equipamentos[indice] =
                data;

        }


        alert(
            "Equipamento atualizado com sucesso!"
        );


        preencherDetalhes(
            data
        );


        mostrarTela(
            "detalhes"
        );


    } catch (erro) {

        console.error(
            erro
        );


        alert(
            "Não foi possível atualizar o equipamento.\n\n" +
            (erro.message || erro)
        );

    }

}


// ============================================================
// EXCLUIR EQUIPAMENTO
// ============================================================

async function excluirEquipamento() {

    if (!equipamentoAtual) {
        return;
    }


    const confirmar =
        confirm(
            "Tem certeza que deseja excluir este equipamento?"
        );


    if (!confirmar) {
        return;
    }


    try {

        const { error } =
            await supabaseClient
                .from("equipamentos")
                .delete()
                .eq(
                    "id",
                    equipamentoAtual.id
                );


        if (error) {

            throw error;

        }


        if (
            equipamentoAtual.foto_placa
        ) {

            await excluirFoto(
                equipamentoAtual.foto_placa
            );

        }


        equipamentos =
            equipamentos.filter(
                item =>
                    item.id !==
                    equipamentoAtual.id
            );


        equipamentoAtual =
            null;


        alert(
            "Equipamento excluído com sucesso!"
        );


        mostrarTela(
            "consulta"
        );


        renderizarEquipamentos();


    } catch (erro) {

        console.error(
            erro
        );


        alert(
            "Não foi possível excluir o equipamento.\n\n" +
            (erro.message || erro)
        );

    }

}


// ============================================================
// EXCLUIR FOTO
// ============================================================

async function excluirFoto(
    valor
) {

    const caminho =
        extrairCaminhoFoto(
            valor
        );


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

        console.error(
            "Erro ao excluir foto:",
            error
        );

    }

}


// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function preencherTexto(
    id,
    valor
) {

    const elemento =
        document.getElementById(id);


    if (elemento) {

        elemento.textContent =
            valor ??
            "-";

    }

}


function preencherCampo(
    id,
    valor
) {

    const campo =
        document.getElementById(id);


    if (campo) {

        campo.value =
            valor ??
            "";

    }

}


function valorCampoId(
    id
) {

    const campo =
        document.getElementById(id);


    if (!campo) {
        return null;
    }


    const valor =
        campo.value.trim();


    return valor === ""
        ? null
        : valor;

}


function numeroCampoId(
    id
) {

    const valor =
        valorCampoId(id);


    if (
        valor === null
    ) {

        return null;

    }


    const normalizado =
        valor
            .replace(",", ".")
            .replace(/[^\d.-]/g, "");


    const numero =
        Number(
            normalizado
        );


    return Number.isFinite(numero)
        ? numero
        : null;

}


function montarPotencia(
    equipamento
) {

    const valores = [];


    if (
        equipamento.potencia_kw !==
        null &&
        equipamento.potencia_kw !==
        undefined
    ) {

        valores.push(
            equipamento.potencia_kw +
            " kW"
        );

    }


    if (
        equipamento.potencia_cv !==
        null &&
        equipamento.potencia_cv !==
        undefined
    ) {

        valores.push(
            equipamento.potencia_cv +
            " CV"
        );

    }


    return valores.length
        ? valores.join(" / ")
        : null;

}


// ============================================================
// ESCAPAR HTML
// ============================================================

function escapeHtml(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "";

    }


    return String(valor)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// EXPOR FUNÇÕES PARA O HTML
// ============================================================
//
// Caso o seu index.html use onclick="...",
// mantemos estas funções disponíveis globalmente.
// ============================================================

window.mostrarTela =
    mostrarTela;

window.abrirDetalhes =
    abrirDetalhes;

window.abrirEdicao =
    abrirEdicao;

window.excluirEquipamento =
    excluirEquipamento;

window.salvarEquipamento =
    salvarEquipamento;

window.atualizarEquipamento =
    atualizarEquipamento;

window.processarPlacaComIA =
    processarPlacaComIA;

window.atualizarCamposTipo =
    atualizarCamposTipo;
