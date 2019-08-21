# Tapster Server

Node/Express API for Tapster apps and dashboards

## Dev Setup:

- Create a `.env` file in the root of the project
  it should contain the following:

```
NODE_ENV=development
DB_NAME=tapster
DB_USER=root
DB_PASS=yourpassword
```

- Make sure mysql server is running locally.
- Download and use [MySQL Workbench](https://dev.mysql.com/downloads/workbench/) to manage and browse your local db server
- Create a schema (database) called `tapster`
- Run migrations to update the schema: `npx sequelize-cli db:migrate`
- `npm run dev` to start the server and make sure it runs with no errors.

## Sequelize ORM CLI commands:

### Creating migrations/models:

`npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string`

### Apply migrations:

`npx sequelize-cli db:migrate`

### Undo last migration:

`npx sequelize-cli db:migrate:undo`

### Seed the database:

`npx sequelize-cli db:seed:all`
