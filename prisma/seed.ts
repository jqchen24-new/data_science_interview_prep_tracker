import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed no longer creates default tags; they are created when the user
 * chooses a profession during onboarding (or via Settings > Add default tags).
 * Seeds SQL Practice questions (idempotent by slug).
 */
async function main() {
  const questions = [
    {
      slug: "second-highest-salary",
      title: "Second Highest Salary",
      difficulty: "easy",
      order: 1,
      problemStatement: `Write a SQL query to get the **second highest** salary. If there is no second highest salary, return \`NULL\`.

Return the salary that is strictly second when distinct salaries are ordered descending (e.g. 200, 200, 100 → second is **100**).

---

**Input:**

| employees | |
|---|---|
| id | INTEGER PRIMARY KEY |
| salary | INTEGER |`,
      schemaSql: `CREATE TABLE employees (id INTEGER PRIMARY KEY, salary INTEGER);`,
      seedSql: `INSERT INTO employees (id, salary) VALUES (1, 100), (2, 200), (3, 200);`,
      expectedResult: [{ salary: 100 }],
    },
    {
      slug: "department-highest-salary",
      title: "Department Highest Salary",
      difficulty: "medium",
      order: 2,
      problemStatement: `Write a query to find employees who have the **highest salary in each department**.

Return \`department_name\`, \`employee_name\`, and \`salary\`.

---

**Input:**

| employee | |
|---|---|
| id | INTEGER PRIMARY KEY |
| name | TEXT |
| salary | INTEGER |
| departmentId | INTEGER |

| department | |
|---|---|
| id | INTEGER PRIMARY KEY |
| name | TEXT |`,
      schemaSql: `CREATE TABLE department (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE employee (id INTEGER PRIMARY KEY, name TEXT, salary INTEGER, departmentId INTEGER);`,
      seedSql: `INSERT INTO department (id, name) VALUES (1, 'IT'), (2, 'Sales');
INSERT INTO employee (id, name, salary, departmentId) VALUES (1, 'Joe', 70000, 1), (2, 'Jim', 90000, 1), (3, 'Henry', 80000, 2);`,
      expectedResult: [
        { department_name: "IT", employee_name: "Jim", salary: 90000 },
        { department_name: "Sales", employee_name: "Henry", salary: 80000 },
      ],
    },
    {
      slug: "duplicate-emails",
      title: "Find Duplicate Emails",
      difficulty: "easy",
      order: 3,
      problemStatement: `Write a query to find all **duplicate** emails. Return each duplicate email once.

---

**Input:**

| person | |
|---|---|
| id | INTEGER PRIMARY KEY |
| email | TEXT |`,
      schemaSql: `CREATE TABLE person (id INTEGER PRIMARY KEY, email TEXT);`,
      seedSql: `INSERT INTO person (id, email) VALUES (1, 'a@b.com'), (2, 'c@d.com'), (3, 'a@b.com');`,
      expectedResult: [{ email: "a@b.com" }],
    },
  ];

  for (const q of questions) {
    await prisma.sqlQuestion.upsert({
      where: { slug: q.slug },
      create: {
        slug: q.slug,
        title: q.title,
        difficulty: q.difficulty,
        order: q.order,
        problemStatement: q.problemStatement,
        schemaSql: q.schemaSql,
        seedSql: q.seedSql,
        expectedResult: q.expectedResult as object,
      },
      update: {
        title: q.title,
        difficulty: q.difficulty,
        order: q.order,
        problemStatement: q.problemStatement,
        schemaSql: q.schemaSql,
        seedSql: q.seedSql,
        expectedResult: q.expectedResult as object,
      },
    });
  }
  console.log("Seed complete. SQL Practice questions upserted.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
