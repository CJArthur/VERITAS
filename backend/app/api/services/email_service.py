from fastapi_mail import FastMail, MessageSchema
from pydantic import EmailStr
import asyncio
from fastapi_mail import ConnectionConfig

from app.utils.config import FRONTEND_URL
from app.settings import SETTINGS


# ==========================================================
#   BASE EMAIL WRAPPER
# ==========================================================
email_conf = ConnectionConfig(
      MAIL_USERNAME=SETTINGS.MAIL_USERNAME,
      MAIL_PASSWORD=SETTINGS.MAIL_PASSWORD.get_secret_value(),
      MAIL_FROM=SETTINGS.MAIL_FROM,
      MAIL_PORT=SETTINGS.MAIL_PORT,
      MAIL_SERVER=SETTINGS.MAIL_SERVER,
      MAIL_FROM_NAME=SETTINGS.MAIL_FROM_NAME,
      MAIL_STARTTLS=SETTINGS.MAIL_TLS,
      MAIL_SSL_TLS=SETTINGS.MAIL_SSL
    )

def _build_email(title: str, message: str, button_text: str, action_link: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0e0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0f0e0d;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
             style="max-width:520px;background:#1c1917;border:1px solid #2a2622;">

        <!-- TOP ACCENT LINE -->
        <tr><td style="height:3px;background:linear-gradient(90deg,#a05c20,#f0d4a0,#a05c20);"></td></tr>

        <!-- HEADER -->
        <tr>
          <td style="padding:36px 40px 28px;text-align:center;border-bottom:1px solid #2a2622;">
            <div style="display:inline-block;width:56px;height:56px;position:relative;margin-bottom:16px;">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M28 4L50 12V30C50 42 28 52 28 52C28 52 6 42 6 30V12L28 4Z"
                      fill="#232020" stroke="#a05c20" stroke-width="1.5" stroke-opacity="0.7"/>
                <text x="28" y="36" text-anchor="middle" font-family="Georgia,serif"
                      font-size="22" font-weight="bold" fill="#f0d4a0">V</text>
              </svg>
            </div>
            <div style="font-size:11px;font-weight:700;letter-spacing:0.3em;color:#a05c20;text-transform:uppercase;">VERITAS</div>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:36px 40px;">
            <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f0d4a0;line-height:1.3;">{title}</h1>
            <p style="margin:0 0 32px;font-size:15px;color:#a8a29e;line-height:1.7;">{message}</p>

            <!-- BUTTON -->
            <table cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="background:#a05c20;">
                  <a href="{action_link}"
                     style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;
                            color:#ffffff;text-decoration:none;letter-spacing:0.02em;">
                    {button_text}
                  </a>
                </td>
              </tr>
            </table>

            <!-- FALLBACK LINK -->
            <p style="margin:24px 0 0;font-size:12px;color:#57534e;">
              Если кнопка не работает, скопируйте ссылку в браузер:<br>
              <a href="{action_link}" style="color:#a05c20;word-break:break-all;">{action_link}</a>
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #2a2622;text-align:center;">
            <p style="margin:0;font-size:12px;color:#44403c;">
              Если вы не выполняли это действие — просто проигнорируйте письмо.
            </p>
            <p style="margin:8px 0 0;font-size:11px;color:#292524;">
              © VERITAS — Платформа верификации дипломов
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>"""


# ==========================================================
#   EMAIL TEMPLATES
# ==========================================================

EMAIL_VERIFY_TEMPLATE = _build_email(
    title="Подтвердите ваш email",
    message=(
        "Спасибо за регистрацию в VERITAS — платформе криптографической верификации дипломов.<br><br>"
        "Нажмите кнопку ниже, чтобы активировать аккаунт. Ссылка действительна <strong style='color:#f0d4a0;'>30 минут</strong>."
    ),
    button_text="Подтвердить Email",
    action_link="{VERIFY_LINK}",
)

EMAIL_RESET_TEMPLATE = _build_email(
    title="Сброс пароля",
    message=(
        "Мы получили запрос на сброс пароля для вашего аккаунта VERITAS.<br><br>"
        "Нажмите кнопку ниже, чтобы задать новый пароль. Ссылка действительна <strong style='color:#f0d4a0;'>30 минут</strong>."
    ),
    button_text="Сбросить пароль",
    action_link="{RESET_LINK}",
)


# ==========================================================
#   SEND: VERIFY EMAIL
# ==========================================================

async def send_verification_email(to_email: EmailStr, verification_link: str):
    html_content = EMAIL_VERIFY_TEMPLATE.replace("{VERIFY_LINK}", verification_link)  # noqa: S001

    message = MessageSchema(
        subject="Подтверждение регистрации",
        recipients=[to_email],
        body=html_content,
        subtype="html"
    )

    fm = FastMail(email_conf)
    await fm.send_message(message)


def send_verification_email_sync(to_email: EmailStr, verification_link: str):
    asyncio.run(send_verification_email(to_email, verification_link))


# ==========================================================
#   SEND: RESET PASSWORD EMAIL
# ==========================================================

async def send_forgot_password_email(to_email: EmailStr, reset_link: str):
    html_content = EMAIL_RESET_TEMPLATE.replace("{RESET_LINK}", reset_link)

    message = MessageSchema(
        subject="Сброс пароля",
        recipients=[to_email],
        body=html_content,
        subtype="html"
    )

    fm = FastMail(email_conf)
    await fm.send_message(message)


def send_forgot_password_email_sync(to_email: EmailStr, reset_link: str):
    asyncio.run(send_forgot_password_email(to_email, reset_link))
