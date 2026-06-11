# Story 5.1: Implementar a Geração de Descrições via Genkit (Batch por Faixa)

## Metadados

| Campo             | Valor                                                                              |
|-------------------|------------------------------------------------------------------------------------|
| **Story ID**      | 5.1                                                                                |
| **Story Key**     | 5-1-implementar-a-geracao-de-descricoes-via-genkit-batch                           |
| **Epic**          | Epic 5 — Automação e Descrições via IA *(Opcional)*                                |
| **Status**        | ready-for-dev                                                                      |
| **Esforço Est.**  | ~4h                                                                                |
| **Depende de**    | Story 3.3 (metadados parseados), Story 2.1 (fila carregada)                       |

---

## User Story

> **Como** Bruno,
> **Eu quero** que o servidor gere automaticamente uma descrição poética para cada faixa nova usando o Genkit/Gemini,
> **Para que** o MiniPlayer exiba textos evocativos que enriqueçam a experiência dos espectadores.

---

## Acceptance Criteria (BDD)

### AC1 — Geração em background para faixas sem descrição
```gherkin
Given uma faixa entra na fila e não possui `aiDescription` nos seus metadados
When o servidor a detecta
Then `server/ai-description.ts` chama o Genkit com prompt:
  "Generate a 2-line poetic description (max 120 chars) for a song titled '{title}' by {artist}, genre: {genre}. Write in English, atmospheric and evocative."
And a resposta é salva em `state.queue[i].aiDescription` e persistida em memória
And a geração ocorre em background sem bloquear a fila nem a reprodução
```

### AC2 — Erro tolerado graciosamente
```gherkin
When o Genkit retorna erro ou timeout (> 5s)
Then `aiDescription` fica como `null`
And MiniPlayer omite a linha de descrição sem crash
```

---

## Contexto para o Agente de Desenvolvimento

### Dependências

O projeto já tem `genkit@^1.28.0` e `@genkit-ai/google-genai@^1.28.0` instalados. Estes são usados para o frontend AI flow. Para o backend Node.js, precisamos chamar a API diretamente ou criar um endpoint HTTP no Next.js e chamá-lo via `fetch` do servidor.

**Abordagem recomendada:** Chamar o endpoint existente `http://localhost:9002/api/ai/generate-description` via `fetch` do servidor Node.js — reutiliza a integração Genkit já configurada no frontend.

### Implementação de `server/ai-description.ts`

```typescript
import { state, setState } from './state';

const AI_ENDPOINT = 'http://localhost:9002/api/ai/generate-description';
const TIMEOUT_MS = 5000;

export async function generateDescription(trackIndex: number): Promise<void> {
  const track = state.queue[trackIndex];
  if (!track || track.aiDescription !== undefined) return; // já gerada ou null explícito

  const title = track.metadata?.title ?? track.filename.replace(/\.mp3$/i, '');
  const artist = track.metadata?.artist ?? 'Unknown Artist';
  const genre = track.metadata?.genre ?? '';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, artist, genre }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { description } = await response.json();

    const newQueue = [...state.queue];
    newQueue[trackIndex] = { ...newQueue[trackIndex], aiDescription: description ?? null };
    setState({ queue: newQueue });
    console.log(`[ai] description generated for: ${title}`);
  } catch (err) {
    const newQueue = [...state.queue];
    newQueue[trackIndex] = { ...newQueue[trackIndex], aiDescription: null };
    setState({ queue: newQueue });
    console.warn(`[ai] failed to generate description for ${title}:`, (err as Error).message);
  }
}

// Gera em batch para toda a fila (não bloqueante)
export function generateAllDescriptions(): void {
  state.queue.forEach((_, i) => {
    // Escalonado para não sobrecarregar a API
    setTimeout(() => generateDescription(i), i * 1500);
  });
}
```

Chamar `generateAllDescriptions()` após `loadAudioQueue()` no boot do servidor.

### Regras Críticas

1. **Background** — nunca `await generateDescription()` no caminho crítico.
2. **Timeout de 5s** — usar `AbortController` para cancelar a fetch.
3. **`aiDescription: undefined`** (não gerado) vs **`null`** (falhou) — diferenciar estados.
4. **Escalonamento** — `setTimeout(fn, i * 1500)` para espaçar as chamadas à API.

---

## Checklist de Implementação

- [ ] Criar `server/ai-description.ts`
- [ ] Verificar endpoint `src/app/api/ai/generate-description/route.ts` existente e adaptar se necessário
- [ ] Chamar `generateAllDescriptions()` no boot após `loadAudioQueue()`
- [ ] Verificar: descrições geradas em background sem bloquear fila
- [ ] Verificar: erro ou timeout → `aiDescription: null` sem crash

---

## Status

**Status:** ready-for-dev
