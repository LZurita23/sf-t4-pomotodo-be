output "addTodo" {
  description = "Adds a new todo item."

  value = aws_lambda_function.addTodo.function_name
}

output "getTodo" {
  description = "Get todo item."

  value = aws_lambda_function.getTodo.function_name
}

output "base_url" {
  description = "Base URL for API Gateway stage."

  value = aws_apigatewayv2_stage.lambda.invoke_url
}
