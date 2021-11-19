terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.2.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = "us-east-1"
}

module "dynamodb_table" {
  source   = "terraform-aws-modules/dynamodb-table/aws"

  name     = "tododata"
  hash_key = "id"

  attributes = [
    {
      name = "id"
      type = "S"
    }

  ]

  tags = {
    Terraform   = "true"
    Environment = "staging"
  }

}
resource "random_pet" "lambda_bucket_name" {
  prefix = "todo-terraform-functions"
  length = 4
}

resource "aws_s3_bucket" "lambda_bucket" {
  bucket = random_pet.lambda_bucket_name.id

  acl           = "private"
  force_destroy = true
}

data "archive_file" "addTodo" {
  type = "zip"

  source_dir  = "${path.module}/src/addTodo"
  output_path = "${path.module}/addTodo.zip"
}

data "archive_file" "deleteTodo" {
  type = "zip"

  source_dir  = "${path.module}/src/deleteTodo"
  output_path = "${path.module}/deleteTodo.zip"
}

data "archive_file" "getTodo" {
  type = "zip"

  source_dir  = "${path.module}/src/getTodo"
  output_path = "${path.module}/getTodo.zip"
}

resource "aws_s3_bucket_object" "addTodo" {
  bucket = aws_s3_bucket.lambda_bucket.id

  key    = "addTodo.zip"
  source = data.archive_file.addTodo.output_path

  etag = filemd5(data.archive_file.addTodo.output_path)
}
resource "aws_s3_bucket_object" "deleteTodo" {
  bucket = aws_s3_bucket.lambda_bucket.id

  key    = "deleteTodo.zip"
  source = data.archive_file.deleteTodo.output_path

  etag = filemd5(data.archive_file.deleteTodo.output_path)
}


resource "aws_s3_bucket_object" "getTodo" {
  bucket = aws_s3_bucket.lambda_bucket.id

  key    = "getTodo.zip"
  source = data.archive_file.getTodo.output_path

  etag = filemd5(data.archive_file.getTodo.output_path)
}

resource "aws_lambda_function" "addTodo" {
  function_name = "addTodo"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_bucket_object.addTodo.key

  runtime = "nodejs12.x"
  handler = "app.addTodo"

  source_code_hash = data.archive_file.addTodo.output_base64sha256

  role = aws_iam_role.lambda_exec.arn
   environment {
    variables = {
      REGION     = "us-east-1",
      TABLE_NAME = "tododata"
    }
   }
}

resource "aws_lambda_function" "deleteTodo" {
  function_name = "deleteTodo"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_bucket_object.deleteTodo.key

  runtime = "nodejs12.x"
  handler = "app.deleteTodo"

  source_code_hash = data.archive_file.deleteTodo.output_base64sha256

  role = aws_iam_role.lambda_exec.arn
   environment {
    variables = {
      REGION     = "us-east-1",
      TABLE_NAME = "tododata"
    }
   }
}

resource "aws_lambda_function" "getTodo" {
  function_name = "getTodo"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_bucket_object.getTodo.key

  runtime = "nodejs12.x"
  handler = "app.getTodo"

  source_code_hash = data.archive_file.getTodo.output_base64sha256

  role = aws_iam_role.lambda_exec.arn
   environment {
    variables = {
      REGION     = "us-east-1",
      TABLE_NAME = "tododata"
    }
   }
}

resource "aws_cloudwatch_log_group" "addTodo" {
  name = "/aws/lambda/${aws_lambda_function.addTodo.function_name}"

  retention_in_days = 30
}
resource "aws_cloudwatch_log_group" "deleteTodo" {
  name = "/aws/lambda/${aws_lambda_function.deleteTodo.function_name}"

  retention_in_days = 30
}
resource "aws_cloudwatch_log_group" "getTodo" {
  name = "/aws/lambda/${aws_lambda_function.getTodo.function_name}"

  retention_in_days = 30
}

resource "aws_iam_role" "lambda_exec" {
  name = "serverless_lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Sid    = ""
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  
}
resource "aws_iam_role_policy_attachment" "dynamodb_policy" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}
resource "aws_iam_role_policy_attachment" "lambda_S3_policy" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonS3ObjectLambdaExecutionRolePolicy"
}

resource "aws_apigatewayv2_api" "lambda" {
  name          = "serverless_lambda_gw"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "lambda" {
  api_id = aws_apigatewayv2_api.lambda.id

  name        = "serverless_lambda_stage"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw.arn

    format = jsonencode({
      requestId               = "$context.requestId"
      sourceIp                = "$context.identity.sourceIp"
      requestTime             = "$context.requestTime"
      protocol                = "$context.protocol"
      httpMethod              = "$context.httpMethod"
      resourcePath            = "$context.resourcePath"
      routeKey                = "$context.routeKey"
      status                  = "$context.status"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
      }
    )
  }
}

resource "aws_apigatewayv2_integration" "addTodo" {
  api_id = aws_apigatewayv2_api.lambda.id

  integration_uri    = aws_lambda_function.addTodo.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "addTodo" {
  api_id = aws_apigatewayv2_api.lambda.id

  route_key = "POST /addTodo"
  target    = "integrations/${aws_apigatewayv2_integration.addTodo.id}"
}
resource "aws_apigatewayv2_integration" "deleteTodo" {
  api_id = aws_apigatewayv2_api.lambda.id
  integration_type = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.deleteTodo.invoke_arn
}

resource "aws_apigatewayv2_route" "deleteTodo" {
  api_id = aws_apigatewayv2_api.lambda.id

  route_key = "DELETE /deleteTodo"
  target    = "integrations/${aws_apigatewayv2_integration.deleteTodo.id}"
}

resource "aws_apigatewayv2_integration" "getTodo" {
  api_id = aws_apigatewayv2_api.lambda.id

  integration_uri    = aws_lambda_function.getTodo.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "getTodo" {
  api_id = aws_apigatewayv2_api.lambda.id

  route_key = "GET /getTodo"
  target    = "integrations/${aws_apigatewayv2_integration.getTodo.id}"
}

resource "aws_cloudwatch_log_group" "api_gw" {
  name = "/aws/api_gw/${aws_apigatewayv2_api.lambda.name}"

  retention_in_days = 30
}

resource "aws_lambda_permission" "api_gw_addTodo" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.addTodo.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.lambda.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gw_deleteTodo" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.deleteTodo.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.lambda.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gw_geteTodo" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.getTodo.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.lambda.execution_arn}/*/*"
}