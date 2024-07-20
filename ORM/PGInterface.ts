import pg, {QueryResult} from "pg";

const Pool = pg.Pool;

const db = new Pool({ //TODO: вынести в .env
    user: "postgres",
    password: "Qwerty123",
    host: "postgres",
    port: 5432,
    database: "vue_tasks"
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


interface ISelect {
    table: string
    fields: string[]
    condition?: string
    join?: IJoin[]
    order?: string
}

interface IJoin {
    type: 'INNER JOIN',
    table: string,
    firstId: string,
    secondId: string
}

interface IInsert {
    table: string,
    fields: string[],
    values: any[],
    returns?: string[]
}

interface IDelete {
    table: string,
    condition: string
}

interface IUpdate {
    table: string,
    set: string[],
    condition: string,
    returns?: string[]
}

export default new PGInterface();