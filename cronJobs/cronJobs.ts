import nodemailer from "nodemailer";
import cron from "node-cron";
import PGInterface from "../ORM/PGInterface";
import {ICurrentData, INotification, taskStatusMap} from "../models/models";
import schedule from "node-schedule";
import 'dotenv/config';

// Настройка SMTP-транспорта
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
})

// Функция для отправки писем
const sendEmail = (to: string, subject: string, dynamicContent: string) => {
    const htmlTemplate = `<html>
            <head>
                <style>
                    body {
                        font-family: Arial, Helvetika, sans-serif; /* Задаем шрифт */
                        font-size: 13px; /* Задаем размер шрифта */
                        color: #222222;
                    }
                    p {
                        margin: 0 0 10px;
                    }
                </style>
            </head>
            <body>
                ${dynamicContent}
            </body>
        </html>`

    const mailOptions = {
        from: process.env.SMTP_USER,
        to,
        subject,
        html: htmlTemplate
    }

    transporter.sendMail(mailOptions, (err: Error | null, info: nodemailer.SentMessageInfo) => {
        if (err) {
            return console.log(err);
        }
        console.log(`Письмо отправлено: ${info.envelope.to.join(',')}`)
    })
}

// Cron job для проверки задач
cron.schedule(process.env.CRON_JOBS_INTERVAL!, async () => {
    console.log('cronJob: start');
    try {
        const newDate = new Date();
        const now = newDate.toISOString();
        const future = new Date(newDate.getTime() +
            Number(process.env.CRON_JOBS_RANGE_TIME) * 60000).toISOString();
        const res: INotification[] = await PGInterface.select({
            table: '"notificationSla"',
            fields: ['*'],
            condition: `"scheduledTime" BETWEEN '${now}' AND '${future}' AND "status" = 'scheduled'`
        })
        res.forEach(async (record): Promise<void> => {
            try {
                const compDate = record.scheduledTime;
                if (new Date(compDate) > newDate) {
                    await PGInterface.update({
                        table: '"notificationSla"',
                        set: [`"status"='pending'`],
                        condition: `"notificationId"=${record.notificationId}`
                    });
                    schedule.scheduleJob(compDate, async () => {
                        const currentData: ICurrentData[] = await PGInterface.select({
                            table: '"notificationSla"',
                            fields: ['"tasks"."taskId"', '"notificationSla"."scheduledTime"', '"notificationSla"."status"',
                                '"notificationSla"."type"', '"users"."email"', '"tasks"."status" AS "taskStatus"'],
                            join: [{
                                type: 'INNER JOIN',
                                table: '"tasks"',
                                firstId: '"tasks"."taskId"',
                                secondId: '"notificationSla"."taskId"'
                            }, {
                                type: 'INNER JOIN',
                                table: '"users"',
                                firstId: '"users"."userId"',
                                secondId: '"tasks"."member"'
                            }],
                            condition: `"notificationId"=${record.notificationId}`
                        });
                        if (currentData[0].status === 'pending') {
                            sendEmail(currentData[0].email,
                                `Превышен срок выполнения задачи #${currentData[0].taskId}`,
                                emailTemplate(currentData[0].taskId, taskStatusMap[currentData[0].taskStatus], currentData[0].scheduledTime.toISOString()))
                            await PGInterface.update({
                                table: '"notificationSla"',
                                set: [`"status"='completed'`],
                                condition: `"notificationId"=${record.notificationId}`
                            });
                        }
                    })
                }
            } catch (e) {
                await PGInterface.update({
                    table: '"notificationSla"',
                    set: [`"status"='failed'`],
                    condition: `"notificationId"=${record.notificationId}`
                });
                throw e
            }
        })
        console.log(`cronJob: ${res.length} mail planned`);
    } catch (e) {
        console.log(`cronJob: exception error`)
        console.log(JSON.stringify(e))
    }
})

const emailTemplate = (id: number, status: string, date: string): string => {
    return `<p>Превышен желаемый срок выполнения задачи:</p>
            <p><strong>Задача:</strong> ${id}</p>
            <p><strong>Статус:</strong> ${status}</p>
            <p><strong>Желаемый срок:</strong> ${date}</p>`;
}