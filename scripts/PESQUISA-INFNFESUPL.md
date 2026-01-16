# Pesquisa Completa: Erro 225 infNFeSupl - NFCe

## Resumo Executivo

O **Erro 225** ("Rejeicao: Falha no Schema XML da NFe") relacionado ao elemento `infNFeSupl` tem como **causa mais provavel** um dos seguintes problemas:

1. **Posicao incorreta do infNFeSupl no XML** (mais provavel)
2. **Namespace duplicado ou incorreto**
3. **Tamanho do qrCode abaixo do minimo (100 chars)**
4. **Hash SHA1 calculado incorretamente**

---

## 1. Estrutura Correta do XML NFCe

### Ordem OBRIGATORIA dos elementos

```xml
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe versao="4.00" Id="NFe...">
    <!-- ide, emit, dest, det, total, transp, pag, infAdic -->
  </infNFe>
  <infNFeSupl>
    <qrCode><![CDATA[URL_COMPLETA]]></qrCode>
    <urlChave>URL_CONSULTA</urlChave>
  </infNFeSupl>
  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
    <!-- SignedInfo, SignatureValue, KeyInfo -->
  </Signature>
</NFe>
```

### IMPORTANTE: A ordem DEVE ser

1. `</infNFe>` - fecha informacoes da NFe
2. `<infNFeSupl>` - informacoes suplementares (QR Code)
3. `<Signature>` - assinatura digital

**Fonte:** [GitHub nfephp Issue #696](https://github.com/nfephp-org/nfephp/issues/696)

---

## 2. Causa Raiz Mais Provavel

### 2.1 Schemas Desatualizados

No issue #696 do nfephp, o erro era **identico**:
> "Elemento 'infNFeSupl': Este elemento nao e esperado. Esperado e Signature"

**Solucao:** Atualizar para schemas **PL_008h** ou superior.

**Fonte:** [nfephp Issue #696](https://github.com/nfephp-org/nfephp/issues/696)

### 2.2 Namespace Duplicado

O `enviNFe` ja declara o namespace. O elemento `NFe` **NAO deve** repetir:

```xml
<!-- ERRADO - namespace duplicado -->
<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">  <!-- DUPLICADO! -->
```

```xml
<!-- CORRETO - NFe herda o namespace -->
<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>  <!-- Herda do pai -->
```

**Fonte:** [Contabeis Forum](https://www.contabeis.com.br/forum/topicos/139187/)

### 2.3 Tamanho do QR Code

O schema SVRS exige:
- **qrCode:** 100-600 caracteres
- **urlChave:** 21-85 caracteres

**ALERTA:** QR Code v3 gera ~94 chars, **ABAIXO do minimo!**
Usar **QR Code v2** que gera ~137 chars.

---

## 3. URLs Oficiais Santa Catarina

### QR Code (consulta com parametros)

| Ambiente | URL |
|----------|-----|
| Producao | `https://sat.sef.sc.gov.br/nfce/consulta?p=` |
| Homologacao | `https://hom.sat.sef.sc.gov.br/nfce/consulta?p=` |

### urlChave (consulta por chave)

| Ambiente | URL |
|----------|-----|
| Producao | `https://sat.sef.sc.gov.br/nfce/consulta` |
| Homologacao | `https://hom.sat.sef.sc.gov.br/nfce/consulta` |

**Fonte:** [SEF/SC Documento Oficial](https://www.sef.sc.gov.br/api-portal/Documento/ver/1398)

---

## 4. Formato QR Code v2.0 (Emissao Online)

### Estrutura da URL

```
https://[dominio]/nfce/consulta?p=[chave]|2|[tpAmb]|[idCSC]|[hash]
```

### Parametros

| Campo | Descricao | Tamanho |
|-------|-----------|---------|
| chave | Chave de acesso (44 digitos) | 44 |
| 2 | Versao do QR Code (fixo "2") | 1 |
| tpAmb | 1=Producao, 2=Homologacao | 1 |
| idCSC | ID do CSC (sem zeros a esquerda) | variavel |
| hash | SHA1 em hexadecimal maiusculo | 40 |

### Calculo do Hash SHA1

```
1. Concatenar: chave|2|tpAmb|idCSC|CSC
2. Aplicar SHA1
3. Converter para HEX maiusculo (40 chars)
```

**Exemplo:**
```
Entrada: 42250112345678000199650010000001231000000015|2|2|1|ABCD1234EFGH5678
SHA1:    DC6AE2C2B9A992BE59679AC365E29922DE6B7511
```

**IMPORTANTE:** O CSC entra no calculo do hash mas NAO aparece na URL final!

**Fonte:** [Oobj - QR Code NFCe 4.0](https://oobj.com.br/bc/qrcode-nfce-40/)

---

## 5. CDATA - Usar ou Nao?

### Recomendacao Oficial (NT 2019.001)

O uso de CDATA e **recomendado** para o elemento `qrCode` porque a URL contem caracteres especiais (`|`, `?`, `&`).

```xml
<!-- RECOMENDADO -->
<infNFeSupl>
  <qrCode><![CDATA[https://sat.sef.sc.gov.br/nfce/consulta?p=...]]></qrCode>
  <urlChave>https://sat.sef.sc.gov.br/nfce/consulta</urlChave>
</infNFeSupl>
```

### Alternativa que Funciona

Algumas implementacoes funcionam **SEM** CDATA, desde que os caracteres especiais nao quebrem o XML.

**Fonte:** [sped-nfe QRCode.php](https://github.com/nfephp-org/sped-nfe/blob/master/src/Factories/QRCode.php)

---

## 6. Checklist de Validacao

### Antes de Enviar

- [ ] infNFeSupl esta DEPOIS de </infNFe>?
- [ ] infNFeSupl esta ANTES de <Signature>?
- [ ] Namespace do NFe NAO esta duplicado?
- [ ] qrCode tem mais de 100 caracteres?
- [ ] urlChave tem entre 21-85 caracteres?
- [ ] Hash SHA1 esta em MAIUSCULAS?
- [ ] CSC esta correto (sem tracos se for UUID)?
- [ ] idCSC esta sem zeros a esquerda?
- [ ] URLs sao do ambiente correto (hom/prod)?

### Validador Online

Use o validador oficial SVRS:
**https://dfe-portal.svrs.rs.gov.br/NFCE/ValidadorXml**

---

## 7. Codigo de Referencia (PHP - sped-nfe)

```php
// Estrutura que funciona (simplificada)
$infNFeSupl = "<infNFeSupl>";
$infNFeSupl .= "<qrCode><![CDATA[{$urlQRCode}]]></qrCode>";
$infNFeSupl .= "<urlChave>{$urlConsulta}</urlChave>";
$infNFeSupl .= "</infNFeSupl>";

// Inserir ANTES da Signature
$xml = str_replace('</NFe>', $infNFeSupl . '</NFe>', $xmlAssinado);
```

**ATENCAO:** O infNFeSupl deve ser inserido **APOS** a assinatura do XML, pois ele fica FORA do bloco assinado (infNFe).

**Fonte:** [sped-nfe](https://github.com/nfephp-org/sped-nfe)

---

## 8. Erros Relacionados e Solucoes

| Erro | Causa | Solucao |
|------|-------|---------|
| 225 | Schema XML invalido | Ver checklist acima |
| 393 | infNFeSupl em NF-e (mod 55) | Remover - so permitido em NFCe (mod 65) |
| 394 | QR Code ausente na NFCe | Adicionar infNFeSupl |
| 464 | Hash difere do calculado | Verificar CSC e idCSC |
| 903 | Versao QR Code invalida | Usar versao 2 (nao 1 ou 100) |

---

## 9. Solucoes a Testar (Ordem de Prioridade)

### Prioridade 1: Verificar Posicao e Namespace

1. Garantir que `infNFeSupl` esta entre `</infNFe>` e `<Signature>`
2. Remover namespace duplicado do elemento `<NFe>`
3. Usar esquema `<NFe>` sem `xmlns` (herdar do `enviNFe`)

### Prioridade 2: Formato do QR Code

4. Verificar se URL do qrCode tem > 100 caracteres
5. Usar CDATA no qrCode
6. Verificar hash SHA1 (40 chars, maiusculo)

### Prioridade 3: CSC e Configuracao

7. Verificar se CSC esta sem tracos (se for UUID, remover)
8. Verificar se idCSC esta sem zeros a esquerda
9. Confirmar ambiente (hom/prod) nas URLs

### Prioridade 4: Minificacao

10. Remover espacos/quebras de linha do XML
11. Remover declaracao XML duplicada
12. Verificar encoding UTF-8 (sem BOM)

---

## 10. Fontes Consultadas

1. [TecnoSpeed - Rejeicao 225](https://atendimento.tecnospeed.com.br/hc/pt-br/articles/360012183534)
2. [GitHub nfephp Issue #696](https://github.com/nfephp-org/nfephp/issues/696)
3. [sped-nfe QRCode.md](https://github.com/nfephp-org/sped-nfe/blob/master/docs/QRCode.md)
4. [Oobj - QR Code 2.0](https://oobj.com.br/bc/qrcode-nfce-40/)
5. [Projeto ACBr Forum](https://www.projetoacbr.com.br/forum/topic/42092-erro-ao-validar-nfce-40-infnfesupl/)
6. [SEF/SC - URLs NFCe](https://www.sef.sc.gov.br/api-portal/Documento/ver/1398)
7. [Portal SVRS](https://dfe-portal.svrs.rs.gov.br/Nfce/Documentos)
8. [TecnoSpeed - NT 2019.001](https://blog.tecnospeed.com.br/nt-2019-001-nfe/)
9. [FlexDocs - Erro 225](https://flexdocs.net/suporte/knowledgebase.php?article=129)

---

## 11. Implementacao Sugerida (TypeScript/Node)

```typescript
/**
 * Monta infNFeSupl CORRETAMENTE
 */
function montarInfNFeSupl(chave: string, ambiente: 1 | 2, csc: string, idToken: number): string {
  // 1. Limpar CSC (remover tracos se UUID)
  const cscLimpo = csc.replace(/-/g, '')

  // 2. URL base conforme ambiente
  const baseUrl = ambiente === 1
    ? 'https://sat.sef.sc.gov.br/nfce/consulta'
    : 'https://hom.sat.sef.sc.gov.br/nfce/consulta'

  // 3. Calcular hash SHA1
  // IMPORTANTE: CSC entra no calculo mas NAO na URL final
  const dadosHash = `${chave}|2|${ambiente}|${idToken}|${cscLimpo}`
  const hash = crypto.createHash('sha1').update(dadosHash).digest('hex').toUpperCase()

  // 4. Montar URL do QR Code (sem CSC!)
  const urlQRCode = `${baseUrl}?p=${chave}|2|${ambiente}|${idToken}|${hash}`

  // 5. Verificar tamanho minimo
  if (urlQRCode.length < 100) {
    console.warn('ALERTA: URL do QR Code menor que 100 chars!')
  }

  // 6. Montar infNFeSupl com CDATA
  return `<infNFeSupl><qrCode><![CDATA[${urlQRCode}]]></qrCode><urlChave>${baseUrl}</urlChave></infNFeSupl>`
}

/**
 * Insere infNFeSupl no XML assinado
 * DEVE ser chamado APOS a assinatura
 */
function inserirInfNFeSupl(xmlAssinado: string, infNFeSupl: string): string {
  // Inserir ANTES do fechamento </NFe>, que vem ANTES da </Signature>
  // A Signature ja foi inserida, entao precisamos colocar o infNFeSupl
  // entre </infNFe> e <Signature>

  return xmlAssinado.replace(
    /<Signature xmlns="http:\/\/www\.w3\.org\/2000\/09\/xmldsig#">/,
    `${infNFeSupl}<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">`
  )
}

/**
 * Monta lote de envio SEM namespace duplicado
 */
function montarLoteEnvio(xmlNFe: string, idLote: string): string {
  // Remover declaracao XML se existir
  let xml = xmlNFe.replace(/<\?xml[^?]*\?>\s*/gi, '')

  // IMPORTANTE: Remover namespace duplicado do NFe
  xml = xml.replace(/<NFe xmlns="http:\/\/www\.portalfiscal\.inf\.br\/nfe">/, '<NFe>')

  // Montar lote (enviNFe declara o namespace uma vez)
  return `<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><idLote>${idLote}</idLote><indSinc>1</indSinc>${xml}</enviNFe>`
}
```

---

## 12. SOLUCAO FINAL IMPLEMENTADA (TESTADA E APROVADA)

### Erro 225 - Schema XML - RESOLVIDO

**Causa raiz:** Ordem incorreta dos elementos no XML.

**Solucao aplicada em `generator.ts`:**

```typescript
// 1. Gerar XML base com infNFe
const xmlBase = gerarXMLBase(dados)

// 2. Adicionar infNFeSupl ANTES do fechamento do NFe
const xml = xmlBase.replace('</NFe>', `${infNFeSupl}</NFe>`)

// 3. Assinar o XML (Signature sera adicionada ao final do NFe)
const xmlAssinado = assinarXML(xml, certificado)
```

**Ordem CORRETA no XML final:**
```xml
<NFe>
  <infNFe>...</infNFe>
  <infNFeSupl>...</infNFeSupl>
  <Signature>...</Signature>
</NFe>
```

**Solucao aplicada em `signer.ts`:**

```typescript
sig.computeSignature(xml, {
  location: {
    reference: `//*[local-name()='NFe']`,
    action: 'append',  // Insere Signature NO FINAL do NFe
  },
})
```

---

### Erro 464 - Hash do QR Code - RESOLVIDO

**Causa raiz:** Formula de calculo do hash estava incorreta.

**Formula CORRETA (descoberta via codigo-fonte do NFePHP):**

```
seq = chave|2|ambiente|idToken
hash = SHA1(seq + csc)   // CSC concatenado SEM pipe!
URL = baseUrl?p=seq|hash
```

**IMPORTANTE sobre o CSC:**

1. O CSC deve ser usado **EXATAMENTE como cadastrado na SEFAZ**
2. Se o CSC foi cadastrado COM hifens (ex: `ABC12345-6789-DEFG-HIJK-LMNOPQRSTUV0`), use COM hifens
3. Se o CSC foi cadastrado SEM hifens, use SEM hifens
4. O CSC entra no calculo do hash mas **NAO aparece na URL final**

**Solucao aplicada em `utils/index.ts`:**

```typescript
export function gerarURLQRCode(params: {
  chave: string
  ambiente: 1 | 2
  csc: string
  idToken: number
  uf?: string
}): string {
  const { chave, ambiente, csc, idToken, uf = 'SC' } = params

  // URL base conforme UF e ambiente
  const urls = URLS_QRCODE[uf] || URLS_QRCODE['SC']
  const baseUrl = ambiente === 1 ? urls.producao : urls.homologacao

  // Sequencia para URL e hash: chave|2|ambiente|idToken
  const seq = `${chave}|2|${ambiente}|${idToken}`

  // Hash: SHA1(sequencia + CSC) - CSC EXATAMENTE como cadastrado na SEFAZ
  // IMPORTANTE: CSC concatenado SEM pipe separador!
  const hash = crypto.createHash('sha1').update(seq + csc).digest('hex').toUpperCase()

  // Formato v2: URL?p=sequencia|hash
  const url = `${baseUrl}?p=${seq}|${hash}`

  return url
}
```

---

### Outros Erros Resolvidos Durante o Processo

| Erro | Causa | Solucao |
|------|-------|---------|
| 297 | Assinatura XML incorreta | Usar xml-crypto com `action: 'append'` |
| 373 | Descricao em homologacao | Usar "NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL" |
| 462 | CSC nao cadastrado | Verificar se CSC esta cadastrado no ambiente correto (prod/hom) |
| 972 | Falta infRespTec | Adicionar grupo infRespTec com CNPJ, xContato, email, fone |

---

## 13. Resultado Final - NFC-e AUTORIZADA

**Ambiente:** Producao
**Status:** cStat 100 - Autorizado o uso da NF-e
**Chave:** 42260136985207000100650010000001431614176125
**Protocolo:** 242260085810434

---

## 14. Checklist de Validacao (ATUALIZADO)

### Antes de Enviar

- [x] infNFeSupl esta DEPOIS de </infNFe>? ✅
- [x] infNFeSupl esta ANTES de <Signature>? ✅
- [x] Namespace do NFe NAO esta duplicado? ✅
- [x] qrCode tem mais de 100 caracteres? ✅
- [x] urlChave tem entre 21-85 caracteres? ✅
- [x] Hash SHA1 esta em MAIUSCULAS? ✅
- [x] **CSC usado EXATAMENTE como cadastrado na SEFAZ?** ✅ (COM hifens se cadastrado assim)
- [x] idCSC esta sem zeros a esquerda? ✅
- [x] URLs sao do ambiente correto (hom/prod)? ✅
- [x] infRespTec esta presente? ✅

---

*Documento gerado em: 2026-01-16*
*Pesquisa realizada por: Claude Code (Terminal B)*
*Atualizado com solucoes finais em: 2026-01-16*
