import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { entities } from "../infrastructure/persistence/entities/index.js";

@Module({
    imports: [
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        entities,           // todas, desde entities/index.ts
        synchronize: false, // las tablas las crea tu script
      }),
    ],
  controllers: [],
  providers: [],
  exports: [],
})
export class DatabaseModule {}
