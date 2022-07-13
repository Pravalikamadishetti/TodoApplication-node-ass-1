const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Db Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

convertTodoDbObjectToResponseDbObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

//api1
app.get("/todos", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const {
    todo,
    priority,
    status,
    search_q = "",
    category,
    dueDate,
  } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
            SELECT *
            FROM todo
            WHERE status='${status}' and priority='${priority}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((eachItem) =>
              convertTodoDbObjectToResponseDbObject(eachItem)
            )
          );
        } else {
          response.status("400");
          response.send("Invalid Todo Status");
        }
      } else {
        response.status("400");
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryAndStatusProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
              SELECT *
              FROM todo
              WHERE category = '${category}' and status='${status}' ;`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((eachItem) =>
              convertTodoDbObjectToResponseDbObject(eachItem)
            )
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status("400");
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryAndPriorityProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `
              SELECT *
              FROM todo 
              WHERE priority = '${priority}' and category='${category}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((eachItem) =>
              convertTodoDbObjectToResponseDbObject(eachItem)
            )
          );
        } else {
          response.status("400");
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status("400");
        response.send("Invalid Todo Category");
      }
      break;
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `
         SELECT *
         FROM todo
         WHERE status = '${status}';`;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((eachItem) =>
            convertTodoDbObjectToResponseDbObject(eachItem)
          )
        );
      } else {
        response.status("400");
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `
         SELECT * 
         FROM todo 
         WHERE priority='${priority}';`;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((eachItem) =>
            convertTodoDbObjectToResponseDbObject(eachItem)
          )
        );
      } else {
        response.status("400");
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `
         SELECT *
         FROM todo
         WHERE category='${category}';`;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((eachItem) =>
            convertTodoDbObjectToResponseDbObject(eachItem)
          )
        );
      } else {
        response.status("400");
        response.send("Invalid Todo Category");
      }
      break;
    case hasSearchProperty(request.query):
      getTodosQuery = `
         SELECT *
         FROM todo
         WHERE todo LIKE '%${search_q}%';`;
      data = await db.all(getTodosQuery);
      response.send(
        data.map((eachItem) => convertTodoDbObjectToResponseDbObject(eachItem))
      );
      break;
    default:
      getTodosQuery = `SELECT * FROM todo;`;
      data = await db.all(getTodosQuery);
      response.send(
        data.map((eachItem) => convertTodoDbObjectToResponseDbObject(eachItem))
      );
  }
});

//api2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
  SELECT *
  FROM todo
  WHERE id=${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(convertTodoDbObjectToResponseDbObject(todo));
});

//api3
app.get("/agenda", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const getTodosQuery = `
    SELECT *
    FROM todo
    WHERE due_date='${newDate}';`;
    const todosArray = await db.all(getTodosQuery);
    response.send(
      todosArray.map((eachTodo) =>
        convertTodoDbObjectToResponseDbObject(eachTodo)
      )
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//api4
app.post("/todos", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const addTodoQuery = `
            INSERT INTO todo(id, todo,category,priority,status,due_date)
            VALUES (${id},'${todo}','${category}','${priority}','${status}','${newDueDate}')`;
          await db.run(addTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status("400");
          response.send("Invalid Due Date");
        }
      } else {
        response.status("400");
        response.send("Invalid Todo Category");
      }
    } else {
      response.status("400");
      response.send("Invalid Todo Status");
    }
  } else {
    response.status("400");
    response.send("Invalid Todo Priority");
  }
});

//api5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  const previousTodoQuery = `
    SELECT *
    FROM todo
    WHERE id=${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  let updateTodoQuery;
  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
        UPDATE todo
        SET status='${status}'
        WHERE id=${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoQuery = `
          UPDATE todo
          SET priority = '${priority}'
          WHERE id=${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case requestBody.todo !== undefined:
      updateTodoQuery = `
        UPDATE todo
        SET todo = '${todo}'
        WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `
         UPDATE todo
         SET category='${category}'
         WHERE id=${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `
        UPDATE todo
        SET due_date = '${newDueDate}'`;
        await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

//api6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
