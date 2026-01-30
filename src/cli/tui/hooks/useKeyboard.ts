import { useInput } from 'ink'

export interface KeyboardHandlers {
  onUp?: () => void
  onDown?: () => void
  onEnter?: () => void
  onBack?: () => void
  onQuit?: () => void
  onRefresh?: () => void
  onNew?: () => void
  onReply?: () => void
}

export function useKeyboard(handlers: KeyboardHandlers) {
  useInput((input, key) => {
    if (input === 'j' || key.downArrow) {
      handlers.onDown?.()
    } else if (input === 'k' || key.upArrow) {
      handlers.onUp?.()
    } else if (key.return) {
      handlers.onEnter?.()
    } else if (input === 'q' || key.escape) {
      handlers.onBack?.()
    } else if (input === 'Q') {
      handlers.onQuit?.()
    } else if (input === 'r') {
      handlers.onRefresh?.()
    } else if (input === 'n') {
      handlers.onNew?.()
    } else if (input === 'R') {
      handlers.onReply?.()
    }
  })
}
