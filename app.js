// =====================================================
// CONFIGURAÇÃO SUPABASE
// =====================================================

const SUPABASE_URL = "https://kxuzpnlizvmluroxenlg.supabase.co";
const SUPABASE_KEY = "sb_publishable_2VUSWEN1y8Ggvl5qIfhthA_0P1v7bWP";

const STORAGE_BUCKET = "fotos-equipamentos";
const EDGE_FUNCTION = "ler-placa-gemini";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let equipamentos = [];
let equipamentoAtual = null;
let fotoSelecionada = null;
let filtroAtual = "todos";
let timerMensagem;


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    document
        .getElementById("btnCamera")
        ?.addEventListener("click", () => {
            document.getElementById("fotoCamera").click();
        });

    document
        .getElementById("btnGaleria")
        ?.addEventListener("click", () => {
            document.getElementById("fotoGaleria").click();
        });

    document
        .getElementById("fotoCamera")
        ?.addEventListener("change", e => {
            processarFoto(e.target.files?.[0]);
        });

    document
        .getElementById("fotoGaleria")
        ?.addEventListener("change", e => {
            processarFoto(e.target.files?.[0]);
        });

    document
        .getElementById("editFoto")
        ?.addEventListener("change", e => {
            previewEdicao(e.target.files?.[0]);
        });

    document
        .getElementById("tipo")
        ?.addEventListener("change", camposRedutor);

    document
        .getElementById("editTipo")
        ?.addEventListener("change", camposRedutorEdicao);

    document
        .getElementById("btnSalvar")
        ?.addEventListener("click", salvarEquipamento);

    document
        .getElementById("busca")
        ?.addEventListener("input", renderizarLista);

    document.querySelectorAll(".filtro").forEach(botao => {

        botao.addEventListener("click", () => {

            filtroAtual = botao.dataset.filtro;

            document
                .querySelectorAll(".filtro")
                .forEach(x => x.classList.remove("ativo"));

            botao.classList.add("ativo");

            renderizarLista();
        });
    });

    mostrarTela("telaHome");
});


/* =========================================================
   NAVEGAÇÃO
========================================================= */

function mostrarTela(id) {

    document
        .querySelectorAll(".tela")
        .forEach(x => x.classList.remove("ativa"));

    document
        .getElementById(id)
        ?.classList.add("ativa");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function abrirCadastro() {

    limparCadastro();

    mostrarTela("telaCadastro");
}


function abrirConsulta() {

    mostrarTela("telaConsulta");

    carregarEquipamentos();
}


function voltarHome() {

    mostrarTela("telaHome");
}


function voltarConsulta() {

    cancelarEdicao();

    mostrarTela("telaConsulta");
}


/* =========================================================
   CADASTRO
========================================================= */

function limparCadastro() {

    [
        "nome",
        "local",
        "tipo",
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
    ].forEach(id => {

        setValue(id, "");

    });

    fotoSelecionada = null;

    document
        .getElementById("previewContainer")
        ?.classList.add("oculto");

    document
        .getElementById("previewFoto")
        ?.removeAttribute("src");

    status("", "");

    camposRedutor();
}


/* =========================================================
   FOTO + GEMINI
========================================================= */

async function processarFoto(file) {

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {

        msg(
            "Selecione uma imagem válida.",
            "erro"
        );

        return;
    }

    try {

        const imagem = await prepararImagem(file);

        fotoSelecionada = {
            file: file,
            ...imagem
        };

        const preview =
            document.getElementById("previewFoto");

        preview.src = imagem.dataUrl;

        document
            .getElementById("previewContainer")
            .classList.remove("oculto");

        status(
            "Lendo a placa com inteligência artificial...",
            ""
        );


        /*
         * Envia a imagem para a Edge Function.
         *
         * A chave do Gemini NÃO fica neste arquivo.
         */

        const resposta =
            await supabaseClient.functions.invoke(
                EDGE_FUNCTION,
                {
                    body: {
                        imageBase64: imagem.base64,
                        mimeType: imagem.mimeType
                    }
                }
            );


        if (resposta.error) {
            throw resposta.error;
        }


        if (!resposta.data?.sucesso) {

            throw new Error(
                resposta.data?.erro ||
                "Falha na leitura da placa."
            );
        }


        const dados =
            resposta.data.dados || {};


        preencherCamposComIA(dados);


        status(
            "Leitura concluída. Confira os dados antes de salvar.",
            "sucesso"
        );

        msg(
            "Placa lida com sucesso.",
            "sucesso"
        );


    } catch (erro) {

        console.error(
            "Erro ao ler placa:",
            erro
        );

        status(
            "Não foi possível ler a placa. Preencha os dados manualmente se necessário.",
            "erro"
        );

        msg(
            "Falha na leitura automática.",
            "erro"
        );
    }
}


/* =========================================================
   PREPARAÇÃO DA IMAGEM
========================================================= */

function prepararImagem(
    file,
    max = 1800,
    qualidade = 0.88
) {

    return new Promise((resolve, reject) => {

        const reader =
            new FileReader();

        reader.onload = () => {

            const imagem =
                new Image();

            imagem.onload = () => {

                let largura = imagem.width;
                let altura = imagem.height;

                const escala =
                    Math.min(
                        1,
                        max / largura,
                        max / altura
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
                    document.createElement("canvas");

                canvas.width = largura;
                canvas.height = altura;


                const contexto =
                    canvas.getContext("2d");

                contexto.drawImage(
                    imagem,
                    0,
                    0,
                    largura,
                    altura
                );


                const dataUrl =
                    canvas.toDataURL(
                        "image/jpeg",
                        qualidade
                    );


                resolve({
                    base64: dataUrl.split(",")[1],
                    mimeType: "image/jpeg",
                    dataUrl: dataUrl
                });
            };


            imagem.onerror = () => {

                reject(
                    new Error("Imagem inválida.")
                );
            };


            imagem.src = reader.result;
        };


        reader.onerror = () => {

            reject(reader.error);
        };


        reader.readAsDataURL(file);
    });
}


/* =========================================================
   PREENCHER CAMPOS COM RESULTADO DO GEMINI
========================================================= */

function preencherCamposComIA(dados) {

    setValue(
        "fabricante",
        dados.fabricante
    );

    setValue(
        "modelo",
        dados.modelo
    );


    /*
     * Se o Gemini encontrar CV,
     * usamos diretamente.
     *
     * Caso encontre somente kW,
     * convertemos para CV.
     */

    let potenciaCV =
        num(dados.potencia_cv);

    const potenciaKW =
        num(dados.potencia_kw);


    if (
        potenciaCV === null &&
        potenciaKW !== null
    ) {

        potenciaCV =
            potenciaKW / 0.73549875;
    }


    setValue(
        "potencia_cv",
        potenciaCV === null
            ? ""
            : potenciaCV.toFixed(2)
    );


    setValue(
        "tensao",
        dados.tensao
    );


    setValue(
        "corrente_a",
        num(dados.corrente_a) ?? ""
    );


    setValue(
        "rotacao_rpm",
        num(dados.rotacao_rpm) ?? ""
    );


    setValue(
        "frequencia_hz",
        num(dados.frequencia_hz) ?? ""
    );


    setValue(
        "numero_serie",
        dados.numero_serie
    );


    setValue(
        "relacao",
        dados.relacao
    );


    setValue(
        "rotacao_entrada_rpm",
        num(dados.rotacao_entrada_rpm) ?? ""
    );


    setValue(
        "rotacao_saida_rpm",
        num(dados.rotacao_saida_rpm) ?? ""
    );


    /*
     * Tenta determinar automaticamente
     * se é motor ou redutor.
     */

    const textoIA =
        JSON.stringify(dados)
            .toLowerCase();


    if (
        dados.relacao ||
        textoIA.includes("redutor")
    ) {

        setValue(
            "tipo",
            "Redutor"
        );

    } else if (
        dados.fabricante ||
        dados.potencia_cv ||
        dados.potencia_kw
    ) {

        setValue(
            "tipo",
            "Motor elétrico"
        );
    }


    /*
     * Informações que não possuem
     * coluna própria no banco são
     * preservadas em observações.
     */

    const observacoes = [];


    if (dados.corrente_texto) {

        observacoes.push(
            "Corrente da placa: " +
            dados.corrente_texto
        );
    }


    if (dados.fator_servico != null) {

        observacoes.push(
            "Fator de serviço: " +
            dados.fator_servico
        );
    }


    if (dados.fator_potencia != null) {

        observacoes.push(
            "Fator de potência: " +
            dados.fator_potencia
        );
    }


    if (dados.rendimento_percentual != null) {

        observacoes.push(
            "Rendimento: " +
            dados.rendimento_percentual +
            "%"
        );
    }


    if (dados.classe_isolacao) {

        observacoes.push(
            "Classe de isolação: " +
            dados.classe_isolacao
        );
    }


    if (dados.grau_protecao) {

        observacoes.push(
            "Grau de proteção: " +
            dados.grau_protecao
        );
    }


    if (dados.regime) {

        observacoes.push(
            "Regime: " +
            dados.regime
        );
    }


    if (dados.estrutura) {

        observacoes.push(
            "Estrutura: " +
            dados.estrutura
        );
    }


    if (dados.peso_kg != null) {

        observacoes.push(
            "Peso: " +
            dados.peso_kg +
            " kg"
        );
    }


    if (dados.observacoes_placa) {

        observacoes.push(
            dados.observacoes_placa
        );
    }


    setValue(
        "observacoes",
        observacoes.join("\n")
    );


    camposRedutor();
}


/* =========================================================
   SALVAR EQUIPAMENTO
========================================================= */

async function salvarEquipamento() {

    const botao =
        document.getElementById("btnSalvar");


    const nome =
        value("nome").trim();

    const local =
        value("local").trim();

    const tipo =
        value("tipo").trim();


    if (!nome || !local || !tipo) {

        msg(
            "Preencha nome, local e tipo.",
            "erro"
        );

        return;
    }


    botao.disabled = true;

    botao.classList.add("carregando");

    botao.textContent = "Salvando...";


    try {

        const registro = {

            nome: nome,

            local_instalacao: local,

            tipo: tipo,

            fabricante:
                texto("fabricante"),

            modelo:
                texto("modelo"),

            potencia_cv:
                numero("potencia_cv"),

            tensao:
                texto("tensao"),

            corrente_a:
                numero("corrente_a"),

            rotacao_rpm:
                numero("rotacao_rpm"),

            frequencia_hz:
                numero("frequencia_hz"),

            numero_serie:
                texto("numero_serie"),

            relacao:
                texto("relacao"),

            rotacao_entrada_rpm:
                numero("rotacao_entrada_rpm"),

            rotacao_saida_rpm:
                numero("rotacao_saida_rpm"),

            observacoes:
                texto("observacoes")
        };


        /*
         * Primeiro salva o registro
         * no banco.
         */

        let {
            data,
            error
        } =
            await supabaseClient
                .from("equipamentos")
                .insert(registro)
                .select()
                .single();


        if (error) {
            throw error;
        }


        /*
         * Depois envia a foto.
         */

        if (fotoSelecionada?.file) {

            const caminho =
                await enviarFoto(
                    fotoSelecionada.file,
                    data.id
                );


            const resultadoFoto =
                await supabaseClient
                    .from("equipamentos")
                    .update({
                        foto_placa: caminho
                    })
                    .eq("id", data.id);


            if (resultadoFoto.error) {

                await removerFoto(caminho);

                throw resultadoFoto.error;
            }
        }


        msg(
            "Equipamento salvo com sucesso.",
            "sucesso"
        );


        setTimeout(
            abrirConsulta,
            600
        );


    } catch (erro) {

        console.error(
            "Erro ao salvar:",
            erro
        );

        msg(
            "Não foi possível salvar: " +
            mensagemErro(erro),
            "erro"
        );


    } finally {

        botao.disabled = false;

        botao.classList.remove(
            "carregando"
        );

        botao.textContent =
            "Salvar equipamento";
    }
}


/* =========================================================
   UPLOAD DA FOTO
========================================================= */

async function enviarFoto(
    file,
    id
) {

    const extensao =
        (
            file.name
                .split(".")
                .pop() ||
            "jpg"
        ).toLowerCase();


    const extensoesPermitidas = [
        "jpg",
        "jpeg",
        "png",
        "webp"
    ];


    const extensaoFinal =
        extensoesPermitidas.includes(
            extensao
        )
            ? extensao
            : "jpg";


    const caminho =
        `equipamentos/${id}.${extensaoFinal}`;


    const {
        error
    } =
        await supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .upload(
                caminho,
                file,
                {
                    upsert: true,
                    contentType:
                        file.type ||
                        "image/jpeg"
                }
            );


    if (error) {
        throw error;
    }


    return caminho;
}


/* =========================================================
   CONSULTA
========================================================= */

async function carregarEquipamentos() {

    const lista =
        document.getElementById(
            "listaEquipamentos"
        );


    lista.innerHTML =
        `
        <div class="lista-vazia">
            Carregando equipamentos...
        </div>
        `;


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("equipamentos")
                .select("*")
                .order("nome");


        if (error) {
            throw error;
        }


        equipamentos =
            data || [];


        renderizarLista();


    } catch (erro) {

        console.error(
            "Erro ao carregar:",
            erro
        );


        lista.innerHTML =
            `
            <div class="lista-vazia">
                Não foi possível carregar os equipamentos.
                <br>
                <small>
                    ${esc(
                        mensagemErro(erro)
                    )}
                </small>
            </div>
            `;
    }
}


/* =========================================================
   RENDERIZAR LISTA
========================================================= */

function renderizarLista() {

    const lista =
        document.getElementById(
            "listaEquipamentos"
        );


    const pesquisa =
        value("busca")
            .trim()
            .toLowerCase();


    const filtrados =
        equipamentos.filter(equipamento => {

            const textoBusca = [

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


            const correspondePesquisa =
                !pesquisa ||
                textoBusca.includes(
                    pesquisa
                );


            let correspondeFiltro =
                true;


            if (
                filtroAtual === "motor"
            ) {

                correspondeFiltro =
                    String(
                        equipamento.tipo || ""
                    )
                        .toLowerCase()
                        .includes("motor");
            }


            if (
                filtroAtual === "redutor"
            ) {

                correspondeFiltro =
                    String(
                        equipamento.tipo || ""
                    )
                        .toLowerCase()
                        .includes("redutor");
            }


            return (
                correspondePesquisa &&
                correspondeFiltro
            );
        });


    if (!filtrados.length) {

        lista.innerHTML =
            `
            <div class="lista-vazia">
                Nenhum equipamento encontrado.
            </div>
            `;

        return;
    }


    lista.innerHTML =
        filtrados
            .map(equipamento => {

                return `
                    <div
                        class="equipamento-item"
                        onclick="abrirDetalhes('${equipamento.id}')"
                    >

                        <div class="item-linha">

                            <div>

                                <h3>
                                    ${esc(
                                        equipamento.nome ||
                                        "Sem nome"
                                    )}
                                </h3>

                                <p>
                                    ${esc(
                                        equipamento.local_instalacao ||
                                        "-"
                                    )}
                                </p>

                            </div>


                            <span class="badge">
                                ${esc(
                                    equipamento.tipo ||
                                    "-"
                                )}
                            </span>

                        </div>


                        <p>
                            ${esc(
                                equipamento.fabricante ||
                                ""
                            )}

                            ${
                                equipamento.modelo
                                    ? " • " +
                                      esc(
                                          equipamento.modelo
                                      )
                                    : ""
                            }
                        </p>

                    </div>
                `;
            })
            .join("");
}


/* =========================================================
   DETALHES
========================================================= */

async function abrirDetalhes(id) {

    equipamentoAtual =
        equipamentos.find(
            equipamento =>
                equipamento.id === id
        );


    if (!equipamentoAtual) {
        return;
    }


    preencherDetalhes(
        equipamentoAtual
    );


    mostrarTela(
        "telaDetalhes"
    );


    await carregarFoto(
        equipamentoAtual.foto_placa
    );
}


/* =========================================================
   PREENCHER DETALHES
========================================================= */

function preencherDetalhes(equipamento) {

    setText(
        "detNome",
        equipamento.nome || "-"
    );

    setText(
        "detLocal",
        equipamento.local_instalacao || "-"
    );

    setText(
        "detTipo",
        equipamento.tipo || "-"
    );

    setText(
        "detFabricante",
        equipamento.fabricante || "-"
    );

    setText(
        "detModelo",
        equipamento.modelo || "-"
    );


    setText(
        "detPotencia",
        equipamento.potencia_cv == null
            ? "-"
            : equipamento.potencia_cv +
              " CV"
    );


    setText(
        "detTensao",
        equipamento.tensao || "-"
    );


    setText(
        "detCorrente",
        equipamento.corrente_a == null
            ? "-"
            : equipamento.corrente_a +
              " A"
    );


    setText(
        "detRotacao",
        equipamento.rotacao_rpm == null
            ? "-"
            : equipamento.rotacao_rpm +
              " RPM"
    );


    setText(
        "detFrequencia",
        equipamento.frequencia_hz == null
            ? "-"
            : equipamento.frequencia_hz +
              " Hz"
    );


    setText(
        "detSerie",
        equipamento.numero_serie || "-"
    );


    setText(
        "detRelacao",
        equipamento.relacao || "-"
    );


    setText(
        "detEntrada",
        equipamento.rotacao_entrada_rpm == null
            ? "-"
            : equipamento.rotacao_entrada_rpm +
              " RPM"
    );


    setText(
        "detSaida",
        equipamento.rotacao_saida_rpm == null
            ? "-"
            : equipamento.rotacao_saida_rpm +
              " RPM"
    );


    setText(
        "detObservacoes",
        equipamento.observacoes || "-"
    );


    const ehRedutor =
        String(
            equipamento.tipo || ""
        )
            .toLowerCase()
            .includes("redutor");


    document
        .getElementById("detRedutorBox")
        .classList.toggle(
            "oculto",
            !ehRedutor
        );


    document
        .getElementById("modoVisualizacao")
        .classList.remove("oculto");


    document
        .getElementById("modoEdicao")
        .classList.add("oculto");
}


/* =========================================================
   CARREGAR FOTO COM URL ASSINADA
========================================================= */

async function carregarFoto(valor) {

    const imagem =
        document.getElementById(
            "detFoto"
        );

    const semFoto =
        document.getElementById(
            "semFoto"
        );


    imagem.removeAttribute("src");

    imagem.classList.add(
        "oculto"
    );

    semFoto.classList.remove(
        "oculto"
    );


    if (!valor) {
        return;
    }


    const caminho =
        extrairCaminhoFoto(valor);


    if (!caminho) {
        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(
                caminho,
                3600
            );


    if (
        error ||
        !data?.signedUrl
    ) {

        console.error(
            "Erro ao criar URL da foto:",
            error
        );

        return;
    }


    imagem.onload = () => {

        imagem.classList.remove(
            "oculto"
        );

        semFoto.classList.add(
            "oculto"
        );
    };


    imagem.src =
        data.signedUrl;
}


/* =========================================================
   EXTRAIR CAMINHO DA FOTO
========================================================= */

function extrairCaminhoFoto(valor) {

    if (!valor) {
        return null;
    }


    /*
     * Novo formato:
     *
     * equipamentos/UUID.jpg
     */

    if (
        !/^https?:\/\//i.test(valor)
    ) {

        return valor;
    }


    /*
     * Compatibilidade com fotos
     * antigas salvas como URL pública.
     */

    const urlPublica =
        `/storage/v1/object/public/${STORAGE_BUCKET}/`;


    const urlAssinada =
        `/storage/v1/object/sign/${STORAGE_BUCKET}/`;


    if (
        valor.includes(
            urlPublica
        )
    ) {

        return decodeURIComponent(
            valor
                .split(urlPublica)[1]
                .split("?")[0]
        );
    }


    if (
        valor.includes(
            urlAssinada
        )
    ) {

        return decodeURIComponent(
            valor
                .split(urlAssinada)[1]
                .split("?")[0]
        );
    }


    return null;
}


/* =========================================================
   EDIÇÃO
========================================================= */

function ativarEdicao() {

    if (!equipamentoAtual) {
        return;
    }


    const equipamento =
        equipamentoAtual;


    setValue(
        "editNome",
        equipamento.nome
    );

    setValue(
        "editLocal",
        equipamento.local_instalacao
    );

    setValue(
        "editTipo",
        equipamento.tipo
    );

    setValue(
        "editFabricante",
        equipamento.fabricante
    );

    setValue(
        "editModelo",
        equipamento.modelo
    );

    setValue(
        "editPotencia",
        equipamento.potencia_cv
    );

    setValue(
        "editTensao",
        equipamento.tensao
    );

    setValue(
        "editCorrente",
        equipamento.corrente_a
    );

    setValue(
        "editRotacao",
        equipamento.rotacao_rpm
    );

    setValue(
        "editFrequencia",
        equipamento.frequencia_hz
    );

    setValue(
        "editSerie",
        equipamento.numero_serie
    );

    setValue(
        "editRelacao",
        equipamento.relacao
    );

    setValue(
        "editEntrada",
        equipamento.rotacao_entrada_rpm
    );

    setValue(
        "editSaida",
        equipamento.rotacao_saida_rpm
    );

    setValue(
        "editObservacoes",
        equipamento.observacoes
    );


    document
        .getElementById("editFoto")
        .value = "";


    document
        .getElementById("editPreviewFoto")
        .classList.add("oculto");


    camposRedutorEdicao();


    document
        .getElementById("modoVisualizacao")
        .classList.add("oculto");


    document
        .getElementById("modoEdicao")
        .classList.remove("oculto");
}


/* =========================================================
   CANCELAR EDIÇÃO
========================================================= */

function cancelarEdicao() {

    document
        .getElementById("modoVisualizacao")
        ?.classList.remove(
            "oculto"
        );


    document
        .getElementById("modoEdicao")
        ?.classList.add(
            "oculto"
        );
}


/* =========================================================
   SELECIONAR FOTO NA EDIÇÃO
========================================================= */

function selecionarFotoEdicao() {

    document
        .getElementById("editFoto")
        .click();
}


/* =========================================================
   PREVIEW DA FOTO NA EDIÇÃO
========================================================= */

async function previewEdicao(file) {

    if (!file) {
        return;
    }


    const imagem =
        await prepararImagem(file);


    const preview =
        document.getElementById(
            "editPreviewFoto"
        );


    preview.src =
        imagem.dataUrl;


    preview.classList.remove(
        "oculto"
    );
}


/* =========================================================
   SALVAR ALTERAÇÕES
========================================================= */

async function salvarAlteracoes() {

    if (!equipamentoAtual) {
        return;
    }


    const dados = {

        nome:
            value("editNome").trim(),

        local_instalacao:
            value("editLocal").trim(),

        tipo:
            value("editTipo"),

        fabricante:
            texto("editFabricante"),

        modelo:
            texto("editModelo"),

        potencia_cv:
            numero("editPotencia"),

        tensao:
            texto("editTensao"),

        corrente_a:
            numero("editCorrente"),

        rotacao_rpm:
            numero("editRotacao"),

        frequencia_hz:
            numero("editFrequencia"),

        numero_serie:
            texto("editSerie"),

        relacao:
            texto("editRelacao"),

        rotacao_entrada_rpm:
            numero("editEntrada"),

        rotacao_saida_rpm:
            numero("editSaida"),

        observacoes:
            texto("editObservacoes"),

        atualizado_em:
            new Date().toISOString()
    };


    try {

        const arquivo =
            document
                .getElementById("editFoto")
                .files?.[0];


        const fotoAntiga =
            equipamentoAtual.foto_placa;


        /*
         * Se o usuário escolheu uma
         * nova foto, fazemos o upload.
         */

        if (arquivo) {

            dados.foto_placa =
                await enviarFoto(
                    arquivo,
                    equipamentoAtual.id
                );
        }


        const {
            data,
            error
        } =
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


        /*
         * Remove a foto antiga somente
         * depois que a atualização
         * foi concluída.
         */

        if (
            arquivo &&
            fotoAntiga &&
            dados.foto_placa !== fotoAntiga
        ) {

            await removerFoto(
                fotoAntiga
            );
        }


        equipamentoAtual =
            data;


        const indice =
            equipamentos.findIndex(
                equipamento =>
                    equipamento.id === data.id
            );


        if (indice >= 0) {

            equipamentos[indice] =
                data;
        }


        preencherDetalhes(
            data
        );


        await carregarFoto(
            data.foto_placa
        );


        msg(
            "Alterações salvas.",
            "sucesso"
        );


    } catch (erro) {

        console.error(
            "Erro ao alterar:",
            erro
        );


        msg(
            "Não foi possível alterar: " +
            mensagemErro(erro),
            "erro"
        );
    }
}


/* =========================================================
   EXCLUIR EQUIPAMENTO
========================================================= */

async function excluirEquipamento() {

    if (!equipamentoAtual) {
        return;
    }


    const confirmou =
        confirm(
            `Deseja excluir "${equipamentoAtual.nome}"?`
        );


    if (!confirmou) {
        return;
    }


    try {

        const foto =
            equipamentoAtual.foto_placa;


        const {
            error
        } =
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


        /*
         * Depois de excluir o registro,
         * remove também a foto.
         */

        if (foto) {

            await removerFoto(
                foto
            );
        }


        equipamentos =
            equipamentos.filter(
                equipamento =>
                    equipamento.id !==
                    equipamentoAtual.id
            );


        equipamentoAtual = null;


        msg(
            "Equipamento excluído.",
            "sucesso"
        );


        setTimeout(
            abrirConsulta,
            500
        );


    } catch (erro) {

        console.error(
            "Erro ao excluir:",
            erro
        );


        msg(
            "Não foi possível excluir: " +
            mensagemErro(erro),
            "erro"
        );
    }
}


/* =========================================================
   REMOVER FOTO DO STORAGE
========================================================= */

async function removerFoto(valor) {

    const caminho =
        extrairCaminhoFoto(valor);


    if (!caminho) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .remove([
                caminho
            ]);


    if (error) {

        console.error(
            "Erro ao remover foto:",
            error
        );
    }
}


/* =========================================================
   CAMPOS DE REDUTOR
========================================================= */

function camposRedutor() {

    const tipo =
        value("tipo")
            .toLowerCase();


    document
        .getElementById("camposRedutor")
        ?.classList.toggle(
            "oculto",
            !tipo.includes("redutor")
        );
}


function camposRedutorEdicao() {

    const tipo =
        value("editTipo")
            .toLowerCase();


    document
        .getElementById("editRedutorBox")
        ?.classList.toggle(
            "oculto",
            !tipo.includes("redutor")
        );
}


/* =========================================================
   STATUS DA LEITURA
========================================================= */

function status(
    texto,
    classe
) {

    const elemento =
        document.getElementById(
            "ocrStatus"
        );


    elemento.textContent =
        texto;


    elemento.className =
        "ocr-status" +
        (
            classe
                ? " " + classe
                : " " +
                  (
                      texto
                          ? ""
                          : "oculto"
                  )
        );
}


/* =========================================================
   MENSAGENS
========================================================= */

function msg(
    texto,
    classe = ""
) {

    const elemento =
        document.getElementById(
            "mensagem"
        );


    clearTimeout(
        timerMensagem
    );


    elemento.textContent =
        texto;


    elemento.className =
        "mensagem mostrar" +
        (
            classe
                ? " " + classe
                : ""
        );


    timerMensagem =
        setTimeout(
            () => {

                elemento.classList.remove(
                    "mostrar"
                );

            },
            4000
        );
}


/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function value(id) {

    return (
        document
            .getElementById(id)
            ?.value ??
        ""
    );
}


function setValue(
    id,
    valor
) {

    const elemento =
        document.getElementById(id);


    if (elemento) {

        elemento.value =
            valor ?? "";
    }
}


function setText(
    id,
    valor
) {

    const elemento =
        document.getElementById(id);


    if (elemento) {

        elemento.textContent =
            valor;
    }
}


function texto(id) {

    const valor =
        value(id).trim();


    return valor || null;
}


function numero(id) {

    const valor =
        value(id).trim();


    if (!valor) {
        return null;
    }


    return num(valor);
}


/*
 * Converte:
 *
 * 37
 * 37,5
 * 37.5
 * 1.234,56
 *
 * corretamente para número.
 */

function num(valor) {

    if (
        valor == null ||
        valor === ""
    ) {

        return null;
    }


    if (
        typeof valor === "number"
    ) {

        return Number.isFinite(valor)
            ? valor
            : null;
    }


    let texto =
        String(valor)
            .replace(
                /\s/g,
                ""
            );


    if (
        texto.includes(",") &&
        texto.includes(".")
    ) {

        /*
         * Exemplo brasileiro:
         * 1.234,56
         */

        if (
            texto.lastIndexOf(",") >
            texto.lastIndexOf(".")
        ) {

            texto =
                texto
                    .replace(
                        /\./g,
                        ""
                    )
                    .replace(
                        ",",
                        "."
                    );

        } else {

            /*
             * Exemplo:
             * 1,234.56
             */

            texto =
                texto.replace(
                    /,/g,
                    ""
                );
        }

    } else {

        texto =
            texto.replace(
                ",",
                "."
            );
    }


    const numero =
        Number(texto);


    return Number.isFinite(numero)
        ? numero
        : null;
}


/* =========================================================
   TRATAMENTO DE ERRO
========================================================= */

function mensagemErro(erro) {

    return (
        erro?.message ||
        erro?.error_description ||
        "Erro desconhecido."
    );
}


/* =========================================================
   SEGURANÇA PARA HTML
========================================================= */

function esc(valor) {

    return String(
        valor ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


/* =========================================================
   FUNÇÕES GLOBAIS USADAS PELO HTML
========================================================= */

window.abrirCadastro =
    abrirCadastro;

window.abrirConsulta =
    abrirConsulta;

window.voltarHome =
    voltarHome;

window.voltarConsulta =
    voltarConsulta;

window.abrirDetalhes =
    abrirDetalhes;

window.ativarEdicao =
    ativarEdicao;

window.cancelarEdicao =
    cancelarEdicao;

window.selecionarFotoEdicao =
    selecionarFotoEdicao;

window.salvarAlteracoes =
    salvarAlteracoes;

window.excluirEquipamento =
    excluirEquipamento;
