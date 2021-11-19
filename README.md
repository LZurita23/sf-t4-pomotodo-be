# Pomotodo Backend with DynamoDB

## Requirements
- node (tested with versions 10+)
- AWS account with DynamoDB and IAM role with Programmatic Access
- Access the TodoArchDiagram using [draw.io](https://app.diagrams.net/?splash=0&libs=aws4)

## Installation
cd into src/<lambda folders>
  - ex: cd src/addTodo
    - `npm install`
    - cd ../..
  * make sure this is done for each lambda
- terraform init
- terraform apply

## Usage
- Once you run the terraform apply, the following information will be available 

  Apply complete! Resources: 15 added, 0 changed, 0 destroyed.

  Outputs:

  addTodo = "addTodo"
  base_url = "https://hn54wa8csb.execute-api.us-east-1.amazonaws.com/serverless_lambda_stage/"

- Access postman and paste in the base_url line add /addTodo or /getTodo at the end. 
- Use a POST request for /addTodo
- Use a GET request for /getTodo

AddTodo Example:
```json body
{
  "name": "Add entry",
  "desc": "Personal log",
  "dateCreated": "1622077232207",
  "pomodoroCount": 2
}
```
AddTodo Response Example:
``` json response 
{
    "order": [
        "706d26b4-feac-4b9a-a468-b37fd042e49c"
    ],
    "id": "0",
    "todos": {
        "706d26b4-feac-4b9a-a468-b37fd042e49c": {
            "name": "Add entry",
            "pomodoroCount": 5,
            "dateCreated": "1622077232207",
            "id": "706d26b4-feac-4b9a-a468-b37fd042e49c",
            "desc": "Personal log"
        }
    }
}
```

GetTodo Example:
```json body
{
}
```
GetTodo Response Example
``` json response 
{
    "order": [
        "706d26b4-feac-4b9a-a468-b37fd042e49c"
    ],
    "id": "0",
    "todos": {
        "706d26b4-feac-4b9a-a468-b37fd042e49c": {
            "name": "Add entry",
            "pomodoroCount": 5,
            "dateCreated": "1622077232207",
            "id": "706d26b4-feac-4b9a-a468-b37fd042e49c",
            "desc": "Personal log"
        }
    }
}
---
```
Original Goals: Utilize terraform to build out our entire backend process. This includes refactoring todo service code to utilize lambda functions.
What I learned:
- Tiffany: How to break up a larger js file in to small lambda functions.
- Lori: Learned how modules work. Utilized Visual Studio shortcuts (code completion).
- Chuck: Learned more about other resources that are utilized int he main.tf
What we would do next:
- Refactor/modularize the main.tf to utilize multiple lambda functions. We would integrate the front end component to work with the back end component.
```