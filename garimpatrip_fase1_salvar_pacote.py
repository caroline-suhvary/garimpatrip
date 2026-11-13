#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GarimpaTrip · Patch Fase 1:
1. Salvamento direto na tabela 'package_items' (remove dependência da 'discoveries').
2. Botões nos cards exibem para qual roteiro estão guardando:
   "Guardar em [Destino]" / "Guardado em [Destino]".
3. Sincroniza automaticamente os itens já guardados para a viagem ativa selecionada.
4. Barra da viagem ativa no topo com destaque visual âmbar e alerta inteligente
   caso o destino pesquisado seja diferente da viagem ativa selecionada.
5. Compatível com Python 3.9+ e preserva quebras de linha Windows (CRLF).
"""
import os
import sys
import shutil

def run():
    print("[*] Iniciando patch GarimpaTrip Fase 1...")

    base_dir = os.getcwd()
    discover_path = os.path.join(base_dir, "src", "components", "discover", "DiscoverClient.tsx")
    css_path = os.path.join(base_dir, "src", "styles", "Discover.module.css")

    if not os.path.exists(discover_path):
        print(f"[ERRO] Arquivo nao encontrado: {discover_path}")
        print("Certifique-se de executar este script na pasta raiz do projeto GarimpaTrip no VS Code.")
        sys.exit(1)

    # 1. Backups de seguranca
    bak_discover = discover_path + ".bak_fase1"
    if not os.path.exists(bak_discover):
        shutil.copy2(discover_path, bak_discover)
        print(f"[i] Backup criado: {bak_discover}")

    if os.path.exists(css_path):
        bak_css = css_path + ".bak_fase1"
        if not os.path.exists(bak_css):
            shutil.copy2(css_path, bak_css)
            print(f"[i] Backup criado: {bak_css}")

    # 2. Ler DiscoverClient.tsx e detectar quebras de linha
    with open(discover_path, "rb") as f:
        raw_bytes = f.read()

    is_crlf = b"\r\n" in raw_bytes
    src = raw_bytes.decode("utf-8").replace("\r\n", "\n")

    # Checar se ja foi aplicado
    if "saveToPackage" in src and "tripMismatchAlert" in src:
        print("[i] O patch da Fase 1 ja esta aplicado em DiscoverClient.tsx!")
    else:
        # A. Injetar getSaveLabel e variaveis da viagem ativa antes do return
        helpers_code = """  const activeTrip = trips.find((t) => t.id === selectedId);
  const activeTripName = activeTrip?.destination_city || activeTrip?.title || "Roteiro";

  const getSaveLabel = (saved: boolean) => {
    if (saved) return `Guardado em ${activeTripName}`;
    if (!selectedId) return "Guardar";
    return `Guardar em ${activeTripName}`;
  };

  """
        if "const activeTrip =" not in src:
            anchor_return = "return (\n    <div className={styles.container}>"
            if anchor_return in src:
                src = src.replace(anchor_return, helpers_code + anchor_return, 1)
            else:
                pos = src.find("return (")
                if pos != -1:
                    src = src[:pos] + helpers_code + src[pos:]

        # B. Injetar sincronizacao automatica de itens ja guardados no pacote
        anchor_saved_urls = "const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set());"
        sync_code = """const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set());

  // Sincroniza itens ja guardados no pacote da viagem ativa selecionada
  useEffect(() => {
    if (!supabase || !selectedId) {
      setSavedUrls(new Set());
      return;
    }
    let isMounted = true;
    supabase
      .from("package_items")
      .select("external_url, meta_details")
      .eq("trip_id", selectedId)
      .then(({ data }) => {
        if (!isMounted || !data) return;
        const urls = new Set<string>();
        for (const row of data) {
          if (row.external_url) urls.add(row.external_url);
          const rawId = (row.meta_details as any)?.raw_payload?.id;
          if (rawId) urls.add(String(rawId));
        }
        setSavedUrls(urls);
      });
    return () => {
      isMounted = false;
    };
  }, [supabase, selectedId]);"""

        if "from(\"package_items\")" not in src and anchor_saved_urls in src:
            src = src.replace(anchor_saved_urls, sync_code, 1)

        # C. Substituir saveToBox por saveToPackage
        idx_save_start = src.find("const saveToBox = async (item: SearchResult) => {")
        idx_save_end = src.find("const handleManualSave = async")
        if idx_save_start != -1 and idx_save_end != -1:
            new_save_box = """const CATEGORY_MAP: Record<string, { id: number; name: string }> = {
    flight: { id: 1, name: "Transporte Principal" },
    transport: { id: 4, name: "Deslocamento Local" },
    hotel: { id: 2, name: "Hospedagem & Pousadas" },
    tour: { id: 3, name: "Passeios & Atrações" },
    doc: { id: 5, name: "Documentação & Saúde" },
    food: { id: 6, name: "Alimentação & Gastos" },
    web: { id: 3, name: "Passeios & Guias" },
    web_idea: { id: 3, name: "Passeios & Guias" },
  };

  const saveToPackage = async (item: SearchResult) => {
    if (!supabase || !user) return signIn();
    if (!selectedId) {
      return setMessage({
        type: "error",
        text: "Selecione ou crie uma viagem ativa para guardar itens no seu Roteiro.",
      });
    }
    const catInfo = CATEGORY_MAP[item.category] || { id: 3, name: "Passeios & Atrações" };
    try {
      await ensureProfile();
      const { error } = await supabase.from("package_items").insert({
        trip_id: selectedId,
        category_id: catInfo.id,
        title: item.title.slice(0, 200),
        status: "planejado",
        estimated_cost: item.price ? Number(item.price) : 0,
        currency: item.currency || "BRL",
        external_url: item.url || null,
        notes: item.description ? item.description.slice(0, 500) : null,
        meta_details: {
          provider: item.source,
          category_code: item.category,
          source_type: item.source_type,
          raw_payload: item.raw || {},
        },
      });
      if (error) throw error;
      setSavedUrls((prev) => new Set(prev).add(item.id || item.url || ""));

      setMessage({
        type: "ok",
        text: `"${item.title.slice(0, 40)}" guardado em ${activeTripName} (${catInfo.name})!`,
      });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Erro ao guardar no Pacote.",
      });
    }
  };

  const saveToBox = saveToPackage;

  """
            src = src[:idx_save_start] + new_save_box + src[idx_save_end:]

        # D. Atualizar rotulos dos botoes
        src = src.replace('{saved ? "Guardado" : "Guardar"}', "{getSaveLabel(saved)}")
        src = src.replace('"Guardar na Caixa"', '`Guardar em ${activeTripName}`')
        src = src.replace('<h4>Guardar um link de viagem</h4>', '<h4>Guardar um link de viagem no Roteiro {activeTripName}</h4>')

        # E. Injetar Alerta de Destino Diferente no tripBar
        anchor_tripbar_end = "</section>\n\n      {/* CABEÇALHO E FORMULÁRIO DE BUSCA */}"
        mismatch_block = """        {/* ALERTA CASO A BUSCA SEJA DIFERENTE DO ROTEIRO ATIVO */}
        {Boolean(selectedId && activeTrip && cleanDest &&
          !activeTripName.toLowerCase().includes(cleanDest.toLowerCase()) &&
          !cleanDest.toLowerCase().includes(activeTripName.toLowerCase())) && (
          <div className={styles.tripMismatchAlert}>
            <AlertCircle size={18} className={styles.tripMismatchIcon} />
            <div className={styles.tripMismatchText}>
              <strong>Atenção ao Roteiro:</strong> Sua viagem ativa é <u>{activeTripName}</u>, mas você está pesquisando <u>{cleanDest}</u>.
              Os itens que você guardar irão para o pacote de <strong>{activeTripName}</strong>.
            </div>
            <button
              type="button"
              className={styles.createTripBtnAlt}
              onClick={createTrip}
              disabled={creatingTrip}>
              <Plus size={14} />
              <span>Criar Roteiro para {cleanDest}</span>
            </button>
          </div>
        )}
      </section>

      {/* CABEÇALHO E FORMULÁRIO DE BUSCA */}"""

        if anchor_tripbar_end in src:
            src = src.replace(anchor_tripbar_end, mismatch_block, 1)

        # Gravar DiscoverClient.tsx preservando CRLF se aplicavel
        if is_crlf:
            out_bytes = src.replace("\n", "\r\n").encode("utf-8")
        else:
            out_bytes = src.encode("utf-8")

        with open(discover_path, "wb") as f:
            f.write(out_bytes)
        print("[OK] src/components/discover/DiscoverClient.tsx atualizado com sucesso!")

    # 3. Atualizar Discover.module.css se existir
    if os.path.exists(css_path):
        with open(css_path, "rb") as f:
            raw_css = f.read()
        is_css_crlf = b"\r\n" in raw_css
        css_src = raw_css.decode("utf-8").replace("\r\n", "\n")

        if ".tripMismatchAlert" in css_src:
            print("[i] Estilos da Fase 1 ja existem em Discover.module.css!")
        else:
            extra_css = """

/* Destaque da Barra de Viagem Ativa e Alerta de Roteiro (Fase 1) */
.tripBar {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%) !important;
  border: 2px solid #f59e0b !important;
  border-radius: 14px;
  padding: 1rem 1.25rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.12);
}

.tripMismatchAlert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.85rem;
  padding: 0.75rem 1rem;
  background: #ffffff;
  border: 1px solid #fcd34d;
  border-radius: 10px;
  font-size: 0.85rem;
  color: #92400e;
}

.tripMismatchIcon {
  color: #d97706;
  flex-shrink: 0;
}

.tripMismatchText {
  flex: 1;
  min-width: 240px;
  line-height: 1.4;
}

.createTripBtnAlt {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  background: #d97706;
  color: #ffffff;
  border: none;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.createTripBtnAlt:hover {
  background: #b45309;
}
"""
            css_src += extra_css
            if is_css_crlf:
                out_css_bytes = css_src.replace("\n", "\r\n").encode("utf-8")
            else:
                out_css_bytes = css_src.encode("utf-8")

            with open(css_path, "wb") as f:
                f.write(out_css_bytes)
            print("[OK] src/styles/Discover.module.css atualizado com estilos em destaque!")

    print("\n[SUCESSO] Patch Fase 1 aplicado com sucesso!")
    print("Agora os itens vao direto para package_items e os botoes mostram o destino ativo.")

if __name__ == "__main__":
    run()
