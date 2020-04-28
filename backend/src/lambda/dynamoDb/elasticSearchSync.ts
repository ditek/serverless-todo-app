import { DynamoDBStreamEvent, DynamoDBStreamHandler } from 'aws-lambda'
import 'source-map-support/register'
import * as elasticsearch from 'elasticsearch'
import * as httpAwsEs from 'http-aws-es'

const esHost = process.env.ES_ENDPOINT

const es = new elasticsearch.Client({
  hosts: [ esHost ],
  connectionClass: httpAwsEs
})

export const handler: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
  console.log('Processing events batch from DynamoDB', JSON.stringify(event))

  for (const record of event.Records) {
    console.log('Processing record', JSON.stringify(record))
    if (record.eventName !== 'INSERT') {
      continue
    }

    const newItem = record.dynamodb.NewImage

    /* The object looks like:
    "dynamodb": {
      "Keys": {
          "todoId": {
              "S": "59956309-c7d9-4aa1-bf1d-90e9752284bb"
          },
          "userId": {
              "S": "google-oauth2|111456596741753831053"
          }
      },
      "NewImage": {
          "createdAt": {
              "S": "2019-030:01:45.424Z"
          },
          ...
          "done": {
              "BOOL": false
          }
      },
  },
     */
    // We loop on the image items to extract the fields
    const todoId = newItem.todoId.S
    let body = {}
    for(let field in newItem){
      const type = Object.keys(newItem[field])[0]
      body[field] = newItem[field][type]
    }

    await es.index({
      index: 'todos-index',
      type: 'todos',
      id: todoId,
      body
    })

  }
}
