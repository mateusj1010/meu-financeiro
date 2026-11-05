# Meu Financeiro v1.5 — leitura gratuita de produtos

Atualização sobre a versão 1.4. O botão **Identificar produtos e conferir compra** interpreta localmente o texto extraído pelo OCR, permite editar cada produto, quantidade, preço total e categoria, e registra a compra em conta ou cartão de crédito. Não usa IA paga.

## Publicação

1. Exporte um backup JSON na versão atual.
2. Envie **todos os oito arquivos** desta pasta à raiz do repositório GitHub, substituindo os antigos.
3. Aguarde a publicação do GitHub Pages e recarregue a página.
4. Na aba Escanear, fotografe a nota ou cole o texto, clique em **Identificar produtos e conferir compra**, confira os dados e registre.

## Limitações

O interpretador usa padrões locais, não entende todos os layouts de notas e pode deixar produtos sem reconhecimento. Sempre confira produtos, descontos e totais. Se houver diferença entre a soma dos itens e o total, a diferença aparece para revisão. O sistema permite confirmar após aviso e registra o ajuste em relatórios. Produtos aprendidos por nome ficam no backup JSON.

Os dados continuam no localStorage do navegador. Sem login, sem sincronização automática; backups frequentes são indispensáveis. A leitura OCR requer internet para carregar Tesseract.js.
