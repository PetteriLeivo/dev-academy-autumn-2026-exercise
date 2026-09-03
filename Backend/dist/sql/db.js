import pgPromise from 'pg-promise';
const pgp = pgPromise({});
// Database connection configuration
const connectionString = 'postgres://academy:academy@localhost:5432/electricity';
// Create the database instance
const db = pgp(connectionString);
export { db, pgp };
