# Pesquisa Completa: Erro 297 - Assinatura Difere do Calculado

## Resumo Executivo

O **Erro 297** ("Rejeicao: Assinatura difere do calculado") ocorre quando a SEFAZ detecta que a assinatura digital do XML foi **invalidada** por alguma alteracao no conteudo apos a assinatura.

### Causas Principais (Ordem de Probabilidade)

| # | Causa | Probabilidade |
|---|-------|---------------|
| 1 | XML modificado apos assinatura | **ALTA** |
| 2 | Whitespace/formatacao inconsistente | **ALTA** |
| 3 | Caracteres especiais no conteudo | MEDIA |
| 4 | Problemas com certificado A3 | BAIXA |
| 5 | CSC/idToken incorretos (NFCe) | MEDIA |

---

## 1. Como Funciona a Assinatura Digital

### Fluxo de Assinatura

```
XML (infNFe) --> Canonicalizacao (C14N) --> Hash SHA1 --> DigestValue
                                                              |
                                                              v
DigestValue + Chave Privada --> Criptografia RSA --> SignatureValue
```

### Elementos da Assinatura

| Elemento | Descricao |
|----------|-----------|
| `DigestValue` | Hash SHA1 do conteudo de `<infNFe>` canonicalizado |
| `SignatureValue` | DigestValue criptografado com chave privada |
| `X509Certificate` | Certificado publico para verificacao |

### Validacao pela SEFAZ

1. SEFAZ recebe o XML
2. Recalcula o DigestValue do `<infNFe>`
3. Compara com o DigestValue informado
4. Se diferente = **Erro 297**

---

## 2. Causas Detalhadas

### 2.1 XML Modificado Apos Assinatura

**Problema:** Qualquer alteracao no conteudo de `<infNFe>` apos a assinatura invalida o DigestValue.

**Exemplos:**
- Alterar valores de campos
- Reformatar numeros (casas decimais)
- Adicionar/remover espacos
- Pretty-print do XML

**Fonte:** [GitHub DFe.NET Issue #45](https://github.com/ZeusAutomacao/DFe.NET/issues/45)

### 2.2 Whitespace Inconsistente

**Problema:** O XML foi assinado COM espacos/formatacao, mas enviado SEM (ou vice-versa).

**Caso real (Issue #543):**
> "A questao era o arquivo XML em si, ele estava sendo utilizado com whitespaces na hora da assinatura e quando enviado estava sem."

**Solucao:** Manter a mesma formatacao entre assinatura e envio.

**Fonte:** [GitHub DFe.NET Issue #543](https://github.com/ZeusAutomacao/DFe.NET/issues/543)

### 2.3 Caracteres Especiais

**Caracteres que causam problemas:**
```
< > & " ' @ # $ % * { } [ ] + = | \ / ^ ~ `
a o e i u (acentuados)
(espacos duplos)
(quebras de linha - Enter)
(tabs)
```

**Campos comuns com problemas:**
- Descricao de produtos (`xProd`)
- Informacoes complementares (`infCpl`)
- Endereco (`xLgr`, `xBairro`)
- Nome/Razao Social (`xNome`)

**Fonte:** [TecnoSpeed - Rejeicao 297](https://atendimento.tecnospeed.com.br/hc/pt-br/articles/360014528533)

### 2.4 Problemas com Certificado A3

**Sintomas:**
- Erro intermitente
- Funciona em algumas maquinas, outras nao

**Causas:**
- Driver do token/smartcard desatualizado
- PIN nao informado corretamente
- Certificado nao instalado corretamente

**Fonte:** [FlexDocs FAQ Assinatura](https://flexdocs.net/guiaNFe/FAQ.assinatura.html)

### 2.5 CSC/idToken Incorretos (NFCe)

**Para NFCe, verificar:**
- CSC com 36 caracteres (UUID com tracos) ou 32 (sem tracos)
- idToken com 6 digitos (ex: 000001, nao 1)
- CSC correto para o ambiente (homologacao vs producao)

**Fonte:** [GitHub DFe.NET Issue #543](https://github.com/ZeusAutomacao/DFe.NET/issues/543)

---

## 3. Relacao com infNFeSupl (NFCe)

### Por que infNFeSupl NAO invalida a assinatura?

O `infNFeSupl` fica **FORA** do elemento `<infNFe>`:

```xml
<NFe>
  <infNFe>           <!-- ESTE bloco e assinado -->
    ...
  </infNFe>          <!-- Fim do bloco assinado -->
  <infNFeSupl>       <!-- FORA da assinatura - pode inserir apos -->
    <qrCode>...</qrCode>
    <urlChave>...</urlChave>
  </infNFeSupl>
  <Signature>        <!-- Assinatura do infNFe -->
    ...
  </Signature>
</NFe>
```

### Fluxo Correto para NFCe

1. Montar XML com `<infNFe>` completo
2. Assinar o XML (gera `<Signature>`)
3. Extrair `DigestValue` da assinatura
4. Montar QR Code usando o `DigestValue`
5. Inserir `<infNFeSupl>` ENTRE `</infNFe>` e `<Signature>`
6. Enviar para SEFAZ

### ALERTA: Nao confundir!

Se voce modificar o conteudo DENTRO de `<infNFe>` apos a assinatura, vai dar erro 297.
Inserir `<infNFeSupl>` apos a assinatura e **permitido** porque ele fica FORA do `<infNFe>`.

---

## 4. Canonicalizacao (C14N)

### O que e?

A canonicalizacao transforma o XML em uma forma "canonica" padronizada antes de calcular o hash. Isso garante que XMLs logicamente iguais gerem o mesmo hash.

### Regras do C14N

1. Remove declaracao XML (`<?xml ...?>`)
2. Remove DTD
3. Normaliza quebras de linha para `\n`
4. Normaliza atributos (ordem alfabetica, aspas duplas)
5. **NAO remove whitespace entre elementos!**

### Problema Comum

```xml
<!-- XML Original (com formatacao) -->
<ide>
  <cUF>42</cUF>
  <cNF>12345678</cNF>
</ide>

<!-- XML Minificado -->
<ide><cUF>42</cUF><cNF>12345678</cNF></ide>
```

**Esses dois XMLs geram hashes DIFERENTES!**

**Fonte:** [C14N Specification](https://di-mgt.com.au/xmldsig-c14n.html)

---

## 5. Solucoes por Linguagem

### 5.1 Node.js / TypeScript

```typescript
import { DOMParser, XMLSerializer } from 'xmldom'

// ERRADO - altera whitespace
const doc = new DOMParser().parseFromString(xml, 'text/xml')
const serializer = new XMLSerializer()
const xmlFormatado = serializer.serializeToString(doc) // Pode alterar!

// CORRETO - preservar XML original
// Usar a mesma string que foi assinada, sem re-parse
const xmlOriginal = xmlAssinado // Manter como string
```

### 5.2 Inserir infNFeSupl sem corromper

```typescript
function inserirInfNFeSuplSeguro(xmlAssinado: string, infNFeSupl: string): string {
  // Metodo 1: Regex simples (recomendado)
  // Insere ANTES da tag Signature, que vem DEPOIS de </infNFe>
  return xmlAssinado.replace(
    '<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">',
    `${infNFeSupl}<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">`
  )

  // NAO usar DOM parser aqui - pode alterar whitespace!
}
```

### 5.3 Evitar reformatacao

```typescript
// ERRADO - xmlbuilder2 com prettyPrint
const xml = doc.end({ prettyPrint: true }) // Adiciona whitespace!

// CORRETO - sem formatacao
const xml = doc.end({ prettyPrint: false }) // Minificado
```

### 5.4 PHP (sped-nfe)

```php
// Configuracao correta
$dom = new DOMDocument('1.0', 'UTF-8');
$dom->preserveWhiteSpace = false;  // Importante!
$dom->formatOutput = false;         // Importante!
$dom->loadXML($xml);
```

### 5.5 C# (.NET)

```csharp
XmlDocument doc = new XmlDocument();
doc.PreserveWhitespace = true;  // Importante para manter original
doc.Load(xmlPath);
```

---

## 6. Checklist de Depuracao

### Antes de Assinar

- [ ] XML esta sem caracteres especiais?
- [ ] Campos de texto estao sem espacos no inicio/fim?
- [ ] Nao ha quebras de linha (Enter) nos campos?
- [ ] Numeros estao com casas decimais corretas?

### Durante Assinatura

- [ ] Certificado A1 esta valido e nao expirado?
- [ ] (A3) Driver do token esta instalado corretamente?
- [ ] (A3) PIN foi informado?

### Apos Assinatura

- [ ] XML NAO foi re-parseado com DOM?
- [ ] XML NAO foi formatado/pretty-printed?
- [ ] XML NAO teve campos alterados?
- [ ] (NFCe) infNFeSupl foi inserido na posicao correta?

### No Envio

- [ ] XML sendo enviado e identico ao assinado?
- [ ] Encoding UTF-8 sem BOM?
- [ ] Sem conversao de encoding?

---

## 7. Ferramentas de Diagnostico

### Validar Assinatura Localmente

**Online:**
- Validador SVRS: https://dfe-portal.svrs.rs.gov.br/NFCE/ValidadorXml
- Assinadoc RFB: https://assinadoc.iti.gov.br/

**Offline:**
- OpenSSL para verificar certificado
- xmlsec1 para validar assinatura

### Comparar XMLs

```bash
# Linux/Mac - comparar XML assinado vs enviado
diff <(cat xml_assinado.xml) <(cat xml_enviado.xml)

# Windows PowerShell
Compare-Object (Get-Content xml_assinado.xml) (Get-Content xml_enviado.xml)
```

### Verificar Hash SHA1

```javascript
const crypto = require('crypto')

function verificarDigestValue(infNFeXml) {
  // Canonicalizar (simplificado - usar biblioteca propria)
  const canonicalizado = infNFeXml.replace(/>\s+</g, '><').trim()

  // Calcular SHA1
  const hash = crypto.createHash('sha1').update(canonicalizado).digest('base64')

  console.log('DigestValue calculado:', hash)
  return hash
}
```

---

## 8. Erros Relacionados

| Erro | Descricao | Relacao com 297 |
|------|-----------|-----------------|
| 298 | Assinatura difere do padrao | Problema no formato da assinatura |
| 225 | Falha no Schema XML | Estrutura XML incorreta |
| 215 | Falha no Schema XML | Similar ao 225 |
| 464 | Hash QR-Code difere | CSC ou calculo errado |

---

## 9. Codigo de Referencia Completo

### Fluxo Seguro para NFCe (TypeScript)

```typescript
import * as crypto from 'crypto'

interface CertificadoA1 {
  pem: { cert: string; key: string }
}

/**
 * Fluxo completo e seguro para emissao de NFCe
 */
async function emitirNFCeSeguro(
  dadosNFCe: any,
  certificado: CertificadoA1,
  csc: string,
  idToken: number
): Promise<string> {

  // 1. Gerar XML base (sem infNFeSupl)
  const xmlBase = gerarXMLNFCe(dadosNFCe)

  // 2. Assinar XML
  // IMPORTANTE: Guardar o XML exatamente como foi assinado
  const xmlAssinado = assinarXML(xmlBase, certificado)

  // 3. Extrair DigestValue para o QR Code (se necessario)
  const digestValue = extrairDigestValue(xmlAssinado)

  // 4. Gerar infNFeSupl
  const infNFeSupl = gerarInfNFeSupl({
    chave: dadosNFCe.chave,
    ambiente: dadosNFCe.ambiente,
    csc,
    idToken,
    digestValue // Para contingencia
  })

  // 5. Inserir infNFeSupl SEM re-parsear o XML
  // Usar replace simples para nao alterar whitespace
  const xmlCompleto = xmlAssinado.replace(
    '<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">',
    `${infNFeSupl}<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">`
  )

  // 6. Montar lote (tambem sem re-parsear)
  const loteXML = montarLoteEnvio(xmlCompleto)

  // 7. Enviar
  return await enviarParaSEFAZ(loteXML, certificado)
}

/**
 * Extrai DigestValue do XML assinado usando regex
 * (evita re-parsear o XML)
 */
function extrairDigestValue(xmlAssinado: string): string {
  const match = xmlAssinado.match(/<DigestValue>([^<]+)<\/DigestValue>/)
  if (!match) throw new Error('DigestValue nao encontrado')
  return match[1]
}

/**
 * Limpa string para evitar caracteres problematicos
 */
function limparTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[<>&"']/g, '')          // Remove caracteres XML
    .replace(/\s+/g, ' ')             // Normaliza espacos
    .trim()                            // Remove espacos inicio/fim
}

/**
 * Formata numero com casas decimais fixas
 * (evita inconsistencias de formatacao)
 */
function formatarValor(valor: number, casas: number = 2): string {
  return valor.toFixed(casas)
}
```

---

## 10. Fontes Consultadas

1. [TecnoSpeed - Rejeicao 297](https://atendimento.tecnospeed.com.br/hc/pt-br/articles/360014528533)
2. [Oobj - Rejeicao 297](https://oobj.com.br/bc/rejeicao-297-como-resolver/)
3. [GitHub DFe.NET Issue #45](https://github.com/ZeusAutomacao/DFe.NET/issues/45)
4. [GitHub DFe.NET Issue #543](https://github.com/ZeusAutomacao/DFe.NET/issues/543)
5. [FlexDocs FAQ Assinatura](https://flexdocs.net/guiaNFe/FAQ.assinatura.html)
6. [Dynamicca - Erro 297](https://kb.dynamicca.com.br/article/01/erro_297_rejeicao_assinatura_difere_calculado)
7. [WebGer - cStat 297](https://webger.com.br/cstat-297-rejeicao-assinatura-difere-do-calculado/)
8. [Projeto ACBr Forum](https://www.projetoacbr.com.br/forum/topic/39462-297-simulacao-rejeicao-assinatura-difere-do-calculado/)
9. [C14N Specification](https://di-mgt.com.au/xmldsig-c14n.html)
10. [sped-nfe GitHub](https://github.com/nfephp-org/sped-nfe)

---

## 11. Resumo das Acoes

### Para resolver o Erro 297:

1. **Verificar se XML foi modificado apos assinatura**
   - Usar string replace em vez de DOM parser para inserir infNFeSupl
   - Nao reformatar/pretty-print o XML

2. **Limpar caracteres especiais ANTES de assinar**
   - Remover acentos, simbolos, espacos extras
   - Usar funcao de limpeza em todos os campos de texto

3. **Manter formatacao consistente**
   - Se assinou minificado, enviar minificado
   - Se assinou formatado, enviar formatado (nao recomendado)

4. **Verificar CSC e idToken (NFCe)**
   - idToken com 6 digitos (ex: 000001)
   - CSC correto para o ambiente

5. **Testar certificado**
   - Verificar validade
   - Testar em outro sistema

---

## 12. SOLUCAO FINAL IMPLEMENTADA (TESTADA E APROVADA)

### O Problema

A assinatura estava sendo inserida manualmente com implementacao simplificada de C14N que nao correspondia ao padrao exato.

### A Solucao - Usar xml-crypto com `action: 'append'`

**Arquivo:** `src/lib/fiscal/xml/signer.ts`

```typescript
import { SignedXml } from 'xml-crypto'

export function assinarXML(xml: string, certificado: CertificadoA1): string {
  // Extrai o ID do elemento infNFe
  const idMatch = xml.match(/Id="(NFe\d+)"/)
  if (!idMatch) {
    throw new Error('ID da NF-e nao encontrado no XML')
  }
  const referenceId = idMatch[1]

  // Configuracoes do SignedXml
  const sig = new SignedXml({
    privateKey: certificado.pem.key,
    publicCert: certificado.pem.cert,
    signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
    canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
  })

  // Adiciona referencia ao elemento infNFe
  sig.addReference({
    xpath: `//*[@Id='${referenceId}']`,
    digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
    transforms: [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    ],
  })

  // SOLUCAO: Inserir Signature como ULTIMO elemento do NFe
  // Isso garante ordem correta: infNFe -> infNFeSupl -> Signature
  sig.computeSignature(xml, {
    location: {
      reference: `//*[local-name()='NFe']`,
      action: 'append',  // CHAVE: append adiciona ao FINAL
    },
  })

  return sig.getSignedXml()
}
```

### Pontos-Chave da Solucao

1. **`action: 'append'`** - A Signature e adicionada como ultimo filho do NFe
2. **`reference: '//*[local-name()='NFe']'`** - Referencia o elemento NFe, nao infNFe
3. **Biblioteca xml-crypto** - Faz a canonicalizacao C14N corretamente
4. **infNFeSupl antes de assinar** - O infNFeSupl ja deve estar no XML antes de chamar assinarXML

### Fluxo Final Correto

```
1. gerarXMLBase() -> XML com infNFe
   |
   v
2. Adicionar infNFeSupl antes de </NFe>
   |
   v
3. assinarXML() -> Signature adicionada ao final do NFe
   |
   v
4. gerarLoteEnvio() -> Envolve em enviNFe
   |
   v
5. Enviar para SEFAZ
```

### Ordem dos Elementos no XML Final

```xml
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe versao="4.00" Id="NFe...">
    <!-- ide, emit, det, total, transp, pag, infRespTec -->
  </infNFe>
  <infNFeSupl>
    <qrCode><![CDATA[...]]></qrCode>
    <urlChave><![CDATA[...]]></urlChave>
  </infNFeSupl>
  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
    <!-- SignedInfo, SignatureValue, KeyInfo -->
  </Signature>
</NFe>
```

---

## 13. Resultado Final

**Erro 297 resolvido com sucesso!**

Apos aplicar a correcao com xml-crypto:
- **Status:** cStat 100 - Autorizado o uso da NF-e
- **Chave:** 42260136985207000100650010000001431614176125
- **Protocolo:** 242260085810434
- **Ambiente:** Producao

---

*Documento gerado em: 2026-01-16*
*Pesquisa realizada por: Claude Code (Terminal B)*
*Atualizado com solucao final em: 2026-01-16*
