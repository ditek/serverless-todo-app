import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import * as AWS from 'aws-sdk'
import * as utils from '../../auth/utils'

const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.TODOS_TABLE;

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  const userId = utils.userIdFromEvent(event)

  try {
    await docClient.update({
      TableName: tableName,
      Key: { todoId, userId },
      UpdateExpression: "set #n = :n, dueDate = :dD, done = :d",
      ExpressionAttributeValues: {
        ":n": updatedTodo.name,
        ":dD": updatedTodo.dueDate,
        ":d": updatedTodo.done
      },
      ExpressionAttributeNames: {
        "#n": "name"
      },
      ReturnValues: "UPDATED_NEW"
    }).promise()

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: ""
    }
  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(error)
    }
  }
}
