# Visual Lab v2 boundary

Visual Lab is intentionally not mounted in the V1 reader. Its future scenes should be deterministic, inspectable, and useful without live hardware.

## Scene contract

```ts
type VisualScene = {
  id: string
  title: string
  topicId: string
  description: string
  initialState: Record<string, unknown>
  controls: SceneControl[]
  render(state: Record<string, unknown>): SceneFrame
}
```

## Planned scenes

- UART, SPI, and I2C transactions
- Stack and heap state
- Cache hits, misses, and eviction
- Virtual-memory translation
- System-call transitions
- Interrupt entry and return
- DMA movement
- Schematic signal tracing

Each scene will support play, pause, reset, step, annotations, accessible text, and predict-before-reveal interaction. V1 uses static diagrams for these mechanisms instead.
