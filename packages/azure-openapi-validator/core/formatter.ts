import { Message } from "./types"
import { DocumentDependencyGraph } from "./depsGraph"
import { stringify } from "./jsonpath"
import { LinterResultMessage } from "."

export interface IFormatter<T> {
  format: (msg: Message | Message[]) => T[]
}

export class JsonFormatter implements IFormatter<LinterResultMessage> {
  constructor(private graph: DocumentDependencyGraph) {}
  format(message: Message | Message[]) {
    const outputs = []
    const msgs = Array.isArray(message) ? message : [message]
    for (const msg of msgs) {
      const document = this.graph.getDocument(msg.Source[0].document)
      let path = msg.Source[0].jsonPath
      if (path[0] === "$") {
        path = path.slice(1)
      }
      const range = document.getPositionFromJsonPath(path)

      const jsonMsg = {
        ...msg.Details,
        sources: [msg.Source[0].document + `:${range.start.line}:${range.start.column}`],
        "json-path": stringify(path as string[]),
        location: range.start,
        range
      }
      outputs.push(jsonMsg)
    }
    return outputs
  }
}
