import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoAccess } from '../dataLayer/todosAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { userIdFromEvent } from '../auth/utils'
import {APIGatewayProxyEvent} from "aws-lambda";
import {UpdateTodoRequest} from "../requests/UpdateTodoRequest";

const todoAccess = new TodoAccess()

export async function getTodos(event: APIGatewayProxyEvent): Promise<TodoItem[]> {
  const userId = userIdFromEvent(event)
  return await todoAccess.getTodos(userId)
}

export async function generateUploadUrl(event: APIGatewayProxyEvent) {
  const imageName = uuid.v4()
  const todoId = event.pathParameters.todoId
  const userId = userIdFromEvent(event)
  await todoAccess.setTodoAttachment(todoId, userId, imageName)
  return todoAccess.getUploadUrl(imageName)
}

export async function updateTodo(event: APIGatewayProxyEvent) {
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  const todoId = event.pathParameters.todoId
  const userId = userIdFromEvent(event)
  return await todoAccess.updateTodo(todoId, userId, updatedTodo)
}

export async function deleteTodo(event: APIGatewayProxyEvent) {
  const todoId = event.pathParameters.todoId
  const userId = userIdFromEvent(event)
  return await todoAccess.deleteTodo(todoId, userId)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  event: APIGatewayProxyEvent
): Promise<TodoItem> {

  const itemId = uuid.v4()
  const userId = userIdFromEvent(event)

  return await todoAccess.createTodo({
    todoId: itemId,
    userId: userId,
    name: createTodoRequest.name,
    createdAt: createTodoRequest.createdAt,
    dueDate: createTodoRequest.dueDate,
    done: createTodoRequest.done,
    attachmentUrl: createTodoRequest.attachmentUrl
  })
}
