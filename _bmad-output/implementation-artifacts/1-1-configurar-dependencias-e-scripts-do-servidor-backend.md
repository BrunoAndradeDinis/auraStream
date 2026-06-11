---
baseline_commit: 6e53350b0ca6031d2df2994c97f31df4713e5bad
---

# Story 1.1: Configurar Dependências e Scripts do Servidor Backend

## Metadados

| Campo             | Valor                                                                 |
|-------------------|-----------------------------------------------------------------------|
| **Story ID**      | 1.1                                                                   |
| **Story Key**     | 1-1-configurar-dependencias-e-scripts-do-servidor-backend             |
| **Epic**          | Epic 1 — Fundação do Servidor e Comunicação em Tempo Real             |
| **Status**        | ready-for-dev                                                         |
| **Esforço Est.**  | ~1h                                                                   |
| **Prioridade**    | Crítica (bloqueante — todas as outras stories do Epic 1 dependem disso) |

---

## User Story

> **Como** Bruno (operador do AuraStream),
> **Eu quero** que as dependências Node.js do servidor e os scripts de inicialização estejam configurados no projeto,
> **Para que** eu possa instalar e rodar o backend sem conflito com o frontend Next.js.

---

## Acceptance Criteria (BDD)

### AC1 — Dependências Instaláveis

```gherkin
Given o `package.json` raiz do projeto existente
When Bruno executa `npm install`
Then as dependências `ws`, `ts-node`, `@types/ws` e `inquirer` estão instaladas com sucesso
And nenhum erro de peer dependency ou conflito é gerado
```

### AC2 — Scripts no package.json

```gherkin
Given o `package.json` raiz existe após o `npm install`
When Bruno inspeciona a seção `"scripts"`
Then o script `"server": "ts-node --project tsconfig.server.json server/server.ts"` está presente
And o script `"cli": "ts-node --project tsconfig.server.json server/cli.ts"` está presente
And o script `"dev"` existente (`next dev --turbopack -p 9002`) permanece inalterado
```

### AC3 — tsconfig.server.json separado

```gherkin
Given a raiz do projeto
When o arquivo `tsconfig.server.json` é inspecionado
Then ele existe na raiz do projeto
And aponta para `"include": ["server/**/*.ts"]`
And possui `"compilerOptions": { "module": "commonjs", "target": "es2020", "esModuleInterop": true, "resolveJsonModule": true, "outDir": "dist/server" }`
And NÃO inclui configurações do Next.js (sem `"jsx": "preserve"`, sem plugin `"next"`)
```

### AC4 — Sem conflito de porta

```gherkin
Given o Next.js dev server está rodando na porta 9002
When Bruno executa `npm run server`
Then o processo inicia sem erros de "EADDRINUSE" ou conflito de porta
And o servidor backend aguarda conexões (na porta 9003, conforme Story 1.2)
```

---

## Contexto para o Agente de Desenvolvimento

### Estado Atual do Projeto

O projeto já existe com a seguinte configuração (NÃO reinventar ou sobrescrever):

**`package.json` atual — scripts presentes:**
```json
{
  "scripts": {
    "dev": "next dev --turbopack -p 9002",
    "genkit:dev": "genkit start -- tsx src/ai/dev.ts",
    "genkit:watch": "genkit start -- tsx --watch src/ai/dev.ts",
    "build": "NODE_ENV=production next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  }
}
```

**`tsconfig.json` atual — configurado exclusivamente para Next.js:**
- `"module": "esnext"`, `"moduleResolution": "bundler"`, `"jsx": "preserve"`
- Plugin `"next"` incluído
- `"noEmit": true` — NÃO gera JS compilado
- Inclui `"**/*.ts"` e `"**/*.tsx"` — abrange tudo, inclusive `/server/`

> ⚠️ **PROBLEMA CRÍTICO:** O `tsconfig.json` existente usa `module: "esnext"` e `moduleResolution: "bundler"`, que são incompatíveis com o runtime Node.js nativo. O backend precisa de `module: "commonjs"`. Por isso, é **obrigatório** criar um `tsconfig.server.json` separado e passar `--project tsconfig.server.json` nos scripts `server` e `cli`.

**Diretório `/server/` ainda não existe** — esta story cria a fundação para que ele seja populado nas próximas stories.

**Dependências já instaladas no `package.json`:**
- `typescript: ^5`, `@types/node: ^20` — já disponíveis como devDependencies ✅
- `ts-node` — **NÃO instalado** — precisa ser adicionado ❌
- `ws` — **NÃO instalado** — precisa ser adicionado ❌
- `@types/ws` — **NÃO instalado** — precisa ser adicionado ❌
- `inquirer` — **NÃO instalado** — precisa ser adicionado ❌

---

## Requisitos Técnicos

### Dependências a Instalar

| Pacote        | Tipo          | Versão recomendada | Motivo                                                       |
|---------------|--------------|---------------------|--------------------------------------------------------------|
| `ws`          | dependencies  | `^8.18.0`          | Biblioteca WebSocket para Node.js (servidor WebSocket 9003)  |
| `ts-node`     | devDependencies | `^10.9.2`        | Compilação on-the-fly de TypeScript para Node.js             |
| `@types/ws`   | devDependencies | `^8.5.13`        | Tipos TypeScript para `ws`                                   |
| `inquirer`    | dependencies  | `^12.6.3`          | Menu interativo no terminal (Story 1.6)                      |

> ⚠️ **Atenção com `inquirer`:** A versão `^9.0.0+` é ESM-only. Usar com `ts-node` + `module: commonjs` **pode causar erro**. Solução: instalar `inquirer@^8.2.6` (última versão CJS), ou configurar o `tsconfig.server.json` com `"module": "commonjs"` e usar dynamic import. **Recomendação: usar `inquirer@8.2.6` para máxima compatibilidade CJS.**

### Arquivo `tsconfig.server.json` a Criar

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist/server",
    "rootDir": "."
  },
  "include": ["server/**/*.ts"],
  "exclude": ["node_modules", "src", ".next", "out"]
}
```

> **Por que `rootDir: "."`?** Para permitir que o `server/*.ts` importe de `src/` ou arquivos raiz se necessário nas stories futuras, mantendo a flexibilidade.

### Scripts a Adicionar ao `package.json`

```json
"server": "ts-node --project tsconfig.server.json server/server.ts",
"cli": "ts-node --project tsconfig.server.json server/cli.ts"
```

### Diretório `/server/` — Estrutura Mínima para Esta Story

Esta story **não implementa** a lógica dos arquivos, apenas garante que a estrutura base exista para validação dos scripts. Criar arquivos placeholder mínimos:

**`server/server.ts`** (placeholder):
```typescript
// server/server.ts — placeholder para Story 1.2
console.log('[server] starting...');
```

**`server/cli.ts`** (placeholder):
```typescript
// server/cli.ts — placeholder para Story 1.6
console.log('[cli] starting...');
```

> ✅ Esses placeholders permitem que `npm run server` e `npm run cli` executem sem erro de "arquivo não encontrado", validando o AC4.

---

## Regras de Arquitetura a Respeitar (Não Negociável)

1. **Isolamento de contextos TypeScript**: O `tsconfig.server.json` deve ser completamente independente do `tsconfig.json` do Next.js. Nunca usar `extends` do tsconfig raiz, pois ele herda configurações ESM incompatíveis com Node.js.

2. **Porta 9002 = Next.js, Porta 9003 = WebSocket Backend**: O `npm run dev` (Next.js) usa a porta `9002`. O servidor backend WebSocket (implementado na Story 1.2) usará a porta `9003`. Os scripts desta story não devem abrir nenhuma porta.

3. **Sem modificar o `tsconfig.json` raiz**: O `tsconfig.json` existente é configuração exclusiva do Next.js. Qualquer alteração pode quebrar a compilação do frontend e o hot-reload do Turbopack.

4. **`ts-node` apenas como devDependency**: O `ts-node` não deve ir para `dependencies` pois é usado apenas em desenvolvimento/VM — em produção o código seria compilado com `tsc` para `dist/`.

5. **Stream Key nunca em logs**: Princípio de segurança global — mesmo nos arquivos placeholder, nunca logar `process.env.YOUTUBE_STREAM_KEY`.

6. **Estrutura de pastas conforme arquitetura**:
   - Backend Node.js: `/server/` (raiz do projeto)
   - Frontend Next.js: `/src/` (sem alterações)
   - Assets: `/src/assets/audio/`, `/src/assets/details/`
   - Logs: `/logs/` (criado nas stories de compliance)

---

## Contexto do Epic 1 (Visão Geral das Próximas Stories)

Esta story é **pré-requisito bloqueante** para todas as demais:

| Story | Depende de 1.1? | O que adiciona a `/server/` |
|-------|----------------|-----------------------------|
| 1.2   | ✅ Sim         | Implementa `server.ts` com WebSocket na porta 9003 |
| 1.3   | ✅ Sim         | Adiciona State Store + `state-cache.json` |
| 1.4   | ✅ Sim         | Adiciona broadcasting de eventos `domain:action` |
| 1.5   | ✅ Sim         | Adiciona sincronização de estado para novos clientes |
| 1.6   | ✅ Sim         | Implementa `cli.ts` com menu Inquirer |
| 1.7   | ✅ Sim         | Conecta CLI ao WebSocket e envia comandos |

**O objetivo do Epic 1 completo:** Bruno pode iniciar o sistema a partir do terminal, com servidor Node.js rodando, WebSocket ativo (porta 9003) e CLI interativa respondendo a comandos básicos.

---

## Checklist de Implementação

- [x] Executar `npm install ws inquirer@8.2.6` (dependencies)
- [x] Executar `npm install -D ts-node @types/ws` (devDependencies)
- [x] Criar `tsconfig.server.json` na raiz do projeto
- [x] Adicionar scripts `"server"` e `"cli"` ao `package.json` (preservar scripts existentes)
- [x] Criar `/server/server.ts` placeholder
- [x] Criar `/server/cli.ts` placeholder
- [x] Verificar: `npm run server` executa sem erro → `[server] starting...`
- [x] Verificar: `npm run cli` executa sem erro → `[cli] starting...`
- [x] Verificar: `npm run dev` ainda funciona na porta 9002 (sem regressão)
- [x] Verificar: `npm run typecheck` — erros pré-existentes em `calendar.tsx` confirmados como baseline, sem novas regressões introduzidas
- [x] Adicionar `dist/`, `server/state-cache.json` e `logs/compliance-audit.jsonl` ao `.gitignore`

---

## Notas para o Desenvolvedor

### Por que `inquirer@8.2.6` e não a versão mais recente?

O `inquirer@9+` adotou ESM puro (`"type": "module"`). Nosso backend usa `module: "commonjs"` no `tsconfig.server.json` para compatibilidade com o runtime Node.js nativo + `ts-node`. Misturar CJS e ESM exige `dynamic import()` assíncrono e complica o código desnecessariamente. A versão `8.x` é a última com suporte CJS completo e é estável.

### Por que não usar `tsx` em vez de `ts-node`?

O projeto já usa `tsx` nos scripts do Genkit (`tsx src/ai/dev.ts`). No entanto, `tsx` é otimizado para ESM e o contexto Next.js. O `ts-node` com `tsconfig.server.json` explícito dá controle preciso sobre o módulo CJS necessário para o backend. Consistência arquitetural > uniformidade de ferramentas.

### `.gitignore` — Entradas Adicionadas

```
# Backend build output
dist/

# State persistence (gerado em runtime, não versionado)
server/state-cache.json

# Logs de auditoria (gerados em runtime)
logs/compliance-audit.jsonl
```

---

## Dev Agent Record

### Implementation Notes

- Dependências `ws@^8.21.0` e `inquirer@^8.2.6` instaladas em `dependencies`.
- `ts-node@^10.9.2` e `@types/ws@^8.18.1` instaladas em `devDependencies`.
- `tsconfig.server.json` criado na raiz — completamente isolado do `tsconfig.json` do Next.js (sem `extends`, sem `jsx`, sem plugin `next`).
- Scripts `server` e `cli` adicionados ao `package.json` preservando todos os scripts existentes.
- Arquivos placeholder `/server/server.ts` e `/server/cli.ts` criados para validação dos scripts.
- Erros pré-existentes em `src/components/ui/calendar.tsx` (react-day-picker API change) confirmados como baseline via `git stash` — nenhuma regressão introduzida por esta story.

### Completion Notes

✅ Story 1.1 implementada com sucesso. Todos os 4 ACs validados:
- **AC1**: `npm install` executa sem erros de conflito
- **AC2**: Scripts `server` e `cli` presentes no `package.json`, script `dev` inalterado
- **AC3**: `tsconfig.server.json` com `module: commonjs`, `include: ["server/**/*.ts"]`, sem configurações Next.js
- **AC4**: `npm run server` e `npm run cli` executam sem `EADDRINUSE` (nenhuma porta aberta nos placeholders)

### File List

- `package.json` — adicionados scripts `server` e `cli`
- `tsconfig.server.json` — novo arquivo (backend TS config)
- `server/server.ts` — novo arquivo (placeholder)
- `server/cli.ts` — novo arquivo (placeholder)
- `.gitignore` — adicionadas entradas para `dist/`, `server/state-cache.json`, `logs/compliance-audit.jsonl`

### Change Log

- 2026-06-11: Story 1.1 implementada — fundação do backend configurada (dependências, tsconfig, scripts, placeholders, .gitignore)

---

## Status

**Status:** review
**Nota de conclusão:** Implementação completa. Todos os ACs validados. Sem regressões no frontend.
