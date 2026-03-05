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
| id | INT PRIMARY KEY |
| salary | INT |`,
      schemaSql: `CREATE TABLE employees (id INT PRIMARY KEY, salary INT);`,
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
| id | INT PRIMARY KEY |
| name | VARCHAR(255) |
| salary | INT |
| departmentId | INT |

| department | |
|---|---|
| id | INT PRIMARY KEY |
| name | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE department (id INT PRIMARY KEY, name VARCHAR(255));
CREATE TABLE employee (id INT PRIMARY KEY, name VARCHAR(255), salary INT, departmentId INT);`,
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
| id | INT PRIMARY KEY |
| email | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE person (id INT PRIMARY KEY, email VARCHAR(255));`,
      seedSql: `INSERT INTO person (id, email) VALUES (1, 'a@b.com'), (2, 'c@d.com'), (3, 'a@b.com');`,
      expectedResult: [{ email: "a@b.com" }],
    },
    {
      slug: "customers-who-never-order",
      title: "Customers Who Never Order",
      difficulty: "easy",
      order: 4,
      problemStatement: `Find all customers who have never placed an order.

Return the customer \`name\`.

---

**Input:**

| customers | |
|---|---|
| id | INT PRIMARY KEY |
| name | VARCHAR(255) |

| orders | |
|---|---|
| id | INT PRIMARY KEY |
| customerId | INT |`,
      schemaSql: `CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(255));
CREATE TABLE orders (id INT PRIMARY KEY, customerId INT);`,
      seedSql: `INSERT INTO customers (id, name) VALUES (1, 'Joe'), (2, 'Henry'), (3, 'Sam'), (4, 'Max');
INSERT INTO orders (id, customerId) VALUES (1, 3), (2, 1);`,
      expectedResult: [{ name: "Henry" }, { name: "Max" }],
    },
    {
      slug: "employees-earning-more-than-managers",
      title: "Employees Earning More Than Managers",
      difficulty: "easy",
      order: 5,
      problemStatement: `Find employees who earn more than their manager.

Return the employee \`name\`.

---

**Input:**

| employee | |
|---|---|
| id | INT PRIMARY KEY |
| name | VARCHAR(255) |
| salary | INT |
| managerId | INT |`,
      schemaSql: `CREATE TABLE employee (id INT PRIMARY KEY, name VARCHAR(255), salary INT, managerId INT);`,
      seedSql: `INSERT INTO employee (id, name, salary, managerId) VALUES (1, 'Joe', 70000, 3), (2, 'Henry', 80000, 4), (3, 'Sam', 60000, NULL), (4, 'Max', 90000, NULL);`,
      expectedResult: [{ name: "Joe" }],
    },
    {
      slug: "combine-two-tables",
      title: "Combine Two Tables",
      difficulty: "easy",
      order: 6,
      problemStatement: `Report the first name, last name, city, and state for each person. If a person's address is not in the \`address\` table, report \`NULL\` instead.

Return \`firstName\`, \`lastName\`, \`city\`, and \`state\`.

---

**Input:**

| person | |
|---|---|
| personId | INT PRIMARY KEY |
| firstName | VARCHAR(255) |
| lastName | VARCHAR(255) |

| address | |
|---|---|
| addressId | INT PRIMARY KEY |
| personId | INT |
| city | VARCHAR(255) |
| state | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE person (personId INT PRIMARY KEY, firstName VARCHAR(255), lastName VARCHAR(255));
CREATE TABLE address (addressId INT PRIMARY KEY, personId INT, city VARCHAR(255), state VARCHAR(255));`,
      seedSql: `INSERT INTO person (personId, firstName, lastName) VALUES (1, 'Allen', 'Wang'), (2, 'Bob', 'Alice');
INSERT INTO address (addressId, personId, city, state) VALUES (1, 2, 'New York', 'NY');`,
      expectedResult: [
        { firstName: "Allen", lastName: "Wang", city: null, state: null },
        { firstName: "Bob", lastName: "Alice", city: "New York", state: "NY" },
      ],
    },
    {
      slug: "classes-with-five-students",
      title: "Classes With Five or More Students",
      difficulty: "easy",
      order: 7,
      problemStatement: `Find all classes that have **at least five students**.

Return the \`class\` name.

---

**Input:**

| courses | |
|---|---|
| student | VARCHAR(255) |
| class | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE courses (student VARCHAR(255), class VARCHAR(255));`,
      seedSql: `INSERT INTO courses (student, class) VALUES ('A', 'Math'), ('B', 'English'), ('C', 'Math'), ('D', 'Biology'), ('E', 'Math'), ('F', 'Math'), ('G', 'Math'), ('H', 'English'), ('I', 'Biology'), ('J', 'English'), ('K', 'English'), ('L', 'English');`,
      expectedResult: [{ class: "Math" }, { class: "English" }],
    },
    {
      slug: "rising-temperature",
      title: "Rising Temperature",
      difficulty: "medium",
      order: 8,
      problemStatement: `Find the \`id\` of days where the temperature was **higher than the previous day**.

---

**Input:**

| weather | |
|---|---|
| id | INT PRIMARY KEY |
| recordDate | VARCHAR(255) |
| temperature | INT |`,
      schemaSql: `CREATE TABLE weather (id INT PRIMARY KEY, recordDate VARCHAR(255), temperature INT);`,
      seedSql: `INSERT INTO weather (id, recordDate, temperature) VALUES (1, '2023-01-01', 10), (2, '2023-01-02', 25), (3, '2023-01-03', 20), (4, '2023-01-04', 30);`,
      expectedResult: [{ id: 2 }, { id: 4 }],
    },
    {
      slug: "consecutive-numbers",
      title: "Consecutive Numbers",
      difficulty: "medium",
      order: 9,
      problemStatement: `Find all numbers that appear **at least three times consecutively** in the \`logs\` table.

Return the \`num\` (each value once).

---

**Input:**

| logs | |
|---|---|
| id | INT PRIMARY KEY |
| num | INT |`,
      schemaSql: `CREATE TABLE logs (id INT PRIMARY KEY, num INT);`,
      seedSql: `INSERT INTO logs (id, num) VALUES (1, 1), (2, 1), (3, 1), (4, 2), (5, 1), (6, 2), (7, 2);`,
      expectedResult: [{ num: 1 }],
    },
    {
      slug: "rank-scores",
      title: "Rank Scores",
      difficulty: "medium",
      order: 10,
      problemStatement: `Rank scores from highest to lowest using **dense ranking** — equal scores share the same rank, and the next rank is the next consecutive integer.

Return \`score\` and \`rank\`, ordered by score descending.

---

**Input:**

| scores | |
|---|---|
| id | INT PRIMARY KEY |
| score | INT |`,
      schemaSql: `CREATE TABLE scores (id INT PRIMARY KEY, score INT);`,
      seedSql: `INSERT INTO scores (id, score) VALUES (1, 350), (2, 365), (3, 400), (4, 385), (5, 400), (6, 365);`,
      expectedResult: [
        { score: 400, rank: 1 },
        { score: 400, rank: 1 },
        { score: 385, rank: 2 },
        { score: 365, rank: 3 },
        { score: 365, rank: 3 },
        { score: 350, rank: 4 },
      ],
    },
    {
      slug: "department-top-three-salaries",
      title: "Department Top Three Salaries",
      difficulty: "hard",
      order: 11,
      problemStatement: `Find employees who earn one of the **top three unique salaries** in their department.

Return \`department_name\`, \`employee_name\`, and \`salary\`.

---

**Input:**

| employee | |
|---|---|
| id | INT PRIMARY KEY |
| name | VARCHAR(255) |
| salary | INT |
| departmentId | INT |

| department | |
|---|---|
| id | INT PRIMARY KEY |
| name | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE department (id INT PRIMARY KEY, name VARCHAR(255));
CREATE TABLE employee (id INT PRIMARY KEY, name VARCHAR(255), salary INT, departmentId INT);`,
      seedSql: `INSERT INTO department (id, name) VALUES (1, 'IT'), (2, 'Sales');
INSERT INTO employee (id, name, salary, departmentId) VALUES (1, 'Joe', 85000, 1), (2, 'Henry', 80000, 2), (3, 'Sam', 60000, 2), (4, 'Max', 90000, 1), (5, 'Janet', 69000, 1), (6, 'Randy', 85000, 1), (7, 'Will', 70000, 1);`,
      expectedResult: [
        { department_name: "IT", employee_name: "Max", salary: 90000 },
        { department_name: "IT", employee_name: "Joe", salary: 85000 },
        { department_name: "IT", employee_name: "Randy", salary: 85000 },
        { department_name: "IT", employee_name: "Will", salary: 70000 },
        { department_name: "Sales", employee_name: "Henry", salary: 80000 },
        { department_name: "Sales", employee_name: "Sam", salary: 60000 },
      ],
    },

    // ── Window Functions ──────────────────────────────────────────────

    {
      slug: "running-total-of-sales",
      title: "Running Total of Sales",
      difficulty: "medium",
      order: 12,
      problemStatement: `Calculate the **running total** of sales amount ordered by \`sale_date\`.

Return \`sale_date\`, \`amount\`, and \`running_total\`.

---

**Input:**

| sales | |
|---|---|
| id | INT PRIMARY KEY |
| sale_date | VARCHAR(255) |
| amount | INT |`,
      schemaSql: `CREATE TABLE sales (id INT PRIMARY KEY, sale_date VARCHAR(255), amount INT);`,
      seedSql: `INSERT INTO sales (id, sale_date, amount) VALUES (1, '2024-01-01', 100), (2, '2024-01-02', 200), (3, '2024-01-03', 150), (4, '2024-01-04', 300);`,
      expectedResult: [
        { sale_date: "2024-01-01", amount: 100, running_total: 100 },
        { sale_date: "2024-01-02", amount: 200, running_total: 300 },
        { sale_date: "2024-01-03", amount: 150, running_total: 450 },
        { sale_date: "2024-01-04", amount: 300, running_total: 750 },
      ],
    },
    {
      slug: "month-over-month-growth",
      title: "Month-over-Month Revenue Change",
      difficulty: "medium",
      order: 13,
      problemStatement: `For each month, calculate the revenue and the **difference from the previous month**. Use \`LAG\` to find the prior month's revenue.

Return \`month\`, \`revenue\`, and \`revenue_change\` (current minus previous; \`NULL\` for the first month).

---

**Input:**

| monthly_revenue | |
|---|---|
| month | VARCHAR(255) |
| revenue | INT |`,
      schemaSql: `CREATE TABLE monthly_revenue (month VARCHAR(255) PRIMARY KEY, revenue INT);`,
      seedSql: `INSERT INTO monthly_revenue (month, revenue) VALUES ('2024-01', 5000), ('2024-02', 7000), ('2024-03', 6500), ('2024-04', 8000);`,
      expectedResult: [
        { month: "2024-01", revenue: 5000, revenue_change: null },
        { month: "2024-02", revenue: 7000, revenue_change: 2000 },
        { month: "2024-03", revenue: 6500, revenue_change: -500 },
        { month: "2024-04", revenue: 8000, revenue_change: 1500 },
      ],
    },
    {
      slug: "top-n-per-group",
      title: "Top 2 Products per Category",
      difficulty: "hard",
      order: 14,
      problemStatement: `Find the **top 2 highest-priced products** in each category. If there is a tie, include all tied products.

Return \`category\`, \`product\`, and \`price\`, ordered by category then price descending.

---

**Input:**

| products | |
|---|---|
| id | INT PRIMARY KEY |
| category | VARCHAR(255) |
| product | VARCHAR(255) |
| price | INT |`,
      schemaSql: `CREATE TABLE products (id INT PRIMARY KEY, category VARCHAR(255), product VARCHAR(255), price INT);`,
      seedSql: `INSERT INTO products (id, category, product, price) VALUES (1, 'Electronics', 'Laptop', 1200), (2, 'Electronics', 'Phone', 800), (3, 'Electronics', 'Tablet', 600), (4, 'Clothing', 'Jacket', 150), (5, 'Clothing', 'Shirt', 50), (6, 'Clothing', 'Pants', 80);`,
      expectedResult: [
        { category: "Clothing", product: "Jacket", price: 150 },
        { category: "Clothing", product: "Pants", price: 80 },
        { category: "Electronics", product: "Laptop", price: 1200 },
        { category: "Electronics", product: "Phone", price: 800 },
      ],
    },

    // ── CTEs & Recursive Queries ──────────────────────────────────────

    {
      slug: "fibonacci-sequence",
      title: "Fibonacci Sequence",
      difficulty: "hard",
      order: 15,
      problemStatement: `Generate the first **8 numbers** of the Fibonacci sequence using a **recursive CTE**.

Return \`n\` (position, starting at 1) and \`fib\` (the Fibonacci value).

---

*No input tables — generate the sequence purely with SQL.*`,
      schemaSql: `CREATE TABLE _placeholder (x INT);`,
      seedSql: `INSERT INTO _placeholder VALUES (0);`,
      expectedResult: [
        { n: 1, fib: 0 },
        { n: 2, fib: 1 },
        { n: 3, fib: 1 },
        { n: 4, fib: 2 },
        { n: 5, fib: 3 },
        { n: 6, fib: 5 },
        { n: 7, fib: 8 },
        { n: 8, fib: 13 },
      ],
    },
    {
      slug: "employee-hierarchy-depth",
      title: "Employee Hierarchy Depth",
      difficulty: "hard",
      order: 16,
      problemStatement: `Using a **recursive CTE**, determine each employee's **depth** in the org chart. The CEO (no manager) has depth 1, their direct reports have depth 2, and so on.

Return \`name\` and \`depth\`.

---

**Input:**

| employees | |
|---|---|
| id | INT PRIMARY KEY |
| name | VARCHAR(255) |
| managerId | INT |`,
      schemaSql: `CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(255), managerId INT);`,
      seedSql: `INSERT INTO employees (id, name, managerId) VALUES (1, 'Alice', NULL), (2, 'Bob', 1), (3, 'Carol', 1), (4, 'Dave', 2), (5, 'Eve', 2), (6, 'Frank', 3);`,
      expectedResult: [
        { name: "Alice", depth: 1 },
        { name: "Bob", depth: 2 },
        { name: "Carol", depth: 2 },
        { name: "Dave", depth: 3 },
        { name: "Eve", depth: 3 },
        { name: "Frank", depth: 3 },
      ],
    },

    // ── Pivoting / Conditional Aggregation ────────────────────────────

    {
      slug: "pivot-sales-by-quarter",
      title: "Pivot Sales by Quarter",
      difficulty: "medium",
      order: 17,
      problemStatement: `Pivot the sales data so each row shows a product and its **total sales per quarter** as separate columns.

Return \`product\`, \`q1\`, \`q2\`, \`q3\`, and \`q4\`. Use \`0\` if a product has no sales in a quarter.

---

**Input:**

| sales | |
|---|---|
| id | INT PRIMARY KEY |
| product | VARCHAR(255) |
| quarter | INT |
| amount | INT |`,
      schemaSql: `CREATE TABLE sales (id INT PRIMARY KEY, product VARCHAR(255), quarter INT, amount INT);`,
      seedSql: `INSERT INTO sales (id, product, quarter, amount) VALUES (1, 'Widget', 1, 100), (2, 'Widget', 2, 200), (3, 'Widget', 4, 150), (4, 'Gadget', 1, 300), (5, 'Gadget', 3, 250), (6, 'Gadget', 4, 400);`,
      expectedResult: [
        { product: "Gadget", q1: 300, q2: 0, q3: 250, q4: 400 },
        { product: "Widget", q1: 100, q2: 200, q3: 0, q4: 150 },
      ],
    },
    {
      slug: "pass-fail-counts",
      title: "Pass / Fail Counts per Subject",
      difficulty: "easy",
      order: 18,
      problemStatement: `Count the number of students who **passed** and **failed** each subject. A score of **60 or above** is a pass.

Return \`subject\`, \`passed\`, and \`failed\`.

---

**Input:**

| exam_results | |
|---|---|
| id | INT PRIMARY KEY |
| student | VARCHAR(255) |
| subject | VARCHAR(255) |
| score | INT |`,
      schemaSql: `CREATE TABLE exam_results (id INT PRIMARY KEY, student VARCHAR(255), subject VARCHAR(255), score INT);`,
      seedSql: `INSERT INTO exam_results (id, student, subject, score) VALUES (1, 'Alice', 'Math', 85), (2, 'Bob', 'Math', 55), (3, 'Carol', 'Math', 72), (4, 'Alice', 'Science', 45), (5, 'Bob', 'Science', 90), (6, 'Carol', 'Science', 60);`,
      expectedResult: [
        { subject: "Math", passed: 2, failed: 1 },
        { subject: "Science", passed: 2, failed: 1 },
      ],
    },

    // ── Date / Time Operations ────────────────────────────────────────

    {
      slug: "active-users-per-day",
      title: "Users Active on Consecutive Days",
      difficulty: "hard",
      order: 19,
      problemStatement: `Find users who were active on **at least 3 consecutive days**.

Return each qualifying \`user_id\` once.

---

**Input:**

| logins | |
|---|---|
| id | INT PRIMARY KEY |
| user_id | INT |
| login_date | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE logins (id INT PRIMARY KEY, user_id INT, login_date VARCHAR(255));`,
      seedSql: `INSERT INTO logins (id, user_id, login_date) VALUES (1, 1, '2024-03-01'), (2, 1, '2024-03-02'), (3, 1, '2024-03-03'), (4, 2, '2024-03-01'), (5, 2, '2024-03-03'), (6, 3, '2024-03-10'), (7, 3, '2024-03-11'), (8, 3, '2024-03-12'), (9, 3, '2024-03-13');`,
      expectedResult: [{ user_id: 1 }, { user_id: 3 }],
    },
    {
      slug: "days-between-orders",
      title: "Average Days Between Orders",
      difficulty: "medium",
      order: 20,
      problemStatement: `For each customer, calculate the **average number of days between consecutive orders**. Only include customers with 2 or more orders.

Return \`customer_id\` and \`avg_days\` (rounded to the nearest integer).

---

**Input:**

| orders | |
|---|---|
| id | INT PRIMARY KEY |
| customer_id | INT |
| order_date | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, order_date VARCHAR(255));`,
      seedSql: `INSERT INTO orders (id, customer_id, order_date) VALUES (1, 1, '2024-01-01'), (2, 1, '2024-01-11'), (3, 1, '2024-01-21'), (4, 2, '2024-02-01'), (5, 2, '2024-02-15'), (6, 3, '2024-03-01');`,
      expectedResult: [
        { customer_id: 1, avg_days: 10 },
        { customer_id: 2, avg_days: 14 },
      ],
    },

    // ── String Manipulation ───────────────────────────────────────────

    {
      slug: "fix-name-casing",
      title: "Fix Name Casing",
      difficulty: "easy",
      order: 21,
      problemStatement: `Names were entered with inconsistent casing. Fix each name so the **first letter is uppercase** and the **rest are lowercase**.

Return the corrected \`name\`, ordered alphabetically.

---

**Input:**

| users | |
|---|---|
| id | INT PRIMARY KEY |
| name | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255));`,
      seedSql: `INSERT INTO users (id, name) VALUES (1, 'aLICE'), (2, 'bOB'), (3, 'CAROL'), (4, 'dave');`,
      expectedResult: [
        { name: "Alice" },
        { name: "Bob" },
        { name: "Carol" },
        { name: "Dave" },
      ],
    },
    {
      slug: "extract-email-domain",
      title: "Extract Email Domain",
      difficulty: "easy",
      order: 22,
      problemStatement: `Count the number of users registered with each **email domain** (the part after the \`@\`).

Return \`domain\` and \`count\`, ordered by count descending.

---

**Input:**

| users | |
|---|---|
| id | INT PRIMARY KEY |
| email | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(255));`,
      seedSql: `INSERT INTO users (id, email) VALUES (1, 'alice@gmail.com'), (2, 'bob@yahoo.com'), (3, 'carol@gmail.com'), (4, 'dave@gmail.com'), (5, 'eve@yahoo.com');`,
      expectedResult: [
        { domain: "gmail.com", count: 3 },
        { domain: "yahoo.com", count: 2 },
      ],
    },

    // ── Set Operations ────────────────────────────────────────────────

    {
      slug: "students-in-both-courses",
      title: "Students Enrolled in Both Courses",
      difficulty: "easy",
      order: 23,
      problemStatement: `Find students who are enrolled in **both** \`'Math'\` and \`'Science'\`.

Return the student \`name\`.

---

**Input:**

| enrollments | |
|---|---|
| id | INT PRIMARY KEY |
| name | VARCHAR(255) |
| course | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE enrollments (id INT PRIMARY KEY, name VARCHAR(255), course VARCHAR(255));`,
      seedSql: `INSERT INTO enrollments (id, name, course) VALUES (1, 'Alice', 'Math'), (2, 'Alice', 'Science'), (3, 'Bob', 'Math'), (4, 'Carol', 'Science'), (5, 'Dave', 'Math'), (6, 'Dave', 'Science'), (7, 'Dave', 'History');`,
      expectedResult: [{ name: "Alice" }, { name: "Dave" }],
    },
    {
      slug: "new-customers-this-month",
      title: "New vs Returning Customers",
      difficulty: "medium",
      order: 24,
      problemStatement: `Classify each March 2024 order as coming from a **new** customer (no orders before March 2024) or a **returning** customer.

Return \`customer_type\` (\`'new'\` or \`'returning'\`) and the \`count\` of distinct customers.

---

**Input:**

| orders | |
|---|---|
| id | INT PRIMARY KEY |
| customer_id | INT |
| order_date | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, order_date VARCHAR(255));`,
      seedSql: `INSERT INTO orders (id, customer_id, order_date) VALUES (1, 1, '2024-01-15'), (2, 2, '2024-02-10'), (3, 1, '2024-03-05'), (4, 3, '2024-03-12'), (5, 4, '2024-03-20'), (6, 2, '2024-03-25');`,
      expectedResult: [
        { customer_type: "new", count: 2 },
        { customer_type: "returning", count: 2 },
      ],
    },

    // ── Subqueries & Correlated Queries ───────────────────────────────

    {
      slug: "above-average-salary",
      title: "Employees Above Average Salary",
      difficulty: "easy",
      order: 25,
      problemStatement: `Find all employees whose salary is **above the company average**.

Return \`name\` and \`salary\`.

---

**Input:**

| employees | |
|---|---|
| id | INT PRIMARY KEY |
| name | VARCHAR(255) |
| salary | INT |`,
      schemaSql: `CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(255), salary INT);`,
      seedSql: `INSERT INTO employees (id, name, salary) VALUES (1, 'Alice', 90000), (2, 'Bob', 50000), (3, 'Carol', 70000), (4, 'Dave', 80000), (5, 'Eve', 60000);`,
      expectedResult: [
        { name: "Alice", salary: 90000 },
        { name: "Dave", salary: 80000 },
      ],
    },
    {
      slug: "products-never-sold",
      title: "Products Never Sold",
      difficulty: "easy",
      order: 26,
      problemStatement: `Find all products that have **never been sold**.

Return the product \`name\`.

---

**Input:**

| products | |
|---|---|
| id | INT PRIMARY KEY |
| name | VARCHAR(255) |

| sales | |
|---|---|
| id | INT PRIMARY KEY |
| product_id | INT |
| quantity | INT |`,
      schemaSql: `CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(255));
CREATE TABLE sales (id INT PRIMARY KEY, product_id INT, quantity INT);`,
      seedSql: `INSERT INTO products (id, name) VALUES (1, 'Laptop'), (2, 'Phone'), (3, 'Tablet'), (4, 'Monitor');
INSERT INTO sales (id, product_id, quantity) VALUES (1, 1, 5), (2, 2, 3), (3, 1, 2);`,
      expectedResult: [{ name: "Tablet" }, { name: "Monitor" }],
    },
    {
      slug: "nth-highest-salary",
      title: "Nth Highest Salary (3rd)",
      difficulty: "medium",
      order: 27,
      problemStatement: `Find the **3rd highest distinct salary**. If there is no 3rd highest salary, return \`NULL\`.

Return a single column \`salary\`.

---

**Input:**

| employees | |
|---|---|
| id | INT PRIMARY KEY |
| salary | INT |`,
      schemaSql: `CREATE TABLE employees (id INT PRIMARY KEY, salary INT);`,
      seedSql: `INSERT INTO employees (id, salary) VALUES (1, 100), (2, 200), (3, 300), (4, 200), (5, 300), (6, 400);`,
      expectedResult: [{ salary: 200 }],
    },

    // ── Aggregation Patterns ──────────────────────────────────────────

    {
      slug: "most-frequent-value",
      title: "Most Frequent Item",
      difficulty: "easy",
      order: 28,
      problemStatement: `Find the **most frequently ordered** item. If there is a tie, return all tied items.

Return \`item\` and \`order_count\`.

---

**Input:**

| orders | |
|---|---|
| id | INT PRIMARY KEY |
| item | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE orders (id INT PRIMARY KEY, item VARCHAR(255));`,
      seedSql: `INSERT INTO orders (id, item) VALUES (1, 'Pizza'), (2, 'Burger'), (3, 'Pizza'), (4, 'Sushi'), (5, 'Burger'), (6, 'Pizza');`,
      expectedResult: [{ item: "Pizza", order_count: 3 }],
    },
    {
      slug: "revenue-by-category",
      title: "Top Revenue Category per Month",
      difficulty: "hard",
      order: 29,
      problemStatement: `For each month, find the **product category with the highest total revenue**.

Return \`month\`, \`category\`, and \`total_revenue\`.

---

**Input:**

| transactions | |
|---|---|
| id | INT PRIMARY KEY |
| category | VARCHAR(255) |
| amount | INT |
| txn_date | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE transactions (id INT PRIMARY KEY, category VARCHAR(255), amount INT, txn_date VARCHAR(255));`,
      seedSql: `INSERT INTO transactions (id, category, amount, txn_date) VALUES (1, 'Electronics', 500, '2024-01-05'), (2, 'Clothing', 300, '2024-01-10'), (3, 'Electronics', 200, '2024-01-20'), (4, 'Clothing', 800, '2024-02-05'), (5, 'Electronics', 400, '2024-02-15'), (6, 'Food', 600, '2024-02-20');`,
      expectedResult: [
        { month: "2024-01", category: "Electronics", total_revenue: 700 },
        { month: "2024-02", category: "Clothing", total_revenue: 800 },
      ],
    },

    // ── Self Joins & Relationships ────────────────────────────────────

    {
      slug: "mutual-friends",
      title: "Find Mutual Friends",
      difficulty: "medium",
      order: 30,
      problemStatement: `Given a friendships table (each row means user1 and user2 are friends), find all pairs of users who share **at least 2 mutual friends**.

Return \`user1\` and \`user2\` where \`user1 < user2\` (each pair once).

---

**Input:**

| friendships | |
|---|---|
| user1 | INT |
| user2 | INT |`,
      schemaSql: `CREATE TABLE friendships (user1 INT, user2 INT);`,
      seedSql: `INSERT INTO friendships (user1, user2) VALUES (1, 2), (1, 3), (1, 4), (2, 3), (2, 4), (3, 4), (3, 5), (4, 5);`,
      expectedResult: [
        { user1: 1, user2: 2 },
        { user1: 1, user2: 3 },
        { user1: 1, user2: 4 },
        { user1: 2, user2: 3 },
        { user1: 2, user2: 4 },
        { user1: 3, user2: 5 },
      ],
    },
    {
      slug: "second-most-recent-order",
      title: "Second Most Recent Order per Customer",
      difficulty: "medium",
      order: 31,
      problemStatement: `For each customer, find their **second most recent order**. Exclude customers with only one order.

Return \`customer_id\`, \`order_date\`, and \`amount\`.

---

**Input:**

| orders | |
|---|---|
| id | INT PRIMARY KEY |
| customer_id | INT |
| order_date | VARCHAR(255) |
| amount | INT |`,
      schemaSql: `CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, order_date VARCHAR(255), amount INT);`,
      seedSql: `INSERT INTO orders (id, customer_id, order_date, amount) VALUES (1, 1, '2024-01-01', 100), (2, 1, '2024-02-15', 200), (3, 1, '2024-03-10', 150), (4, 2, '2024-01-20', 300), (5, 2, '2024-04-01', 250), (6, 3, '2024-05-01', 400);`,
      expectedResult: [
        { customer_id: 1, order_date: "2024-02-15", amount: 200 },
        { customer_id: 2, order_date: "2024-01-20", amount: 300 },
      ],
    },

    // ── Data Transformation ───────────────────────────────────────────

    {
      slug: "unpivot-columns-to-rows",
      title: "Unpivot Quarterly Data",
      difficulty: "medium",
      order: 32,
      problemStatement: `Convert a table with quarterly columns into rows — one row per product per quarter.

Return \`product\`, \`quarter\`, and \`revenue\`. Exclude rows where revenue is 0.

---

**Input:**

| quarterly_sales | |
|---|---|
| product | VARCHAR(255) |
| q1 | INT |
| q2 | INT |
| q3 | INT |
| q4 | INT |`,
      schemaSql: `CREATE TABLE quarterly_sales (product VARCHAR(255), q1 INT, q2 INT, q3 INT, q4 INT);`,
      seedSql: `INSERT INTO quarterly_sales (product, q1, q2, q3, q4) VALUES ('Widget', 100, 200, 0, 150), ('Gadget', 300, 0, 250, 400);`,
      expectedResult: [
        { product: "Widget", quarter: "Q1", revenue: 100 },
        { product: "Widget", quarter: "Q2", revenue: 200 },
        { product: "Widget", quarter: "Q4", revenue: 150 },
        { product: "Gadget", quarter: "Q1", revenue: 300 },
        { product: "Gadget", quarter: "Q3", revenue: 250 },
        { product: "Gadget", quarter: "Q4", revenue: 400 },
      ],
    },
    {
      slug: "gaps-in-sequence",
      title: "Find Missing IDs",
      difficulty: "medium",
      order: 33,
      problemStatement: `Given a table of IDs, find all **missing IDs** in the range from the minimum to the maximum ID.

Return the missing \`id\` values.

---

**Input:**

| sequence | |
|---|---|
| id | INT PRIMARY KEY |`,
      schemaSql: `CREATE TABLE sequence (id INT PRIMARY KEY);`,
      seedSql: `INSERT INTO sequence (id) VALUES (1), (2), (4), (7), (8), (10);`,
      expectedResult: [
        { id: 3 },
        { id: 5 },
        { id: 6 },
        { id: 9 },
      ],
    },

    // ── Advanced Window Functions ─────────────────────────────────────

    {
      slug: "median-salary",
      title: "Median Salary",
      difficulty: "hard",
      order: 34,
      problemStatement: `Calculate the **median salary**. If there is an even number of employees, return the average of the two middle values.

Return a single column \`median_salary\` (as a decimal, e.g. 75000.0).

---

**Input:**

| employees | |
|---|---|
| id | INT PRIMARY KEY |
| salary | INT |`,
      schemaSql: `CREATE TABLE employees (id INT PRIMARY KEY, salary INT);`,
      seedSql: `INSERT INTO employees (id, salary) VALUES (1, 50000), (2, 60000), (3, 80000), (4, 90000);`,
      expectedResult: [{ median_salary: 70000.0 }],
    },
    {
      slug: "longest-streak",
      title: "Longest Winning Streak",
      difficulty: "hard",
      order: 35,
      problemStatement: `Find the **longest consecutive winning streak** for each player. A win is recorded as result = \`'W'\`.

Return \`player\` and \`longest_streak\`.

---

**Input:**

| games | |
|---|---|
| id | INT PRIMARY KEY |
| player | VARCHAR(255) |
| game_date | VARCHAR(255) |
| result | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE games (id INT PRIMARY KEY, player VARCHAR(255), game_date VARCHAR(255), result VARCHAR(255));`,
      seedSql: `INSERT INTO games (id, player, game_date, result) VALUES (1, 'Alice', '2024-01-01', 'W'), (2, 'Alice', '2024-01-02', 'W'), (3, 'Alice', '2024-01-03', 'L'), (4, 'Alice', '2024-01-04', 'W'), (5, 'Alice', '2024-01-05', 'W'), (6, 'Alice', '2024-01-06', 'W'), (7, 'Bob', '2024-01-01', 'W'), (8, 'Bob', '2024-01-02', 'L'), (9, 'Bob', '2024-01-03', 'W');`,
      expectedResult: [
        { player: "Alice", longest_streak: 3 },
        { player: "Bob", longest_streak: 1 },
      ],
    },

    // ── NULL Handling ─────────────────────────────────────────────────

    {
      slug: "replace-nulls-with-previous",
      title: "Fill Missing Prices",
      difficulty: "hard",
      order: 36,
      problemStatement: `Some daily prices are missing (\`NULL\`). Fill each missing price with the **most recent non-NULL price** before it.

Return \`date\` and \`price\` for all rows, ordered by date.

---

**Input:**

| prices | |
|---|---|
| date | VARCHAR(255) |
| price | INT |`,
      schemaSql: `CREATE TABLE prices (date VARCHAR(255) PRIMARY KEY, price INT);`,
      seedSql: `INSERT INTO prices (date, price) VALUES ('2024-01-01', 100), ('2024-01-02', NULL), ('2024-01-03', NULL), ('2024-01-04', 110), ('2024-01-05', NULL), ('2024-01-06', 120);`,
      expectedResult: [
        { date: "2024-01-01", price: 100 },
        { date: "2024-01-02", price: 100 },
        { date: "2024-01-03", price: 100 },
        { date: "2024-01-04", price: 110 },
        { date: "2024-01-05", price: 110 },
        { date: "2024-01-06", price: 120 },
      ],
    },
    {
      slug: "coalesce-multiple-sources",
      title: "Merge Contact Info",
      difficulty: "easy",
      order: 37,
      problemStatement: `Each user may have a phone number from different sources. Return the **first non-NULL phone** from: \`primary_phone\`, \`work_phone\`, \`emergency_phone\`. If all are NULL, return \`'N/A'\`.

Return \`name\` and \`phone\`.

---

**Input:**

| contacts | |
|---|---|
| id | INT PRIMARY KEY |
| name | VARCHAR(255) |
| primary_phone | VARCHAR(255) |
| work_phone | VARCHAR(255) |
| emergency_phone | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE contacts (id INT PRIMARY KEY, name VARCHAR(255), primary_phone VARCHAR(255), work_phone VARCHAR(255), emergency_phone VARCHAR(255));`,
      seedSql: `INSERT INTO contacts (id, name, primary_phone, work_phone, emergency_phone) VALUES (1, 'Alice', '555-0001', '555-0002', '555-0003'), (2, 'Bob', NULL, '555-1001', NULL), (3, 'Carol', NULL, NULL, '555-2001'), (4, 'Dave', NULL, NULL, NULL);`,
      expectedResult: [
        { name: "Alice", phone: "555-0001" },
        { name: "Bob", phone: "555-1001" },
        { name: "Carol", phone: "555-2001" },
        { name: "Dave", phone: "N/A" },
      ],
    },

    // ── Multi-Table Joins ─────────────────────────────────────────────

    {
      slug: "student-gpa",
      title: "Calculate Student GPA",
      difficulty: "medium",
      order: 38,
      problemStatement: `Calculate each student's **GPA** (average grade, rounded to 1 decimal place). Only include students who have taken at least 2 courses.

Return \`student_name\` and \`gpa\`.

---

**Input:**

| students | |
|---|---|
| id | INT PRIMARY KEY |
| name | VARCHAR(255) |

| grades | |
|---|---|
| id | INT PRIMARY KEY |
| student_id | INT |
| course | VARCHAR(255) |
| grade | INT |`,
      schemaSql: `CREATE TABLE students (id INT PRIMARY KEY, name VARCHAR(255));
CREATE TABLE grades (id INT PRIMARY KEY, student_id INT, course VARCHAR(255), grade INT);`,
      seedSql: `INSERT INTO students (id, name) VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Carol');
INSERT INTO grades (id, student_id, course, grade) VALUES (1, 1, 'Math', 90), (2, 1, 'Science', 85), (3, 1, 'English', 92), (4, 2, 'Math', 78), (5, 2, 'Science', 82), (6, 3, 'Math', 95);`,
      expectedResult: [
        { student_name: "Alice", gpa: 89.0 },
        { student_name: "Bob", gpa: 80.0 },
      ],
    },
    {
      slug: "unmatched-transactions",
      title: "Unreconciled Transactions",
      difficulty: "medium",
      order: 39,
      problemStatement: `Find transactions in the \`bank_records\` table that have **no matching entry** in the \`company_records\` table. Records match when they have the same \`amount\` and \`date\`.

Return the unmatched \`id\`, \`amount\`, and \`date\` from bank_records.

---

**Input:**

| bank_records | |
|---|---|
| id | INT PRIMARY KEY |
| amount | INT |
| date | VARCHAR(255) |

| company_records | |
|---|---|
| id | INT PRIMARY KEY |
| amount | INT |
| date | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE bank_records (id INT PRIMARY KEY, amount INT, date VARCHAR(255));
CREATE TABLE company_records (id INT PRIMARY KEY, amount INT, date VARCHAR(255));`,
      seedSql: `INSERT INTO bank_records (id, amount, date) VALUES (1, 500, '2024-01-01'), (2, 300, '2024-01-02'), (3, 750, '2024-01-03'), (4, 200, '2024-01-04');
INSERT INTO company_records (id, amount, date) VALUES (1, 500, '2024-01-01'), (2, 750, '2024-01-03');`,
      expectedResult: [
        { id: 2, amount: 300, date: "2024-01-02" },
        { id: 4, amount: 200, date: "2024-01-04" },
      ],
    },

    // ── Percentages & Ratios ──────────────────────────────────────────

    {
      slug: "conversion-rate",
      title: "Signup to Purchase Conversion Rate",
      difficulty: "medium",
      order: 40,
      problemStatement: `Calculate the **conversion rate** from signup to first purchase for each signup month. The rate is the number of users who made at least one purchase divided by total signups that month, as a percentage rounded to 1 decimal place.

Return \`signup_month\` and \`conversion_rate\`.

---

**Input:**

| users | |
|---|---|
| id | INT PRIMARY KEY |
| signup_date | VARCHAR(255) |

| purchases | |
|---|---|
| id | INT PRIMARY KEY |
| user_id | INT |
| purchase_date | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE users (id INT PRIMARY KEY, signup_date VARCHAR(255));
CREATE TABLE purchases (id INT PRIMARY KEY, user_id INT, purchase_date VARCHAR(255));`,
      seedSql: `INSERT INTO users (id, signup_date) VALUES (1, '2024-01-05'), (2, '2024-01-12'), (3, '2024-01-20'), (4, '2024-02-03'), (5, '2024-02-14');
INSERT INTO purchases (id, user_id, purchase_date) VALUES (1, 1, '2024-01-10'), (2, 3, '2024-02-01'), (3, 4, '2024-02-10');`,
      expectedResult: [
        { signup_month: "2024-01", conversion_rate: 66.7 },
        { signup_month: "2024-02", conversion_rate: 50.0 },
      ],
    },
    {
      slug: "market-share",
      title: "Product Market Share",
      difficulty: "easy",
      order: 41,
      problemStatement: `Calculate each product's **market share** as a percentage of total sales quantity, rounded to 1 decimal place.

Return \`product\` and \`market_share\`.

---

**Input:**

| sales | |
|---|---|
| id | INT PRIMARY KEY |
| product | VARCHAR(255) |
| quantity | INT |`,
      schemaSql: `CREATE TABLE sales (id INT PRIMARY KEY, product VARCHAR(255), quantity INT);`,
      seedSql: `INSERT INTO sales (id, product, quantity) VALUES (1, 'A', 100), (2, 'B', 200), (3, 'A', 150), (4, 'C', 50), (5, 'B', 100);`,
      expectedResult: [
        { product: "A", market_share: 41.7 },
        { product: "B", market_share: 50.0 },
        { product: "C", market_share: 8.3 },
      ],
    },

    // ── Deduplication & Cleanup ───────────────────────────────────────

    {
      slug: "latest-record-per-group",
      title: "Latest Status per Order",
      difficulty: "easy",
      order: 42,
      problemStatement: `Each order can have multiple status updates. Find the **most recent status** for each order.

Return \`order_id\` and \`status\`.

---

**Input:**

| order_status | |
|---|---|
| id | INT PRIMARY KEY |
| order_id | INT |
| status | VARCHAR(255) |
| updated_at | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE order_status (id INT PRIMARY KEY, order_id INT, status VARCHAR(255), updated_at VARCHAR(255));`,
      seedSql: `INSERT INTO order_status (id, order_id, status, updated_at) VALUES (1, 100, 'pending', '2024-01-01 10:00'), (2, 100, 'shipped', '2024-01-02 14:00'), (3, 100, 'delivered', '2024-01-04 09:00'), (4, 200, 'pending', '2024-01-01 11:00'), (5, 200, 'shipped', '2024-01-03 16:00');`,
      expectedResult: [
        { order_id: 100, status: "delivered" },
        { order_id: 200, status: "shipped" },
      ],
    },
    {
      slug: "remove-duplicate-rows",
      title: "Find Rows to Keep (Dedup)",
      difficulty: "medium",
      order: 43,
      problemStatement: `A table has duplicate rows. For each group of duplicates (same \`email\`), keep only the row with the **smallest id**. Return the ids to **keep**.

Return \`id\`.

---

**Input:**

| contacts | |
|---|---|
| id | INT PRIMARY KEY |
| email | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE contacts (id INT PRIMARY KEY, email VARCHAR(255));`,
      seedSql: `INSERT INTO contacts (id, email) VALUES (1, 'a@b.com'), (2, 'c@d.com'), (3, 'a@b.com'), (4, 'c@d.com'), (5, 'e@f.com');`,
      expectedResult: [{ id: 1 }, { id: 2 }, { id: 5 }],
    },

    // ── Cumulative & Running Calculations ─────────────────────────────

    {
      slug: "cumulative-percentage",
      title: "Cumulative Revenue Percentage",
      difficulty: "hard",
      order: 44,
      problemStatement: `Calculate each product's revenue and its **cumulative percentage** of total revenue when sorted by revenue descending. Round to 1 decimal place.

Return \`product\`, \`revenue\`, and \`cumulative_pct\`.

---

**Input:**

| sales | |
|---|---|
| id | INT PRIMARY KEY |
| product | VARCHAR(255) |
| revenue | INT |`,
      schemaSql: `CREATE TABLE sales (id INT PRIMARY KEY, product VARCHAR(255), revenue INT);`,
      seedSql: `INSERT INTO sales (id, product, revenue) VALUES (1, 'A', 500), (2, 'B', 300), (3, 'C', 150), (4, 'D', 50);`,
      expectedResult: [
        { product: "A", revenue: 500, cumulative_pct: 50.0 },
        { product: "B", revenue: 300, cumulative_pct: 80.0 },
        { product: "C", revenue: 150, cumulative_pct: 95.0 },
        { product: "D", revenue: 50, cumulative_pct: 100.0 },
      ],
    },
    {
      slug: "balance-after-transactions",
      title: "Running Account Balance",
      difficulty: "medium",
      order: 45,
      problemStatement: `Given an opening balance of **1000**, calculate the **running balance** after each transaction. Deposits add, withdrawals subtract.

Return \`txn_date\`, \`type\`, \`amount\`, and \`balance\`.

---

**Input:**

| transactions | |
|---|---|
| id | INT PRIMARY KEY |
| txn_date | VARCHAR(255) |
| type | VARCHAR(255) |
| amount | INT |`,
      schemaSql: `CREATE TABLE transactions (id INT PRIMARY KEY, txn_date VARCHAR(255), type VARCHAR(255), amount INT);`,
      seedSql: `INSERT INTO transactions (id, txn_date, type, amount) VALUES (1, '2024-01-01', 'deposit', 500), (2, '2024-01-02', 'withdrawal', 200), (3, '2024-01-03', 'deposit', 300), (4, '2024-01-04', 'withdrawal', 100);`,
      expectedResult: [
        { txn_date: "2024-01-01", type: "deposit", amount: 500, balance: 1500 },
        { txn_date: "2024-01-02", type: "withdrawal", amount: 200, balance: 1300 },
        { txn_date: "2024-01-03", type: "deposit", amount: 300, balance: 1600 },
        { txn_date: "2024-01-04", type: "withdrawal", amount: 100, balance: 1500 },
      ],
    },

    // ── Pattern Matching & Filtering ──────────────────────────────────

    {
      slug: "consecutive-login-days",
      title: "Users With Weekend Logins",
      difficulty: "medium",
      order: 46,
      problemStatement: `Find users who logged in on **both Saturday and Sunday** of the same weekend. Use \`strftime('%w', date)\` where 0=Sunday, 6=Saturday.

Return distinct \`user_id\`.

---

**Input:**

| logins | |
|---|---|
| id | INT PRIMARY KEY |
| user_id | INT |
| login_date | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE logins (id INT PRIMARY KEY, user_id INT, login_date VARCHAR(255));`,
      seedSql: `INSERT INTO logins (id, user_id, login_date) VALUES (1, 1, '2024-03-02'), (2, 1, '2024-03-03'), (3, 2, '2024-03-02'), (4, 3, '2024-03-09'), (5, 3, '2024-03-10'), (6, 2, '2024-03-09');`,
      expectedResult: [{ user_id: 1 }, { user_id: 3 }],
    },
    {
      slug: "search-log-patterns",
      title: "Users Who Viewed Then Purchased",
      difficulty: "medium",
      order: 47,
      problemStatement: `Find users who **viewed** a product and then **purchased** the same product on the same day or later.

Return distinct \`user_id\` and \`product\`.

---

**Input:**

| activity_log | |
|---|---|
| id | INT PRIMARY KEY |
| user_id | INT |
| product | VARCHAR(255) |
| action | VARCHAR(255) |
| action_date | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE activity_log (id INT PRIMARY KEY, user_id INT, product VARCHAR(255), action VARCHAR(255), action_date VARCHAR(255));`,
      seedSql: `INSERT INTO activity_log (id, user_id, product, action, action_date) VALUES (1, 1, 'Laptop', 'view', '2024-01-01'), (2, 1, 'Laptop', 'purchase', '2024-01-03'), (3, 2, 'Phone', 'purchase', '2024-01-02'), (4, 2, 'Phone', 'view', '2024-01-05'), (5, 3, 'Tablet', 'view', '2024-01-01'), (6, 1, 'Phone', 'view', '2024-01-02'), (7, 1, 'Phone', 'purchase', '2024-01-02');`,
      expectedResult: [
        { user_id: 1, product: "Laptop" },
        { user_id: 1, product: "Phone" },
      ],
    },

    // ── Grouping & Having ─────────────────────────────────────────────

    {
      slug: "single-order-customers",
      title: "One-Time Customers",
      difficulty: "easy",
      order: 48,
      problemStatement: `Find customers who have placed **exactly one order**.

Return \`customer_id\` and the \`order_date\` of their single order.

---

**Input:**

| orders | |
|---|---|
| id | INT PRIMARY KEY |
| customer_id | INT |
| order_date | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, order_date VARCHAR(255));`,
      seedSql: `INSERT INTO orders (id, customer_id, order_date) VALUES (1, 1, '2024-01-01'), (2, 2, '2024-01-05'), (3, 1, '2024-02-10'), (4, 3, '2024-03-15'), (5, 4, '2024-01-20'), (6, 4, '2024-04-01');`,
      expectedResult: [
        { customer_id: 2, order_date: "2024-01-05" },
        { customer_id: 3, order_date: "2024-03-15" },
      ],
    },
    {
      slug: "above-avg-per-group",
      title: "Above-Average Scorers per Subject",
      difficulty: "medium",
      order: 49,
      problemStatement: `Find students who scored **above the average** for their subject.

Return \`student\`, \`subject\`, and \`score\`.

---

**Input:**

| exam_results | |
|---|---|
| id | INT PRIMARY KEY |
| student | VARCHAR(255) |
| subject | VARCHAR(255) |
| score | INT |`,
      schemaSql: `CREATE TABLE exam_results (id INT PRIMARY KEY, student VARCHAR(255), subject VARCHAR(255), score INT);`,
      seedSql: `INSERT INTO exam_results (id, student, subject, score) VALUES (1, 'Alice', 'Math', 90), (2, 'Bob', 'Math', 60), (3, 'Carol', 'Math', 75), (4, 'Alice', 'Science', 70), (5, 'Bob', 'Science', 85), (6, 'Carol', 'Science', 80);`,
      expectedResult: [
        { student: "Alice", subject: "Math", score: 90 },
        { student: "Bob", subject: "Science", score: 85 },
      ],
    },

    // ── EXISTS & Complex Conditions ───────────────────────────────────

    {
      slug: "managers-with-five-reports",
      title: "Managers With At Least 5 Reports",
      difficulty: "easy",
      order: 50,
      problemStatement: `Find managers who have **at least 5 direct reports**.

Return the manager \`name\`.

---

**Input:**

| employees | |
|---|---|
| id | INT PRIMARY KEY |
| name | VARCHAR(255) |
| manager_id | INT |`,
      schemaSql: `CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(255), manager_id INT);`,
      seedSql: `INSERT INTO employees (id, name, manager_id) VALUES (1, 'Alice', NULL), (2, 'Bob', 1), (3, 'Carol', 1), (4, 'Dave', 1), (5, 'Eve', 1), (6, 'Frank', 1), (7, 'Grace', 2), (8, 'Hank', 2);`,
      expectedResult: [{ name: "Alice" }],
    },

    // ── Conditional Aggregation & CASE ────────────────────────────────

    {
      slug: "conditional-aggregation",
      title: "Order Status Summary",
      difficulty: "easy",
      order: 51,
      problemStatement: `For each customer, count how many orders are in each status (\`pending\`, \`shipped\`, \`delivered\`) using **conditional aggregation**.

Return \`customer_id\`, \`pending\`, \`shipped\`, and \`delivered\`.

---

**Input:**

| orders | |
|---|---|
| id | INT PRIMARY KEY |
| customer_id | INT |
| status | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, status VARCHAR(255));`,
      seedSql: `INSERT INTO orders (id, customer_id, status) VALUES (1, 1, 'pending'), (2, 1, 'shipped'), (3, 1, 'delivered'), (4, 1, 'delivered'), (5, 2, 'pending'), (6, 2, 'pending'), (7, 3, 'shipped'), (8, 3, 'delivered');`,
      expectedResult: [
        { customer_id: 1, pending: 1, shipped: 1, delivered: 2 },
        { customer_id: 2, pending: 2, shipped: 0, delivered: 0 },
        { customer_id: 3, pending: 0, shipped: 1, delivered: 1 },
      ],
    },
    {
      slug: "salary-bands",
      title: "Salary Band Classification",
      difficulty: "easy",
      order: 52,
      problemStatement: `Classify each employee into a salary band:
- **Low**: salary < 50000
- **Mid**: salary between 50000 and 99999 (inclusive)
- **High**: salary >= 100000

Return \`name\`, \`salary\`, and \`band\`.

---

**Input:**

| employees | |
|---|---|
| id | INT PRIMARY KEY |
| name | VARCHAR(255) |
| salary | INT |`,
      schemaSql: `CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(255), salary INT);`,
      seedSql: `INSERT INTO employees (id, name, salary) VALUES (1, 'Alice', 120000), (2, 'Bob', 45000), (3, 'Carol', 75000), (4, 'Dave', 95000), (5, 'Eve', 30000);`,
      expectedResult: [
        { name: "Alice", salary: 120000, band: "High" },
        { name: "Bob", salary: 45000, band: "Low" },
        { name: "Carol", salary: 75000, band: "Mid" },
        { name: "Dave", salary: 95000, band: "Mid" },
        { name: "Eve", salary: 30000, band: "Low" },
      ],
    },

    // ── UNION & Combining Results ─────────────────────────────────────

    {
      slug: "union-all-sources",
      title: "Merge Event Streams",
      difficulty: "easy",
      order: 53,
      problemStatement: `Combine events from \`web_events\` and \`mobile_events\` into a single list. Add a column \`source\` with value \`'web'\` or \`'mobile'\` respectively.

Return \`user_id\`, \`event\`, \`event_date\`, and \`source\`. Order by \`event_date\`.

---

**Input:**

| web_events | |
|---|---|
| id | INT PRIMARY KEY |
| user_id | INT |
| event | VARCHAR(255) |
| event_date | VARCHAR(255) |

| mobile_events | |
|---|---|
| id | INT PRIMARY KEY |
| user_id | INT |
| event | VARCHAR(255) |
| event_date | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE web_events (id INT PRIMARY KEY, user_id INT, event VARCHAR(255), event_date VARCHAR(255));
CREATE TABLE mobile_events (id INT PRIMARY KEY, user_id INT, event VARCHAR(255), event_date VARCHAR(255));`,
      seedSql: `INSERT INTO web_events (id, user_id, event, event_date) VALUES (1, 1, 'login', '2024-01-01'), (2, 2, 'purchase', '2024-01-03');
INSERT INTO mobile_events (id, user_id, event, event_date) VALUES (1, 1, 'view', '2024-01-02'), (2, 3, 'login', '2024-01-04');`,
      expectedResult: [
        { user_id: 1, event: "login", event_date: "2024-01-01", source: "web" },
        { user_id: 1, event: "view", event_date: "2024-01-02", source: "mobile" },
        { user_id: 2, event: "purchase", event_date: "2024-01-03", source: "web" },
        { user_id: 3, event: "login", event_date: "2024-01-04", source: "mobile" },
      ],
    },

    // ── Correlated Subqueries ─────────────────────────────────────────

    {
      slug: "departments-all-above-threshold",
      title: "Departments Where Everyone Earns Above 60k",
      difficulty: "medium",
      order: 54,
      problemStatement: `Find departments where **every** employee earns more than 60000.

Return \`department\`.

---

**Input:**

| employees | |
|---|---|
| id | INT PRIMARY KEY |
| name | VARCHAR(255) |
| department | VARCHAR(255) |
| salary | INT |`,
      schemaSql: `CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(255), department VARCHAR(255), salary INT);`,
      seedSql: `INSERT INTO employees (id, name, department, salary) VALUES (1, 'Alice', 'Engineering', 90000), (2, 'Bob', 'Engineering', 80000), (3, 'Carol', 'Sales', 55000), (4, 'Dave', 'Sales', 70000), (5, 'Eve', 'Marketing', 65000), (6, 'Frank', 'Marketing', 72000);`,
      expectedResult: [
        { department: "Engineering" },
        { department: "Marketing" },
      ],
    },
    {
      slug: "latest-order-per-customer",
      title: "Most Expensive Order per Customer",
      difficulty: "medium",
      order: 55,
      problemStatement: `For each customer, find their **single most expensive order**. If there's a tie, pick the one with the latest \`order_date\`.

Return \`customer_id\`, \`order_id\`, \`amount\`, and \`order_date\`.

---

**Input:**

| orders | |
|---|---|
| id | INT PRIMARY KEY |
| customer_id | INT |
| amount | INT |
| order_date | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT, order_date VARCHAR(255));`,
      seedSql: `INSERT INTO orders (id, customer_id, amount, order_date) VALUES (1, 1, 200, '2024-01-01'), (2, 1, 500, '2024-01-15'), (3, 1, 500, '2024-02-01'), (4, 2, 300, '2024-01-10'), (5, 2, 100, '2024-02-05');`,
      expectedResult: [
        { customer_id: 1, order_id: 3, amount: 500, order_date: "2024-02-01" },
        { customer_id: 2, order_id: 4, amount: 300, order_date: "2024-01-10" },
      ],
    },

    // ── Window Frames & Moving Calculations ───────────────────────────

    {
      slug: "moving-average",
      title: "3-Day Moving Average",
      difficulty: "medium",
      order: 56,
      problemStatement: `Calculate the **3-day moving average** of daily revenue (current day + previous 2 days). Round to 1 decimal place. For the first two days, average whatever is available.

Return \`sale_date\`, \`revenue\`, and \`moving_avg\`.

---

**Input:**

| daily_sales | |
|---|---|
| sale_date | VARCHAR(255) |
| revenue | INT |`,
      schemaSql: `CREATE TABLE daily_sales (sale_date VARCHAR(255) PRIMARY KEY, revenue INT);`,
      seedSql: `INSERT INTO daily_sales (sale_date, revenue) VALUES ('2024-01-01', 100), ('2024-01-02', 200), ('2024-01-03', 150), ('2024-01-04', 300), ('2024-01-05', 250);`,
      expectedResult: [
        { sale_date: "2024-01-01", revenue: 100, moving_avg: 100.0 },
        { sale_date: "2024-01-02", revenue: 200, moving_avg: 150.0 },
        { sale_date: "2024-01-03", revenue: 150, moving_avg: 150.0 },
        { sale_date: "2024-01-04", revenue: 300, moving_avg: 216.7 },
        { sale_date: "2024-01-05", revenue: 250, moving_avg: 233.3 },
      ],
    },
    {
      slug: "ntile-quartiles",
      title: "Salary Quartiles",
      difficulty: "medium",
      order: 57,
      problemStatement: `Assign each employee to a **salary quartile** (1 = lowest 25%, 4 = highest 25%) using the \`NTILE\` window function.

Return \`name\`, \`salary\`, and \`quartile\`.

---

**Input:**

| employees | |
|---|---|
| id | INT PRIMARY KEY |
| name | VARCHAR(255) |
| salary | INT |`,
      schemaSql: `CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(255), salary INT);`,
      seedSql: `INSERT INTO employees (id, name, salary) VALUES (1, 'Alice', 40000), (2, 'Bob', 55000), (3, 'Carol', 70000), (4, 'Dave', 85000), (5, 'Eve', 60000), (6, 'Frank', 95000), (7, 'Grace', 50000), (8, 'Hank', 75000);`,
      expectedResult: [
        { name: "Alice", salary: 40000, quartile: 1 },
        { name: "Grace", salary: 50000, quartile: 1 },
        { name: "Bob", salary: 55000, quartile: 2 },
        { name: "Eve", salary: 60000, quartile: 2 },
        { name: "Carol", salary: 70000, quartile: 3 },
        { name: "Hank", salary: 75000, quartile: 3 },
        { name: "Dave", salary: 85000, quartile: 4 },
        { name: "Frank", salary: 95000, quartile: 4 },
      ],
    },

    // ── Real-World Analytics ──────────────────────────────────────────

    {
      slug: "retention-day-1",
      title: "Day-1 Retention Rate",
      difficulty: "hard",
      order: 58,
      problemStatement: `Calculate the **Day-1 retention rate** for each signup cohort (by signup date). A user is retained on Day 1 if they have an activity on the day after their signup. Return the rate as a percentage rounded to 1 decimal place.

Return \`signup_date\` and \`retention_rate\`.

---

**Input:**

| users | |
|---|---|
| id | INT PRIMARY KEY |
| signup_date | VARCHAR(255) |

| activity | |
|---|---|
| id | INT PRIMARY KEY |
| user_id | INT |
| activity_date | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE users (id INT PRIMARY KEY, signup_date VARCHAR(255));
CREATE TABLE activity (id INT PRIMARY KEY, user_id INT, activity_date VARCHAR(255));`,
      seedSql: `INSERT INTO users (id, signup_date) VALUES (1, '2024-01-01'), (2, '2024-01-01'), (3, '2024-01-01'), (4, '2024-01-02'), (5, '2024-01-02');
INSERT INTO activity (id, user_id, activity_date) VALUES (1, 1, '2024-01-02'), (2, 3, '2024-01-02'), (3, 4, '2024-01-03'), (4, 1, '2024-01-03'), (5, 2, '2024-01-05');`,
      expectedResult: [
        { signup_date: "2024-01-01", retention_rate: 66.7 },
        { signup_date: "2024-01-02", retention_rate: 50.0 },
      ],
    },
    {
      slug: "year-over-year-growth",
      title: "Year-over-Year Revenue Growth",
      difficulty: "medium",
      order: 59,
      problemStatement: `Calculate the **year-over-year revenue growth** percentage for each year (compared to the previous year). Round to 1 decimal place. Only include years that have a previous year to compare against.

Return \`year\`, \`revenue\`, and \`yoy_growth\`.

---

**Input:**

| annual_revenue | |
|---|---|
| year | INT PRIMARY KEY |
| revenue | INT |`,
      schemaSql: `CREATE TABLE annual_revenue (year INT PRIMARY KEY, revenue INT);`,
      seedSql: `INSERT INTO annual_revenue (year, revenue) VALUES (2020, 100000), (2021, 120000), (2022, 108000), (2023, 150000);`,
      expectedResult: [
        { year: 2021, revenue: 120000, yoy_growth: 20.0 },
        { year: 2022, revenue: 108000, yoy_growth: -10.0 },
        { year: 2023, revenue: 150000, yoy_growth: 38.9 },
      ],
    },
    {
      slug: "churn-candidates",
      title: "Identify Churned Users",
      difficulty: "medium",
      order: 60,
      problemStatement: `A user is considered **churned** if their most recent activity was more than 30 days before the latest date in the activity table. Find all churned users.

Return \`user_id\` and \`last_active\` (their most recent activity date).

---

**Input:**

| activity | |
|---|---|
| id | INT PRIMARY KEY |
| user_id | INT |
| activity_date | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE activity (id INT PRIMARY KEY, user_id INT, activity_date VARCHAR(255));`,
      seedSql: `INSERT INTO activity (id, user_id, activity_date) VALUES (1, 1, '2024-03-01'), (2, 1, '2024-03-15'), (3, 2, '2024-01-10'), (4, 2, '2024-01-20'), (5, 3, '2024-03-14'), (6, 4, '2024-02-01');`,
      expectedResult: [
        { user_id: 2, last_active: "2024-01-20" },
        { user_id: 4, last_active: "2024-02-01" },
      ],
    },

    // ── Advanced Joins ────────────────────────────────────────────────

    {
      slug: "self-join-pairs",
      title: "Employee Pairs in Same Department",
      difficulty: "medium",
      order: 61,
      problemStatement: `Find all **unique pairs** of employees who work in the same department. Each pair should appear only once (alphabetically by first name).

Return \`employee1\`, \`employee2\`, and \`department\`.

---

**Input:**

| employees | |
|---|---|
| id | INT PRIMARY KEY |
| name | VARCHAR(255) |
| department | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE employees (id INT PRIMARY KEY, name VARCHAR(255), department VARCHAR(255));`,
      seedSql: `INSERT INTO employees (id, name, department) VALUES (1, 'Alice', 'Eng'), (2, 'Bob', 'Eng'), (3, 'Carol', 'Eng'), (4, 'Dave', 'Sales'), (5, 'Eve', 'Sales');`,
      expectedResult: [
        { employee1: "Alice", employee2: "Bob", department: "Eng" },
        { employee1: "Alice", employee2: "Carol", department: "Eng" },
        { employee1: "Bob", employee2: "Carol", department: "Eng" },
        { employee1: "Dave", employee2: "Eve", department: "Sales" },
      ],
    },
    {
      slug: "cross-join-missing-data",
      title: "Fill Missing Month-Product Combinations",
      difficulty: "hard",
      order: 62,
      problemStatement: `You have sales data but some month/product combinations are missing (zero sales). Generate **all combinations** of months and products, showing 0 for months with no sales.

Return \`month\`, \`product\`, and \`total_sales\`. Order by month, then product.

---

**Input:**

| sales | |
|---|---|
| id | INT PRIMARY KEY |
| month | VARCHAR(255) |
| product | VARCHAR(255) |
| amount | INT |`,
      schemaSql: `CREATE TABLE sales (id INT PRIMARY KEY, month VARCHAR(255), product VARCHAR(255), amount INT);`,
      seedSql: `INSERT INTO sales (id, month, product, amount) VALUES (1, '2024-01', 'A', 100), (2, '2024-01', 'B', 200), (3, '2024-02', 'A', 150), (4, '2024-03', 'B', 300);`,
      expectedResult: [
        { month: "2024-01", product: "A", total_sales: 100 },
        { month: "2024-01", product: "B", total_sales: 200 },
        { month: "2024-02", product: "A", total_sales: 150 },
        { month: "2024-02", product: "B", total_sales: 0 },
        { month: "2024-03", product: "A", total_sales: 0 },
        { month: "2024-03", product: "B", total_sales: 300 },
      ],
    },

    // ── Island & Gap Problems ─────────────────────────────────────────

    {
      slug: "group-consecutive-events",
      title: "Group Consecutive Status Periods",
      difficulty: "hard",
      order: 63,
      problemStatement: `A server's status is recorded daily. Group consecutive days with the **same status** into periods.

Return \`status\`, \`start_date\`, and \`end_date\` for each period, ordered by start_date.

---

**Input:**

| server_log | |
|---|---|
| log_date | VARCHAR(255) |
| status | VARCHAR(255) |`,
      schemaSql: `CREATE TABLE server_log (log_date VARCHAR(255) PRIMARY KEY, status VARCHAR(255));`,
      seedSql: `INSERT INTO server_log (log_date, status) VALUES ('2024-01-01', 'up'), ('2024-01-02', 'up'), ('2024-01-03', 'down'), ('2024-01-04', 'down'), ('2024-01-05', 'down'), ('2024-01-06', 'up'), ('2024-01-07', 'up');`,
      expectedResult: [
        { status: "up", start_date: "2024-01-01", end_date: "2024-01-02" },
        { status: "down", start_date: "2024-01-03", end_date: "2024-01-05" },
        { status: "up", start_date: "2024-01-06", end_date: "2024-01-07" },
      ],
    },

    // ── Practical Business Queries ────────────────────────────────────

    {
      slug: "revenue-contribution",
      title: "Customer Revenue Contribution Tier",
      difficulty: "medium",
      order: 64,
      problemStatement: `Classify customers by their total spending:
- **Gold**: top 20% of spenders (by revenue)
- **Silver**: next 30%
- **Bronze**: remaining 50%

Use \`NTILE(10)\` to create deciles, then map: deciles 9-10 = Gold, 7-8 = Silver, 1-6 = Bronze.

Return \`customer_id\`, \`total_revenue\`, and \`tier\`.

---

**Input:**

| orders | |
|---|---|
| id | INT PRIMARY KEY |
| customer_id | INT |
| amount | INT |`,
      schemaSql: `CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, amount INT);`,
      seedSql: `INSERT INTO orders (id, customer_id, amount) VALUES (1, 1, 500), (2, 1, 300), (3, 2, 1000), (4, 2, 500), (5, 3, 200), (6, 4, 100), (7, 5, 400), (8, 5, 200), (9, 6, 50), (10, 7, 900), (11, 7, 100), (12, 8, 300), (13, 9, 150), (14, 10, 80);`,
      expectedResult: [
        { customer_id: 2, total_revenue: 1500, tier: "Gold" },
        { customer_id: 7, total_revenue: 1000, tier: "Gold" },
        { customer_id: 1, total_revenue: 800, tier: "Silver" },
        { customer_id: 5, total_revenue: 600, tier: "Silver" },
        { customer_id: 8, total_revenue: 300, tier: "Silver" },
        { customer_id: 3, total_revenue: 200, tier: "Bronze" },
        { customer_id: 9, total_revenue: 150, tier: "Bronze" },
        { customer_id: 4, total_revenue: 100, tier: "Bronze" },
        { customer_id: 10, total_revenue: 80, tier: "Bronze" },
        { customer_id: 6, total_revenue: 50, tier: "Bronze" },
      ],
    },
    {
      slug: "inventory-reorder",
      title: "Products to Reorder",
      difficulty: "easy",
      order: 65,
      problemStatement: `Find products where current \`stock\` is **below** the \`reorder_level\`. Also calculate how many units to order: \`reorder_level - stock + safety_stock\`.

Return \`product\`, \`stock\`, \`reorder_level\`, and \`order_qty\`.

---

**Input:**

| inventory | |
|---|---|
| id | INT PRIMARY KEY |
| product | VARCHAR(255) |
| stock | INT |
| reorder_level | INT |
| safety_stock | INT |`,
      schemaSql: `CREATE TABLE inventory (id INT PRIMARY KEY, product VARCHAR(255), stock INT, reorder_level INT, safety_stock INT);`,
      seedSql: `INSERT INTO inventory (id, product, stock, reorder_level, safety_stock) VALUES (1, 'Widget A', 15, 20, 10), (2, 'Widget B', 50, 30, 5), (3, 'Widget C', 3, 25, 15), (4, 'Widget D', 0, 10, 5);`,
      expectedResult: [
        { product: "Widget A", stock: 15, reorder_level: 20, order_qty: 15 },
        { product: "Widget C", stock: 3, reorder_level: 25, order_qty: 37 },
        { product: "Widget D", stock: 0, reorder_level: 10, order_qty: 15 },
      ],
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
