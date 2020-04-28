import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import * as uuid from 'uuid'
import * as utils from '../../auth/utils'

const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.TODOS_TABLE;
const bucketName = process.env.IMAGES_S3_BUCKET;
const region = process.env.REGION;

const s3 = new AWS.S3({
  signatureVersion: 'v4',
  region: 'us-east-1',
  params: { Bucket: bucketName }
});

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  try {
    // Generate image name
    const imageName = uuid.v4()
    // The URL looks like "https://s3-bucket-name.s3.eu-west-2.amazonaws.com/image.png"
    const imageUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${imageName}`

    // Obtain signed URL
    const urlParams = {
      Bucket: bucketName,
      Key: imageName,
      Expires: (60 * 5)
    };

    const uploadUrl = s3.getSignedUrl('putObject', urlParams);
    const userId = utils.userIdFromEvent(event)

    await docClient.update({
      TableName: tableName,
      Key: { todoId, userId },
      UpdateExpression: "set attachmentUrl = :url",
      ExpressionAttributeValues: {
        ":url": imageUrl
      },
      ReturnValues: "UPDATED_NEW"
    }).promise()

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ uploadUrl })
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
