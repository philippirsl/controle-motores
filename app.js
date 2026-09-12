import { createClient } from
    "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL =
    "https://kxuzpnlizvmluroxenlg.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_2VUSWEN1y8Ggvl5qIfhthA_0P1v7bWP";

const supabase =
    createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


const nome =
    document.getElementById("nome");

const local =
    document.getElementById("local");

const tipo =
    document.getElementById("tipo");

const foto =
    document.getElementById("foto");

const preview =
    document.getElementById("preview");

const salvar =
    document.getElementById("salvar");

const mensagem =
    document.getElementById("mensagem");


foto.addEventListener("change", () => {

    const arquivo = foto.files[0];

    if (!arquivo) {
        preview.innerHTML = "";
        return;
    }

    const imagem =
        document.createElement("img");

    imagem.src =
        URL.createObjectURL(arquivo);

    preview.innerHTML = "";

    preview.appendChild(imagem);
});


salvar.addEventListener("click", async () => {

    mensagem.textContent = "";

    if (!nome.value.trim()) {

        mensagem.textContent =
            "Informe o nome do equipamento.";

        return;
    }

    if (!local.value.trim()) {

        mensagem.textContent =
            "Informe o local de instalação.";

        return;
    }


    salvar.disabled = true;

    mensagem.textContent =
        "Salvando...";


    try {

        const { data, error } =
            await supabase
                .from("equipamentos")
                .insert({

                    nome:
                        nome.value.trim(),

                    local_instalacao:
                        local.value.trim(),

                    tipo:
                        tipo.value

                })
                .select()
                .single();


        if (error) {
            throw error;
        }


        mensagem.textContent =
            "Equipamento cadastrado com sucesso!";


        nome.value = "";

        local.value = "";

        tipo.value = "motor";

        foto.value = "";

        preview.innerHTML = "";


        console.log(
            "Equipamento:",
            data
        );


    } catch (erro) {

        console.error(erro);

        mensagem.textContent =
            "Erro ao salvar equipamento.";

    } finally {

        salvar.disabled = false;

    }

});
