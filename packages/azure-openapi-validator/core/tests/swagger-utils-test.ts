import * as assert from "assert"
import { getResolvedSchemaByPath } from "../rules/utilities/rules-helper"
import { SwaggerHelper } from "../swaggerHelper"
import { suite, test } from "mocha-typescript"
import { followReference } from "../utils"
import { SwaggerInventory } from "../swaggerInventory"
import { getFilePath, readObjectFromFile } from "./utilities/tests-helper"
import { dirname } from "path"
@suite
class SwaggerHelperTests {
  @test public async "external reference"() {
    const inventory = new SwaggerInventory()
    const swagger = await (await inventory.loadDocument(getFilePath("armResource/externalRef.json"))).getObj()
    const util = new SwaggerHelper(swagger, null, inventory)
    const schema = getResolvedSchemaByPath(
      swagger,
      ["paths", "/providers/Microsoft.MachineLearning/operations", "get", "responses", "default", "schema"],
      inventory
    )
    const resolvedSchema = followReference(swagger, schema, inventory)
    assert.strictEqual(!!resolvedSchema.properties, true)

    const errorObject = util.getPropertyOfModel(resolvedSchema, "error")
    assert.strictEqual(!!errorObject, false)
  }

  @test public "test get properties"() {
    const swagger = readObjectFromFile(getFilePath("armResource/test_get_properties.json"))
    const util = new SwaggerHelper(swagger, null, null)
    const bar = util.getDefinitionByName("A")
    assert.deepEqual(
      {
        type: "string",
        description: "p1"
      },
      util.getPropertyOfModel(bar, "p1")
    )
    const foo = util.getDefinitionByName("B")
    assert.deepEqual(
      {
        description: "a ref"
      },
      util.getPropertyOfModel(foo, "display")
    )
  }
  @test public async "resolve partial schema"() {
    const filePath = getFilePath("references/external.json")
    const inventory = new SwaggerInventory()
    const openapiDefinitionObject = (await inventory.loadDocument(filePath)).getObj()
    const comonFilePath = getFilePath("references/common.json")
    const commonDoc = await inventory.loadDocument(comonFilePath)
    const swaggerHelper = new SwaggerHelper(openapiDefinitionObject, filePath, inventory)
    let resolvedSchema = (await swaggerHelper.resolveSchema(
      openapiDefinitionObject.paths[
        "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Network/applicationGateways/{applicationGatewayName}/listKeys"
      ].post
    )) as any
    assert.strictEqual(resolvedSchema.parameters[0].name, "subscriptionId")
    resolvedSchema = await swaggerHelper.resolveSchema(dirname(filePath) + "/common.json#/parameters/ApiVersion")

    resolvedSchema = await swaggerHelper.resolveSchema(dirname(filePath) + "/common.json#/parameters/ApiVersion")

    assert.strictEqual(resolvedSchema.name, "api-version")

    const position = commonDoc.getPositionFromJsonPath(["definitions", "a", "allOf", "0"])

    assert.ok(!!position.start.line)
  }
}
