# Design

## Users

- **Doadora:** a mother a few weeks after birth. Often holding the baby with one hand, short on sleep, mid-range Android on unstable 4G. Uses the app in short bursts.
- **Equipe do banco:** milk bank staff on a desktop browser, working through a daily queue.

## Principles

1. One primary action per screen. The home screen shows a single main button, chosen by `proxima_acao` from the backend.
2. Any flow can be interrupted and resumed. Keep form state; never lose input on a network error.
3. Ask little, infer the rest: the CEP fills the address, the last pickup pre-fills the next one.
4. Always show what happens next: step counters, expected response time, the pickup timeline.
5. Show concrete impact after each donation. Never guilt.

## Voice (pt-BR)

- Warm and direct. "Você", short sentences, one idea each.
- Never "mamãe", never blame. Health jargon only in the panel.
- Buttons are verb + object ("Agendar coleta"). Never "OK" or "Enviar" alone.
- Errors: what happened + what to do. Empty states: what this is + how to start.
- Donor-facing texts, tips, guides and health questions come from the API and are edited in the Django admin (`conteudo`, `PerguntaSaude`). The app keeps only layout and a short fallback.

Glossary for donor-facing text:

```yaml
# use: avoid
doação: contribuição
coleta: retirada, busca, visita
frascos: potes, recipientes
banco de leite: BLH
perguntas de saúde: triagem
equipe do banco: funcionário, motorista
```

## Accessibility (WCAG 2.2 AA)

Mobile:
- Every touchable has `accessibilityRole`, and an `accessibilityLabel` when it has no visible text.
- Touch targets at least 48x48 dp. Primary action pinned to the bottom, within thumb reach.
- Text scales with the system font. Never `allowFontScaling={false}`.
- Contrast 4.5:1 for text, 3:1 for icons and borders. Status is never color alone: color + text + icon.
- Brand pink and teal fail text contrast. Text and filled buttons use `primaria` and `turquesaTexto`; `rosa` and `turquesa` are for decoration.
- Motion: springs from `mola` in `tema.ts`; Reanimated layout animations follow the system reduce-motion setting. Haptics only through `lib/haptico.ts`. Icons: `lucide-react-native`.
- Field errors appear below the field and are announced to screen readers.
- Inputs set `keyboardType`, `textContentType` and `autoComplete`.
- Dates are picked from buttons for the next days, not a calendar grid.
- Animations respect reduced motion.

Web:
- Fully keyboard operable with visible focus and a skip link.
- Landmarks, one `h1` per page, `th scope` in tables, a label on every input.
- Success notices use `role="status"`. Layout holds at 200% zoom.

Before merging a screen: run the main flow with TalkBack, check it at the largest font size, and on web check it keyboard only.

## Sources

- Screens: [Figma KAMBY V2](https://www.figma.com/design/uYRn0mrUuzEE1xWW5Kc9BI/KAMBY---V2).
- Tokens: `mobile/src/lib/tema.ts`, web Tailwind config.
