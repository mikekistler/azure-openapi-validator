import { readFileSync } from "fs"
import { JsonPath,IFileSystem } from "./types"
import { JsonInstance, JsonParser } from "./jsonParser"
import { Resolver } from "./resolver"
import {  } from "."

export class OpenapiDocument {
  private _content = undefined
  private _doc = undefined
  private jsonInstance: JsonInstance
  private resolver
  constructor(private _specPath: string, private parser: JsonParser,private fileSystem:IFileSystem) {
  }
  async resolve() {
    this._content = await this.fileSystem.read(this._specPath)
    this.jsonInstance = this.parser.parse(this._content)
    this._doc = this.jsonInstance.getValue()
    this.resolver = new Resolver(this._doc, this._specPath)
    await this.resolver.resolve()
  }
  getObj() {
    return this._doc
  }
  getContent() {
    return this._content
  }

  getReferences() {
    return this.resolver.getReferences()
  }
  getDocumentPath() {
    return this._specPath
  }
  getPositionFromJsonPath(jsonPath: JsonPath) {
    return this.jsonInstance.getLocation(jsonPath)
  }
}
