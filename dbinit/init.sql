CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    socket_id VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS tokens (
    user_id INTEGER,
    refresh_token VARCHAR,
    FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE TABLE IF NOT EXISTS projects (
    project_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150),
    description TEXT,
    owner INTEGER,
    editor INTEGER,
    FOREIGN KEY (owner) REFERENCES users (user_id),
    FOREIGN KEY (editor) REFERENCES users (user_id)
);

CREATE TABLE IF NOT EXISTS tasks (
    task_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(200),
    description TEXT,
    priority VARCHAR(50),
    complation_date TIMESTAMP WITHOUT TIME ZONE,
    project_id INTEGER,
    member INTEGER,
    status VARCHAR(100),
    editor INTEGER,
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (member) REFERENCES users(user_id),
    FOREIGN KEY (editor) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS notification_sla (
    notification_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    task_id INTEGER,
    scheduled_time TIMESTAMP WITHOUT TIME ZONE,
    status VARCHAR(100),
    type VARCHAR(50),
    FOREIGN KEY (task_id) REFERENCES tasks(task_id)
);

CREATE TABLE IF NOT EXISTS notification_log (
    notification_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    is_checked BOOLEAN NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (task_id) REFERENCES tasks(task_id)
);