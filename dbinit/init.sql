CREATE TABLE IF NOT EXISTS users (
    "userId" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL UNIQUE,
    "password" VARCHAR(100) NOT NULL,
    "socketId" VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS tokens (
    "userId" INTEGER,
    "refreshToken" VARCHAR,
    FOREIGN KEY ("userId") REFERENCES users ("userId")
);

CREATE TABLE IF NOT EXISTS projects (
    "projectId" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "name" VARCHAR(150),
    "description" TEXT,
    "owner" INTEGER,
    "editor" INTEGER,
    FOREIGN KEY ("owner") REFERENCES users ("userId"),
    FOREIGN KEY ("editor") REFERENCES users ("userId")
);

CREATE TABLE IF NOT EXISTS tasks (
    "taskId" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "name" VARCHAR(200),
    "description" TEXT,
    "priority" VARCHAR(50),
    "completionDate" TIMESTAMP WITHOUT TIME ZONE,
    "projectId" INTEGER,
    "member" INTEGER,
    "status" VARCHAR(100),
    "editor" INTEGER,
    FOREIGN KEY ("projectId") REFERENCES projects("projectId"),
    FOREIGN KEY ("member") REFERENCES users("userId"),
    FOREIGN KEY ("editor") REFERENCES users("userId")
);

CREATE TABLE IF NOT EXISTS "notificationSla" (
    "notificationId" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "taskId" INTEGER,
    "scheduledTime" TIMESTAMP WITHOUT TIME ZONE,
    "status" VARCHAR(100),
    "type" VARCHAR(50),
    FOREIGN KEY ("taskId") REFERENCES tasks("taskId")
);

CREATE TABLE IF NOT EXISTS "notificationLog" (
    "notificationId" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "taskId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "isChecked" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    FOREIGN KEY ("userId") REFERENCES users("userId"),
    FOREIGN KEY ("taskId") REFERENCES tasks("taskId")
);