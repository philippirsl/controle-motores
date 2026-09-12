import { createClient } from
    "https://esm.sh/@supabase/supabase-js@2";


// =====================================================
// CONFIGURAÇÃO DO SUPABASE
// =====================================================
//
// COLOQUE AQUI OS DADOS DO SEU PROJETO
//
// Exemplo:
//
// const SUPABASE_URL =
//     "https://xxxxxxxx.supabase.co";
//
// const SUPABASE_KEY =
//     "sb_publishable_xxxxxxxxx";
//
// =====================================================


const SUPABASE_URL =
    "https://kxuzpnlizvmluroxenlg.supabase.co";


const SUPABASE_KEY =
    "sb_publishable_2VUSWEN1y8Ggvl5qIfhthA_0P1v7bWP";


const supabase =
    createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// =====================================================
// ELEMENTOS DA TELA
// =====================================================

const btnCadastro =
    document.getElementById(
        "btnCadastro"
    );


const btnConsulta =
    document.getElementById(
        "btnConsulta"
    );


const telaCadastro =
    document.getElementById(
        "telaCadastro"
    );


const telaConsulta =
    document.getElementById(
        "telaConsulta"
    );


const telaDetalhes =
    document.getElementById(
        "telaDetalhes"
    );


const nome =
    document.getElementById(
        "nome"
    );


const local =
    document.getElementById(
        "local"
    );


const tipo =
    document.getElementById(
        "tipo"
    );


const fotoCamera =
    document.getElementById(
        "fotoCamera"
    );


const fotoGaleria =
    document.getElementById(
        "fotoGaleria"
    );


const btnCamera =
    document.getElementById(
        "btnCamera"
    );


const btnGaleria =
    document.getElementById(
        "btnGaleria"
    );


const preview =
    document.getElementById(
        "preview"
    );


const salvar =
    document.getElementById(
        "salvar"
    );


const mensagem =
    document.getElementById(
        "mensagem"
    );


const pesquisa =
    document.getElementById(
        "pesquisa"
    );


const listaEquipamentos =
    document.getElementById(
        "listaEquipamentos"
    );


const voltarConsulta =
    document.getElementById(
        "voltarConsulta"
    );


// =====================================================
// VARIÁVEIS
// =====================================================

let equipamentos = [];

let filtroTipo = "todos";


// =====================================================
// FOTO - CÂMERA
// =====================================================

btnCamera.addEventListener(
    "click",
    () => {

        fotoCamera.click();

    }
);


// =====================================================
// FOTO - GALERIA
// =====================================================

btnGaleria.addEventListener(
    "click",
    () => {

        fotoGaleria.click();

    }
);


// =====================================================
// FOTO TIRADA PELA CÂMERA
// =====================================================

fotoCamera.addEventListener(
    "change",
    () => {

        const arquivo =
            fotoCamera.files[0];

        mostrarFoto(arquivo);

    }
);


// =====================================================
// FOTO ESCOLHIDA DA GALERIA
// =====================================================

fotoGaleria.addEventListener(
    "change",
    () => {

        const arquivo =
            fotoGaleria.files[0];

        mostrarFoto(arquivo);

    }
);


// =====================================================
// MOSTRAR FOTO
// =====================================================

function mostrarFoto(arquivo) {

    if (!arquivo) {

        return;

    }


    const imagem =
        document.createElement(
            "img"
        );


    imagem.src =
        URL.createObjectURL(
            arquivo
        );


    imagem.alt =
        "Foto da placa do equipamento";


    preview.innerHTML = "";


    preview.appendChild(
        imagem
    );

}


// =====================================================
// MENU - CADASTRO
// =====================================================

btnCadastro.addEventListener(
    "click",
    () => {

        telaCadastro.classList.remove(
            "oculto"
        );


        telaConsulta.classList.add(
            "oculto"
        );


        telaDetalhes.classList.add(
            "oculto"
        );


        btnCadastro.classList.add(
            "ativo"
        );


        btnConsulta.classList.remove(
            "ativo"
        );

    }
);


// =====================================================
// MENU - CONSULTA
// =====================================================

btnConsulta.addEventListener(
    "click",
    async () => {

        telaCadastro.classList.add(
            "oculto"
        );


        telaConsulta.classList.remove(
            "oculto"
        );


        telaDetalhes.classList.add(
            "oculto"
        );


        btnCadastro.classList.remove(
            "ativo"
        );


        btnConsulta.classList.add(
            "ativo"
        );


        await carregarEquipamentos();

    }
);


// =====================================================
// SALVAR EQUIPAMENTO
// =====================================================

salvar.addEventListener(
    "click",
    async () => {

        mensagem.textContent = "";


        // ---------------------------------------------
        // VALIDAÇÕES
        // ---------------------------------------------

        if (!nome.value.trim()) {

            mensagem.textContent =
                "Informe o nome do equipamento.";


            nome.focus();


            return;

        }


        if (!local.value.trim()) {

            mensagem.textContent =
                "Informe o local de instalação.";


            local.focus();


            return;

        }


        // ---------------------------------------------
        // DESABILITAR BOTÃO
        // ---------------------------------------------

        salvar.disabled = true;


        salvar.textContent =
            "SALVANDO...";


        try {

            // -----------------------------------------
            // DADOS DO EQUIPAMENTO
            // -----------------------------------------

            const dados = {

                nome:
                    nome.value.trim(),


                local_instalacao:
                    local.value.trim(),


                tipo:
                    tipo.value

            };


            // -----------------------------------------
            // GRAVAR NO SUPABASE
            // -----------------------------------------

            const {
                data,
                error
            } = await supabase

                .from(
                    "equipamentos"
                )

                .insert(
                    dados
                )

                .select()

                .single();


            if (error) {

                throw error;

            }


            // -----------------------------------------
            // SUCESSO
            // -----------------------------------------

            mensagem.textContent =
                "✅ Equipamento cadastrado com sucesso!";


            console.log(
                "Equipamento cadastrado:",
                data
            );


            limparFormulario();


        } catch (erro) {

            console.error(
                "Erro ao cadastrar:",
                erro
            );


            mensagem.textContent =
                "❌ Erro ao salvar equipamento: " +
                erro.message;


        } finally {

            salvar.disabled = false;


            salvar.textContent =
                "💾 SALVAR EQUIPAMENTO";

        }

    }
);


// =====================================================
// LIMPAR FORMULÁRIO
// =====================================================

function limparFormulario() {

    nome.value = "";

    local.value = "";

    tipo.value = "motor";

    fotoCamera.value = "";

    fotoGaleria.value = "";

    preview.innerHTML = "";

}


// =====================================================
// CARREGAR EQUIPAMENTOS
// =====================================================

async function carregarEquipamentos() {

    listaEquipamentos.innerHTML =
        `
        <div class="carregando">
            Carregando equipamentos...
        </div>
        `;


    try {

        const {
            data,
            error
        } = await supabase

            .from(
                "equipamentos"
            )

            .select("*")

            .order(
                "criado_em",
                {
                    ascending: false
                }
            );


        if (error) {

            throw error;

        }


        equipamentos =
            data || [];


        mostrarEquipamentos();


    } catch (erro) {

        console.error(
            "Erro ao carregar:",
            erro
        );


        listaEquipamentos.innerHTML =
            `
            <div class="sem-resultados">

                ❌ Erro ao carregar equipamentos.

                <br><br>

                ${escapeHtml(
                    erro.message
                )}

            </div>
            `;

    }

}


// =====================================================
// MOSTRAR EQUIPAMENTOS
// =====================================================

function mostrarEquipamentos() {

    const texto =
        pesquisa.value
            .trim()
            .toLowerCase();


    const resultado =
        equipamentos.filter(
            (equipamento) => {


                const nomeEquipamento =
                    String(
                        equipamento.nome || ""
                    )
                    .toLowerCase();


                const localEquipamento =
                    String(
                        equipamento.local_instalacao || ""
                    )
                    .toLowerCase();


                const correspondePesquisa =

                    !texto ||

                    nomeEquipamento.includes(
                        texto
                    ) ||

                    localEquipamento.includes(
                        texto
                    );


                const correspondeTipo =

                    filtroTipo ===
                    "todos"

                    ||

                    equipamento.tipo ===
                    filtroTipo;


                return (
                    correspondePesquisa
                    &&
                    correspondeTipo
                );

            }
        );


    // ---------------------------------------------
    // NENHUM RESULTADO
    // ---------------------------------------------

    if (resultado.length === 0) {

        listaEquipamentos.innerHTML =
            `
            <div class="sem-resultados">
                Nenhum equipamento encontrado.
            </div>
            `;

        return;

    }


    // ---------------------------------------------
    // LIMPAR LISTA
    // ---------------------------------------------

    listaEquipamentos.innerHTML = "";


    // ---------------------------------------------
    // CRIAR ITENS
    // ---------------------------------------------

    resultado.forEach(
        (equipamento) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "equipamento";


            const nomeEquipamento =
                escapeHtml(
                    equipamento.nome ||
                    "Sem nome"
                );


            const localEquipamento =
                escapeHtml(
                    equipamento.local_instalacao ||
                    "-"
                );


            const tipoEquipamento =
                formatarTipo(
                    equipamento.tipo
                );


            item.innerHTML =
                `

                <div class="equipamento-nome">

                    ${nomeEquipamento}

                </div>


                <div class="equipamento-info">

                    📍 ${localEquipamento}

                </div>


                <div class="tipo-badge">

                    ${tipoEquipamento}

                </div>

                `;


            item.addEventListener(
                "click",
                () => {

                    abrirDetalhes(
                        equipamento
                    );

                }
            );


            listaEquipamentos.appendChild(
                item
            );

        }
    );

}


// =====================================================
// PESQUISA
// =====================================================

pesquisa.addEventListener(
    "input",
    () => {

        mostrarEquipamentos();

    }
);


// =====================================================
// FILTROS
// =====================================================

document
    .querySelectorAll(
        ".filtro"
    )
    .forEach(
        (botao) => {

            botao.addEventListener(
                "click",
                () => {


                    document
                        .querySelectorAll(
                            ".filtro"
                        )
                        .forEach(
                            (b) => {

                                b.classList.remove(
                                    "ativo"
                                );

                            }
                        );


                    botao.classList.add(
                        "ativo"
                    );


                    filtroTipo =
                        botao.dataset.tipo;


                    mostrarEquipamentos();

                }
            );

        }
    );


// =====================================================
// ABRIR DETALHES
// =====================================================

function abrirDetalhes(
    equipamento
) {

    telaCadastro.classList.add(
        "oculto"
    );


    telaConsulta.classList.add(
        "oculto"
    );


    telaDetalhes.classList.remove(
        "oculto"
    );


    // ---------------------------------------------
    // DADOS BÁSICOS
    // ---------------------------------------------

    document.getElementById(
        "detalheNome"
    ).textContent =
        equipamento.nome || "-";


    document.getElementById(
        "detalheLocal"
    ).textContent =
        equipamento.local_instalacao || "-";


    document.getElementById(
        "detalheTipo"
    ).textContent =
        formatarTipo(
            equipamento.tipo
        );


    // ---------------------------------------------
    // MOTOR / REDUTOR
    // ---------------------------------------------

    document.getElementById(
        "detalheFabricante"
    ).textContent =
        equipamento.fabricante || "-";


    document.getElementById(
        "detalheModelo"
    ).textContent =
        equipamento.modelo || "-";


    document.getElementById(
        "detalhePotencia"
    ).textContent =

        equipamento.potencia_cv != null

            ? equipamento.potencia_cv +
              " CV"

            : "-";


    document.getElementById(
        "detalheTensao"
    ).textContent =
        equipamento.tensao || "-";


    document.getElementById(
        "detalheCorrente"
    ).textContent =

        equipamento.corrente_a != null

            ? equipamento.corrente_a +
              " A"

            : "-";


    document.getElementById(
        "detalheRotacao"
    ).textContent =

        equipamento.rotacao_rpm != null

            ? equipamento.rotacao_rpm +
              " RPM"

            : "-";


    document.getElementById(
        "detalheFrequencia"
    ).textContent =

        equipamento.frequencia_hz != null

            ? equipamento.frequencia_hz +
              " Hz"

            : "-";


    document.getElementById(
        "detalheSerie"
    ).textContent =
        equipamento.numero_serie || "-";


    document.getElementById(
        "detalheRelacao"
    ).textContent =
        equipamento.relacao || "-";


    document.getElementById(
        "detalheEntrada"
    ).textContent =

        equipamento.rotacao_entrada_rpm != null

            ? equipamento.rotacao_entrada_rpm +
              " RPM"

            : "-";


    document.getElementById(
        "detalheSaida"
    ).textContent =

        equipamento.rotacao_saida_rpm != null

            ? equipamento.rotacao_saida_rpm +
              " RPM"

            : "-";


    // ---------------------------------------------
    // FOTO
    // ---------------------------------------------

    const divFoto =
        document.getElementById(
            "detalheFoto"
        );


    divFoto.innerHTML = "";


    if (
        equipamento.foto_placa
    ) {

        const imagem =
            document.createElement(
                "img"
            );


        imagem.src =
            equipamento.foto_placa;


        imagem.alt =
            "Foto da placa";


        divFoto.appendChild(
            imagem
        );

    }


    // ---------------------------------------------
    // OBSERVAÇÕES
    // ---------------------------------------------

    const observacoes =
        document.getElementById(
            "detalheObservacoes"
        );


    observacoes.textContent =
        equipamento.observacoes || "";

}


// =====================================================
// VOLTAR PARA CONSULTA
// =====================================================

voltarConsulta.addEventListener(
    "click",
    () => {

        telaDetalhes.classList.add(
            "oculto"
        );


        telaConsulta.classList.remove(
            "oculto"
        );

    }
);


// =====================================================
// FORMATAR TIPO
// =====================================================

function formatarTipo(
    tipo
) {

    if (
        tipo === "motor"
    ) {

        return "Motor elétrico";

    }


    if (
        tipo === "redutor"
    ) {

        return "Caixa de redução";

    }


    return "Outro";

}


// =====================================================
// SEGURANÇA BÁSICA
// =====================================================

function escapeHtml(
    valor
) {

    return String(valor)

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
