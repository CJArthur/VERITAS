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
      MAIL_PASSWORD=SETTINGS.MAIL_PASSWORD.get_secret_value(), # Добавьте .get_secret_value()
      MAIL_FROM=SETTINGS.MAIL_FROM,
      MAIL_PORT=SETTINGS.MAIL_PORT,
      MAIL_SERVER=SETTINGS.MAIL_SERVER,
      MAIL_FROM_NAME=SETTINGS.MAIL_FROM_NAME,
      MAIL_STARTTLS=SETTINGS.MAIL_TLS, # В новых версиях fastapi-mail поле называется так
      MAIL_SSL_TLS=SETTINGS.MAIL_SSL    # И так для SSL
    )

BASE_EMAIL_WRAPPER = """
<html>
  <body style="
      margin:0;
      padding:0;
      background:#F2F4F6;
      font-family:-apple-system, BlinkMacSystemFont,'Inter','Segoe UI',Roboto,Arial,sans-serif;
      color:#333333;
      line-height:1.6;
    "
  >

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="background:#F2F4F6; padding:48px 0;">
      <tr>
        <td align="center">

          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="
              max-width:560px;
              background:#FFFFFF;
              border-radius:24px;
              padding:40px;
              box-shadow:0 10px 15px -3px rgba(16,24,40,0.08),
                         0 4px 6px -4px rgba(16,24,40,0.04);
            "
          >

            <!-- LOGO -->
            <tr>
              <td style="text-align:center; padding-bottom:32px;">
                <img src='{FRONTEND_URL}/logo.svg'
                     width="64" height="64"
                     alt="Stanza"
                     style="display:block; margin:0 auto;">
              </td>
            </tr>

            <!-- TITLE -->
            <tr>
              <td style="
                  font-size:24px;
                  font-weight:700;
                  color:#333333;
                  text-align:center;
                  padding-bottom:16px;
                ">
                {TITLE}
              </td>
            </tr>

            <!-- MESSAGE -->
            <tr>
              <td style="
                  font-size:16px;
                  color:#666666;
                  text-align:center;
                  padding-bottom:32px;
                ">
                {MESSAGE}
              </td>
            </tr>

            <!-- BUTTON -->
            <tr>
              <td align="center">
                <a href="{ACTION_LINK}" style="
                    display:inline-block;
                    background-color:#5B4FFF;
                    color:#FFFFFF;
                    font-size:16px;
                    font-weight:600;
                    padding:14px 28px;
                    border-radius:16px;
                    text-decoration:none;
                    box-shadow:0 6px 18px -6px rgba(91,79,255,0.40);
                  ">
                  {BUTTON_TEXT}
                </a>
              </td>
            </tr>

            <tr><td style="height:36px;"></td></tr>

            <!-- FOOTER -->
            <tr>
              <td style="font-size:14px; color:#999999; text-align:center;">
                Если вы не выполняли это действие — просто игнорируйте письмо.
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
</html>
"""


# ==========================================================
#   EMAIL TEMPLATES
# ==========================================================

EMAIL_VERIFY_TEMPLATE = BASE_EMAIL_WRAPPER.format(
    TITLE="Подтверждение регистрации",
    MESSAGE="Спасибо за регистрацию в Stanza! Нажмите кнопку ниже, чтобы подтвердить ваш email.",
    BUTTON_TEXT="Подтвердить Email",
    ACTION_LINK="{VERIFY_LINK}",
    FRONTEND_URL=FRONTEND_URL
)

EMAIL_RESET_TEMPLATE = BASE_EMAIL_WRAPPER.format(
    TITLE="Сброс пароля",
    MESSAGE="Вы запросили восстановление доступа. Нажмите кнопку ниже, чтобы задать новый пароль.",
    BUTTON_TEXT="Сбросить пароль",
    ACTION_LINK="{RESET_LINK}",
    FRONTEND_URL=FRONTEND_URL
)


# ==========================================================
#   SEND: VERIFY EMAIL
# ==========================================================

async def send_verification_email(to_email: EmailStr, verification_link: str):
    html_content = EMAIL_VERIFY_TEMPLATE.replace("{VERIFY_LINK}", verification_link)

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
