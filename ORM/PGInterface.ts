import pg, {QueryResult} from "pg";
import 'dotenv/config';
import {IDelete, IInsert, ISelect, IUpdate} from "../models/pginterfaceModels";

const Pool = pg.Pool;

const db = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_DATABASE,
})

class PGInterface {
    async select(options: ISelect): Promise<any[]> {
        let queryString = `SELECT ${options.fields.join(',')} FROM ${options.table}`;
        if (options.join && options.join.length > 0) {
            options.join.forEach(el => {
                queryString += ` ${el.type} ${el.table} ON ${el.firstId} = ${el.secondId}`
            })
        }
        if (options.condition) {
            queryString += ` WHERE ${options.condition}`
        }
        if (options.order) {
            queryString += ` ORDER BY ${options.order}`
        }
        if (options.limit) {
            queryString += ` LIMIT ${options.limit}`
        }
        if (options.offset) {
            queryString += ` OFFSET ${options.offset}`
        }
        return await this.#dbquery(queryString);
    }

    async insert(options: IInsert): Promise<any[]> {
        let queryString = `INSERT INTO ${options.table} (${options.fields.join(',')}) 
        VALUES (${options.values.join(',')})`
        if (options.returns && options.returns.length > 0) {
            queryString += ` RETURNING ${options.returns.join(',')}`
        }
        return await this.#dbquery(queryString);
    }

    async update(options: IUpdate): Promise<any[]> {
        let queryString = `UPDATE ${options.table} SET ${options.set.join(',')} WHERE ${options.condition}`
        if (options.returns && options.returns.length > 0) {
            queryString += ` RETURNING ${options.returns.join(',')}`
        }
        return await this.#dbquery(queryString);
    }

    async delete(options: IDelete): Promise<any[]> {
        let queryString = `DELETE FROM ${options.table} WHERE ${options.condition}`
        return await this.#dbquery(queryString);
    }

    async customQuery(queryString: string): Promise<any[]> {
        return await this.#dbquery(queryString);
    }

    async #dbquery(query: string): Promise<any[]> {
        const response: QueryResult<any> = await db.query(query);
        return response.rows;
    }
}

export default new PGInterface();