# Meu Financeiro — MVP PWA

Aplicativo estático para celular, hospedável gratuitamente no GitHub Pages.

## Funcionalidades implementadas
- Dashboard, contas, receitas, despesas e transferências.
- Inclusão, edição e exclusão de movimentações.
- Categorias, relatórios mensais e pesquisa.
- Importação OFX (STMTTRN) e CSV com prévia e sinalização simples de duplicidade.
- OCR experimental de imagens via Tesseract.js carregado da CDN (precisa de internet na primeira carga).
- Backup/restauração JSON, PWA instalável e cache básico offline.

## Publicar no GitHub Pages
1. Crie um repositório, por exemplo `meu-financeiro`.
2. Envie **todos os arquivos desta pasta para a raiz** do repositório.
3. Em **Settings > Pages**, selecione **Deploy from a branch**, branch `main`, pasta `/(root)` e salve.
4. Aguarde a publicação e abra `https://SEU-USUARIO.github.io/meu-financeiro/`.
5. No celular, use **Adicionar à tela inicial** pelo navegador.

## Segurança e limitações
- **MVP local:** dados ficam no `localStorage` do navegador; não há login, banco de dados remoto nem sincronização.
- **Não coloque extratos, backups ou chaves privadas no repositório público.** Arquivos importados são processados no navegador.
- Backup JSON contém dados financeiros em texto simples: armazene-o com cuidado.
- A deduplicação de CSV/OFX é apenas heurística; confira o resultado antes de importar. Reimportações de linhas selecionadas podem gerar duplicações.
- A leitura OCR **não categoriza automaticamente itens de nota fiscal** nesta versão; apenas sugere data e valor total de um lançamento. Revise sempre.
- O OCR usa CDN externa e pode transferir arquivos de biblioteca, mas o processamento de imagens ocorre no navegador.
- OFX e CSV variam entre bancos; alguns formatos precisam de ajustes no parser.
- O serviço offline funciona após primeira visita online, exceto dependências de OCR ainda não armazenadas.
- Transferências entre contas não contam como receita ou despesa.
- Não existe ainda controle de cartão de crédito, parcelamento, orçamento ou Supabase conectado.

## Próxima etapa
Criar Supabase Auth + PostgreSQL com Row Level Security e migração de dados locais, além de importação bancária robusta, itens de nota e categorias sugeridas.
