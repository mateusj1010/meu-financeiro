'use strict';
// Interpretação local de cupons fiscais. Nenhuma API de IA ou envio de dados.
(() => {
  const $id=id=>document.getElementById(id);
  const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  const moneyValue=s=>{let t=String(s||'').replace(/[^\d.,]/g,'');if(!t)return NaN;if(t.includes(',')&&t.includes('.'))t=t.lastIndexOf(',')>t.lastIndexOf('.')?t.replace(/\./g,'').replace(',','.'):t.replace(/,/g,'');else if(t.includes(','))t=t.replace(',','.');return Number(t)};
  const cash=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const round=n=>Math.round(n*100)/100;
  const rules=[['Limpeza',/DETERG|SABAO|AMACIAN|DESINF|AGUA SANIT|LIMPADOR|ESPONJA|ALVEJ|LAVA ROUP/],['Higiene',/SHAMP|CONDICION|SABONET|CREME DENT|ESCOVA DENT|DESODOR|PAPEL HIG|ABSORVENT|FRALDA/],['Saúde',/MEDICAM|DIPIRONA|PARACETAM|IBUPROF|VITAMINA|FARMAC/],['Transporte',/GASOLINA|ETANOL|DIESEL|LUBRIFICANTE/],['Alimentação',/ARROZ|FEIJAO|LEITE|CAFE|ACUCAR|MACARR|FRANGO|CARNE|OVO|PAO|FARINHA|QUEIJO|IOGUR|BISCOIT|BANANA|TOMATE|BATATA|MANTEIGA|OLEO|REFRIG|SUCO|AGUA MINERAL/]];
  const categoryFor=name=>{const key=normalize(name);const learned=(db.productRules||{})[key];if(learned&&db.categories.includes(learned))return learned;for(const [cat,re] of rules)if(re.test(key)&&db.categories.includes(cat))return cat;return db.categories.includes('Outros')?'Outros':db.categories[0]||''};
  const ignored=/^(?:TOTAL|SUBTOTAL|VALOR|TROCO|DESCONTO|ACRESC|FORMA DE PAG|PAGAMENTO|DINHEIRO|CARTAO|CREDITO|DEBITO|PIX|CNPJ|CPF|ENDERECO|DATA|HORA|CHAVE|PROTOCOLO|CONSULTE|NFC|SAT|TRIBUT|IMPOST|OPERADOR|CAIXA|OBRIGAD|QRCODE|QR CODE|ITEM CODIGO|CODIGO DESCRICAO|QTD |QTDE |UN |VL |PRECO |VAL UNIT|EMISSAO|DOCUMENTO|NUMERO|SERIE|AUTORIZACAO|ESTABELECIMENTO|CONSUMIDOR|VENDEDOR|DESCONTO TOTAL|ITENS)/;
  const isIgnored=line=>ignored.test(normalize(line))||/^[-_=*\s]+$/.test(line);
  function parse(text){const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);let items=[];let total=null;let date='';let merchant='';
    for(const line of lines){const m=line.match(/(?:TOTAL\s*(?:A\s*PAGAR|DA\s*COMPRA|R\$)?|VALOR\s*(?:TOTAL|A\s*PAGAR|PAGO))\s*[:R$\s]*([\d.,]+)/i);if(m&&!/SUBTOTAL/i.test(line)){const n=moneyValue(m[1]);if(n>0)total=n}const d=line.match(/\b(\d{2}[\/.\-]\d{2}[\/.\-]\d{4})\b/);if(d&&!date)date=dateBR(d[1]);}
    merchant=lines.find(l=>/[A-Za-zÀ-ÿ]{4}/.test(l)&&!isIgnored(l)&&!/^\d/.test(l))||'Compra por cupom';
    // Formatos: "001 PRODUTO 2 UN X 3,50 7,00", "PRODUTO 2 X 3,50 = 7,00", "PRODUTO 7,00".
    for(let i=0;i<lines.length;i++){
      let line=lines[i];if(isIgnored(line))continue;
      let name='',qty=1,unit=NaN,amount=NaN;
      const combined=line.match(/^(?:\d{1,4}\s+)?(.{3,}?)\s+(\d+[.,]?\d*)\s*(?:UN|UND|KG|G|LT|L|PC|PCT|CX)?\s*[Xx×]\s*(\d+[.,]\d{2})\s*(?:=|R\$)?\s*(\d+[.,]\d{2})\s*$/i);
      const qtyTotal=line.match(/^(?:\d{1,4}\s+)?(.{3,}?)\s+(\d+[.,]?\d*)\s+(?:UN|UND|KG|LT|PC|PCT)\s+(\d+[.,]\d{2})\s+(\d+[.,]\d{2})$/i);
      const simple=line.match(/^(?:\d{1,4}\s+)?(.{3,}?)\s+(?:R\$\s*)?(\d+[.,]\d{2})\s*$/i);
      if(combined){name=combined[1];qty=moneyValue(combined[2]);unit=moneyValue(combined[3]);amount=moneyValue(combined[4])}
      else if(qtyTotal){name=qtyTotal[1];qty=moneyValue(qtyTotal[2]);unit=moneyValue(qtyTotal[3]);amount=moneyValue(qtyTotal[4])}
      else if(simple){name=simple[1];amount=moneyValue(simple[2]);unit=amount}
      else if(i+1<lines.length && /[A-Za-zÀ-ÿ]{3}/.test(line)){
        const next=lines[i+1].match(/^(\d+[.,]?\d*)\s*(?:UN|UND|KG|G|LT|L|PC|PCT)?\s*[Xx×]\s*(\d+[.,]\d{2})\s*(?:=|R\$)?\s*(\d+[.,]\d{2})$/i);
        if(next){name=line.replace(/^\d{1,4}\s+/,'');qty=moneyValue(next[1]);unit=moneyValue(next[2]);amount=moneyValue(next[3]);i++}
      }
      name=name.replace(/^\d{1,4}\s+/,'').trim();if(!name||!/[A-Za-zÀ-ÿ]{3}/.test(name)||isIgnored(name)||!Number.isFinite(amount)||amount<=0||amount>100000||!Number.isFinite(qty)||qty<=0)continue;
      items.push({name:name.slice(0,130),qty,unit:round(unit),amount:round(amount),category:categoryFor(name)});
    }
    return {items,total,date:date||today(),merchant:merchant.slice(0,120)};
  }
  let draft=null;
  function row(item,index){const el=document.createElement('div');el.className='receipt-item';el.innerHTML=`<label>Produto<input data-field="name" maxlength="130"></label><div class="receipt-grid"><label>Quantidade<input data-field="qty" type="number" min="0.001" step="any"></label><label>Valor total (R$)<input data-field="amount" type="number" min="0.01" step="0.01"></label></div><label>Categoria<select data-field="category"></select></label><div class="receipt-row-bottom"><small data-subtotal></small><button type="button" class="ghost" data-remove-item>Remover</button></div>`;
    el.querySelector('[data-field="name"]').value=item.name;el.querySelector('[data-field="qty"]').value=item.qty;el.querySelector('[data-field="amount"]').value=item.amount;
    const sel=el.querySelector('[data-field="category"]');for(const c of db.categories){const opt=document.createElement('option');opt.value=c;opt.textContent=c;sel.append(opt)}sel.value=item.category;
    el.querySelectorAll('[data-field]').forEach(input=>input.addEventListener('input',()=>{item[input.dataset.field]=['qty','amount'].includes(input.dataset.field)?Number(input.value):input.value;refreshTotals()}));
    el.querySelector('[data-remove-item]').onclick=()=>{draft.items.splice(index,1);drawItems()};return el;
  }
  function drawItems(){const root=$id('receiptItems');root.replaceChildren();draft.items.forEach((x,i)=>root.append(row(x,i)));refreshTotals()}
  function refreshTotals(){if(!draft)return;const sum=round(draft.items.reduce((s,x)=>s+(Number(x.amount)||0),0));const declared=Number($id('receiptTotal').value);$id('receiptComputed').textContent=cash(sum);const difference=round(declared-sum);$id('receiptDifference').textContent=Number.isFinite(difference)?cash(difference):'—';$id('receiptDifference').style.color=Math.abs(difference)>.01?'#f59e0b':''}
  function sourceOptions(){const mode=$id('receiptMethod').value,sel=$id('receiptSource');sel.replaceChildren();const sources=mode==='card'?(db.cards||[]):db.accounts;for(const s of sources){const opt=document.createElement('option');opt.value=s.id;opt.textContent=s.name;sel.append(opt)}$id('receiptInstallmentsWrap').hidden=mode!=='card';$id('receiptSourceLabel').textContent=mode==='card'?'Cartão de crédito':'Conta de pagamento'}
  function show(){draft=parse($id('ocrText').value);if(!draft.items.length){if(!confirm('Nenhum produto foi reconhecido automaticamente. Deseja abrir a conferência e adicionar os produtos manualmente?'))return;draft.items.push({name:'',qty:1,amount:0,unit:0,category:db.categories[0]||''})}const dialog=$id('receiptDialog');$id('receiptMerchant').value=draft.merchant;$id('receiptDate').value=draft.date;$id('receiptTotal').value=draft.total??round(draft.items.reduce((s,x)=>s+x.amount,0));$id('receiptMethod').value='account';$id('receiptInstallments').value='1';sourceOptions();drawItems();dialog.showModal()}
  function saveReceipt(e){e.preventDefault();if(!draft?.items.length)return alert('Adicione ao menos um produto.');const items=draft.items.map(x=>({...x,name:x.name.trim(),qty:Number(x.qty),amount:round(Number(x.amount)),unit:round(Number(x.amount)/Number(x.qty))}));if(items.some(x=>!x.name||!Number.isFinite(x.qty)||x.qty<=0||!Number.isFinite(x.amount)||x.amount<=0||!db.categories.includes(x.category)))return alert('Confira nome, quantidade, valor e categoria de todos os produtos.');const total=round(Number($id('receiptTotal').value)),sum=round(items.reduce((s,x)=>s+x.amount,0));if(!Number.isFinite(total)||total<=0)return alert('Informe um total válido.');if(Math.abs(total-sum)>.01&&!confirm(`A soma dos produtos (${cash(sum)}) difere do total (${cash(total)}). Isso pode ocorrer por descontos ou acréscimos. Deseja continuar?`))return;
    const mode=$id('receiptMethod').value,source=$id('receiptSource').value,date=$id('receiptDate').value,merchant=$id('receiptMerchant').value.trim()||'Compra por cupom';if(!source)return alert('Cadastre e selecione uma conta ou cartão.');if(!date)return alert('Informe a data.');
    const signature=normalize(merchant)+'|'+date+'|'+Math.round(total*100)+'|'+items.map(x=>normalize(x.name)+Math.round(x.amount*100)).join('|');if(db.transactions.some(t=>t.receiptSignature===signature)&&!confirm('Uma compra com estes produtos, data e valor já foi registrada. Registrar novamente?'))return;
    // Cartão usa a mesma lógica de mês de fatura da versão 1.4.
    if(mode==='card'){
      const card=db.cards.find(x=>x.id===source);if(!card)return alert('Cartão inválido.');const installments=Number($id('receiptInstallments').value);if(!Number.isInteger(installments)||installments<1||installments>60)return alert('Informe de 1 a 60 parcelas.');const base=Math.floor(total*100/installments),remainder=Math.round(total*100)-base*installments;const purchaseId=uid();for(let i=0;i<installments;i++){const amount=(base+(i<remainder?1:0))/100;const bill=billMonth(date,card);const installmentDate=plusMonths(bill+'-01',i);db.transactions.push({id:uid(),type:'credit',description:merchant+(installments>1?` (${i+1}/${installments})`:''),amount,date:installmentDate,category:'Compra detalhada',card:source,purchaseId,receiptSignature:signature,receiptItems:items.map(x=>({...x,amount:round(x.amount*amount/total)})),receiptOriginalTotal:total,source:'receipt'})}
    }else{if(!db.accounts.some(x=>x.id===source))return alert('Conta inválida.');db.transactions.push({id:uid(),type:'expense',description:merchant,amount:total,date,category:'Compra detalhada',account:source,target:null,receiptSignature:signature,receiptItems:items,source:'receipt'})}
    db.productRules ||= {};for(const x of items)db.productRules[normalize(x.name)]=x.category;$id('receiptDialog').close();draft=null;save();alert('Compra e produtos registrados com sucesso!');
  }
  $id('extract').textContent='Identificar produtos e conferir compra';$id('extract').onclick=show;$id('receiptMethod').onchange=sourceOptions;$id('receiptTotal').oninput=refreshTotals;$id('receiptAddItem').onclick=()=>{draft.items.push({name:'',qty:1,amount:0,unit:0,category:db.categories[0]||''});drawItems()};$id('receiptCancel').onclick=()=>$id('receiptDialog').close();$id('receiptReviewForm').onsubmit=saveReceipt;
  // Complementa os relatórios por categoria sem duplicar o valor total da compra.
  const previousRender=render;
  render=function(){previousRender();const month=$id('month').value||today().slice(0,7);const transactions=db.transactions.filter(t=>t.date.startsWith(month)&&['expense','credit'].includes(t.type));const totals={};for(const t of transactions){if(Array.isArray(t.receiptItems)&&t.receiptItems.length){const sum=t.receiptItems.reduce((s,x)=>s+Number(x.amount||0),0);for(const x of t.receiptItems){totals[x.category||'Outros']=(totals[x.category||'Outros']||0)+Number(x.amount||0)}const delta=round(t.amount-sum);if(Math.abs(delta)>.01)totals['Ajustes de nota']=(totals['Ajustes de nota']||0)+delta}else totals[t.category||'Outros']=(totals[t.category||'Outros']||0)+t.amount}
    const expense=transactions.reduce((s,t)=>s+t.amount,0);const rows=Object.entries(totals).sort((a,b)=>b[1]-a[1]);const html=rows.length?rows.map(([name,val])=>`<div class="breakrow"><div class="labels"><span>${esc(name)}</span><b>${money(val)}</b></div><div class="track"><i style="width:${expense?Math.max(0,100*val/expense):0}%"></i></div></div>`).join(''):'<div class="empty">Sem despesas neste mês.</div>';$id('breakdown').innerHTML=html;$id('reportCategories').innerHTML=html;
    // Mostra os produtos ao expandir a movimentação, sem interferir na edição convencional.
    for(const t of db.transactions.filter(t=>t.receiptItems?.length)){const row=document.querySelector(`[data-delete="${CSS.escape(t.id)}"]`)?.closest('.item');if(row&&!row.querySelector('details')){const details=document.createElement('details');details.className='receipt-details';const summary=document.createElement('summary');summary.textContent=`Ver ${t.receiptItems.length} produto(s)`;details.append(summary);for(const x of t.receiptItems){const p=document.createElement('div');p.textContent=`${x.name} · ${x.category} · ${cash(x.amount)}`;details.append(p)}row.querySelector('div')?.append(details)}}
  };
  // Atualiza a visualização quando dados forem alterados.
  render();
})();
