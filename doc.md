# AuraStream - Documentação do Projeto

**Data:** 06 de Junho de 2026
**Versão:** 0.1.0
**Status:** Em Desenvolvimento

---

## 📋 Visão Geral

**AuraStream** é um mecanismo de composição em tempo real para streaming ao vivo, projetado para funcionar em ambientes VM com capacidades de renderização local e transmissão profissional. O projeto combina:

- 🎨 **Interface Dashboard ao vivo** para controle de fluxos
- ✨ **Motor de Aurora Boreal gerado** como fallback dinâmico
- 🤖 **IA Generativa** para criação de descrições criativas de tracks
- 🎵 **Sequenciador de Áudio** com suporte a crossfading
- 📺 **Sistema de Miniplayer** como overlay customizável
- 📡 **Ponte RTMP/SRT** com integração FFmpeg
- 🔄 **Sincronização Automática** de Assets

---

## 🏗️ Stack de Tecnologia

### Frontend & Framework
- **Next.js 15.5.9** - Framework React com App Router e renderização híbrida
- **React 19.2.1** - Biblioteca UI com hooks modernos
- **TypeScript 5** - Type-safety em todo o projeto
- **TailwindCSS 3.4.1** - Utility-first CSS framework
- **PostCSS 8** - Processador de CSS

### UI & Componentes
- **Shadcn/UI** - Componentes base reutilizáveis (via Radix UI)
- **Radix UI** - Biblioteca headless de componentes acessíveis
  - Alert Dialog, Accordion, Avatar, Checkbox, Dialog, Dropdown Menu
  - Label, Menubar, Popover, Progress, Radio Group, Scroll Area
  - Select, Separator, Sheet, Sidebar, Slider, Switch, Tabs, Toast, Tooltip
- **Lucide React** - Ícones minimalistas (475+ ícones)
- **Embla Carousel** - Carrossel responsivo

### Gerenciamento de Estado & Forms
- **React Hook Form 7.54.2** - Gerenciamento eficiente de formulários
- **Zod 3.24.2** - Validação TypeScript-first de esquemas
- **@hookform/resolvers** - Integração com validadores

### AI & Geração de Conteúdo
- **Google Genkit 1.28.0** - SDK para IA generativa
- **@genkit-ai/google-genai 1.28.0** - Provider Google AI
- **genkit-cli 1.28.0** - CLI para desenvolvimento

### Utilitários
- **Class Variance Authority 0.7.1** - Builder de classNames com variantes
- **CLSX 2.1.1** - Gerador de className condicional
- **Tailwind Merge 3.0.1** - Merge inteligente de classes Tailwind
- **Date-fns 3.6.0** - Utilitários para manipulação de datas
- **React Day Picker 9.11.3** - Seletor de datas
- **Recharts 2.15.1** - Biblioteca de gráficos React
- **Embla Carousel React 8.6.0** - Carrossel
- **Firebase 11.9.1** - Backend (se utilizado)
- **dotenv 16.5.0** - Variáveis de ambiente
- **Patch Package 8.0.0** - Patch de dependências

---

## 📁 Estrutura do Projeto

```
/
├── src/
│   ├── ai/
│   │   ├── flows/
│   │   │   └── generate-creative-track-description.ts  # Flow IA para descrições
│   │   └── dev.ts                                      # Dev server para Genkit
│   ├── app/
│   │   ├── api/
│   │   │   └── ai/
│   │   │       └── generate-description/
│   │   │           └── route.ts                        # Endpoint IA
│   │   ├── globals.css                                 # Estilos globais
│   │   ├── layout.tsx                                  # Layout raiz
│   │   └── page.tsx                                    # Page principal (Dashboard)
│   ├── components/
│   │   ├── streaming/
│   │   │   ├── AuroraBackground.tsx                   # Fundo Aurora Boreal
│   │   │   ├── Dashboard.tsx                          # Dashboard principal
│   │   │   └── MiniPlayer.tsx                         # Overlay miniplayer
│   │   └── ui/                                        # Componentes Shadcn/UI
│   │       ├── accordion.tsx, alert.tsx, alert-dialog.tsx
│   │       ├── avatar.tsx, badge.tsx, button.tsx
│   │       ├── calendar.tsx, card.tsx, carousel.tsx
│   │       ├── chart.tsx, checkbox.tsx, collapsible.tsx
│   │       ├── dialog.tsx, dropdown-menu.tsx, form.tsx
│   │       ├── input.tsx, label.tsx, menubar.tsx
│   │       ├── popover.tsx, progress.tsx, radio-group.tsx
│   │       ├── scroll-area.tsx, select.tsx, separator.tsx
│   │       ├── sheet.tsx, sidebar.tsx, skeleton.tsx
│   │       ├── slider.tsx, switch.tsx, table.tsx
│   │       ├── tabs.tsx, textarea.tsx, toast.tsx
│   │       ├── toaster.tsx, tooltip.tsx
│   ├── hooks/
│   │   ├── use-mobile.tsx                             # Hook para detectar mobile
│   │   └── use-toast.ts                               # Hook para sistema toast
│   ├── lib/
│   │   ├── placeholder-images.json                    # Imagens placeholder
│   │   ├── placeholder-images.ts                      # Utilidades de imagens
│   │   └── utils.ts                                   # Funções utilitárias gerais
│   └── assets/
│       ├── audio/                                     # Arquivos de áudio
│       ├── video/                                     # Arquivos de vídeo
│       └── details/                                   # Assets detalhados
├── _bmad/                                             # Configuração BMad (Framework)
│   ├── config.toml, config.user.toml
│   ├── _config/, bmm/, core/, custom/, scripts/, tea/
├── _bmad-output/                                      # Outputs gerados
├── docs/
│   └── blueprint.md                                   # Plano visual do projeto
├── Configurações Raiz
│   ├── package.json                                   # Dependências e scripts
│   ├── next.config.ts                                 # Config Next.js
│   ├── tsconfig.json                                  # Config TypeScript
│   ├── tailwind.config.ts                             # Config Tailwind
│   ├── postcss.config.mjs                             # Config PostCSS
│   ├── components.json                                # Config Shadcn/UI
│   ├── studio.json                                    # Config Studio (?)
│   └── next-env.d.ts                                  # Types Next.js auto-gerados
```

---

## 🎨 Componentes Principais

### 1. **AuroraBackground** (`src/components/streaming/AuroraBackground.tsx`)
Motor de renderização Canvas que cria o efeito Aurora Boreal dinâmico como fallback visual quando nenhum vídeo de fundo está presente.

**Características:**
- Renderização em Canvas em tempo real
- Gradientes animados simulando Aurora Boreal
- Fallback quando vídeo não está disponível
- Performance otimizada para streaming

### 2. **Dashboard** (`src/components/streaming/Dashboard.tsx`)
Interface centralizadora para monitoramento e controle de status do fluxo ao vivo e saída do stream.

**Características:**
- Monitoramento em tempo real
- Controles de stream
- Gerenciamento de tracks
- Integração com AI para geração de descrições

### 3. **MiniPlayer** (`src/components/streaming/MiniPlayer.tsx`)
Camada visual customizável posicionada como overlay que exibe metadata de tracks em tempo real no canto inferior direito.

**Características:**
- Overlay assimétrico e low-profile
- Exibição de metadata (título, artista, gênero)
- Descrições criativas geradas por IA
- Transições fluidas

### 4. **Sistema de Componentes UI**
Biblioteca completa de componentes reutilizáveis baseados em Shadcn/UI para construir interfaces consistentes.

---

## 🚀 Features Implementadas

### ✅ Dashboard de Composição Ao Vivo
- Interface centralizada para monitoramento
- Controle em tempo real de outputs
- Status visual do stream

### ✅ Motor Aurora Boreal
- Renderização Canvas de gradientes dinâmicos
- Fallback automático quando vídeo ausente
- Animações fluidas e cinéticas

### ✅ IA Generativa (Genkit)
- Integration com Google Genkit
- Geração automática de descrições criativas
- Endpoint API `/api/ai/generate-description`

### ✅ Miniplayer Overlay
- Exibição de metadata em tempo real
- Posicionamento customizável
- Transições suaves

### ✅ Sistema de Tracks
- Gerenciamento local de tracks
- Suporte a múltiplos gêneros e artistas
- Descrições customizáveis

### ⏳ Em Desenvolvimento
- Sequenciador de Áudio automatizado
- Sistema de crossfading
- Ponte RTMP/SRT com FFmpeg
- Sincronização automática de assets

---

## 🎨 Guia de Estilo

### Paleta de Cores
| Cor | Código | Uso |
|-----|--------|-----|
| Crimson | `#EB2E4E` | Cor primária (botões, destaque, live indicator) |
| Charcoal | `#141011` | Background principal (deeply desaturated) |
| Orchid | `#D629AD` | Accent (elementos ativos do miniplayer) |

### Tipografia
| Tipo | Fonte | Uso |
|------|-------|-----|
| Headlines | Space Grotesk (300-700) | Títulos, headings principais |
| Body | Inter (100-900) | Descrições, metadata, body text |
| Code | Monospace | Código, valores técnicos |

### Design Principles
- **Minimalista**: Ícones outline limpinhos
- **High-tech**: Espaçamento preciso, feels "pro-app"
- **Cinematic**: Transições fluidas e easing suave
- **Assimétrico**: Layout low-profile que prioriza espaço visual do stream
- **Readable**: Absoluta legibilidade para títulos e descrições de tracks

---

## 📝 Configuração & Setup

### TypeScript (`tsconfig.json`)
- **Target:** ES2017
- **Mode:** Strict
- **Paths Alias:** `@/*` → `./src/*`
- **JSX:** Preserve (Next.js App Router)

### Tailwind (`tailwind.config.ts`)
- **Dark Mode:** Class-based
- **CSS Variables:** Habilitadas (HSL format)
- **Extended Theme:**
  - Font families customizadas
  - Color system completo
  - Base colors: neutral

### Shadcn/UI (`components.json`)
- **Style:** Default
- **Icons:** Lucide React
- **RSC:** Habilitado (React Server Components)
- **CSS Variables:** Habilitadas com base color `neutral`

### Next.js (`next.config.ts`)
- **Output:** Static export (`export`)
- **Image Optimization:**
  - placehold.co
  - images.unsplash.com
  - picsum.photos
- **Build Errors:** Build completa com TypeScript/ESLint ignorados

---

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev           # Inicia dev server com Turbopack (porta 9002)
npm run genkit:dev    # Inicia Genkit dev server
npm run genkit:watch  # Inicia Genkit com watch mode

# Build & Deploy
npm run build         # Build otimizado com NODE_ENV=production
npm start            # Inicia servidor Next.js em produção

# Qualidade
npm run lint         # Lint com ESLint
npm run typecheck    # Type check com TypeScript (sem emit)
```

---

## 🌐 Endpoints API

### POST `/api/ai/generate-description`
Endpoint para geração de descrições criativas via Google Genkit.

**Request:**
```json
{
  "title": "string",
  "artist": "string",
  "genre": "string"
}
```

**Response:**
```json
{
  "description": "string"
}
```

---

## 📊 Estado do Projeto

### Arquitetura
- ✅ **Frontend Framework**: Next.js 15 com App Router
- ✅ **Component Library**: Shadcn/UI + Radix UI
- ✅ **Styling**: Tailwind CSS com dark mode
- ✅ **Type Safety**: TypeScript strict mode
- ✅ **UI Components**: ~20+ componentes prontos
- ✅ **AI Integration**: Genkit com Google AI
- ✅ **Forms**: React Hook Form + Zod validation

### Core Features
- ✅ Dashboard component
- ✅ Aurora Background renderer
- ✅ Miniplayer overlay
- ✅ Track management system
- ✅ AI description generation
- ⏳ Audio sequencer
- ⏳ RTMP/SRT broadcast bridge
- ⏳ Asset synchronization system

### Padrões Implementados
- **Component Structure**: Modular, dividido por feature
- **Hooks Customizados**: `use-toast`, `use-mobile`
- **Client-side Rendering**: Componentes streaming com "use client"
- **API Routes**: Endpoints API estruturados
- **Environment Variables**: dotenv para configuração

---

## 🔑 Padrões Críticos de Implementação

### 1. **Path Aliases**
Sempre use `@/` para imports internos:
```typescript
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
```

### 2. **Client Components**
Marque componentes interativos com `"use client"`:
```typescript
"use client"

export function MyComponent() { ... }
```

### 3. **Validação de Forms**
Use Zod + React Hook Form:
```typescript
const schema = z.object({
  title: z.string(),
  // ...
})
```

### 4. **Componentes UI**
Reutilize componentes de `@/components/ui`:
```typescript
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
```

### 5. **Variantes de Componentes**
Use Class Variance Authority para variantes:
```typescript
const buttonVariants = cva(...)
```

### 6. **Hooks Customizados**
- `useToast()` - Sistema de notificações toast
- `useMobile()` - Detecção de breakpoint mobile

### 7. **Metadata e SEO**
Defina metadata no layout raiz:
```typescript
export const metadata: Metadata = { ... }
```

---

## 🚦 Como Executar

### 1. Instalação
```bash
npm install
```

### 2. Development
```bash
npm run dev           # Frontend na porta 9002
npm run genkit:dev    # Em outro terminal para IA
```

### 3. Build
```bash
npm run build
npm start
```

---

## 📚 Recursos Adicionais

- **Blueprint Visual**: [docs/blueprint.md](docs/blueprint.md)
- **Shadcn/UI Docs**: https://ui.shadcn.com
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind Docs**: https://tailwindcss.com/docs
- **Google Genkit**: https://genkit.dev

---

## 📝 Notas Importantes

- Build errors de TypeScript e ESLint são ignorados (`ignoreBuildErrors: true`)
- Projeto exportado como static site (`output: 'export'`)
- Utiliza Turbopack em desenvolvimento para performance máxima
- Sistema de dark mode implementado via classes CSS
- Color system baseado em CSS variables (HSL format)

---

**Última atualização:** 06 de junho de 2026
