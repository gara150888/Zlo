import { neon } from "@neondatabase/serverless";
import { env } from "@Zlo/env/server";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema/index";

const sql = neon(env.DATABASE_URL);
export const db = drizzle(sql, { schema });
