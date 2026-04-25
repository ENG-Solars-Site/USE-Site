const fetch = require('node-fetch');

// ⚠️ هام: هذه المفاتيح حساسة. تأكد من جعل المستودع خاصاً (Private) على GitHub.
const TELEGRAM_BOT_TOKEN = '8710514306:AAGuB0YEbpId-tBRJRlqbLw5_lP7fMCWlic';
const TELEGRAM_CHAT_IDS = ['8357998608', '5059002505'];

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const data = JSON.parse(event.body);

        let message = `📄 *طلب توظيف جديد - USE*\n`;
        message += `🆔 رقم الطلب: ${data.applicationId}\n`;
        message += `👤 الاسم: ${data.fullName}\n`;
        message += `📞 الهاتف: ${data.phone}\n`;
        message += `📧 البريد: ${data.email}\n`;
        message += `🎂 تاريخ الميلاد: ${data.dob || 'غير محدد'}\n`;
        message += `📍 العنوان: ${data.address || '-'}\n`;
        message += `🎓 التخصص: ${data.major || '-'} / ${data.university || '-'} (${data.gradYear || '-'})\n`;
        message += `🆔 رقم نقابة المهندسين: ${data.engineerId || 'لايوجد'}\n`;
        message += `💼 خبرة: ${data.hasExperience || 'لا'} ${data.expCompany ? `\n   الشركة: ${data.expCompany} - ${data.expDuration} سنة` : ''}\n`;
        message += `🛠️ المهارات البرمجية: ${data.softwareSkills || '-'}\n`;
        message += `📚 الدورات: ${data.courses.map(c => `${c.name} (${c.provider})`).join('; ') || 'لا يوجد'}\n`;
        message += `💬 لماذا USE: ${data.motivation || '-'}\n`;
        message += `🏗️ العمل الميداني: ${data.fieldWork || 'لا'}\n`;
        message += `📎 السيرة الذاتية: ${data.cvFileName || 'لم يرفق'}\n`;
        message += `📜 الشهادات: ${data.certFileName || 'لم يرفق'}\n`;

        const sendText = async (chatId) => {
            const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
            return fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' })
            });
        };

        const sendDocument = async (chatId, base64Data, filename) => {
            if (!base64Data) return;
            const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`;
            const boundary = '----WebKitFormBoundary';
            const body = `--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${filename}"\r\nContent-Type: application/pdf\r\n\r\n${Buffer.from(base64Data, 'base64').toString('binary')}\r\n--${boundary}--`;
            return fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
                body: Buffer.from(body, 'binary')
            });
        };

        for (const chatId of TELEGRAM_CHAT_IDS) {
            await sendText(chatId);
            if (data.cvBase64) await sendDocument(chatId, data.cvBase64, data.cvFileName);
            if (data.certBase64) await sendDocument(chatId, data.certBase64, data.certFileName);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'تم إرسال الطلب بنجاح' })
        };
    } catch (err) {
        console.error('Error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: err.message })
        };
    }
};
