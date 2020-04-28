import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS)

import { TodoItem } from '../models/TodoItem'
import {UpdateTodoRequest} from "../requests/UpdateTodoRequest";

export class TodoAccess {

  s3 = new AWS.S3({
    signatureVersion: 'v4',
    region: this.region,
    params: { Bucket: this.bucketName }
  });

  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly tableName = process.env.TODOS_TABLE,
    private readonly bucketName = process.env.IMAGES_S3_BUCKET,
    private readonly region = process.env.REGION
  ) {}

  async getTodos(userId: string): Promise<TodoItem[]> {
    console.log('Getting all todos')
    const result = await this.docClient.query({
      TableName: this.tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise()
    const items = result.Items
    return items as TodoItem[]
  }

  async setTodoAttachment(todoId: string, userId: string, imageName: string) {
    console.log('Set attachment')

    // The URL looks like "https://s3-bucket-name.s3.eu-west-2.amazonaws.com/image.png"
    const imageUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${imageName}`
    await this.docClient.update({
      TableName: this.tableName,
      Key: { todoId, userId },
      ConditionExpression: "attribute_exists(todoId)",
      UpdateExpression: "set attachmentUrl = :url",
      ExpressionAttributeValues: {
        ":url": imageUrl
      },
      ReturnValues: "UPDATED_NEW"
    }).promise()
  }

  getUploadUrl(imageName: string){
    const urlParams = {
      Bucket: this.bucketName,
      Key: imageName,
      Expires: (60 * 5)
    };
    return this.s3.getSignedUrl('putObject', urlParams);
  }

  async updateTodo(todoId: string, userId: string, item: UpdateTodoRequest) {
    console.log('Update todo')
    await this.docClient.update({
      TableName: this.tableName,
      Key: { todoId, userId },
      ConditionExpression: "attribute_exists(todoId)",
      UpdateExpression: "set #n = :n, dueDate = :dD, done = :d",
      ExpressionAttributeValues: {
        ":n": item.name,
        ":dD": item.dueDate,
        ":d": item.done
      },
      ExpressionAttributeNames: {
        "#n": "name"
      },
      ReturnValues: "UPDATED_NEW"
    }).promise()
  }

  async createTodo(item: TodoItem): Promise<TodoItem> {
    await this.docClient.put({
      TableName: this.tableName,
      Item: item
    }).promise()
    return item
  }

  async deleteTodo(todoId: string, userId: string) {
    await this.docClient.delete({
      TableName: this.tableName,
      Key: { todoId, userId }
    }).promise();
  }

}
